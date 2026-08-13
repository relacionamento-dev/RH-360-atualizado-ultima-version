/**
 * SIMULADOR DA CASCATA DE APROVAÇÃO — auditoria do motor parametrizado
 * =====================================================================
 *
 * Rodar:  npx tsx auditoria/simular-aprovacoes.ts
 *         npx tsx auditoria/simular-aprovacoes.ts --json   (saída JSON)
 *
 * Sem browser e sem React: abre uma solicitação em cada um dos 15 processos e
 * percorre a cascata de níveis configurada em Central Adm > Processos >
 * Aprovações, conferindo se o `approvalFlow.ts` respeita a condição de cada
 * nível ("Sempre" / "Se maior que") e se o status final e o histórico ficam
 * corretos.
 *
 * O QUE É REAL E O QUE É ESPELHO
 * ------------------------------
 * - REAL (importado de src/): `buildApprovalChain`, `isStepApplicable`,
 *   `resolveConditionField`, `getCurrentLevelIndex`, `levelLabel`, `slaToMs`,
 *   `ensureApprovalChain` — todo o motor de decisão vem de
 *   src/utils/approvalFlow.ts. A configuração dos processos vem de
 *   INITIAL_RH_PROCESSES (src/data.ts) e os formulários de PROCESS_DEFINITIONS
 *   (src/processDefinitions.ts).
 * - ESPELHO: `abrirSolicitacao` e `aprovarUmNivel` reproduzem as transições de
 *   estado de `createRequest` (AppConfigContext.tsx:440-578) e `approveRequest`
 *   (AppConfigContext.tsx:707-824), que hoje moram dentro do provider React e
 *   não são importáveis fora do browser. As linhas de origem estão citadas
 *   junto de cada transição. Se aquele arquivo mudar, este espelho precisa
 *   acompanhar.
 */

import { COST_CENTERS, DEMO_USERS, INITIAL_EMPLOYEES, INITIAL_RH_PROCESSES, SECTORS } from '../src/data';
import { PROCESS_DEFINITIONS } from '../src/processDefinitions';
import {
  buildApprovalChain,
  ensureApprovalChain,
  getCurrentLevelIndex,
  isStepApplicable,
  levelLabel,
  Organizacao,
  resolveConditionField,
  slaToMs
} from '../src/utils/approvalFlow';
import { estaAbaixoDe, porId } from '../src/utils/hierarquia';
import { ApprovalStep, Employee, FormField, RHProcess, RequestApprovalLevel } from '../src/types';
import { PROCESSO_DESLIGAMENTO } from '../src/utils/permissions';
import { ETAPA_ENCERRAMENTO } from '../src/utils/desligamento';

// ---------------------------------------------------------------------------
// Espelho das transições de estado do AppConfigContext
// ---------------------------------------------------------------------------

interface SolicitacaoSimulada {
  numero: string;
  processId: string;
  status: string;
  etapaAtual: string;
  responsavelAtual: string;
  approvalChain: RequestApprovalLevel[];
  trail: string[];
  data: Record<string, any>;
  historico: { etapa?: string; action?: string; de?: string; para?: string; comentario?: string }[];
  tarefas: { title: string; assignedTo?: string }[];
}

/**
 * A estrutura real da empresa, igual à que o provider monta
 * (`organizacaoDoConfig`). É ela que faz o aprovador sair da hierarquia do alvo
 * em vez de um mapa fixo de tipo → usuário.
 */
const ORGANIZACAO: Organizacao = {
  colaboradores: INITIAL_EMPLOYEES,
  setores: SECTORS,
  centrosDeCusto: COST_CENTERS,
  usuarios: DEMO_USERS
};

