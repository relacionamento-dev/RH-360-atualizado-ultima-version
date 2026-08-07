import { BadgeVariant } from '../components/ui/Badge';

// Fonte única de verdade para status de solicitação/acesso: cor semântica e o
// conjunto canônico de "pendente/em andamento" usado pelos contadores. Evita as
// várias tabelas divergentes que existiam espalhadas pelas telas.

// Status em que a solicitação ainda demanda ação (aparece como pendência nas
// listas e deve ser contada pelos KPIs de "pendentes/em andamento").
export const PENDING_STATUSES = [
  'Pendente de Aprovação',
  'Em Análise',
  'Em Aprovação',
  'Enviada',
  // Desligamento: cascata aprovada, esperando o RH/DP executar a etapa de
  // Benefícios e Encerramento. Ainda é trabalho em aberto.
  'Aguardando Encerramento',
] as const;

export const isPendingStatus = (status?: string): boolean =>
  !!status && (PENDING_STATUSES as readonly string[]).includes(status);

export const isConcludedStatus = (status?: string): boolean =>
  status === 'Concluída' || status === 'Concluído' || status === 'Aprovada' ||
  // Protocolo de recebimento: assinou, encerrou.
  status === 'Recebimento Confirmado';

export const isReturnedStatus = (status?: string): boolean =>
  status === 'Devolvida' || status === 'Devolvido';

// Paleta semântica única (preenchida, via variants do Badge). Cobre status de
// solicitação e de acesso (Ativo/Expirando/Expirado/Bloqueado).
export function getStatusVariant(status?: string): BadgeVariant {
  switch (status) {
    case 'Rascunho':
      return 'gray';
    case 'Aberto':
    case 'Enviada':
      return 'blue';
    case 'Pendente de Aprovação':
    case 'Em Análise':
    case 'Em Aprovação':
    case 'Aguardando Encerramento':
    case 'Expirando':
      return 'amber';
    case 'Devolvido':
    case 'Devolvida':
      return 'purple';
    case 'Aprovada':
    case 'Concluído':
    case 'Concluída':
    case 'Recebimento Confirmado':
    case 'Ativo':
      return 'green';
    case 'Reprovada':
    case 'Reprovado':
    case 'Cancelado':
    case 'Cancelada':
    case 'Bloqueado':
      return 'red';
    case 'Expirado':
      return 'gray';
    default:
      return 'gray';
  }
}
