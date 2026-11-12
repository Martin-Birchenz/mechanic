const portalRepository = require("../repositories/portal.repository");
const { GoogleGenAI, Type } = require("@google/genai");

class PortalService {
  constructor() {
    this.ai = new GoogleGenAI();
  }

  async consultarSeguimiento(slug, patente) {
    const taller = await portalRepository.findTallerBySlug(slug);
    if (!taller) {
      const error = new Error("Taller no encontrado o inactivo");
      error.statusCode = 404;
      throw error;
    }

    const orden = await portalRepository.findEstadoVehiculoPublico(
      taller.id,
      patente.toUpperCase(),
    );
    if (!orden) {
      const error = new Error(
        `No se encontró ninguna orden para la patente ${patente}`,
      );
      error.statusCode = 404;
      throw error;
    }

    return {
      taller: {
        nombre: taller.nombre,
        telefono: taller.telefono,
        direccion: taller.direccion,
      },
      vehiculo: {
        patente: orden.patente,
        marca: orden.marca,
        modelo: orden.modelo,
      },
      orden: {
        id: orden.orden_id,
        estado: orden.estado,
        falla_declarada: orden.falla_declarada,
        fecha_ingreso: orden.fecha_ingreso,
        total: Number(orden.total_final),
        total_pagado: Number(orden.total_pagado),
        saldo_pendiente: Number(orden.saldo_pendiente),
        trabajos: orden.trabajos_realizados,
      },
    };
  }

