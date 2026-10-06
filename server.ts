import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Esquema estructurado estricto para el SELLO DE IA AGUA JUSTA
export const SelloIaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    nivelEficiencia: {
      type: Type.STRING,
      description: "Clasificación estricta del consumo: 'EXCELENTE', 'MODERADO', 'EN_ALERTA' o 'CRITICO'",
    },
    puntajeEficiencia: {
      type: Type.INTEGER,
      description: "Calificación integral del hogar de 0 a 100",
    },
    diagnosticoClave: {
      type: Type.STRING,
      description: "Diagnóstico conciso del consumo en máximo 12 palabras",
    },
    riesgoSobrecosto: {
      type: Type.STRING,
      description: "Nivel de riesgo monetario en el recibo: 'BAJO', 'MEDIO' o 'ALTO'",
    },
    ahorroEstimadoM3: {
      type: Type.NUMBER,
      description: "Cantidad estimada de metros cúbicos (m³) que el hogar podría ahorrar al mes",
    },
    accionPrioritaria: {
      type: Type.STRING,
      description: "Recomendación operativa principal en máximo 15 palabras",
    },
  },
  required: [
    'nivelEficiencia',
    'puntajeEficiencia',
    'diagnosticoClave',
    'riesgoSobrecosto',
    'ahorroEstimadoM3',
    'accionPrioritaria',
  ],
};

// Ejemplo de prueba fijo para desarrollar sin gastar llamadas de API
export const MOCK_SELLO_IA = {
  nivelEficiencia: 'MODERADO',
  puntajeEficiencia: 78,
  diagnosticoClave: 'Consumo controlado con leve sobreconsumo en fin de semana',
  riesgoSobrecosto: 'MEDIO',
  ahorroEstimadoM3: 2.4,
  accionPrioritaria: 'Revisar flotador del tanque y reducir lavado de patio a 1 vez por semana',
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  /**
   * Endpoint Server-Side para el Sello de IA Agua Justa.
   * La API Key nunca se envía al cliente.
   */
  app.post('/api/sello-ia', async (req, res) => {
    try {
      const {
        weeklyAverage = 0,
        monthTotalLiters = 0,
        monthTotalCubicMeters = 0,
        projectedCubicMeters = 0,
        excessDaysCount = 0,
        useMock = false,
      } = req.body || {};

      // Si el cliente solicita modo de prueba para no gastar llamadas:
      if (useMock) {
        return res.json({ data: MOCK_SELLO_IA, source: 'mock' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'MISSING_API_KEY',
          message: 'La variable de entorno GEMINI_API_KEY no está configurada en el servidor.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptContext = `
Analiza las siguientes métricas reales de consumo hídrico de una vivienda familiar:
- Promedio semanal actual: ${weeklyAverage} L/día.
- Acumulado en el mes actual: ${monthTotalLiters} Litros (${monthTotalCubicMeters} m³).
- Proyección estimada de cierre de mes: ${projectedCubicMeters} m³.
- Días que superaron en más de 30% el promedio semanal: ${excessDaysCount} día(s).

Emite el "SELLO DE IA AGUA JUSTA" evaluando estrictamente la eficiencia del hogar y el riesgo en el próximo recibo.
`;

      // Llamada con timeout de 10 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContext,
        config: {
          responseMimeType: 'application/json',
          responseSchema: SelloIaResponseSchema,
          systemInstruction:
            'Sos un auditor técnico de consumo de agua potable para hogares. Tu misión es evaluar métricas de volumen, calcular riesgo de sobrecosto y devolver datos exactos y concisos bajo el esquema JSON solicitado.',
          temperature: 0.2,
        },
      });

      clearTimeout(timeoutId);

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error('La respuesta de Gemini vino vacía.');
      }

      const parsedData = JSON.parse(rawJson);

      // Validación de esquema
      if (
        !parsedData.nivelEficiencia ||
        typeof parsedData.puntajeEficiencia !== 'number' ||
        !parsedData.diagnosticoClave
      ) {
        throw new Error('El JSON devuelto por el modelo no cumple con las propiedades requeridas.');
      }

      return res.json({ data: parsedData, source: 'gemini' });
    } catch (error: any) {
      console.error('Error en /api/sello-ia:', error);

      if (error?.name === 'AbortError') {
        return res.status(504).json({
          error: 'TIMEOUT',
          message: 'El servicio de IA tardó más de 10 segundos en responder.',
        });
      }

      return res.status(500).json({
        error: 'AI_ERROR',
        message: error?.message || 'Error al comunicarse con la API de Gemini.',
      });
    }
  });

  // Configuración de Vite para desarrollo o estáticos para producción
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor AGUA JUSTA corriendo en http://localhost:${PORT}`);
  });
}

startServer();
