import { FormField } from '../types';

// Regra única de "campo obrigatório não preenchido", usada pela validação do
// FormRenderer e pelo contador de obrigatórios do RHRequestForm — antes cada um
// tinha a sua cópia e nenhuma tratava booleanos: um checkbox obrigatório com
// valor `false` contava como preenchido e liberava o envio.
export function isEmptyFieldValue(field: FormField, value: any): boolean {
  if (value === undefined || value === null || value === '') return true;

  // Aceite/consentimento: só vale quando marcado.
  if (field.type === 'checkbox' || field.type === 'boolean' || field.type === 'toggle') {
    return value !== true;
  }

  // Assinatura eletrônica: o registro do aceite precisa existir de fato.
  if (field.type === 'signature') {
    return !value || value.signed !== true;
  }

  return false;
}
