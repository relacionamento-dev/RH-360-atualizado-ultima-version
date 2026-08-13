/**
 * SIMULADOR DE ACABAMENTO — rótulos, recorte por empresa e gestor exibido
 * =====================================================================
 *
 * Rodar:  npx tsx auditoria/simular-acabamento.ts
 *         npx tsx auditoria/simular-acabamento.ts --json   (saída JSON)
 *
 * Três defeitos de acabamento que só aparecem quando se olha o dado exibido:
 *
 *   1. RÓTULO CRU — o detalhe da solicitação caía na CHAVE do campo quando não
 *      achava a definição, e a tela mostrava DIASGOZADOSHIST, CARGOATUAL,
 *      PERIODOAQUISITIVO em caixa alta ao lado do campo amigável.
 *   2. KPI NÃO ESCOPADO — "Vagas Abertas" e "SLA Vencido" liam a base inteira,
 *      então os dois cartões davam o mesmo número nas duas empresas.
 *   3. GESTOR DIVERGENTE — o campo do cadastro vinha de um nome fixo no código,
 *      e a alçada vinha da hierarquia: dois gestores para a mesma pessoa.
 *
 * O QUE É REAL E O QUE É ESPELHO
 * ------------------------------
 * - REAL (importado de src/): o seed (vagas, tarefas, solicitações, cadastro),
 *   as definições de processo, `findFieldDef`, `gestorDe`, `buildApprovalChain`
 *   e os recortes de `utils/empresa`.
 * - ESPELHO: as contas dos KPIs reproduzem as linhas do Dashboard
 *   (Dashboard.tsx:31-42) e o filtro de exibição do detalhe reproduz o `map` de
 *   RequestDetail.tsx:315. Se aquelas telas mudarem, este espelho acompanha.
 */

import {
  COMPANIES,
  COST_CENTERS,
  DEMO_USERS,
  INITIAL_ACCESS_PROFILES,
  INITIAL_JOBS,
  INITIAL_RH_PROCESSES,
  INITIAL_RH_REQUESTS,
  INITIAL_TASKS,
  SECTORS,
  TODOS_OS_COLABORADORES
} from '../src/data';
import { PROCESS_DEFINITIONS } from '../src/processDefinitions';
import { findFieldDef } from '../src/utils/requestFields';
import { gestorDe, resolverAlvo } from '../src/utils/hierarquia';
import {
  colaboradorDaEmpresa,
  solicitacaoDaEmpresa,
  tarefaDaEmpresa,
  vagaDaEmpresa
} from '../src/utils/empresa';
import { buildApprovalChain, contextoDaSolicitacao, getCurrentLevel, Organizacao } from '../src/utils/approvalFlow';
import { Company } from '../src/types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type Nivel = 'ok' | 'falha';
interface Verificacao { nivel: Nivel; grupo: string; titulo: string; detalhe: string }
const verificacoes: Verificacao[] = [];
const jsonMode = process.argv.includes('--json');

const checar = (grupo: string, titulo: string, condicao: boolean, detalhe: string) =>
  void verificacoes.push({ nivel: condicao ? 'ok' : 'falha', grupo, titulo, detalhe });

