import {
  AvisoPrevioModo,
  DocumentoEncerramento,
  EncerramentoDesligamento,
  ItemChecklistEncerramento,
  TipoDesligamento,
  VerbaRescisoria
} from '../types';
import { localDateFromString } from './dateLocal';

// VERBAS RESCISÓRIAS E ENCERRAMENTO
//
// O que o colaborador recebe (e o que perde) depende SÓ do tipo de
// desligamento. Este módulo é a fonte única dessa tabela: a tela da etapa
// "Benefícios e Encerramento" apenas exibe o que sai daqui, e a auditoria
// (auditoria/simular-verbas-desligamento.ts) confere os cinco tipos contra a
// mesma função — sem duplicar a regra.
//
// Os valores em R$ NÃO são calculados: quem lança é o DP, conferindo a
// convenção coletiva aplicável. Aqui só se decide o que é devido e qual regra
// legal se aplica (inclusive os dias de aviso prévio, que vêm da admissão).

/** Nome da etapa — usado na trilha, nas tarefas, no histórico e na tela. */
export const ETAPA_ENCERRAMENTO = 'Benefícios e Encerramento';

export const TIPO_DESLIGAMENTO_LABELS: Record<TipoDesligamento, string> = {
  pedido_demissao: 'Pedido de Demissão',
  sem_justa_causa: 'Sem Justa Causa',
  justa_causa: 'Justa Causa',
  fim_contrato: 'Término de Contrato de Experiência',
  acordo: 'Acordo (art. 484-A)'
};

export const TIPOS_DESLIGAMENTO = Object.keys(TIPO_DESLIGAMENTO_LABELS) as TipoDesligamento[];

/** Prazo legal para o pagamento das verbas, contado do término do contrato. */
export const PRAZO_PAGAMENTO_DIAS = 10;

/** Só a dispensa sem justa causa habilita o seguro-desemprego. */
export const daDireitoASeguroDesemprego = (tipo?: TipoDesligamento): boolean =>
  tipo === 'sem_justa_causa';

export const ehTipoDesligamento = (valor: any): valor is TipoDesligamento =>
  typeof valor === 'string' && (TIPOS_DESLIGAMENTO as string[]).includes(valor);

/** Tipo gravado pelo formulário da solicitação (processDefinitions '15'). */
export const tipoDesligamentoDaSolicitacao = (
  data: Record<string, any> = {}
): TipoDesligamento | undefined =>
  ehTipoDesligamento(data.tipoDesligamento) ? data.tipoDesligamento : undefined;

/**
 * Data que encerra o contrato. O formulário tem três campos de data com efeitos
 * distintos: o término explícito só existe no fim de contrato, então o último
 * dia trabalhado é o que vale nos demais tipos.
 */
export const dataTerminoDaSolicitacao = (data: Record<string, any> = {}): string | undefined =>
  data.dataTerminoContrato || data.ultimoDiaTrabalhado || data.dataPrevistaDesligamento || undefined;

