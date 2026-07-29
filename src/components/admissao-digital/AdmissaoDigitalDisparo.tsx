import { useMemo } from 'react';
import { Send } from 'lucide-react';
import { ProcessDefinition } from '../../types';
import { Modal } from '../ui/Misc';
import { Button } from '../ui/Button';
import { InfoNote } from '../admin/AdminUI';
import { FormRenderer } from '../FormRenderer';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';

const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mini-formulário do disparo. Usa o FormRenderer do app (mesma tipografia,
 * mesmas mensagens de erro e mesmo comportamento dos formulários de processo),
 * com uma definição declarada aqui em vez de vir de processDefinitions — este
 * fluxo é de demonstração e não gera solicitação.
 */
const DISPARO_DEFINITION: ProcessDefinition = {
  processId: 'admissao-digital-disparo',
  steps: [
    {
      id: 'disparo',
      title: 'Disparo do link',
      fields: [
        {
          id: 'nome',
          label: 'Nome completo',
          type: 'text',
          required: true,
          placeholder: 'Como consta no documento',
          gridCols: 3
        },
        {
          id: 'cpf',
          label: 'CPF',
          type: 'text',
          required: true,
          placeholder: '000.000.000-00',
          // Vazio devolve '' para não sobrescrever a mensagem de obrigatório.
          validation: (value: any) => {
            const v = String(value || '').trim();
            if (!v) return '';
            return CPF_REGEX.test(v) ? '' : 'Informe um CPF válido (000.000.000-00).';
          }
        },
        {
          id: 'email',
          label: 'E-mail',
          type: 'text',
          required: true,
          placeholder: 'nome@email.com',
          validation: (value: any) => {
            const v = String(value || '').trim();
            if (!v) return '';
            return EMAIL_REGEX.test(v) ? '' : 'Informe um e-mail válido.';
          }
        },
        {
          id: 'prazoDias',
          label: 'Prazo em dias',
          type: 'select',
          required: true,
          options: [
            { value: '5', label: '5 dias' },
            { value: '7', label: '7 dias' },
            { value: '10', label: '10 dias' },
            { value: '15', label: '15 dias' }
          ]
        }
      ]
    }
  ]
};

export default function AdmissaoDigitalDisparo({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { dispararAdmissaoDigital } = useAppConfig();
  const { addToast } = useToast();

  const initialData = useMemo(() => ({ prazoDias: '7' }), []);

  const handleSubmit = (data: Record<string, any>) => {
    const nome = String(data.nome).trim();
    dispararAdmissaoDigital({
      nome,
      cpf: String(data.cpf).trim(),
      email: String(data.email).trim(),
      prazoDias: Number(data.prazoDias) || 7
    });
    addToast(`Link de admissão digital enviado para ${nome}.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disparar link de admissão digital" size="lg">
      <div className="space-y-6">
        <InfoNote>
          O candidato recebe um link por e-mail para enviar os documentos pelo celular. Ele entra
          como <strong>Pré-admissão</strong> e só passa a contar como Ativo depois que o RH aprovar.
        </InfoNote>

        <FormRenderer
          definition={DISPARO_DEFINITION}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          hideActions
        />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="rh-request-form" leftIcon={<Send size={16} />}>
            Disparar link
          </Button>
        </div>
      </div>
    </Modal>
  );
}