// ===========================================================================
// 1. Nenhum rótulo cru na tela de detalhe
// ===========================================================================
{
  const G = '1. Rótulos do detalhe da solicitação';

  /**
   * Espelha o `map` de RequestDetail.tsx:315 — o que a seção "Dados da
   * Solicitação" de fato renderiza para uma solicitação.
   */
  const rotulosExibidos = (req: { processId?: string; tipoProcesso?: string; data: Record<string, any> }) => {
    const processDef = PROCESS_DEFINITIONS[req.processId || req.tipoProcesso || ''];
    const exibidos: { key: string; label: string }[] = [];
    Object.entries(req.data || {}).forEach(([key]) => {
      const field: any = findFieldDef(processDef, key, req.data);
      if (!field?.label) return;
      if (field.type === 'section' || field.type === 'info') return;
      if (key.endsWith('Id') || key === 'colaborador' || key === 'matricula') return;
      exibidos.push({ key, label: field.label });
    });
    return exibidos;
  };

  // Rótulo "cru" é o que sai IDÊNTICO à chave — é o que a tela produzia quando
  // não achava a definição e caía no `key`. Comparação sensível a maiúsculas de
  // propósito: 'Motivo' para a chave `motivo` é rótulo escrito por gente; o
  // defeito era 'diasGozadosHist' aparecendo como DIASGOZADOSHIST.
  const pareceChaveInterna = (label: string, key: string) => label === key;

  const suspeitos = ['diasGozadosHist', 'cargoAtual', 'setorAtual', 'empresaAtual', 'gestorAtual', 'ccAtual', 'periodoaquisitivo', 'saldo'];

  let totalCampos = 0;
  const crus: string[] = [];
  const semRotulo: string[] = [];

  for (const req of INITIAL_RH_REQUESTS) {
    const exibidos = rotulosExibidos(req);
    totalCampos += exibidos.length;
    exibidos.forEach(({ key, label }) => {
      if (pareceChaveInterna(label, key)) crus.push(`${req.numero} (P${req.processId}) · ${key}`);
      if (!label.trim()) semRotulo.push(`${req.numero} · ${key}`);
    });
  }

  checar(G, 'nenhuma solicitação do seed exibe a chave crua como rótulo',
    crus.length === 0,
    `${INITIAL_RH_REQUESTS.length} solicitações · ${totalCampos} campos exibidos` +
    (crus.length ? `\n          ${crus.slice(0, 8).join('\n          ')}` : ''));

  checar(G, 'nenhum campo exibido fica com rótulo vazio', semRotulo.length === 0,
    semRotulo.length ? semRotulo.slice(0, 5).join(' · ') : 'todos os rótulos têm texto');

  // Os campos de bastidor citados na reverificação não podem aparecer em
  // processo NENHUM onde não são declarados.
  const vazamentos: string[] = [];
  for (const req of INITIAL_RH_REQUESTS) {
    const exibidos = rotulosExibidos(req).map(e => e.key);
    suspeitos.forEach(s => {
      if (!exibidos.includes(s)) return;
      const processDef = PROCESS_DEFINITIONS[req.processId || ''];
      const declarado = (processDef?.steps || []).flatMap((st: any) => st.fields)
        .some((f: any) => ((f.id || f.name) === s) && f.label);
      if (!declarado) vazamentos.push(`${req.numero} (P${req.processId}) · ${s}`);
    });
  }
  checar(G, 'campo de bastidor só aparece onde o processo o declara',
    vazamentos.length === 0,
    vazamentos.length ? vazamentos.slice(0, 8).join('\n          ') : suspeitos.join(', '));

  // Varredura ampla: qualquer chave de qualquer processo, com dados sintéticos
  // que acionam todas as condições.
  const crusPorProcesso: string[] = [];
  for (const processo of INITIAL_RH_PROCESSES) {
    const def: any = PROCESS_DEFINITIONS[processo.id];
    if (!def) continue;
    const todasAsChaves = (def.steps || []).flatMap((s: any) => s.fields).map((f: any) => f.id || f.name);
    // Mais as chaves que o pré-preenchimento grava sem serem campos.
    [...new Set([...todasAsChaves, ...suspeitos])].forEach((key: string) => {
      const field: any = findFieldDef(def, key, {});
      if (field && !field.label) crusPorProcesso.push(`P${processo.id} · ${key} (campo sem label)`);
    });
  }
  checar(G, 'nenhum campo declarado nos 15 processos está sem label',
    crusPorProcesso.length === 0,
    crusPorProcesso.length ? crusPorProcesso.slice(0, 8).join('\n          ') : `${INITIAL_RH_PROCESSES.length} processos varridos`);
}