  async procesarMensajeWhatsApp(slug, { telefono, mensaje }) {
    const taller = await portalRepository.findTallerBySlug(slug);
    if (!taller) {
      const error = new Error("Taller no registrado");
      error.statusCode = 404;
      throw error;
    }

    // Si no configuraste GEMINI_API_KEY todavía, fallback automático por Regex
    if (!process.env.GEMINI_API_KEY) {
      const regexPatente = /[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2}/i;
      const match = mensaje.toUpperCase().match(regexPatente);

      if (!match) {
        return {
          reply: `¡Hola! Bienvenido a ${taller.nombre}. Para consultar el estado de tu vehículo, envianos únicamente tu número de patente (ejemplo: AF123JK).`,
        };
      }

      const orden = await portalRepository.findEstadoVehiculoPublico(
        taller.id,
        match[0],
      );
      if (!orden) {
        return {
          reply: `No registramos reparaciones activas para la patente ${match[0]} en ${taller.nombre}.`,
        };
      }

      let text = `Hola ${orden.cliente_nombre}! Tu ${orden.marca} ${orden.modelo} (${orden.patente}) está en estado: *${orden.estado}*.`;
      if (orden.estado === "LISTO") {
        text += ` Ya podés pasar a retirarlo. Saldo pendiente: $${orden.saldo_pendiente}.`;
      }
      return { reply: text, orden_id: orden.orden_id, estado: orden.estado };
    }

    // Tool Definition para Gemini Flash
    const consultarEstadoVehiculoTool = {
      name: "consultarEstadoVehiculo",
      description:
        "Consulta el estado actual de reparación, trabajos hechos y saldo pendiente de un vehículo mediante su patente.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          patente: {
            type: Type.STRING,
            description:
              "La patente o dominio del vehículo en mayúsculas (ej: AF123JK o AB123CD)",
          },
        },
        required: ["patente"],
      },
    };

    const systemInstruction = `
Sos el asistente virtual inteligente de "${taller.nombre}".
Ubicación: ${taller.direccion || "Nogoyá, Entre Ríos"}.
Teléfono: ${taller.telefono}.
Horario: Lunes a Viernes de 08:00 a 18:00 hs.
Respondé de forma educada, concisa y con lenguaje claro de taller mecánico.
Si el usuario pregunta por un vehículo o menciona una patente, usá la herramienta 'consultarEstadoVehiculo'.
Nunca inventes estados de reparación que no provengan de la herramienta.
`;

    // Helper interno para llamar a Gemini con margen de 15s y 1 reintento rápido
    const llamarGeminiConReintento = async (params, intentos = 2) => {
      for (let i = 0; i < intentos; i++) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout de IA")), 15000),
          );
          return await Promise.race([
            this.ai.models.generateContent({
              model: "gemini-3.8-flash",
              ...params,
            }),
            timeoutPromise,
          ]);
        } catch (err) {
          const esSaturacion =
            err?.status === 503 || String(err?.message).includes("503");
          if (esSaturacion && i < intentos - 1) {
            await new Promise((res) => setTimeout(res, 1000));
            continue;
          }
          throw err;
        }
      }
    };

    try {
      // 1. Llamada inicial con Function Calling
      const response = await llamarGeminiConReintento({
        contents: mensaje,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [consultarEstadoVehiculoTool] }],
        },
      });

      // 2. Verificar si la IA solicitó consultar una patente en MySQL
      const functionCall = response.functionCalls?.[0];

      if (functionCall && functionCall.name === "consultarEstadoVehiculo") {
        const { patente } = functionCall.args;
        const orden = await portalRepository.findEstadoVehiculoPublico(
          taller.id,
          String(patente).toUpperCase(),
        );

        const toolResult = !orden
          ? {
              encontrado: false,
              mensaje: `No hay reparaciones registradas para la patente ${patente}`,
            }
          : {
              encontrado: true,
              cliente: orden.cliente_nombre,
              vehiculo: `${orden.marca} ${orden.modelo}`,
              patente: orden.patente,
              estado: orden.estado,
              falla: orden.falla_declarada,
              total: Number(orden.total_final),
              saldo_pendiente: Number(orden.saldo_pendiente),
            };

        // 3. Devolver los datos de MySQL al modelo para redactar la respuesta
        const followUp = await llamarGeminiConReintento({
          contents: [
            { role: "user", parts: [{ text: mensaje }] },
            { role: "model", parts: [{ functionCall }] },
            {
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: "consultarEstadoVehiculo",
                    response: toolResult,
                  },
                },
              ],
            },
          ],
          config: { systemInstruction },
        });

        return { reply: followUp.text };
      }

      // Respuesta directa a preguntas generales (horarios, ubicación, servicios)
      return { reply: response.text };
    } catch (err) {
      console.error("Fallback activado en el bot:", err.message);

      // 1. Si menciona una patente, consulta directo a MySQL
      const regexPatente = /[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2}/i;
      const match = mensaje.toUpperCase().match(regexPatente);

      if (match) {
        const orden = await portalRepository.findEstadoVehiculoPublico(
          taller.id,
          match[0],
        );
        if (orden) {
          let text = `Hola ${orden.cliente_nombre}! Tu ${orden.marca} ${orden.modelo} (${orden.patente}) está en estado: *${orden.estado}*.`;
          if (orden.estado === "LISTO") {
            text += ` Ya podés pasar a retirarlo. Saldo pendiente: $${orden.saldo_pendiente}.`;
          }
          return { reply: text };
        }
        return {
          reply: `No encontramos órdenes activas para la patente ${match[0]} en ${taller.nombre}.`,
        };
      }

      // 2. Respuestas rápidas por palabras clave si la API de IA demoró
      const textoLower = mensaje.toLowerCase();
      if (
        textoLower.includes("hora") ||
        textoLower.includes("abierto") ||
        textoLower.includes("abren")
      ) {
        return {
          reply: `Nuestro horario de atención en ${taller.nombre} es de Lunes a Viernes de 08:00 a 18:00 hs.`,
        };
      }
      if (
        textoLower.includes("donde") ||
        textoLower.includes("direccion") ||
        textoLower.includes("ubicacion")
      ) {
        return {
          reply: `Estamos ubicados en ${taller.direccion || "Nogoyá, Entre Ríos"}.`,
        };
      }
      if (
        textoLower.includes("pago") ||
        textoLower.includes("transferencia") ||
        textoLower.includes("tarjeta")
      ) {
        return {
          reply: `Aceptamos efectivo, transferencias bancarias y tarjetas.`,
        };
      }

      return {
        reply: `¡Hola! Soy el asistente de ${taller.nombre}. Podés consultarme horarios, ubicación, medios de pago o escribir tu patente (ej: AF123JK) para ver el estado de tu auto.`,
      };
    }
  }
}

module.exports = new PortalService();
