import { MeasurementUnit, WaterEntry, UnitConfig } from '../types';

export const DEFAULT_UNIT_CONFIG: UnitConfig = {
  // Puntos donde alguien suele equivocarse:
  // 1. Un barril/tambo estándar de polietileno de 55 galones equivale aproximadamente a 200-208 litros. Usamos 200 L como convención práctica casera.
  barrelLiters: 200,
  // 2. Una pila de lavadero tradicional de concreto o mampostería varía entre 250 y 350 L. Usamos 300 L como referencia promedio.
  pilaLiters: 300,
};

/**
 * ¡OJO CON LA ZONA HORARIA!
 * ERROR FRECUENTE: Usar `new Date().toISOString().split('T')[0]` convierte a UTC,
 * lo que hace que después de las 6:00 PM o 7:00 PM en América Latina la fecha cambie al día siguiente.
 * Esta función extrae el año, mes y día en la zona horaria LOCAL del dispositivo.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte cualquier unidad seleccionada (litros, barriles o pilas) a LITROS.
 * PUNTO CRÍTICO DE ERROR: Validar que el valor no sea negativo ni NaN antes de multiplicar.
 */
export function convertToLiters(
  value: number,
  unit: MeasurementUnit,
  config: UnitConfig = DEFAULT_UNIT_CONFIG
): number {
  if (isNaN(value) || value <= 0) return 0;

  switch (unit) {
    case 'barriles':
      return Math.round(value * config.barrelLiters);
    case 'pilas':
      return Math.round(value * config.pilaLiters);
    case 'litros':
    default:
      return Math.round(value);
  }
}

/**
 * Agrupa los registros individuales por fecha (YYYY-MM-DD).
 * ¿POR QUÉ ES NECESARIO?
 * Si en un mismo día el usuario registra "1 barril en la mañana (200 L)" y "1 pila en la tarde (300 L)",
 * el consumo REAL de ese día fue de 500 L.
 * Si no se agrupan, el cálculo del 30% del promedio se evaluaría por cada recarga y no por el total diario.
 */
export function groupEntriesByDay(entries: WaterEntry[]): Record<string, { totalLiters: number; entries: WaterEntry[] }> {
  const grouped: Record<string, { totalLiters: number; entries: WaterEntry[] }> = {};

  for (const entry of entries) {
    if (!grouped[entry.date]) {
      grouped[entry.date] = { totalLiters: 0, entries: [] };
    }
    grouped[entry.date].totalLiters += entry.liters;
    grouped[entry.date].entries.push(entry);
  }

  return grouped;
}

/**
 * Calcula el promedio semanal (litros por día).
 * 
 * PUNTOS DONDE ALGUIEN SUELE EQUIVOCARSE:
 * 1. Dividir por 0 cuando no hay registros aún (provoca NaN o Infinity).
 * 2. Si el usuario recién empezó y solo tiene 1 o 2 días registrados, dividir por 7
 *    hace que el promedio sea artificialmente bajo y todo supere el 30%.
 *    Por tanto: tomamos la ventana de los últimos 7 días con registros reales,
 *    o si hay registros distribuidos en la última semana, dividimos entre el número real de días registrados.
 */
export function calculateWeeklyAverage(entries: WaterEntry[]): number {
  if (!entries || entries.length === 0) return 0;

  const grouped = groupEntriesByDay(entries);
  const sortedDates = Object.keys(grouped).sort(); // Orden cronológico ascendente

  if (sortedDates.length === 0) return 0;

  // Tomamos hasta los últimos 7 días con datos
  const last7DaysDates = sortedDates.slice(-7);
  const sumLast7Days = last7DaysDates.reduce((acc, dateKey) => acc + grouped[dateKey].totalLiters, 0);

  // Evitamos dividir entre cero
  const daysCount = last7DaysDates.length;
  if (daysCount === 0) return 0;

  return Math.round(sumLast7Days / daysCount);
}

/**
 * Calcula el total del mes en curso (o de un mes específico YYYY-MM).
 * PUNTO DE ERROR: No filtrar correctamente el año al comparar solo el número del mes.
 * Siempre comparar con prefijo "YYYY-MM".
 */
export function calculateMonthTotal(entries: WaterEntry[], targetMonthPrefix?: string): { liters: number; cubicMeters: number } {
  const currentMonthPrefix = targetMonthPrefix || getLocalDateString().slice(0, 7); // ej: "2026-10"

  const monthEntries = entries.filter(e => e.date.startsWith(currentMonthPrefix));
  const totalLiters = monthEntries.reduce((sum, e) => sum + e.liters, 0);

  // 1 metro cúbico (m³) = 1,000 Litros. En el recibo siempre cobran en m³.
  const cubicMeters = Number((totalLiters / 1000).toFixed(2));

  return { liters: totalLiters, cubicMeters };
}