/** Espelha createRequest (AppConfigContext.tsx:440-578), caminho não-rascunho. */
function abrirSolicitacao(
  process: RHProcess,
  data: Record<string, any>,
  alvo?: Employee
): SolicitacaoSimulada {
  const acknowledgement = PROCESS_DEFINITIONS[process.id]?.acknowledgement; // :449
  const approvalChain = acknowledgement
    ? []
    : buildApprovalChain(process, data, { ...ORGANIZACAO, alvo }); // :453
  const firstLevel = approvalChain[0]; // :454

  const req: SolicitacaoSimulada = {
    numero: `RH-SIM-${process.id}`,
    processId: process.id,
    status: acknowledgement?.status || 'Pendente de Aprovação', // :491
    etapaAtual: acknowledgement?.etapa || firstLevel?.name || 'Aprovação', // :492
    responsavelAtual: acknowledgement ? 'Colaborador' : (firstLevel?.responsibleLabel || 'Administrador Demo'), // :493-495
    approvalChain,
    trail: acknowledgement?.trail || ['Solicitação', ...approvalChain.map(l => l.name), 'Conclusão'], // :500
    data,
    historico: [
      {
        etapa: 'Solicitação', // :511
        de: 'Novo',
        para: acknowledgement?.etapa || firstLevel?.name || 'Aprovação', // :513
        action: acknowledgement ? 'Confirmação' : 'Envio', // :516
        comentario:
          acknowledgement?.comment ||
          `Solicitação enviada. Fluxo com ${approvalChain.length} nível(is) de aprovação: ${approvalChain
            .map(l => l.name)
            .join(' → ')}.` // :519-520
      }
    ],
    tarefas: []
  };

  if (!acknowledgement) {
    // :526-552 — a tarefa nasce no responsável do PRIMEIRO nível.
    req.tarefas.push({
      title: `Aprovar ${process.name} — ${firstLevel?.name || 'Aprovação'}`,
      assignedTo: firstLevel?.responsibleUserId || firstLevel?.responsibleEmployeeId || 'ADMIN-001'
    });
  }
  // Só para exercitar o cálculo de SLA da abertura (:496).
  if (firstLevel) slaToMs(firstLevel);

  return req;
}

/** Espelha approveRequest (AppConfigContext.tsx:707-824). Retorna false se não há nível pendente. */
function aprovarUmNivel(req: SolicitacaoSimulada, process: RHProcess, aprovador = 'Administrador Demo'): boolean {
  const chain = ensureApprovalChain(req as any, process); // :721
  const levelIndex = getCurrentLevelIndex(chain); // :722
  const approvedLevel = chain[levelIndex]; // :723
  if (!approvedLevel) return false; // :725-728

  const newChain = chain.map((level, i) =>
    i === levelIndex ? { ...level, status: 'aprovado' as const, decidedBy: aprovador } : level
  ); // :731-740

  const nextLevel = newChain[levelIndex + 1]; // :742
  const isFinal = !nextLevel; // :743
  const currentLabel = levelLabel(newChain, levelIndex); // :745
  // Desligamento: a última alçada NÃO conclui — abre a etapa de Benefícios e
  // Encerramento (RH/DP), que é quem encerra o vínculo.
  const abreEncerramento = isFinal && process.id === PROCESSO_DESLIGAMENTO;
  const proximaEtapa = abreEncerramento ? ETAPA_ENCERRAMENTO : isFinal ? 'Conclusão' : nextLevel.name;

  req.historico.push({
    etapa: approvedLevel.name, // :755
    de: req.status,
    para: abreEncerramento ? ETAPA_ENCERRAMENTO : isFinal ? 'Concluída' : nextLevel.name, // :757
    action: isFinal ? 'Aprovação Final' : `Aprovação — ${currentLabel}` // :746
  });

  req.status = abreEncerramento ? 'Aguardando Encerramento' : isFinal ? 'Concluída' : 'Em Aprovação'; // :744
  req.etapaAtual = proximaEtapa; // :766
  req.approvalChain = newChain; // :767
  req.responsavelAtual = abreEncerramento ? 'RH / DP' : isFinal ? '' : nextLevel.responsibleLabel; // :769
  req.trail = [
    'Solicitação',
    ...newChain.map(l => l.name),
    ...(process.id === PROCESSO_DESLIGAMENTO ? [ETAPA_ENCERRAMENTO] : []),
    'Conclusão'
  ]; // :771

  if (!isFinal) {
    // :800-823 — abre a tarefa do PRÓXIMO nível.
    req.tarefas.push({
      title: `Aprovar ${process.name} — ${nextLevel.name}`,
      assignedTo: nextLevel.responsibleUserId || nextLevel.responsibleEmployeeId || 'ADMIN-001'
    });
  }

  if (abreEncerramento) {
    // A etapa do RH/DP nasce como tarefa, e é ela — não esta aprovação — que
    // conclui a solicitação (concluirEncerramentoDesligamento).
    req.tarefas.push({
      title: `${ETAPA_ENCERRAMENTO} - ${process.name}`,
      assignedTo: 'RH-001'
    });
  }
  // Fora do espelho: no nível final o approveRequest real também aplica o
  // handoff de cadastro (`aplicarHandoffCadastro`, AppConfigContext.tsx:125-199)
  // — promoção, movimentação e desligamento reescrevem a ficha do colaborador.
  // Aqui não há lista de colaboradores para alterar; a auditoria olha só a
  // cascata. Esse efeito é conferido no teste de tela, não neste simulador.
  return true;
}

