export type MeasurementUnit = 'litros' | 'barriles' | 'pilas';

export interface WaterEntry {
  id: string;
  date: string; // Formato YYYY-MM-DD (fecha local del usuario)
  liters: number; // Consumo normalizado en litros (para todos los cálculos matemáticos)
  originalValue: number; // Valor ingresado por el usuario (ej: 2.5)
  unit: MeasurementUnit; // Unidad elegida: 'litros', 'barriles' o 'pilas'
  note?: string; // Breve descripción opcional (ej: "Lavado de ropa", "Riego")
  createdAt: number; // Marca de tiempo unix para ordenamiento estable
}

export interface DaySummary {
  date: string;
  totalLiters: number;
  entriesCount: number;
  entries: WaterEntry[];
  isAboveThreshold: boolean; // Verdadero si supera el 30% del promedio de referencia
  percentAbove: number; // Porcentaje de sobreconsumo respecto al promedio (ej: 45 para +45%)
}

export interface UnitConfig {
  barrelLiters: number; // Litros por barril (típico: 200 L)
  pilaLiters: number; // Litros por llenada de pila (típico: 300 L)
}