// ===========================================================================
// 2. KPIs do topo mudam com a empresa
// ===========================================================================
{
  const G = '2. KPIs recortados por empresa';

  /** Espelha as contas do Dashboard (Dashboard.tsx:31-42). */
  const kpisDaEmpresa = (empresa: Company) => ({
    colaboradoresAtivos: TODOS_OS_COLABORADORES
      .filter(e => colaboradorDaEmpresa(e, empresa) && e.status === 'Ativo').length,
    vagasAbertas: INITIAL_JOBS
      .filter(v => vagaDaEmpresa(v, empresa) && v.status === 'Aberto').length,
    solicitacoes: INITIAL_RH_REQUESTS
      .filter(r => solicitacaoDaEmpresa(r, empresa, TODOS_OS_COLABORADORES)).length,
    tarefas: INITIAL_TASKS
      .filter(t => tarefaDaEmpresa(t, empresa, INITIAL_RH_REQUESTS, TODOS_OS_COLABORADORES)).length
  });

  const porEmpresa = COMPANIES.map(c => ({ empresa: c, kpis: kpisDaEmpresa(c) }));
  porEmpresa.forEach(({ empresa, kpis }) => {
    checar(G, `${empresa.name} tem quadro próprio`,
      kpis.colaboradoresAtivos > 0,
      `colaboradores=${kpis.colaboradoresAtivos} · vagas=${kpis.vagasAbertas} · solicitações=${kpis.solicitacoes} · tarefas=${kpis.tarefas}`);
  });

  // O critério de pronto: TODO KPI de topo muda ao trocar de empresa.
  const [a, b] = porEmpresa;
  ([
    ['Colaboradores Ativos', 'colaboradoresAtivos'],
    ['Vagas Abertas', 'vagasAbertas'],
    ['Solicitações (Aprovações Pendentes)', 'solicitacoes'],
    ['Tarefas (SLA Vencido)', 'tarefas']
  ] as [string, keyof ReturnType<typeof kpisDaEmpresa>][]).forEach(([rotulo, chave]) => {
    checar(G, `"${rotulo}" muda entre as duas empresas`,
      a.kpis[chave] !== b.kpis[chave],
      `${a.empresa.name}=${a.kpis[chave]} · ${b.empresa.name}=${b.kpis[chave]}`);
  });

  // Soma das partes = total: nenhum registro fica órfão nem contado duas vezes.
  const somaVagas = porEmpresa.reduce((s, p) => s + p.kpis.vagasAbertas, 0);
  const totalVagasAbertas = INITIAL_JOBS.filter(v => v.status === 'Aberto').length;
  checar(G, 'toda vaga aberta pertence a exatamente uma empresa',
    somaVagas === totalVagasAbertas,
    `soma por empresa=${somaVagas} · total=${totalVagasAbertas}`);

  const somaTarefas = porEmpresa.reduce((s, p) => s + p.kpis.tarefas, 0);
  checar(G, 'toda tarefa pertence a exatamente uma empresa',
    somaTarefas === INITIAL_TASKS.length,
    `soma por empresa=${somaTarefas} · total=${INITIAL_TASKS.length}`);

  // A vaga precisa apontar para empresa e filial que EXISTEM — era o que
  // impedia o recorte de funcionar ("RH360 Holding" não é empresa nenhuma).
  const nomesDeEmpresa = new Set(COMPANIES.map(c => c.name));
  const vagasForaDoCadastro = INITIAL_JOBS.filter(v => v.company && !nomesDeEmpresa.has(v.company));
  checar(G, 'toda vaga aponta para uma empresa do cadastro',
    vagasForaDoCadastro.length === 0,
    vagasForaDoCadastro.length
      ? vagasForaDoCadastro.map(v => `${v.code}="${v.company}"`).join(' · ')
      : `${INITIAL_JOBS.length} vagas`);
}

