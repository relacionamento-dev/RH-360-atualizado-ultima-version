import { Employee, RHProcess, RHRequest } from '../types';
import { isPendingStatus } from './requestStatus';

// VISÃO GERAL DA OPERAÇÃO (painel da tela de login)
//
// O painel da tela de login mostrava números decorativos — headcount 184 contra
// os colaboradores que o Dashboard lista, "42 sol." num mês, turnover 2,4%.
// Quem testava comparava com a tela de dentro e concluía que o sistema não
// fecha os próprios números.
//
// Aqui os mesmos números saem do estado real, com as MESMAS contas das telas de
// dentro. A tela de login já roda dentro do AppConfigProvider (App.tsx), então
// o seed/localStorage está disponível antes da autenticação — e nada disso é
// dado de pessoa: são totais agregados da base de demonstração.

export interface FatiaMensal {
  /** 'AGO' — rótulo do eixo. */
  label: string;
  /** 'ago/2026' — usado no balão do pico, onde o ano importa. */
  labelCompleto: string;
  total: number;
}

export interface PendenciaPorProcesso {
  nome: string;
  total: number;
  /** Quantas dessas estão com o SLA estourado — é o que acende o sinal vermelho. */
  criticos: number;
}

export interface ResumoOperacao {
  /** Colaboradores ativos — mesma conta do KPI "Colaboradores Ativos" do Dashboard. */
  headcount: number;
  /** Admitidos no mês corrente, mesma regra da lista "Boas-vindas" da Intranet. */
  admitidosNoMes: number;
  /** Solicitações em aberto — conjunto canônico de `isPendingStatus`. */
  emAndamento: number;
  /** Quantos processos distintos respondem por essas solicitações em aberto. */
  processosEmAndamento: number;
  /** Solicitações em aberto com SLA estourado (mesmo campo da coluna SLA das listas). */
  slaEstourado: number;
  /** Turnover em %, mesma fórmula do KPI "Turnover Médio (Real)" de Relatórios. */
  turnover: number;
  desligados: number;
  totalColaboradores: number;
  /** Solicitações abertas por mês, do mais antigo ao mês corrente. */
  porMes: FatiaMensal[];
  /** Mês de maior volume da série — é o ponto que o gráfico destaca. */
  pico: FatiaMensal;
  /** Processos com mais solicitações em aberto, do maior para o menor. */
  pendenciasPorProcesso: PendenciaPorProcesso[];
}

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** Meses exibidos na série do gráfico, terminando no mês corrente. */
const JANELA_MESES = 8;

export function resumoDaOperacao(
  colaboradores: Employee[],
  solicitacoes: RHRequest[],
  processos: RHProcess[],
  hoje: Date = new Date()
): ResumoOperacao {
  const headcount = colaboradores.filter(e => e.status === 'Ativo').length;

  // Mesma regra da Intranet ("Boas-vindas"): mês da admissão, quem não foi
  // desligado. O ano não entra — o seed tem admissões de anos anteriores e a
  // Intranet as celebra do mesmo jeito.
  const mesAtual = hoje.getMonth() + 1;
  const admitidosNoMes = colaboradores.filter(
    e => e.status !== 'Desligado' && Number(e.admissionDate?.slice(5, 7)) === mesAtual
  ).length;

  const emAberto = solicitacoes.filter(r => isPendingStatus(r.status));
  const emAndamento = emAberto.length;
  const processosEmAndamento = new Set(emAberto.map(r => r.tipoProcesso || r.processId)).size;
  const slaEstourado = emAberto.filter(r => r.slaStatus === 'critical').length;

  // Turnover: vínculos encerrados sobre a base inteira (ReportsModule.tsx).
  const totalColaboradores = colaboradores.length;
  const desligados = colaboradores.filter(e => ['Inativo', 'Desligado'].includes(e.status)).length;
  const turnover = totalColaboradores > 0 ? (desligados / totalColaboradores) * 100 : 0;

  // Série mensal: uma casa por mês da janela, contando pela data de abertura.
  const porMes: FatiaMensal[] = [];
  for (let i = JANELA_MESES - 1; i >= 0; i--) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = ref.getFullYear();
    const mes = ref.getMonth();
    porMes.push({
      label: MESES[mes],
      labelCompleto: `${MESES[mes].toLowerCase()}/${ano}`,
      total: solicitacoes.filter(r => {
        const criada = new Date(r.createdAt);
        return criada.getFullYear() === ano && criada.getMonth() === mes;
      }).length
    });
  }
  const pico = porMes.reduce((maior, atual) => (atual.total > maior.total ? atual : maior), porMes[0]);

  const totalPorProcesso = new Map<string, PendenciaPorProcesso>();
  emAberto.forEach(req => {
    const processo = processos.find(p => p.id === (req.tipoProcesso || req.processId));
    const nome = processo?.name || req.processName || 'Outros';
    const atual = totalPorProcesso.get(nome) || { nome, total: 0, criticos: 0 };
    atual.total += 1;
    if (req.slaStatus === 'critical') atual.criticos += 1;
    totalPorProcesso.set(nome, atual);
  });
  // Ordena por volume (é o que a lista promete: "pendências por processo"); o
  // SLA estourado só decide empate — e acende o sinal vermelho no item.
  const pendenciasPorProcesso = [...totalPorProcesso.values()]
    .sort((a, b) => b.total - a.total || b.criticos - a.criticos || a.nome.localeCompare(b.nome));

  return {
    headcount,
    admitidosNoMes,
    emAndamento,
    processosEmAndamento,
    slaEstourado,
    turnover,
    desligados,
    totalColaboradores,
    porMes,
    pico,
    pendenciasPorProcesso
  };
}

/** '3,85' — o separador decimal da interface é a vírgula. */
export const formatarPercentual = (valor: number, casas = 2): string =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