// ---------------------------------------------------------------------------
// Geração de dados de formulário plausíveis, a partir de PROCESS_DEFINITIONS
// ---------------------------------------------------------------------------

/** Chave usada no `data` da solicitação — mesma regra do FormRenderer (:194). */
const chaveDoCampo = (f: FormField) => (f as any).id || (f as any).name;

const primeiraOpcao = (f: FormField): any => {
  const opt = f.options?.[0];
  if (opt === undefined) return 'Opção';
  return typeof opt === 'object' ? opt.value : opt;
};

/**
 * Preenche todos os campos visíveis do formulário. `valorMonetario` define
 * quanto vale cada campo do tipo currency — é o que faz uma alçada condicional
 * "Se maior que X" disparar ou não.
 */
function montarDados(processId: string, valorMonetario: number): Record<string, any> {
  const fields = PROCESS_DEFINITIONS[processId]?.steps?.[0]?.fields || [];
  const data: Record<string, any> = {};

  // Duas passadas: campos condicionais só aparecem depois que o campo que os
  // controla (ex.: tipoDesligamento) já tem valor.
  for (let passada = 0; passada < 2; passada++) {
    for (const f of fields) {
      const key = chaveDoCampo(f);
      if (!key || f.type === 'info') continue;
      if (f.condition && !f.condition(data)) continue;
      if (data[key] !== undefined) continue;

      switch (f.type) {
        case 'currency':
        case 'number':
          data[key] = f.type === 'currency' ? valorMonetario : (f.defaultValue ?? 10);
          break;
        case 'select':
        case 'radio':
          data[key] = primeiraOpcao(f);
          break;
        case 'date':
          data[key] = '2026-08-01';
          break;
        case 'boolean':
        case 'checkbox':
          data[key] = true;
          break;
        case 'signature':
          data[key] = { signed: true };
          break;
        case 'zoom':
          data[key] = 'EMP-001';
          break;
        case 'file':
          data[key] = 'arquivo.pdf';
          break;
        case 'calc':
          if (f.calculate) data[key] = f.calculate(data);
          break;
        default:
          data[key] = `${f.label} (simulado)`;
      }
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Verificações
// ---------------------------------------------------------------------------

type Severidade = 'OK' | 'ALERTA' | 'FALHA';

interface Achado {
  processo: string;
  cenario: string;
  severidade: Severidade;
  verificacao: string;
  detalhe: string;
}

const achados: Achado[] = [];
const registrar = (
  processo: string,
  cenario: string,
  severidade: Severidade,
  verificacao: string,
  detalhe: string
) => achados.push({ processo, cenario, severidade, verificacao, detalhe });

/**
 * Confere se o `conditionField` de cada nível existe de fato no formulário do
 * processo. Um campo inexistente faz a comparação numérica cair em `null` e o
 * nível NUNCA disparar (approvalFlow.ts:70-78) — falha silenciosa.
 */
function auditarCamposDeCondicao(process: RHProcess) {
  const fields = PROCESS_DEFINITIONS[process.id]?.steps?.[0]?.fields || [];
  const chaves = new Set(fields.map(chaveDoCampo).filter(Boolean));

  for (const step of process.approvals as ApprovalStep[]) {
    if (!step.conditionField) continue;
    if (chaves.has(step.conditionField)) {
      registrar(
        process.id,
        'config',
        'OK',
        'conditionField existe no formulário',
        `Nível "${step.name}" compara "${step.conditionField}".`
      );
    } else {
      registrar(
        process.id,
        'config',
        'FALHA',
        'conditionField inexistente no formulário',
        `Nível "${step.name}" compara "${step.conditionField}", que não é campo de PROCESS_DEFINITIONS['${process.id}']. ` +
          `Campos monetários disponíveis: ${
            fields
              .filter(f => f.type === 'currency')
              .map(chaveDoCampo)
              .join(', ') || '(nenhum)'
          }. Com operador numérico o nível nunca dispara.`
      );
    }
  }
}

/** Palavras que anunciam uma decisão de alçada no rótulo de uma etapa. */
const PALAVRA_DE_APROVACAO = /aprova|valida|audit|board/i;

/**
 * Confere a lista `etapas` do processo contra a trilha real gerada pela cascata.
 *
 * A conferência é ESTRUTURAL, não por contagem de palavras. Contar rótulos que
 * "parecem aprovação" era um proxy: dava falso positivo em "Validado" (estado
 * final do processo 1, não alçada) e falso negativo em toda etapa cujo nome não
 * carrega a palavra — os processos 2, 3, 4 e 14 divergiam do mesmo jeito e
 * passavam calados, porque nenhuma etapa deles casava com a regex.
 *
 * Agora as etapas nomeiam os níveis, então a pergunta certa é de posição:
 *
 *   (a) os níveis da cascata aparecem em `etapas`, na ordem e em sequência —
 *       a descrição não pode omitir nem reordenar por onde o pedido passa;
 *   (b) nenhuma etapa FORA desse trecho anuncia aprovação — senão o painel
 *       promete uma alçada que o motor não roda.
 */
function auditarEtapas(process: RHProcess, req: SolicitacaoSimulada) {
  const nomesDaCascata = req.approvalChain.map(l => l.name);
  const etapas = process.etapas;

  // (a) trecho contíguo com os níveis, na ordem.
  const inicio = etapas.indexOf(nomesDaCascata[0]);
  const contiguo =
    inicio >= 0 && nomesDaCascata.every((nome, i) => etapas[inicio + i] === nome);

  if (!contiguo) {
    registrar(
      process.id,
      'etapas',
      'ALERTA',
      'etapas não descrevem os níveis da cascata',
      `etapas = [${etapas.join(' → ')}] não contém, em sequência, os níveis ` +
        `[${nomesDaCascata.join(' → ')}] que o motor executa.`
    );
    return;
  }

  // (b) fora do trecho da cascata, nada pode se anunciar como aprovação.
  const foraDaCascata = [
    ...etapas.slice(0, inicio),
    ...etapas.slice(inicio + nomesDaCascata.length)
  ];
  const prometidas = foraDaCascata.filter(e => PALAVRA_DE_APROVACAO.test(e));

  if (prometidas.length > 0) {
    registrar(
      process.id,
      'etapas',
      'ALERTA',
      'etapas prometem aprovação que não existe',
      `[${prometidas.join(', ')}] se anuncia(m) como decisão, mas está(ão) fora da cascata ` +
        `[${nomesDaCascata.join(' → ')}]. Etapa operacional não deve usar palavra de aprovação no rótulo.`
    );
    return;
  }

  registrar(
    process.id,
    'etapas',
    'OK',
    'etapas coerentes com a cascata',
    `[${etapas.join(' → ')}] · níveis nas posições ${inicio + 1}–${inicio + nomesDaCascata.length}` +
      (foraDaCascata.length ? ` · operacionais: ${foraDaCascata.join(', ')}` : '')
  );
}

/** Abre uma solicitação e percorre a cascata inteira, verificando cada invariante. */
function simularProcesso(process: RHProcess, cenario: string, valorMonetario: number) {
  const data = montarDados(process.id, valorMonetario);
  const acknowledgement = PROCESS_DEFINITIONS[process.id]?.acknowledgement;

  // --- Cascata esperada: níveis ativos que passaram na condição, na ordem ---
  const esperados = (process.approvals as ApprovalStep[])
    .filter(s => isStepApplicable(s, data))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const req = abrirSolicitacao(process, data);

  // --- Protocolo (acknowledgement): nasce concluído, sem cascata e sem tarefa ---
  if (acknowledgement) {
    const ok =
      req.approvalChain.length === 0 &&
      req.status === acknowledgement.status &&
      req.tarefas.length === 0 &&
      JSON.stringify(req.trail) === JSON.stringify(acknowledgement.trail);
    registrar(
      process.id,
      cenario,
      ok ? 'OK' : 'FALHA',
      'protocolo sem aprovação',
      `status="${req.status}", cascata=${req.approvalChain.length} nível(is), tarefas=${req.tarefas.length}, ` +
        `trilha=[${req.trail.join(' → ')}].`
    );
    return;
  }

  // --- A cascata materializada bate com a configuração filtrada? ---
  const semAlcadas = process.approvals.length === 0;
  if (semAlcadas) {
    const ok = req.approvalChain.length === 1 && req.approvalChain[0].id === 'default-approval';
    registrar(
      process.id,
      cenario,
      ok ? 'OK' : 'FALHA',
      'processo sem alçadas usa nível implícito',
      `cascata = [${req.approvalChain.map(l => l.name).join(' → ')}] (approvalFlow.ts:110-121).`
    );
  } else {
    const obtido = req.approvalChain.map(l => l.id).join(',');
    const alvo = esperados.map(s => s.id).join(',');
    registrar(
      process.id,
      cenario,
      obtido === alvo ? 'OK' : 'FALHA',
      'cascata = níveis configurados que passaram na condição',
      `esperado [${esperados.map(s => s.name).join(' → ') || '—'}] · obtido [${
        req.approvalChain.map(l => l.name).join(' → ') || '—'
      }]`
    );

    // Cada nível condicional: o disparo bate com a leitura do dado?
    for (const step of process.approvals as ApprovalStep[]) {
      if (!step.conditionOperator) continue;
      const campo = resolveConditionField(step, data);
      const valorLido = campo ? data[campo] : undefined;
      const disparou = req.approvalChain.some(l => l.id === step.id);
      registrar(
        process.id,
        cenario,
        'OK',
        `condição do nível "${step.name}"`,
        `regra: ${step.conditionField || '(auto)'} ${step.conditionOperator} ${step.conditionValue} · ` +
          `campo resolvido: ${campo ?? 'NENHUM'} · valor lido: ${
            valorLido === undefined ? 'undefined' : JSON.stringify(valorLido)
          } · disparou: ${disparou ? 'SIM' : 'NÃO'}`
      );
    }
  }

  // --- Estado de abertura ---
  const primeiro = req.approvalChain[0];
  registrar(
    process.id,
    cenario,
    req.status === 'Pendente de Aprovação' && req.etapaAtual === primeiro?.name ? 'OK' : 'FALHA',
    'abertura: status e etapa iniciais',
    `status="${req.status}", etapaAtual="${req.etapaAtual}", responsável="${req.responsavelAtual}", ` +
      `tarefa para ${req.tarefas[0]?.assignedTo}.`
  );

  // --- Percorre a cascata até o fim ---
  const totalNiveis = req.approvalChain.length;
  // Desligamento não conclui na aprovação: para em 'Aguardando Encerramento',
  // esperando a etapa de Benefícios e Encerramento do RH/DP.
  const statusEsperado = process.id === PROCESSO_DESLIGAMENTO ? 'Aguardando Encerramento' : 'Concluída';
  const etapaEsperada = process.id === PROCESSO_DESLIGAMENTO ? ETAPA_ENCERRAMENTO : 'Conclusão';
  let passos = 0;
  while (aprovarUmNivel(req, process)) {
    passos++;
    if (passos > 10) break; // trava contra laço infinito
    if (req.status === statusEsperado) break;
  }

  const todosAprovados = req.approvalChain.every(l => l.status === 'aprovado');
  registrar(
    process.id,
    cenario,
    passos === totalNiveis && req.status === statusEsperado && req.etapaAtual === etapaEsperada && todosAprovados
      ? 'OK'
      : 'FALHA',
    process.id === PROCESSO_DESLIGAMENTO
      ? 'cascata percorrida até a etapa de encerramento'
      : 'cascata percorrida até a conclusão',
    `${passos}/${totalNiveis} aprovações · status final "${req.status}" (esperado "${statusEsperado}") · ` +
      `etapaAtual "${req.etapaAtual}" · todos os níveis aprovados: ${todosAprovados ? 'sim' : 'não'}`
  );

  // --- Histórico: 1 entrada de abertura + 1 por nível ---
  const esperadoHist = 1 + totalNiveis;
  registrar(
    process.id,
    cenario,
    req.historico.length === esperadoHist ? 'OK' : 'FALHA',
    'histórico completo',
    `${req.historico.length}/${esperadoHist} entradas: ${req.historico
      .map(h => `${h.etapa}→${h.para}`)
      .join(' | ')}`
  );

  // --- Tarefas: 1 por nível (+ a do RH/DP, no desligamento) ---
  const tarefasEsperadas = totalNiveis + (process.id === PROCESSO_DESLIGAMENTO ? 1 : 0);
  registrar(
    process.id,
    cenario,
    req.tarefas.length === tarefasEsperadas ? 'OK' : 'FALHA',
    process.id === PROCESSO_DESLIGAMENTO
      ? 'uma tarefa por nível + a etapa de encerramento'
      : 'uma tarefa por nível da cascata',
    `${req.tarefas.length}/${tarefasEsperadas}: ${req.tarefas.map(t => t.assignedTo).join(', ')}`
  );
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const CENARIOS: { nome: string; valor: number }[] = [
  { nome: 'valor baixo (R$ 3.000)', valor: 3000 },
  { nome: 'valor alto (R$ 50.000)', valor: 50000 }
];

for (const process of INITIAL_RH_PROCESSES) {
  auditarCamposDeCondicao(process);
  for (const c of CENARIOS) {
    simularProcesso(process, c.nome, c.valor);
  }
  // Etapas: avaliadas uma vez, sobre o cenário de valor alto.
  const reqAlto = abrirSolicitacao(process, montarDados(process.id, 50000));
  if (!PROCESS_DEFINITIONS[process.id]?.acknowledgement) auditarEtapas(process, reqAlto);
}

// ---------------------------------------------------------------------------
// RESOLUÇÃO DO APROVADOR — o aprovador sai da hierarquia do ALVO
// ---------------------------------------------------------------------------
//
// Enquanto o responsável vinha de RESPONSIBILITY_USERS (tipo de alçada → um
// usuário de demonstração fixo), estas quatro perguntas tinham a mesma resposta
// para qualquer alvo. São elas que provam que a resolução é real.

/** Processos com alçada hierárquica, cada um exercitado com alvos de setores distintos. */
const PROCESSOS_DE_ALVO = ['9', '8', '12'];

const ALVOS: { emp: Employee; nota: string }[] = [
  { emp: porId('EMP-001', INITIAL_EMPLOYEES)!, nota: 'Desenvolvimento / gestor Marcos Vinicius' },
  { emp: porId('EMP-009', INITIAL_EMPLOYEES)!, nota: 'Vendas / gestor Leonardo Vinci' },
  { emp: porId('EMP-013', INITIAL_EMPLOYEES)!, nota: 'Financeiro / gestor Karina Lopes' },
  { emp: porId('EMP-003', INITIAL_EMPLOYEES)!, nota: 'Diretor Geral / topo da hierarquia' }
];

const aprovadoresDe = (process: RHProcess, alvo: Employee) =>
  buildApprovalChain(process, montarDados(process.id, 3000), { ...ORGANIZACAO, alvo });

for (const processId of PROCESSOS_DE_ALVO) {
  const process = INITIAL_RH_PROCESSES.find(p => p.id === processId);
  if (!process) continue;
  const cenario = 'resolução por alvo';

  // (a) Alvos com gestores diferentes geram aprovadores diferentes.
  const porAlvo = ALVOS.map(a => ({
    ...a,
    chain: aprovadoresDe(process, a.emp)
  }));
  const assinaturas = porAlvo.map(p => p.chain.map(l => l.responsibleEmployeeId || l.responsibleUserId || '—').join('+'));
  const distintas = new Set(assinaturas).size;
  registrar(
    process.id,
    cenario,
    distintas > 1 ? 'OK' : 'FALHA',
    'alvos de setores diferentes geram aprovadores diferentes',
    porAlvo.map((p, i) => `${p.emp.name} → ${p.chain.map(l => l.responsibleName || l.responsibleLabel).join(', ')}`).join(' | ')
  );

  // (b) O aprovador nunca é hierarquicamente inferior ao alvo.
  for (const { emp, chain } of porAlvo) {
    const inferiores = chain
      .filter(l => l.responsibleEmployeeId)
      .map(l => ({ nivel: l, aprovador: porId(l.responsibleEmployeeId, INITIAL_EMPLOYEES)! }))
      // 'rh-filial'/'diretoria' são papéis institucionais: o RH processa o
      // pedido do diretor sem estar acima dele. A regra vale para as alçadas
      // que saem da hierarquia.
      .filter(x => ['gestor-direto', 'gestor-setor', 'responsavel-cc'].includes(x.nivel.responsibilityType))
      .filter(x => x.aprovador && estaAbaixoDe(x.aprovador, emp, INITIAL_EMPLOYEES));
    registrar(
      process.id,
      cenario,
      inferiores.length === 0 ? 'OK' : 'FALHA',
      `aprovador nunca abaixo do alvo (${emp.name})`,
      inferiores.length === 0
        ? `${chain.length} nível(is) conferido(s); ${chain.filter(l => l.responsibleEmployeeId).length} com pessoa resolvida`
        : inferiores.map(x => `${x.nivel.name} → ${x.aprovador.name}`).join(', ')
    );
  }

  // (c) Titular ausente → substituto, e o motivo fica gravado.
  const alvoDoSubstituto = porId('EMP-001', INITIAL_EMPLOYEES)!;
  const comTitularAusente = INITIAL_EMPLOYEES.map(e =>
    e.id === 'EMP-005' ? { ...e, status: 'Afastado' as const } : e
  );
  const chainSubstituto = buildApprovalChain(process, montarDados(process.id, 3000), {
    ...ORGANIZACAO,
    colaboradores: comTitularAusente,
    alvo: comTitularAusente.find(e => e.id === alvoDoSubstituto.id)
  });
  const chainNormal = aprovadoresDe(process, alvoDoSubstituto);
  const mudou = chainSubstituto.some((l, i) =>
    l.responsibleEmployeeId !== chainNormal[i]?.responsibleEmployeeId
  );
  const comMotivo = chainSubstituto.some(l => l.resolucao?.substituicao || l.resolucao?.escalado);
  const tinhaTitular = chainNormal.some(l => l.responsibleEmployeeId === 'EMP-005');
  registrar(
    process.id,
    cenario,
    !tinhaTitular || (mudou && comMotivo) ? 'OK' : 'FALHA',
    'titular afastado sai da fila e o motivo vai para a trilha',
    tinhaTitular
      ? chainSubstituto
          .map(l => `${l.name}: ${l.responsibleName || '—'}${l.resolucao?.motivo ? ` [${l.resolucao.motivo}]` : ''}`)
          .join(' | ')
      : 'nenhum nível deste processo resolve para EMP-005 — nada a substituir'
  );

  // (d) O responsável exibido é quem tem o item na fila.
  const req = abrirSolicitacao(process, montarDados(process.id, 3000), alvoDoSubstituto);
  const nivelAtual = req.approvalChain[getCurrentLevelIndex(req.approvalChain)];
  const donoDaTarefa = req.tarefas[0]?.assignedTo;
  const donoEsperado = nivelAtual?.responsibleUserId || nivelAtual?.responsibleEmployeeId;
  registrar(
    process.id,
    cenario,
    req.responsavelAtual === nivelAtual?.responsibleLabel && donoDaTarefa === donoEsperado ? 'OK' : 'FALHA',
    'responsável exibido = dono da fila',
    `exibido "${req.responsavelAtual}" · nível "${nivelAtual?.responsibleLabel}" · tarefa para ${donoDaTarefa} (esperado ${donoEsperado})`
  );
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(achados, null, 2));
} else {
  const nomeDoProcesso = (id: string) => INITIAL_RH_PROCESSES.find(p => p.id === id)?.name || id;
  let ultimo = '';
  for (const a of achados) {
    if (a.processo !== ultimo) {
      console.log(`\n${'='.repeat(78)}\nPROCESSO ${a.processo} — ${nomeDoProcesso(a.processo)}\n${'='.repeat(78)}`);
      ultimo = a.processo;
    }
    const marca = a.severidade === 'OK' ? '  ok  ' : a.severidade === 'ALERTA' ? 'ALERTA' : 'FALHA!';
    console.log(`[${marca}] (${a.cenario}) ${a.verificacao}`);
    console.log(`          ${a.detalhe}`);
  }

  const falhas = achados.filter(a => a.severidade === 'FALHA');
  const alertas = achados.filter(a => a.severidade === 'ALERTA');
  console.log(`\n${'='.repeat(78)}`);
  console.log(`RESUMO: ${achados.length} verificações · ${falhas.length} falhas · ${alertas.length} alertas`);
  console.log('='.repeat(78));
  for (const f of [...falhas, ...alertas]) {
    console.log(`  ${f.severidade === 'FALHA' ? 'FALHA ' : 'ALERTA'} · Processo ${f.processo} (${f.cenario}) · ${f.verificacao}`);
  }
  process.exitCode = falhas.length > 0 ? 1 : 0;
}