// ===========================================================================
// 3. Um gestor só por colaborador
// ===========================================================================
{
  const G = '3. Gestor do cadastro = aprovador da alçada';

  const ORGANIZACAO: Organizacao = {
    colaboradores: TODOS_OS_COLABORADORES,
    setores: SECTORS,
    centrosDeCusto: COST_CENTERS,
    usuarios: DEMO_USERS,
    perfis: INITIAL_ACCESS_PROFILES
  };

  // O texto denormalizado da ficha não pode contradizer a resolução por id —
  // é a leitura que alimenta o campo 'Gestor Direto Atual' e a cascata.
  const divergentes = TODOS_OS_COLABORADORES.filter(e => {
    const resolvido = gestorDe(e, TODOS_OS_COLABORADORES)?.name;
    return !!resolvido && !!e.manager && resolvido.trim().toLowerCase() !== e.manager.trim().toLowerCase();
  });
  checar(G, 'o campo `manager` da ficha concorda com a resolução por `managerId`',
    divergentes.length === 0,
    divergentes.length
      ? divergentes.map(e => `${e.id} ${e.name}: "${e.manager}" ≠ "${gestorDe(e, TODOS_OS_COLABORADORES)?.name}"`).slice(0, 6).join('\n          ')
      : `${TODOS_OS_COLABORADORES.length} fichas conferidas`);

  // O valor que o pré-preenchimento grava no campo do cadastro tem de ser o
  // mesmo nome que a alçada de 'gestor-direto' resolve para aquele alvo.
  const processosComGestorDireto = INITIAL_RH_PROCESSES.filter(p =>
    p.approvals.some(a => a.responsibilityType === 'gestor-direto' && a.active !== false));

  const conflitos: string[] = [];
  let pares = 0;
  for (const processo of processosComGestorDireto) {
    for (const alvo of TODOS_OS_COLABORADORES.filter(e => e.status === 'Ativo')) {
      const doCadastro = gestorDe(alvo, TODOS_OS_COLABORADORES);
      if (!doCadastro) continue;
      const chain = buildApprovalChain(processo, {}, {
        ...ORGANIZACAO,
        alvo,
        solicitante: undefined
      });
      const nivel = chain.find(l => l.responsibilityType === 'gestor-direto');
      if (!nivel?.responsibleEmployeeId) continue;
      pares++;
      // Só compara quando a alçada NÃO precisou substituir nem escalar: aí o
      // aprovador é outro de propósito (titular afastado, conflito de papel),
      // e a trilha diz o motivo.
      const roteada = nivel.resolucao?.substituicao || nivel.resolucao?.escalado || nivel.resolucao?.fallback;
      if (roteada) continue;
      if (nivel.responsibleEmployeeId !== doCadastro.id) {
        conflitos.push(`P${processo.id} · alvo=${alvo.name} · cadastro="${doCadastro.name}" ≠ alçada="${nivel.responsibleName}"`);
      }
    }
  }
  checar(G, 'o gestor do cadastro é o mesmo que assume a alçada de gestor direto',
    conflitos.length === 0,
    `${pares} par(es) processo × colaborador conferido(s)` +
    (conflitos.length ? `\n          ${conflitos.slice(0, 6).join('\n          ')}` : ''));

  // Nenhum nome de gestor pode estar escrito à mão no código das telas — era
  // exatamente esse o defeito ('Ana Paula Lima' fixo no RHRequestForm).
  const nomesDePessoa = TODOS_OS_COLABORADORES.map(e => e.name);
  const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components');
  const arquivos: string[] = [];
  const varrer = (dir: string) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) varrer(p);
      else if (/\.tsx?$/.test(item.name)) arquivos.push(p);
    }
  };
  varrer(raiz);

  const fixos: string[] = [];
  for (const arquivo of arquivos) {
    const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
    linhas.forEach((linha, i) => {
      if (linha.trim().startsWith('//') || linha.trim().startsWith('*')) return;
      // ATRIBUIÇÃO a uma chave de gestor — `gestorAtual: 'Fulano'`. Procurar só
      // pela palavra "gestor" na linha pegava a lista de PERFIS ('Gestor' ao
      // lado de 'Administrador Geral', que por acaso também é nome de pessoa
      // no cadastro), que não tem nada a ver com o campo do formulário.
      const atribuicao = linha.match(/\bgestor\w*\s*:\s*(['"])(.+?)\1/i);
      if (!atribuicao) return;
      const valor = atribuicao[2];
      if (nomesDePessoa.some(nome => nome === valor)) {
        fixos.push(`${path.relative(raiz, arquivo)}:${i + 1} → "${valor}"`);
      }
    });
  }
  checar(G, 'nenhuma tela tem nome de gestor escrito à mão',
    fixos.length === 0,
    fixos.length ? fixos.join('\n          ') : `${arquivos.length} arquivos varridos em src/components`);

  // A alçada resolvida tem de bater com o que a tela do detalhe mostraria para
  // as solicitações que JÁ existem no seed.
  const semAlvo: string[] = [];
  const conflitoSeed: string[] = [];
  for (const req of INITIAL_RH_REQUESTS) {
    const processo = INITIAL_RH_PROCESSES.find(p => p.id === (req.tipoProcesso || req.processId));
    if (!processo?.approvals.some(a => a.responsibilityType === 'gestor-direto')) continue;
    const alvo = resolverAlvo(req, TODOS_OS_COLABORADORES);
    if (!alvo) { semAlvo.push(req.numero); continue; }
    const doCadastro = gestorDe(alvo, TODOS_OS_COLABORADORES);
    const nivel = (req.approvalChain || []).find(l => l.responsibilityType === 'gestor-direto');
    if (!nivel || !doCadastro || nivel.resolucao) continue;
    if (nivel.responsibleEmployeeId && nivel.responsibleEmployeeId !== doCadastro.id) {
      conflitoSeed.push(`${req.numero} · alvo=${alvo.name} · cadastro="${doCadastro.name}" ≠ alçada="${nivel.responsibleName}"`);
    }
  }
  checar(G, 'as solicitações do seed não têm dois gestores para o mesmo alvo',
    conflitoSeed.length === 0,
    conflitoSeed.length ? conflitoSeed.slice(0, 6).join('\n          ') : `${INITIAL_RH_REQUESTS.length} solicitações conferidas`);

  // Contexto da solicitação montado como a tela monta (regressão do resolver).
  const exemplo = INITIAL_RH_REQUESTS.find(r => (r.tipoProcesso || r.processId) === '9');
  if (exemplo) {
    const ctx = contextoDaSolicitacao(exemplo, ORGANIZACAO);
    const processo = INITIAL_RH_PROCESSES.find(p => p.id === '9')!;
    const nivel = getCurrentLevel(buildApprovalChain(processo, exemplo.data || {}, ctx));
    checar(G, 'a cascata de uma solicitação de férias do seed resolve para alguém',
      !!nivel?.responsibleName,
      `${exemplo.numero} · alvo=${ctx.alvo?.name || '(sem)'} · aprovador=${nivel?.responsibleName || '(ninguém)'}`);
  }
}

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------
const falhas = verificacoes.filter(v => v.nivel === 'falha');

if (jsonMode) {
  console.log(JSON.stringify({ total: verificacoes.length, falhas: falhas.length, verificacoes }, null, 2));
} else {
  let grupoAtual = '';
  for (const v of verificacoes) {
    if (v.grupo !== grupoAtual) {
      grupoAtual = v.grupo;
      console.log(`\n${'='.repeat(78)}\n${grupoAtual}\n${'='.repeat(78)}`);
    }
    console.log(`${v.nivel === 'ok' ? '[  ok  ]' : '[FALHA ]'} ${v.titulo}`);
    if (v.detalhe) console.log(`          ${v.detalhe}`);
  }
  console.log(`\n${'='.repeat(78)}`);
  console.log(`RESUMO: ${verificacoes.length} verificações · ${falhas.length} falhas`);
  console.log('='.repeat(78));
  falhas.forEach(f => console.log(`  FALHA · ${f.grupo} · ${f.titulo}`));
}

process.exit(falhas.length > 0 ? 1 : 0);
