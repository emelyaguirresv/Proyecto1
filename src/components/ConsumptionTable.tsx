import React, { useRef } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Droplet, Sparkles, Download, Upload } from 'lucide-react';
import { WaterEntry } from '../types';
import { formatDateSpanish } from '../utils/waterCalculations';

interface ConsumptionTableProps {
  entries: WaterEntry[];
  weeklyAverage: number;
  onDeleteEntry: (id: string) => void;
  onLoadDemoData: () => void;
  onClearAll: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
}

/**
 * Componente Tabla de Consumos con Fecha (Criterio de Aceptación Clave).
 * Muestra el historial cronológico y resalta con una alerta cuando un día
 * supera el 30% del promedio semanal.
 */
export const ConsumptionTable: React.FC<ConsumptionTableProps> = ({
  entries,
  weeklyAverage,
  onDeleteEntry,
  onLoadDemoData,
  onClearAll,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    // Limpiar input para permitir seleccionar el mismo archivo si es necesario
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // PUNTO DE ERROR AL CALCULAR EL CONSUMO TOTAL POR FECHA:
  // Si un día tiene 2 registros (ej: 200 L en la mañana y 200 L en la tarde = 400 L en el día),
  // el cálculo de si se pasa del 30% debe hacerse sobre la suma de todo el día.
  // Precalculamos los totales por fecha:
  const dayTotalsByDate = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + entry.liters;
    return acc;
  }, {});

  // Ordenamos del más reciente al más antiguo para que el usuario vea de inmediato lo de hoy
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt - a.createdAt;
  });

  // Umbral de alerta (+30% sobre promedio semanal)
  const alertThreshold = weeklyAverage > 0 ? weeklyAverage * 1.3 : 0;

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
          <Droplet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Aún no hay consumos registrados</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          Registra el consumo de agua de hoy arriba para comenzar a calcular tu promedio y detectar sobrecostos.
        </p>
        <button
          type="button"
          onClick={onLoadDemoData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          Cargar datos de ejemplo para probar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Encabezado de la sección */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tabla de Consumos</h2>
          <p className="text-xs text-slate-500">Historial por fecha y detección de sobreconsumos</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title="Descargar respaldo en archivo JSON"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Respaldar</span>
            </button>
          )}
          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="import-backup-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Cargar archivo JSON de respaldo"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onLoadDemoData}
            title="Cargar registros de ejemplo"
            className="text-xs px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Ejemplo
          </button>
          <button
            type="button"
            onClick={onClearAll}
            title="Borrar todos los registros"
            className="text-xs px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      {/* Tabla Adaptativa Mobile-Friendly */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-3 sm:px-4">Fecha</th>
              <th className="py-3 px-3 sm:px-4">Medida Ingresada</th>
              <th className="py-3 px-3 sm:px-4 text-right">Consumo (Litros)</th>
              <th className="py-3 px-3 sm:px-4 text-center">Estado (+30%)</th>
              <th className="py-3 px-2 sm:px-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {sortedEntries.map((entry) => {
              const dayTotal = dayTotalsByDate[entry.date] || entry.liters;
              // PUNTO CLAVE: ¿El consumo del día supera en >30% el promedio semanal?
              const isAbove = weeklyAverage > 0 && dayTotal > alertThreshold;
              const percentExceed = weeklyAverage > 0
                ? Math.round(((dayTotal - weeklyAverage) / weeklyAverage) * 100)
                : 0;

              return (
                <tr
                  key={entry.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isAbove ? 'bg-amber-50/40' : ''
                  }`}
                >
                  {/* Columna Fecha */}
                  <td className="py-3.5 px-3 sm:px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div>{formatDateSpanish(entry.date)}</div>
                    {entry.note && (
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px] sm:max-w-xs">
                        {entry.note}
                      </div>
                    )}
                  </td>

                  {/* Columna Medida Ingresada */}
                  <td className="py-3.5 px-3 sm:px-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      {entry.originalValue}{' '}
                      <span className="font-normal text-slate-500">
                        {entry.unit === 'barriles'
                          ? entry.originalValue === 1 ? 'barril' : 'barriles'
                          : entry.unit === 'pilas'
                          ? entry.originalValue === 1 ? 'pila' : 'pilas'
                          : 'L'}
                      </span>
                    </span>
                  </td>

                  {/* Columna Total Litros */}
                  <td className="py-3.5 px-3 sm:px-4 text-right font-bold text-slate-900 tabular-nums">
                    {entry.liters.toLocaleString('es-ES')} L
                  </td>

                  {/* Columna Estado / Alerta (+30%) */}
                  <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                    {weeklyAverage === 0 ? (
                      <span className="text-[11px] text-slate-400">Sin promedio</span>
                    ) : isAbove ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        +{percentExceed}% Exceso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Normal
                      </span>
                    )}
                  </td>

                  {/* Columna Acción Borrar */}
                  <td className="py-3.5 px-2 sm:px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      title="Eliminar este registro"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      aria-label="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla informativo */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <span>Mostrando {entries.length} {entries.length === 1 ? 'registro' : 'registros'}.</span>
        <span>
          💡 Umbral del 30%: {weeklyAverage > 0 ? `${alertThreshold.toFixed(0)} L/día` : 'Pendiente'}
        </span>
      </div>
    </div>
  );
};
