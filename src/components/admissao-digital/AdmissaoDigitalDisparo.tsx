import { useMemo } from 'react';
import { Send } from 'lucide-react';
import { ProcessDefinition } from '../../types';
import { Modal } from '../ui/Misc';
import { Button } from '../ui/Button';
import { InfoNote } from '../admin/AdminUI';
import { FormRenderer } from '../FormRenderer';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { paraDataISO } from '../../utils/admissaoDigital';

const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Entrada única da Admissão Digital ("+ Nova Admissão"): parte da Requisição de
 * Vaga aprovada, coleta os dados do futuro colaborador e as condições
 * contratuais, e termina no disparo do link.
 *
 * Usa o FormRenderer do app (mesma tipografia, mesmas mensagens de erro e mesmo
 * comportamento dos formulários de processo), com uma definição declarada aqui
 * em vez de vir de processDefinitions — o disparo cria o colaborador em
 * Pré-admissão, não uma solicitação.
 *
 * O zoom de vaga grava dois campos: `vaga` (título, exibido no card de
 * selecionado) e `vagaId` (id do cadastro) — é a convenção do FormRenderer,
 * que sempre escreve o id em `<campo>Id`.
 */
const DISPARO_DEFINITION: ProcessDefinition = {
  processId: 'admissao-digital-disparo',
  steps: [
    {
      id: 'disparo',
      title: 'Disparo do link',
      fields: [
        {
          id: 'vaga',
          label: 'Vaga Aprovada',
          type: 'zoom',
          origin: 'C',
          required: true,
          placeholder: 'Buscar vaga aprovada...',
          section: 'Vaga Aprovada',
          zoomConfig: { entity: 'approved-vacancy', fields: ['code', 'title', 'company', 'branch', 'department'] }
        },

        {
          id: 'nome',
          label: 'Nome completo',
          type: 'text',
          origin: 'C',
          required: true,
          placeholder: 'Como consta no documento',
          gridCols: 3,
          section: 'Dados do Futuro Colaborador'
        },
        {
          id: 'cpf',
          label: 'CPF',
          type: 'text',
          origin: 'C',
          required: true,
          placeholder: '000.000.000-00',
          section: 'Dados do Futuro Colaborador',
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
          origin: 'C',
          required: true,
          placeholder: 'nome@email.com',
          section: 'Dados do Futuro Colaborador',
          validation: (value: any) => {
            const v = String(value || '').trim();
            if (!v) return '';
            return EMAIL_REGEX.test(v) ? '' : 'Informe um e-mail válido.';
          }
        },
        {
          id: 'telefone',
          label: 'Telefone',
          type: 'text',
          origin: 'C',
          required: true,
          placeholder: '(00) 00000-0000',
          section: 'Dados do Futuro Colaborador'
        },

        {
          id: 'salario',
          label: 'Salário Nominal (R$)',
          type: 'currency',
          origin: 'C',
          required: true,
          section: 'Condições Contratuais'
        },
        {
          id: 'dataAdmissao',
          label: 'Data prevista de início',
          type: 'date',
          origin: 'C',
          required: true,
          section: 'Condições Contratuais'
        },
        {
          id: 'tipoContrato',
          label: 'Regime Jurídico',
          type: 'select',
          origin: 'C',
          required: true,
          options: ['CLT', 'PJ', 'Estágio', 'Temporário'],
          section: 'Condições Contratuais'
        },

        {
          id: 'prazoDias',
          label: 'Prazo em dias',
          type: 'select',
          origin: 'C',
          required: true,
          section: 'Envio do Link',
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
      vagaId: String(data.vagaId || ''),
      vagaTitulo: String(data.vaga || ''),
      nome,
      cpf: String(data.cpf).trim(),
      email: String(data.email).trim(),
      telefone: String(data.telefone || '').trim(),
      salario: Number(data.salario) || 0,
      dataAdmissao: paraDataISO(data.dataAdmissao),
      tipoContrato: String(data.tipoContrato || ''),
      prazoDias: Number(data.prazoDias) || 7
    });
    addToast(`Link de admissão digital enviado para ${nome}.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova admissão digital" size="lg">
      <div className="space-y-6">
        <InfoNote>
          O candidato recebe um link por e-mail para enviar os documentos pelo celular. Ele entra
          como <strong>Pré-admissão</strong> e só passa a contar como Ativo depois que o RH aprovar.
        </InfoNote>

        {/* O formulário tem quatro seções e passa da altura da tela; o corpo
            rola sozinho para o botão "Disparar link" ficar sempre visível. O
            calendário do campo de data é portal com reposicionamento no scroll,
            então acompanha a rolagem sem sair do lugar. */}
        <div className="max-h-[55vh] overflow-y-auto -mr-2 pr-2">
          <FormRenderer
            definition={DISPARO_DEFINITION}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            hideActions
          />
        </div>

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
