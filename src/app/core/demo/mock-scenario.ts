export type MockScenario = 'normal' | 'slow' | 'empty' | 'error' | 'offline' | 'uncertain';

export const MOCK_SCENARIO_KEY = 'tizo:mock-scenario:v1';

export const MOCK_SCENARIOS: readonly {
  readonly value: MockScenario;
  readonly label: string;
  readonly description: string;
}[] = [
  { value: 'normal', label: 'Normal', description: 'Datos seed y latencia breve' },
  { value: 'slow', label: 'Carga lenta', description: 'Respuestas de 2,2 segundos' },
  { value: 'empty', label: 'Sin datos', description: 'Listados y catálogo vacíos' },
  { value: 'error', label: 'Error 500', description: 'Servicio temporalmente caído' },
  { value: 'offline', label: 'Sin conexión', description: 'Fallo de red del navegador' },
  {
    value: 'uncertain',
    label: 'Resultado incierto',
    description: 'La mutación se ejecuta y se pierde la respuesta',
  },
];
