import { ProcessDefinition } from '../types';

// Campos CALC (origin 'K') são DERIVADOS: nunca ficam no estado do formulário.
// Esta função aplica cada `calculate` sobre uma cópia dos dados, de forma que
// cálculos encadeados (um K que depende de outro K) enxerguem o valor já
// computado. Usada tanto no render (via useMemo no FormRenderer) quanto no
// momento do envio (para montar o payload sem gravar nada em estado).
export function computeDerivedFields(
  definition: ProcessDefinition | undefined,
  data: Record<string, any>
): Record<string, any> {
  const step = definition?.steps?.[0];
  if (!step) return data;

  const merged = { ...data };
  step.fields.forEach(field => {
    const fieldId = (field as any).id || (field as any).name;
    if ((field as any).origin === 'K' && typeof (field as any).calculate === 'function') {
      merged[fieldId] = (field as any).calculate(merged);
    }
  });
  return merged;
}
