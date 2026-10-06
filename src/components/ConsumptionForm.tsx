import React, { useState } from 'react';
import { PlusCircle, Droplets, Calendar as CalendarIcon, Check } from 'lucide-react';
import { MeasurementUnit, UnitConfig } from '../types';
import { convertToLiters, getLocalDateString, DEFAULT_UNIT_CONFIG } from '../utils/waterCalculations';

interface ConsumptionFormProps {
  onAddEntry: (entry: {
    date: string;
    value: number;
    unit: MeasurementUnit;
    note?: string;
  }) => void;
  unitConfig?: UnitConfig;
}

/**
 * Componente para registrar el consumo diario (Función #1).
 * Soporta Litros, Barriles o Llenadas de pila.
 */
export const ConsumptionForm: React.FC<ConsumptionFormProps> = ({
  onAddEntry,
  unitConfig = DEFAULT_UNIT_CONFIG,
}) => {
  // Fecha seleccionada (por defecto hoy en fecha local)
  const [date, setDate] = useState<string>(getLocalDateString());
  // Unidad elegida: 'litros', 'barriles' o 'pilas'
  const [unit, setUnit] = useState<MeasurementUnit>('litros');
  // Cantidad ingresada como string para facilitar escritura en celular
  const [valueStr, setValueStr] = useState<string>('');
  // Nota o etiqueta opcional
  const [note, setNote] = useState<string>('');
  // Estado para feedback visual tras guardar
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // PUNTO DONDE ALGUIEN SUELE EQUIVOCARSE:
  // En teclados móviles en español, los usuarios a veces escriben "1,5" con coma en vez de punto decimal.
  // Es crucial reemplazar la coma por punto antes de hacer parseFloat para evitar NaN.
  const numericValue = parseFloat(valueStr.replace(',', '.')) || 0;
  
  // Cálculo en vivo de los litros equivalentes
  const calculatedLiters = convertToLiters(numericValue, unit, unitConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // PUNTO DE ERROR: Validar que el valor sea estrictamente mayor que 0
    if (numericValue <= 0) {
      return;
    }

    onAddEntry({
      date,
      value: numericValue,
      unit,
      note: note.trim() || undefined,
    });

    // Resetear formulario para el próximo registro
    setValueStr('');
    setNote('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Botones de acceso rápido según la unidad
  const renderQuickPresets = () => {
    if (unit === 'barriles') {
      return [1, 2, 3, 0.5].map((val) => (
        <button
          key={val}
          type="button"
          onClick={() => setValueStr(String(val))}
          className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg transition-colors"
        >
          {val} {val === 1 ? 'barril' : 'barriles'}
        </button>
      ));
    }
    if (unit === 'pilas') {
      return [1, 2, 0.5].map((val) => (
        <button
          key={val}
          type="button"
          onClick={() => setValueStr(String(val))}
          className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg transition-colors"
        >
          {val} {val === 1 ? 'pila' : 'pilas'}
        </button>
      ));
    }
    // Litros directos
    return [50, 100, 200, 300, 500].map((val) => (
      <button
        key={val}
        type="button"
        onClick={() => setValueStr(String(val))}
        className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg transition-colors"
      >
        +{val} L
      </button>
    ));
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Registrar Consumo</h2>
          <p className="text-xs text-slate-500">Anota lo que se gastó hoy o en días pasados</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDate(getLocalDateString())}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              date === getLocalDateString()
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              setDate(getLocalDateString(y));
            }}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              date !== getLocalDateString()
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ayer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Fecha */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            Fecha del consumo
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            required
          />
        </div>

        {/* Selector de Unidad: Litros, Barriles, Pilas */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ¿Cómo mediste el agua?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setUnit('litros')}
              className={`min-h-[44px] py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                unit === 'litros'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Litros
              <span className="block text-[10px] opacity-80 mt-0.5">medida exacta</span>
            </button>

            <button
              type="button"
              onClick={() => setUnit('barriles')}
              className={`min-h-[44px] py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                unit === 'barriles'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Barriles
              <span className="block text-[10px] opacity-80 mt-0.5">({unitConfig.barrelLiters} L c/u)</span>
            </button>

            <button
              type="button"
              onClick={() => setUnit('pilas')}
              className={`min-h-[44px] py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                unit === 'pilas'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Llenada de pila
              <span className="block text-[10px] opacity-80 mt-0.5">({unitConfig.pilaLiters} L c/u)</span>
            </button>
          </div>
        </div>

        {/* Input de Cantidad + Equivalencia en vivo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>
              Cantidad en {unit === 'litros' ? 'litros' : unit === 'barriles' ? 'barriles' : 'llenadas de pila'}
            </span>
            {calculatedLiters > 0 && unit !== 'litros' && (
              <span className="text-blue-700 font-bold tabular-nums">
                = {calculatedLiters.toLocaleString('es-ES')} Litros
              </span>
            )}
          </label>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder={unit === 'litros' ? 'Ej. 250' : unit === 'barriles' ? 'Ej. 2 o 1.5' : 'Ej. 1'}
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="w-full h-12 px-3.5 text-base font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors tabular-nums"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase">
              {unit === 'litros' ? 'L' : unit}
            </div>
          </div>

          {/* Accesos rápidos táctiles */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-0.5">Rápido:</span>
            {renderQuickPresets()}
          </div>
        </div>

        {/* Nota opcional */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Motivo o actividad (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. Lavado de ropa, cocina, riego..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-10 px-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Botón de Enviar (Touch target grande para celular >= 48px) */}
        <button
          type="submit"
          disabled={numericValue <= 0}
          className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            numericValue > 0
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-sm'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>¡Consumo Registrado con Éxito!</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>
                Guardar {calculatedLiters > 0 ? `${calculatedLiters} L` : 'Consumo'}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