/** Anos completos entre duas datas (aniversário ainda não feito não conta). */
function anosCompletos(inicio: Date, fim: Date): number {
  let anos = fim.getFullYear() - inicio.getFullYear();
  const aindaNaoFezAniversario =
    fim.getMonth() < inicio.getMonth() ||
    (fim.getMonth() === inicio.getMonth() && fim.getDate() < inicio.getDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return Math.max(0, anos);
}

/**
 * Aviso prévio proporcional (Lei 12.506/2011): 30 dias + 3 por ano completo de
 * casa, limitado a 90. Sem data de admissão não há o que calcular — devolve
 * `null` e a tela mostra só a regra.
 */
export function diasAvisoPrevio(admissao?: string, termino?: string): number | null {
  const inicio = admissao ? localDateFromString(admissao) : null;
  if (!inicio) return null;
  const fim = (termino ? localDateFromString(termino) : null) || new Date();
  return Math.min(90, 30 + anosCompletos(inicio, fim) * 3);
}

/** Data limite para pagar a rescisão: término + 10 dias corridos. */
export function dataLimitePagamento(termino?: string): Date | null {
  const fim = termino ? localDateFromString(termino) : null;
  if (!fim) return null;
  const limite = new Date(fim);
  limite.setDate(limite.getDate() + PRAZO_PAGAMENTO_DIAS);
  return limite;
}

export interface ContextoVerbas {
  /** Data de admissão do colaborador — base do aviso prévio proporcional. */
  admissao?: string;
  /** Data de término do contrato. */
  termino?: string;
}

const verba = (
  id: string,
  label: string,
  devida: boolean,
  detalhe: string,
  semValor = false
): VerbaRescisoria => ({ id, label, devida, detalhe, ...(semValor ? { semValor: true } : {}) });

/**
 * A lista de verbas do tipo informado. Sempre as mesmas oito linhas, na mesma
 * ordem: o que muda é o `devida` e a regra descrita — assim a tela mostra lado a
 * lado o que é pago e o que se perde naquele tipo de desligamento.
 */
export function calcularVerbas(tipo: TipoDesligamento, ctx: ContextoVerbas = {}): VerbaRescisoria[] {
  const dias = diasAvisoPrevio(ctx.admissao, ctx.termino);
  const regraProporcional = dias
    ? `${dias} dias — 30 + 3 por ano completo, limitado a 90.`
    : '30 dias + 3 por ano completo de casa, limitado a 90.';
  const regraAcordo = dias
    ? `Indenizado pela metade: ${Math.round(dias / 2)} de ${dias} dias (art. 484-A).`
    : 'Indenizado pela metade (50%), conforme art. 484-A.';

  const saldo = verba(
    'saldo_salario',
    'Saldo de salário',
    true,
    'Dias efetivamente trabalhados no mês da rescisão.'
  );
  const feriasVencidas = verba(
    'ferias_vencidas',
    'Férias vencidas + 1/3',
    true,
    'Período aquisitivo completo e não gozado, com o terço constitucional.'
  );

  switch (tipo) {
    case 'sem_justa_causa':
      return [
        saldo,
        verba('aviso_previo', 'Aviso prévio', true, regraProporcional),
        verba('decimo_terceiro', '13º salário proporcional', true, 'Avos proporcionais aos meses trabalhados no ano.'),
        feriasVencidas,
        verba('ferias_proporcionais', 'Férias proporcionais + 1/3', true, 'Avos do período aquisitivo em curso, com o terço.'),
        verba('multa_fgts', 'Multa do FGTS', true, 'Multa de 40% sobre o saldo depositado.'),
        verba('saque_fgts', 'Saque do FGTS', true, 'Saque integral do saldo da conta vinculada.'),
        verba('seguro_desemprego', 'Seguro-desemprego', true, 'Habilitado — guia emitida pelo empregador.', true)
      ];

    case 'pedido_demissao':
      return [
        saldo,
        verba(
          'aviso_previo',
          'Aviso prévio',
          true,
          'Cumprido pelo colaborador ou descontado da rescisão — definir ao lado.'
        ),
        verba('decimo_terceiro', '13º salário proporcional', true, 'Avos proporcionais aos meses trabalhados no ano.'),
        feriasVencidas,
        verba('ferias_proporcionais', 'Férias proporcionais + 1/3', true, 'Avos do período aquisitivo em curso, com o terço.'),
        verba('multa_fgts', 'Multa do FGTS', false, 'Não há multa no pedido de demissão.'),
        verba('saque_fgts', 'Saque do FGTS', false, 'Saldo permanece retido na conta vinculada.'),
        verba('seguro_desemprego', 'Seguro-desemprego', false, 'Não dá direito ao benefício.', true)
      ];

    case 'justa_causa':
      return [
        saldo,
        verba('aviso_previo', 'Aviso prévio', false, 'Não há aviso prévio na justa causa.'),
        verba('decimo_terceiro', '13º salário proporcional', false, 'Perdido na justa causa.'),
        feriasVencidas,
        verba('ferias_proporcionais', 'Férias proporcionais + 1/3', false, 'Perdidas na justa causa.'),
        verba('multa_fgts', 'Multa do FGTS', false, 'Não há multa na justa causa.'),
        verba('saque_fgts', 'Saque do FGTS', false, 'Saldo permanece retido na conta vinculada.'),
        verba('seguro_desemprego', 'Seguro-desemprego', false, 'Não dá direito ao benefício.', true)
      ];

    case 'acordo':
      return [
        saldo,
        verba('aviso_previo', 'Aviso prévio', true, regraAcordo),
        verba('decimo_terceiro', '13º salário proporcional', true, 'Avos proporcionais aos meses trabalhados no ano.'),
        feriasVencidas,
        verba('ferias_proporcionais', 'Férias proporcionais + 1/3', true, 'Avos do período aquisitivo em curso, com o terço.'),
        verba('multa_fgts', 'Multa do FGTS', true, 'Multa de 20% — metade da multa cheia (art. 484-A).'),
        verba('saque_fgts', 'Saque do FGTS', true, 'Saque de até 80% do saldo da conta vinculada.'),
        verba('seguro_desemprego', 'Seguro-desemprego', false, 'O acordo não dá direito ao benefício.', true)
      ];

    case 'fim_contrato':
      return [
        saldo,
        verba('aviso_previo', 'Aviso prévio', false, 'Contrato por prazo determinado encerrado no termo final.'),
        verba('decimo_terceiro', '13º salário proporcional', true, 'Avos proporcionais aos meses trabalhados no ano.'),
        verba('ferias_vencidas', 'Férias vencidas + 1/3', false, 'Não há período aquisitivo completo na experiência.'),
        verba('ferias_proporcionais', 'Férias proporcionais + 1/3', true, 'Avos do período trabalhado, com o terço.'),
        verba('multa_fgts', 'Multa do FGTS', false, 'Sem multa quando o contrato encerra no termo final.'),
        verba('saque_fgts', 'Saque do FGTS', true, 'Saque liberado pelo encerramento do contrato.'),
        verba('seguro_desemprego', 'Seguro-desemprego', false, 'Não dá direito ao benefício.', true)
      ];
  }
}

/** Soma só o que é devido e tem valor a lançar (o direito sem R$ fica de fora). */
export const totalVerbas = (verbas: VerbaRescisoria[] = []): number =>
  verbas.reduce((total, v) => (v.devida && !v.semValor ? total + (Number(v.valor) || 0) : total), 0);

/**
 * Recalcula a tabela do tipo e traz de volta os valores já lançados pelo DP.
 * Roda a cada abertura da tela: se a regra deste módulo mudar, o pedido em
 * andamento passa a refletir a regra nova sem perder o que foi digitado.
 */
export function mesclarVerbas(
  tipo: TipoDesligamento,
  salvas: VerbaRescisoria[] = [],
  ctx: ContextoVerbas = {}
): VerbaRescisoria[] {
  return calcularVerbas(tipo, ctx).map(base => {
    const anterior = salvas.find(v => v.id === base.id);
    // Valor de verba que deixou de ser devida não volta: seria dinheiro lançado
    // numa linha que a tela mostra como "não devida".
    return anterior?.valor !== undefined && base.devida && !base.semValor
      ? { ...base, valor: anterior.valor }
      : base;
  });
}

export function checklistPadrao(): ItemChecklistEncerramento[] {
  return [
    {
      id: 'plano_saude',
      label: 'Desativar plano de saúde',
      descricao: 'Comunicar a operadora e encerrar titular e dependentes.',
      concluido: false,
      labelData: 'Data de corte'
    },
    {
      id: 'plano_odontologico',
      label: 'Desativar plano odontológico',
      descricao: 'Mesmo corte do plano de saúde, quando houver adesão.',
      concluido: false,
      labelData: 'Data de corte'
    },
    {
      id: 'vr_va',
      label: 'Bloquear VR/VA',
      descricao: 'Bloquear o cartão e apurar o desconto dos dias não trabalhados.',
      concluido: false,
      labelData: 'Data do bloqueio',
      labelValor: 'Desconto proporcional (opcional)'
    },
    {
      id: 'vale_transporte',
      label: 'Cancelar vale-transporte',
      descricao: 'Encerrar a recarga e recolher o cartão, se aplicável.',
      concluido: false,
      labelData: 'Data do cancelamento'
    },
    {
      id: 'seguro_vida',
      label: 'Cancelar seguro de vida',
      descricao: 'Excluir da apólice coletiva na próxima fatura.',
      concluido: false,
      labelData: 'Data do cancelamento'
    },
    {
      id: 'devolucao_equipamentos',
      label: 'Devolução de notebook, celular e crachá',
      descricao: 'Conferir os ativos entregues e registrar o recebimento.',
      concluido: false,
      labelData: 'Data da devolução'
    },
    {
      id: 'acessos_ti',
      label: 'Revogar acessos de TI e sistemas',
      descricao: 'E-mail, VPN, ERP e demais sistemas corporativos.',
      concluido: false,
      labelData: 'Data da revogação'
    }
  ];
}

/**
 * Documentos da rescisão. A guia do seguro-desemprego só entra quando o tipo dá
 * direito — pedir o documento em pedido de demissão ou justa causa seria uma
 * pendência impossível de resolver.
 */
export function documentosPadrao(tipo: TipoDesligamento): DocumentoEncerramento[] {
  const documentos: DocumentoEncerramento[] = [
    { id: 'trct', label: 'TRCT', descricao: 'Termo de Rescisão do Contrato de Trabalho.', },
    { id: 'aso_demissional', label: 'ASO demissional', descricao: 'Atestado de Saúde Ocupacional de desligamento.' },
    { id: 'grrf', label: 'Chave de conectividade / GRRF (FGTS)', descricao: 'Guia de recolhimento rescisório do FGTS.' },
    { id: 'esocial_s2299', label: 'Evento eSocial S-2299', descricao: 'Recibo do evento de desligamento.' },
    { id: 'baixa_ctps', label: 'Baixa na CTPS', descricao: 'Anotação da saída na carteira digital.' }
  ];

  if (daDireitoASeguroDesemprego(tipo)) {
    documentos.push({
      id: 'guia_seguro_desemprego',
      label: 'Guia do seguro-desemprego',
      descricao: 'Emitida pelo empregador — exclusiva da dispensa sem justa causa.'
    });
  }

  documentos.push({
    id: 'termo_quitacao',
    label: 'Termo de quitação / homologação',
    descricao: 'Assinado pelas partes, com assistência sindical quando exigida.'
  });

  return documentos;
}

/** Estado inicial da etapa, montado a partir do tipo da solicitação. */
export function criarEncerramento(
  tipo: TipoDesligamento,
  ctx: ContextoVerbas = {}
): EncerramentoDesligamento {
  return {
    tipo,
    verbas: calcularVerbas(tipo, ctx),
    avisoPrevioModo: tipo === 'pedido_demissao' ? ('trabalhado' as AvisoPrevioModo) : undefined,
    checklist: checklistPadrao(),
    documentos: documentosPadrao(tipo)
  };
}

/**
 * Reidrata a etapa: recompõe a tabela do tipo atual e devolve o que o DP já
 * preencheu. Serve tanto para o primeiro acesso (sem `salvo`) quanto para os
 * seguintes.
 */
export function prepararEncerramento(
  tipo: TipoDesligamento,
  salvo: EncerramentoDesligamento | undefined,
  ctx: ContextoVerbas = {}
): EncerramentoDesligamento {
  const base = criarEncerramento(tipo, ctx);
  if (!salvo) return base;

  const documentos = base.documentos.map(doc => {
    const anterior = salvo.documentos?.find(d => d.id === doc.id);
    return anterior?.anexo ? { ...doc, anexo: anterior.anexo } : doc;
  });

  const checklist = base.checklist.map(item => {
    const anterior = salvo.checklist?.find(c => c.id === item.id);
    return anterior
      ? { ...item, concluido: !!anterior.concluido, data: anterior.data, valor: anterior.valor }
      : item;
  });

  return {
    ...base,
    verbas: mesclarVerbas(tipo, salvo.verbas, ctx),
    avisoPrevioModo: salvo.avisoPrevioModo || base.avisoPrevioModo,
    checklist,
    documentos,
    observacao: salvo.observacao,
    concluidoEm: salvo.concluidoEm,
    concluidoPor: salvo.concluidoPor
  };
}

/** Contadores usados no rodapé da tela e na confirmação do encerramento. */
export function pendenciasEncerramento(encerramento: EncerramentoDesligamento) {
  const checklistTotal = encerramento.checklist.length;
  const checklistFeitos = encerramento.checklist.filter(i => i.concluido).length;
  const documentosTotal = encerramento.documentos.length;
  const documentosAnexados = encerramento.documentos.filter(d => !!d.anexo).length;
  const verbasDevidas = encerramento.verbas.filter(v => v.devida && !v.semValor);
  const verbasSemValor = verbasDevidas.filter(v => !v.valor).length;

  return {
    checklistTotal,
    checklistFeitos,
    documentosTotal,
    documentosAnexados,
    verbasDevidas: verbasDevidas.length,
    verbasSemValor,
    total: totalVerbas(encerramento.verbas)
  };
}
