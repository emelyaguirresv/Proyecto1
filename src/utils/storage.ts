import { WaterEntry } from '../types';

export const STORAGE_KEY = 'agua_justa_records_v1';

/**
 * 1. GUARDAR DATOS EN LOCALSTORAGE
 * Serializa la lista de registros a una cadena JSON y la almacena bajo la clave designada.
 * PUNTO DE ERROR: Siempre envolver en try/catch porque en modo incógnito estricto
 * o con almacenamiento lleno (QuotaExceededError), localStorage.setItem puede fallar.
 */
export function saveEntries(entries: WaterEntry[]): boolean {
  try {
    const serializedData = JSON.stringify(entries);
    localStorage.setItem(STORAGE_KEY, serializedData);
    return true;
  } catch (error) {
    console.error('Error al guardar datos en localStorage:', error);
    return false;
  }
}

/**
 * 2. LEER DATOS DESDE LOCALSTORAGE
 * Recupera y deserializa los datos. Si no hay datos previos o están dañados,
 * retorna una lista vacía o el fallback provisto sin romper la aplicación.
 */
export function loadEntries(fallbackData: WaterEntry[] = []): WaterEntry[] {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return fallbackData;
    }
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return fallbackData;
  } catch (error) {
    console.error('Error al leer datos desde localStorage:', error);
    return fallbackData;
  }
}

/**
 * 3. BORRAR DATOS DE LOCALSTORAGE
 * Elimina la clave del almacenamiento local, dejando el espacio limpio.
 */
export function clearEntries(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
    return false;
  }
}

/**
 * 4. EXPORTAR DATOS A UN ARCHIVO JSON DE RESPALDO
 * Crea un Blob de tipo application/json y dispara una descarga automática en el navegador.
 * Funciona tanto en computadoras como en navegadores de celular (Chrome, Safari, Firefox).
 */
export function exportEntriesToJsonFile(entries: WaterEntry[]): void {
  try {
    const jsonString = JSON.stringify(entries, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Generar nombre de archivo con fecha local: ej: agua-justa-respaldo-2026-10-06.json
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agua-justa-respaldo-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al exportar datos a archivo JSON:', error);
  }
}

/**
 * 5. IMPORTAR DATOS DESDE UN ARCHIVO JSON RESPALDADO
 * Lee un archivo seleccionado por el usuario y valida que su estructura sea un arreglo de WaterEntry.
 */
export function importEntriesFromJsonFile(file: File): Promise<WaterEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          resolve(parsed);
        } else {
          reject(new Error('El archivo no contiene una lista válida de registros.'));
        }
      } catch (err) {
        reject(new Error('El archivo seleccionado no es un JSON válido.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}
