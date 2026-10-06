import React, { useState, useEffect, useMemo } from 'react';
import { Droplet, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { WaterEntry, MeasurementUnit, UnitConfig } from './types';
import {
  convertToLiters,
  getLocalDateString,
  calculateWeeklyAverage,
  calculateMonthTotal,
  calculateMonthProjection,
  checkDailyAlert,
  getInitialDemoData,
  DEFAULT_UNIT_CONFIG,
} from './utils/waterCalculations';
import {
  loadEntries,
  saveEntries,
  clearEntries,
  exportEntriesToJsonFile,
  importEntriesFromJsonFile,
} from './utils/storage';
import { MetricCards } from './components/MetricCards';
import { AlertBanner } from './components/AlertBanner';
import { ConsumptionForm } from './components/ConsumptionForm';
import { ConsumptionTable } from './components/ConsumptionTable';
import { SelloIaCard } from './components/SelloIaCard';

export default function App() {
  /**
   * 1. LEER DATOS AL INICIAR:
   * Carga desde localStorage. Si es la primera visita, usa datos de muestra.
   */
  const [entries, setEntries] = useState<WaterEntry[]>(() => {
    return loadEntries(getInitialDemoData());
  });

  const [unitConfig] = useState<UnitConfig>(DEFAULT_UNIT_CONFIG);

  // 2. GUARDAR DATOS AUTOMÁTICAMENTE:
  // Se sincroniza en localStorage cada vez que la lista de registros se modifica.
  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  // Fecha actual local (YYYY-MM-DD)
  const todayStr = useMemo(() => getLocalDateString(), []);

  // 1. Cálculo de promedio de la semana (litros/día)
  const weeklyAverage = useMemo(() => calculateWeeklyAverage(entries), [entries]);

  // 2. Cálculo del total del mes en curso (litros y metros cúbicos)
  const monthData = useMemo(() => calculateMonthTotal(entries), [entries]);

  // Nombre del mes actual en español (ej: "Octubre")
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', { month: 'long' });
  }, []);

  // Total de litros consumidos en el día de hoy
  const todayLiters = useMemo(() => {
    return entries
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.liters, 0);
  }, [entries, todayStr]);

  // 3. Verificación de alerta (+30% sobre el promedio) para el día de hoy
  const todayAlert = useMemo(() => {
    return checkDailyAlert(todayLiters, weeklyAverage);
  }, [todayLiters, weeklyAverage]);

  // Lista de días recientes con sobreconsumo (>30% sobre promedio)
  const recentExcessDays = useMemo(() => {
    if (weeklyAverage <= 0) return [];
    const threshold = weeklyAverage * 1.3;

    // Agrupar por fecha
    const dayTotals: Record<string, number> = {};
    for (const e of entries) {
      dayTotals[e.date] = (dayTotals[e.date] || 0) + e.liters;
    }

    const excessList: Array<{ date: string; liters: number; percentAbove: number }> = [];
    for (const [date, total] of Object.entries(dayTotals)) {
      if (total > threshold) {
        const percentAbove = Math.round(((total - weeklyAverage) / weeklyAverage) * 100);
        excessList.push({ date, liters: total, percentAbove });
      }
    }

    // Ordenar fechas más recientes primero
    return excessList.sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, weeklyAverage]);

  // Cantidad de días distintos con registro en el mes actual
  const monthDaysCount = useMemo(() => {
    const currentMonthPrefix = todayStr.slice(0, 7);
    const uniqueDates = new Set(
      entries.filter((e) => e.date.startsWith(currentMonthPrefix)).map((e) => e.date)
    );
    return uniqueDates.size;
  }, [entries, todayStr]);

  // 4. FUNCIÓN MEJORADA: Proyección estimada de cierre de mes para el recibo
  const monthProjection = useMemo(() => {
    return calculateMonthProjection(monthData.liters, monthDaysCount);
  }, [monthData.liters, monthDaysCount]);

  /**
   * Manejador para registrar un nuevo consumo (Función #1).
   * PUNTO DE ERROR:
   * Normalizar la cantidad a litros usando la función de conversión antes de guardar.
   */
  const handleAddEntry = (newEntryData: {
    date: string;
    value: number;
    unit: MeasurementUnit;
    note?: string;
  }) => {
    const calculatedLiters = convertToLiters(
      newEntryData.value,
      newEntryData.unit,
      unitConfig
    );

    const newRecord: WaterEntry = {
      id: `water-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: newEntryData.date,
      liters: calculatedLiters,
      originalValue: newEntryData.value,
      unit: newEntryData.unit,
      note: newEntryData.note,
      createdAt: Date.now(),
    };

    setEntries((prev) => [newRecord, ...prev]);
  };

  /**
   * Eliminar un registro específico
   */
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Cargar datos de demostración
   */
  const handleLoadDemoData = () => {
    setEntries(getInitialDemoData());
  };

  /**
   * Vaciar todos los datos para empezar de cero
   */
  const handleClearAll = () => {
    if (window.confirm('¿Seguro que deseas borrar todos los consumos registrados?')) {
      clearEntries();
      setEntries([]);
    }
  };

  /**
   * Exportar registros a archivo JSON descargable
   */
  const handleExport = () => {
    exportEntriesToJsonFile(entries);
  };

  /**
   * Restaurar registros desde un archivo JSON
   */
  const handleImport = async (file: File) => {
    try {
      const importedEntries = await importEntriesFromJsonFile(file);
      if (importedEntries.length > 0) {
        setEntries(importedEntries);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al leer el archivo';
      console.error('Error al importar:', msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Barra Superior / Header Limpio */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                AGUA JUSTA
              </h1>
              <span className="text-[11px] font-medium text-slate-500 block -mt-0.5">
                Para quien paga el recibo del agua
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              v1.0
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal con Diseño Centrado Mobile-First */}
      <main className="max-w-xl mx-auto px-4 pt-5">
        {/* FUNCIÓN #3: Alerta de Sobreconsumo (+30% sobre el promedio) */}
        <AlertBanner
          currentDayLiters={todayLiters}
          selectedDate={todayStr}
          weeklyAverage={weeklyAverage}
          isAboveThreshold={todayAlert.isAboveThreshold}
          percentAbove={todayAlert.percentAbove}
          threshold={todayAlert.threshold}
          recentExcessDays={recentExcessDays}
        />

        {/* FUNCIÓN #2 y MEJORADA: Promedio de la semana, Total del mes y Proyección de recibo */}
        <MetricCards
          weeklyAverage={weeklyAverage}
          monthTotalLiters={monthData.liters}
          monthTotalCubicMeters={monthData.cubicMeters}
          monthName={currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
          daysRecordedCount={monthDaysCount}
          monthProjection={monthProjection}
        />

        {/* SELLO DE IA AGUA JUSTA (Evaluación con Gemini API) */}
        <SelloIaCard
          weeklyAverage={weeklyAverage}
          monthTotalLiters={monthData.liters}
          monthTotalCubicMeters={monthData.cubicMeters}
          projectedCubicMeters={monthProjection?.projectedCubicMeters || 0}
          excessDaysCount={recentExcessDays.length}
        />

        {/* FUNCIÓN #1: Registrar el consumo del día (litros, barriles o llenadas de pila) */}
        <ConsumptionForm
          onAddEntry={handleAddEntry}
          unitConfig={unitConfig}
        />

        {/* CRITERIO DE ACEPTACIÓN: Tabla de consumos con fecha */}
        <ConsumptionTable
          entries={entries}
          weeklyAverage={weeklyAverage}
          onDeleteEntry={handleDeleteEntry}
          onLoadDemoData={handleLoadDemoData}
          onClearAll={handleClearAll}
          onExport={handleExport}
          onImport={handleImport}
        />

        {/* Guía Rápida de Referencia para el Hogar */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-100/70 border border-slate-200/60 text-xs text-slate-600">
          <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Equivalencias estándar utilizadas:
          </h4>
          <ul className="space-y-1 text-[11px] text-slate-500 mt-2 list-disc list-inside">
            <li>
              <strong>1 Barril / Tambo:</strong> 200 Litros (típico contenedor azul de 55 galones).
            </li>
            <li>
              <strong>1 Llenada de Pila:</strong> 300 Litros (lavadero familiar estándar).
            </li>
            <li>
              <strong>1 Metro cúbico (m³):</strong> 1,000 Litros (unidad que cobra la empresa de agua).
            </li>
            <li>
              <strong>Alerta de exceso:</strong> Se activa cuando un día gasta más del 130% de tu promedio semanal habitual.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
