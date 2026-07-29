import { AdmissaoBloco, AdmissaoDigital, Employee } from '../types';

/**
 * Blocos de documento pedidos ao colaborador no portal. A CTPS fica opcional
 * de propósito: mostra na demo que o botão "Concluir e enviar" só depende dos
 * obrigatórios.
 */
export const BLOCOS_ADMISSAO_PADRAO: Omit<AdmissaoBloco, 'anexos' | 'statusRevisao' | 'motivoRevisao'>[] = [
  {
    id: 'dados-pessoais',
    titulo: 'Dados Pessoais',
    descricao: 'Documento com nome completo, data de nascimento e nome da mãe.',
    obrigatorio: true
  },
  {
    id: 'rg',
    titulo: 'RG (frente e verso)',
    descricao: 'Duas imagens legíveis, sem reflexo e com as bordas visíveis.',
    obrigatorio: true
  },
  {
    id: 'comprovante-endereco',
    titulo: 'Comprovante de Endereço',
    descricao: 'Conta de luz, água ou telefone dos últimos 3 meses.',
    obrigatorio: true
  },
  {
    id: 'ctps',
    titulo: 'CTPS Digital',
    descricao: 'PDF da carteira de trabalho digital (opcional nesta etapa).',
    obrigatorio: false
  }
];

export function criarBlocosAdmissao(): AdmissaoBloco[] {
  return BLOCOS_ADMISSAO_PADRAO.map(bloco => ({
    ...bloco,
    anexos: [],
    statusRevisao: 'PENDENTE' as const
  }));
}

export function blocoPreenchido(bloco: AdmissaoBloco): boolean {
  return bloco.anexos.length > 0;
}

/** % concluído exibido na barra do topo do portal — conta todos os blocos. */
export function progressoAdmissao(admissao: AdmissaoDigital): number {
  const total = admissao.blocos.length;
  if (total === 0) return 0;
  return Math.round((admissao.blocos.filter(blocoPreenchido).length / total) * 100);
}

/** Blocos que o portal mostra: todos, ou só os devolvidos no modo correção. */
export function blocosVisiveis(admissao: AdmissaoDigital): AdmissaoBloco[] {
  if (admissao.estado !== 'EM_CORRECAO') return admissao.blocos;
  return admissao.blocos.filter(b => b.statusRevisao === 'AGUARDANDO_CORRECAO');
}

/**
 * Habilita "Concluir e enviar" / "Corrigir e reenviar": termo aceito e todos os
 * blocos visíveis obrigatórios com pelo menos um anexo. No modo correção todo
 * bloco devolvido precisa de anexo novo, obrigatório ou não.
 */
export function podeEnviarAdmissao(admissao: AdmissaoDigital): boolean {
  if (!admissao.termoAceito) return false;
  const visiveis = blocosVisiveis(admissao);
  if (visiveis.length === 0) return false;
  const emCorrecao = admissao.estado === 'EM_CORRECAO';
  return visiveis.every(b => (emCorrecao || b.obrigatorio ? blocoPreenchido(b) : true));
}

/** Colaboradores do seed antigo não têm `situacao` — valem como ativos. */
export function situacaoDoColaborador(emp: Employee): 'PRE_ADMISSAO' | 'ATIVO' {
  return emp.situacao || 'ATIVO';
}

/** Quem aparece no menu Portal do Colaborador. */
export function aguardandoColaborador(emp: Employee): boolean {
  const estado = emp.admissaoDigital?.estado;
  return estado === 'AGUARDANDO_PREENCHIMENTO' || estado === 'EM_CORRECAO';
}

/** Quem aparece na fila de revisão do RH. */
export function aguardandoRevisaoRH(emp: Employee): boolean {
  return emp.admissaoDigital?.estado === 'EM_ANALISE';
}

export const ESTADO_ADMISSAO_LABEL: Record<AdmissaoDigital['estado'], string> = {
  AGUARDANDO_PREENCHIMENTO: 'Aguardando preenchimento',
  EM_ANALISE: 'Em análise do RH',
  EM_CORRECAO: 'Em correção'
};

export const ESTADO_ADMISSAO_BADGE: Record<AdmissaoDigital['estado'], 'blue' | 'amber' | 'red'> = {
  AGUARDANDO_PREENCHIMENTO: 'blue',
  EM_ANALISE: 'amber',
  EM_CORRECAO: 'red'
};

/** Prazo final do link, calculado a partir do disparo. */
export function prazoFinal(admissao: AdmissaoDigital): Date {
  return new Date(new Date(admissao.disparo.enviadoEm).getTime() + admissao.disparo.prazoDias * 86400000);
}
