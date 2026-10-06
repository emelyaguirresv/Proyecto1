import React from 'react';
import { Droplet, TrendingUp, Calculator } from 'lucide-react';

interface MetricCardsProps {
  weeklyAverage: number;
  monthTotalLiters: number;
  monthTotalCubicMeters: number;
  monthName: string;
  daysRecordedCount: number;
  monthProjection?: {
    projectedLiters: number;
    projectedCubicMeters: number;
    dailyPace: number;
    daysRemaining: number;
  };
}

/**
 * Componente de Métricas Clave:
 * Muestra la función #2 exigida: Promedio de la semana y Total del mes,
 * más la Función Mejorada: Proyección de Cierre de Mes para el recibo.
 */
export const MetricCards: React.FC<MetricCardsProps> = ({
  weeklyAverage,
  monthTotalLiters,
  monthTotalCubicMeters,
  monthName,
  daysRecordedCount,
  monthProjection,
}) => {
  // PUNTO DONDE ALGUIEN SUELE EQUIVOCARSE:
  // El umbral del 30% se calcula como promedio * 1.3.
  // Es útil mostrárselo al usuario para que sepa de antemano a partir de cuántos litros se dispara la alarma.
  const alertThreshold = weeklyAverage > 0 ? Math.round(weeklyAverage * 1.3) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
      {/* Tarjeta 1: Promedio de la semana */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Promedio Semanal
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {weeklyAverage > 0 ? weeklyAverage.toLocaleString('es-ES') : '0'}
            </span>
            <span className="text-sm font-semibold text-slate-600">L / día</span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {weeklyAverage > 0 ? (
              <span>
                Límite de alerta (+30%):{' '}
                <strong className="text-amber-700 font-semibold">{alertThreshold} L</strong>
              </span>
            ) : (
              'Registra al menos un día para calcular'
            )}
          </p>
        </div>
      </div>

      {/* Tarjeta 2: Total del mes en curso */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total {monthName}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({daysRecordedCount} {daysRecordedCount === 1 ? 'día' : 'días'})
            </span>
          </div>
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
            <Droplet className="w-5 h-5" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                {monthTotalLiters.toLocaleString('es-ES')}
              </span>
              <span className="text-sm font-semibold text-slate-600">Litros</span>
            </div>

            {/* Equivalente en m³ (es como viene facturado el recibo del agua) */}
            <div className="text-right">
              <span className="text-base font-bold text-cyan-700 tabular-nums">
                {monthTotalCubicMeters.toLocaleString('es-ES', { minimumFractionDigits: 1 })} m³
              </span>
              <span className="block text-[10px] text-slate-400">para el recibo</span>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Acumulado en el mes actual (1 m³ = 1,000 Litros)
          </p>
        </div>
      </div>

      {/* FUNCIÓN MEJORADA: Proyección estimada de fin de mes para el recibo */}
      {monthProjection && monthProjection.projectedLiters > 0 && (
        <div className="sm:col-span-2 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 rounded-2xl p-4 border border-blue-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Proyección Cierre de Mes (Recibo)
                </h4>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                  Ritmo: {monthProjection.dailyPace.toLocaleString('es-ES')} L/día
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Si mantienes este ritmo, cerrarás el mes en aproximadamente{' '}
                <strong className="text-blue-900 font-bold">{monthProjection.projectedCubicMeters.toLocaleString('es-ES')} m³</strong>{' '}
                ({monthProjection.projectedLiters.toLocaleString('es-ES')} Litros).
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right sm:shrink-0 pl-11 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-200/40">
            <div className="text-xl font-extrabold text-blue-700 tabular-nums">
              ~{monthProjection.projectedCubicMeters.toLocaleString('es-ES')} m³
            </div>
            <span className="block text-[11px] text-slate-500">
              {monthProjection.daysRemaining} {monthProjection.daysRemaining === 1 ? 'día restante' : 'días restantes'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