/**
 * FUNCIÓN MEJORADA: Proyección de Cierre de Mes para el Recibo de Agua.
 * Estima con cuántos m³ y litros cerrará el mes si se mantiene el ritmo diario actual.
 *
 * PUNTOS DONDE ALGUIEN SUELE EQUIVOCARSE:
 * 1. Dividir entre los días totales del mes en lugar de los días efectivamente registrados,
 *    lo que subestimaría el ritmo diario real.
 * 2. Calcular días restantes usando fechas UTC en vez de la fecha local del dispositivo.
 */
export function calculateMonthProjection(
  monthTotalLiters: number,
  daysRecordedCount: number,
  referenceDate: Date = new Date()
): { projectedLiters: number; projectedCubicMeters: number; dailyPace: number; daysRemaining: number } {
  if (daysRecordedCount <= 0 || monthTotalLiters <= 0) {
    return { projectedLiters: 0, projectedCubicMeters: 0, dailyPace: 0, daysRemaining: 0 };
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  // Último día del mes actual (28, 29, 30 o 31)
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = referenceDate.getDate();
  const daysRemaining = Math.max(0, totalDaysInMonth - currentDay);

  // Ritmo diario basado en los días registrados del mes
  const dailyPace = Math.round(monthTotalLiters / daysRecordedCount);
  const projectedLiters = monthTotalLiters + (dailyPace * daysRemaining);
  const projectedCubicMeters = Number((projectedLiters / 1000).toFixed(2));

  return {
    projectedLiters,
    projectedCubicMeters,
    dailyPace,
    daysRemaining,
  };
}

/**
 * Determina si el consumo de un día específico supera en más del 30% el promedio semanal.
 * 
 * FÓRMULA MATEMÁTICA CORRECTA:
 * Umbral de alerta = promedio * 1.30
 * Porcentaje de sobreconsumo = ((consumo - promedio) / promedio) * 100
 * 
 * PUNTO DE ERROR:
 * No avisar si el promedio es 0 (no hay historial suficiente de comparación).
 * Necesitamos al menos 1 día de referencia para que tenga sentido alertar.
 */
export function checkDailyAlert(
  dayLiters: number,
  weeklyAverage: number
): { isAboveThreshold: boolean; percentAbove: number; threshold: number } {
  if (weeklyAverage <= 0) {
    return { isAboveThreshold: false, percentAbove: 0, threshold: 0 };
  }

  const threshold = Math.round(weeklyAverage * 1.3);
  const isAboveThreshold = dayLiters > threshold;
  
  // Porcentaje exacto por encima del promedio (ej: si promedio es 200 y hoy gasta 300, está 50% por encima)
  const percentAbove = Math.round(((dayLiters - weeklyAverage) / weeklyAverage) * 100);

  return {
    isAboveThreshold,
    percentAbove: Math.max(0, percentAbove),
    threshold
  };
}

/**
 * Formatea una fecha YYYY-MM-DD en texto legible en español.
 * PUNTO DE ERROR: Al hacer `new Date('2026-10-03')`, JavaScript interpreta UTC medianoche
 * y en zonas horarias de América (GMT-3 a GMT-8) retrocede un día.
 * Para evitar este error, dividimos los componentes numéricos año, mes, día manualmente.
 */
export function formatDateSpanish(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Genera datos de demostración realistas para que el usuario pueda probar
 * de inmediato el cálculo del promedio, total mensual y la alerta del 30%.
 */
export function getInitialDemoData(): WaterEntry[] {
  const today = new Date();
  const demoList: WaterEntry[] = [];

  // Creamos 6 días anteriores con consumos típicos (~220-280 L)
  // y un día con sobreconsumo (>400 L) para ilustrar la alerta de forma evidente.
  const daysOffset = [
    { offset: 6, liters: 240, orig: 240, unit: 'litros' as MeasurementUnit, note: 'Uso normal de casa' },
    { offset: 5, liters: 200, orig: 1, unit: 'barriles' as MeasurementUnit, note: '1 barril para cocina y baño' },
    { offset: 4, liters: 260, orig: 260, unit: 'litros' as MeasurementUnit, note: 'Consumo habitual' },
    { offset: 3, liters: 420, orig: 420, unit: 'litros' as MeasurementUnit, note: 'Lavado de ropa de cama (+30% exceso)' },
    { offset: 2, liters: 250, orig: 250, unit: 'litros' as MeasurementUnit, note: 'Rutina familiar normal' },
    { offset: 1, liters: 300, orig: 1, unit: 'pilas' as MeasurementUnit, note: '1 llenada de pila' },
    { offset: 0, liters: 280, orig: 280, unit: 'litros' as MeasurementUnit, note: 'Consumo registrado hoy' },
  ];

  for (const item of daysOffset) {
    const d = new Date(today);
    d.setDate(today.getDate() - item.offset);
    const dateStr = getLocalDateString(d);
    demoList.push({
      id: `demo-${item.offset}`,
      date: dateStr,
      liters: item.liters,
      originalValue: item.orig,
      unit: item.unit,
      note: item.note,
      createdAt: d.getTime(),
    });
  }

  return demoList;
}
