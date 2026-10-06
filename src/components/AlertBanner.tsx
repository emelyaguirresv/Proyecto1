import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { formatDateSpanish } from '../utils/waterCalculations';

interface AlertBannerProps {
  currentDayLiters: number;
  selectedDate: string;
  weeklyAverage: number;
  isAboveThreshold: boolean;
  percentAbove: number;
  threshold: number;
  recentExcessDays: Array<{ date: string; liters: number; percentAbove: number }>;
}

/**
 * Componente de Aviso de Sobreconsumo (Función #3):
 * Avisa cuando un día se pasa del 30% del promedio.
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({
  currentDayLiters,
  selectedDate,
  weeklyAverage,
  isAboveThreshold,
  percentAbove,
  threshold,
  recentExcessDays,
}) => {
  // PUNTO DE ERROR: Si aún no hay suficiente historial (promedio 0 o sin registros),
  // no debemos alarmar al usuario ni mostrar datos erróneos de "0%".
  if (weeklyAverage <= 0) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Primeros pasos:</strong> Registra el consumo de tus primeros días para que
          la app calcule automáticamente tu promedio semanal y te avise si algún día excedes el 30%.
        </div>
      </div>
    );
  }

  // Si el día seleccionado supera el 30%:
  if (isAboveThreshold) {
    return (
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-amber-900">
                ¡Alerta de sobreconsumo (+{percentAbove}% sobre el promedio)!
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                Límite excedido
              </span>
            </div>

            <p className="mt-1.5 text-xs text-amber-800 leading-relaxed">
              El consumo de <strong>{formatDateSpanish(selectedDate)}</strong> fue de{' '}
              <strong className="underline">{currentDayLiters.toLocaleString('es-ES')} Litros</strong>,
              superando el umbral de alerta de{' '}
              <strong>{threshold.toLocaleString('es-ES')} Litros</strong> (+30% sobre el promedio
              semanal de {weeklyAverage.toLocaleString('es-ES')} L/día).
            </p>

            <div className="mt-3 pt-2.5 border-t border-amber-200/70 text-[11px] text-amber-700 flex items-center justify-between">
              <span>💡 Revisa si hubo fugas en sanitarios, lavado excesivo o tanques desbordados.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay días anteriores recientes con exceso (en caso de que hoy esté normal pero en la semana hubo alertas):
  if (recentExcessDays.length > 0) {
    const latestExcess = recentExcessDays[0];
    return (
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">
            Aviso reciente: {formatDateSpanish(latestExcess.date)} se superó el promedio en +{latestExcess.percentAbove}% ({latestExcess.liters} L).
          </p>
          <p className="text-slate-500 mt-0.5">
            El consumo de hoy está bajo control ({currentDayLiters} L vs umbral {threshold} L).
          </p>
        </div>
      </div>
    );
  }

  // Si todo el consumo está normal:
  return (
    <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <p className="text-xs text-emerald-900">
        <strong>Consumo normal:</strong> Estás dentro del rango esperado respecto a tu promedio semanal ({weeklyAverage} L/día).
      </p>
    </div>
  );
};
