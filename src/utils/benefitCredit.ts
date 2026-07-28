import { BenefitConfig } from '../types';

// O crédito de VR/VA é lançado pelo RH — o colaborador não informa valor nem
// status, apenas confere e assina o recebimento. Aqui o lançamento é derivado
// da configuração de benefícios da empresa (mesma fonte do cadastro), na
// competência corrente. Em produção este seria o retorno da folha/operadora.

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Dia útil padrão do crédito no cartão.
const CREDIT_DAY = 5;

export interface BenefitCredit {
  competencia: string;
  beneficio: string;
  valorCreditado: number;
  dataCredito: string; // dd/mm/aaaa, mesmo formato usado pelos campos de data
}

const formatCompetence = (reference: Date) =>
  `${MONTH_NAMES[reference.getMonth()]}/${reference.getFullYear()}`;

const formatCreditDate = (reference: Date) =>
  `${String(CREDIT_DAY).padStart(2, '0')}/${String(reference.getMonth() + 1).padStart(2, '0')}/${reference.getFullYear()}`;

export function getBenefitCredit(
  benefits: BenefitConfig[] = [],
  reference: Date = new Date()
): BenefitCredit {
  // Vale Refeição é o crédito principal; se a empresa não o tiver ativo, cai
  // para o Vale Alimentação.
  const card =
    benefits.find(b => b.active && b.type === 'Refeição') ||
    benefits.find(b => b.active && b.type === 'Alimentação');

  return {
    competencia: formatCompetence(reference),
    beneficio: card?.name || 'Vale Refeição',
    valorCreditado: card?.cost ?? 0,
    dataCredito: formatCreditDate(reference)
  };
}
