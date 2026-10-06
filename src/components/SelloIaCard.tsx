import React, { useState } from 'react';
import { ShieldCheck, Sparkles, AlertCircle, RefreshCw, CheckCircle2, TrendingDown } from 'lucide-react';

export interface SelloIaData {
  nivelEficiencia: 'EXCELENTE' | 'MODERADO' | 'EN_ALERTA' | 'CRITICO' | string;
  puntajeEficiencia: number;
  diagnosticoClave: string;
  riesgoSobrecosto: 'BAJO' | 'MEDIO' | 'ALTO' | string;
  ahorroEstimadoM3: number;
  accionPrioritaria: string;
}

interface SelloIaCardProps {
  weeklyAverage: number;
  monthTotalLiters: number;
  monthTotalCubicMeters: number;
  projectedCubicMeters: number;
  excessDaysCount: number;
}

export const SelloIaCard: React.FC<SelloIaCardProps> = ({
  weeklyAverage,
  monthTotalLiters,
  monthTotalCubicMeters,
  projectedCubicMeters,
  excessDaysCount,
}) => {
  const [selloData, setSelloData] = useState<SelloIaData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  const requestSelloIa = async (forceMock: boolean = false) => {
    setIsLoading(true);
    setErrorInfo(null);

    try {
      const response = await fetch('/api/sello-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyAverage,
          monthTotalLiters,
          monthTotalCubicMeters,
          projectedCubicMeters,
          excessDaysCount,
          useMock: forceMock,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error del servidor (${response.status})`);
      }

      if (!result.data || typeof result.data.puntajeEficiencia !== 'number') {
        throw new Error('La respuesta recibida no cumple con la estructura requerida del Sello.');
      }

      setSelloData(result.data);
      setIsMockMode(result.source === 'mock');
    } catch (err: any) {
      setErrorInfo({
        code: 'ERROR_RESPUESTA',
        message: err.message || 'No fue posible obtener el Sello de IA en este momento.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNivelBadgeClass = (nivel: string) => {
    switch (nivel.toUpperCase()) {
      case 'EXCELENTE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MODERADO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EN_ALERTA':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CRITICO':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRiesgoBadgeClass = (riesgo: string) => {
    switch (riesgo.toUpperCase()) {
      case 'BAJO':
        return 'text-emerald-700 bg-emerald-50';
      case 'MEDIO':
        return 'text-amber-700 bg-amber-50';
      case 'ALTO':
        return 'text-rose-700 bg-rose-50';
      default:
        return 'text-slate-700 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              SELLO DE IA AGUA JUSTA
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                Auditoría
              </span>
            </h3>
            <p className="text-xs text-slate-500">Evaluación de eficiencia y riesgo en tu recibo</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => requestSelloIa(false)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? 'Evaluando...' : selloData ? 'Actualizar' : 'Auditar'}</span>
          </button>
        </div>
      </div>

      {/* MANEJO DE FALLO: Si la IA no responde, responde lento o falla */}
      {errorInfo && (
        <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold">Error al obtener el Sello de IA:</strong>
            <p className="mt-0.5 text-rose-700 text-[11px] leading-relaxed">{errorInfo.message}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => requestSelloIa(false)}
                className="px-2.5 py-1 rounded-md bg-rose-200 text-rose-900 font-semibold text-[11px] hover:bg-rose-300 transition-colors"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => requestSelloIa(true)}
                className="px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-800 font-medium text-[11px] hover:bg-rose-50 transition-colors"
              >
                Cargar modo de prueba (Mock)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO INICIAL / SIN SELLO AUDITADO */}
      {!selloData && !isLoading && !errorInfo && (
        <div className="mt-2 py-4 px-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Presiona <strong>Auditar</strong> para que Gemini analice tu promedio, proyecciones y sobreconsumos en un esquema estructurado.
          </p>
          <button
            type="button"
            onClick={() => requestSelloIa(true)}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-purple-700 font-semibold hover:underline"
          >
            o probar con respuesta mock local (sin gastar llamadas)
          </button>
        </div>
      )}

      {/* VISUALIZACIÓN DE DATOS ESTRUCTURADOS (NO PÁRRAFO) */}
      {selloData && !isLoading && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {/* Fila 1: Nivel de Eficiencia y Puntaje Numérico */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                Nivel
              </span>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold border ${getNivelBadgeClass(
                  selloData.nivelEficiencia
                )}`}
              >
                {selloData.nivelEficiencia}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                Puntaje
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black text-slate-900 tabular-nums">
                  {selloData.puntajeEficiencia}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">/ 100</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                Riesgo Recibo
              </span>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${getRiesgoBadgeClass(
                  selloData.riesgoSobrecosto
                )}`}
              >
                {selloData.riesgoSobrecosto}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                Ahorro Potencial
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingDown className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-sm font-bold text-cyan-800 tabular-nums">
                  ~{selloData.ahorroEstimadoM3} m³
                </span>
              </div>
            </div>
          </div>

          {/* Fila 2: Diagnóstico Clave (Dato puntual) */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-950">
              <span className="font-semibold text-purple-900">Diagnóstico: </span>
              {selloData.diagnosticoClave}
            </div>
          </div>

          {/* Fila 3: Acción Prioritaria */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-950">
            <span className="font-semibold text-amber-900">Acción prioritaria: </span>
            {selloData.accionPrioritaria}
          </div>

          {isMockMode && (
            <div className="text-[10px] text-slate-400 text-right">
              * Mostrando respuesta de prueba mock (sin consumo de API).
            </div>
          )}
        </div>
      )}
    </div>
  );
};
