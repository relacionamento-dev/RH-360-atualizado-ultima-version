/**
 * SIMULADOR DA MATRIZ DE PERMISSÃO — auditoria do RBAC por processo
 * =====================================================================
 *
 * Rodar:  npx tsx auditoria/simular-permissoes.ts
 *         npx tsx auditoria/simular-permissoes.ts --json   (saída JSON)
 *
 * Sem browser e sem React. Responde às três perguntas que a matriz de permissão
 * precisa acertar, e que o laço genérico `for (let i = 1; i <= 15; i++)` errava:
 *
 *   (a) entrando como Colaborador, "Nova Solicitação" lista só autosserviço?
 *   (b) entrando como Gestor, a solicitação parada na fila dele mostra
 *       Aprovar / Reprovar / Devolver?
 *   (c) alguma solicitação fica numa fila cujo dono NÃO pode decidir?
 *
 * O QUE É REAL E O QUE É ESPELHO
 * ------------------------------
 * - REAL (importado de src/): a matriz de fábrica (INITIAL_ACCESS_PROFILES,
 *   INITIAL_GROUPS), a configuração dos processos (INITIAL_RH_PROCESSES) e todo
 *   o motor de resolução de alçada (buildApprovalChain, isPendingApprover).
 * - ESPELHO: `permissaoEfetiva` reproduz `getEffectivePermissions`
 *   (AppConfigContext.tsx:658-745) — perfil como base, grupos somando por cima —
 *   que hoje mora dentro do provider React e não é importável fora do browser.
 *   Se aquele arquivo mudar, este espelho precisa acompanhar.
 */

import {
  COST_CENTERS,
  DEMO_USERS,
  INITIAL_ACCESS_PROFILES,
  INITIAL_EMPLOYEES,
  INITIAL_GROUPS,
  INITIAL_RH_PROCESSES,
  PROCESSOS_APROVADOS_PELO_GESTOR,
  PROCESSOS_AUTOSSERVICO,
  SECTORS
} from '../src/data';
import {
  buildApprovalChain,
  ContextoDeAlcada,
  getCurrentLevel,
  isPendingApprover,
  Organizacao
} from '../src/utils/approvalFlow';
import { colaboradorDoUsuario } from '../src/utils/hierarquia';
import {
  FULL_PROCESS_PERMISSIONS,
  isSuperAdmin,
  perfilDoUsuario,
  podeAbrirPeloFluxoGenerico
} from '../src/utils/permissions';
import { Employee, ProcessPermission, RHProcess, RHRequest, User } from '../src/types';

const ORGANIZACAO: Organizacao = {
  colaboradores: INITIAL_EMPLOYEES,
  setores: SECTORS,
  centrosDeCusto: COST_CENTERS,
  usuarios: DEMO_USERS,
  perfis: INITIAL_ACCESS_PROFILES
};

// ---------------------------------------------------------------------------
// Espelho de getEffectivePermissions (AppConfigContext.tsx:658-745)
// ---------------------------------------------------------------------------

const PERMISSAO_NEGADA: ProcessPermission = {
  ver: false, solicitar: false, executar: false, aprovar: false,
  devolver: false, cancelar: true, reabrir: false, verHistorico: true, verSigiloso: false
};

function permissaoEfetiva(user: User, processId: string): ProcessPermission {
  if (isSuperAdmin(user)) return { ...FULL_PROCESS_PERMISSIONS };

  const efetiva: ProcessPermission = { ...PERMISSAO_NEGADA };
  if (!INITIAL_RH_PROCESSES.some(p => p.id === processId)) return efetiva;

  const registro = perfilDoUsuario(user, INITIAL_ACCESS_PROFILES);
  if (!registro) return efetiva;
  if (!registro.ativo) return efetiva;

  Object.assign(efetiva, registro.permissoes[processId] || {});

  // Grupos somam por cima — é o caminho pelo qual o laço genérico devolvia por
  // fora o que o perfil negava.
  const grupos = INITIAL_GROUPS.filter(g => g.membros.includes(user.id) || user.groups.includes(g.nome));
  grupos.forEach(g => {
    const p = g.permissoes[processId];
    if (p) (Object.keys(efetiva) as (keyof ProcessPermission)[]).forEach(k => { if (p[k]) efetiva[k] = true; });
  });

  return efetiva;
}

/** Espelha `isAuthorized` (AppConfigContext.tsx:793-799). */
const autorizado = (user: User, processId: string, acao: keyof ProcessPermission): boolean =>
  isSuperAdmin(user) ? true : permissaoEfetiva(user, processId)[acao];

/** A vitrine do modal "Nova Solicitação" (RHRequests.tsx:183). */
const vitrineDeNovaSolicitacao = (user: User): RHProcess[] =>
  INITIAL_RH_PROCESSES.filter(p =>
    p.ativo && autorizado(user, p.id, 'solicitar') && podeAbrirPeloFluxoGenerico(p.id));

/** Os cards do Hub de Processos (RHRequests.tsx:210). */
const hubDeProcessos = (user: User): RHProcess[] =>
  INITIAL_RH_PROCESSES.filter(p => p.ativo && autorizado(user, p.id, 'ver'));

/** Os botões de decisão do detalhe da solicitação (RequestDetail.tsx:69-71). */
const botoesDeDecisao = (user: User, processId: string): string[] => [
  ...(autorizado(user, processId, 'devolver') ? ['Devolver'] : []),
  ...(autorizado(user, processId, 'aprovar') ? ['Reprovar', 'Aprovar'] : [])
];

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

type Nivel = 'ok' | 'falha' | 'alerta';
interface Verificacao { nivel: Nivel; grupo: string; titulo: string; detalhe: string }

const verificacoes: Verificacao[] = [];
const jsonMode = process.argv.includes('--json');

function checar(grupo: string, titulo: string, condicao: boolean, detalhe: string, alertaSeFalhar = false) {
  verificacoes.push({ nivel: condicao ? 'ok' : alertaSeFalhar ? 'alerta' : 'falha', grupo, titulo, detalhe });
}

const nome = (id: string) => INITIAL_RH_PROCESSES.find(p => p.id === id)?.name || id;
const listar = (ids: string[]) => ids.length ? ids.map(i => `${i} ${nome(i)}`).join(' · ') : '(nenhum)';

const usuario = (id: string): User => DEMO_USERS.find(u => u.id === id)!;
const COLABORADOR = usuario('COLAB-002');
const GESTOR = usuario('GEST-002');
const RH = usuario('RH-002');
const DIRETORIA = usuario('DIR-002');

// ===========================================================================
// 1. COERÊNCIA DOS CONJUNTOS COM A CONFIGURAÇÃO DOS PROCESSOS
// ===========================================================================
{
  const G = '1. Conjuntos derivados da configuração';

  // Autosserviço tem de ser processo do colaborador e sobre ele mesmo.
  PROCESSOS_AUTOSSERVICO.forEach(id => {
    const p = INITIAL_RH_PROCESSES.find(x => x.id === id);
    checar(G, `autosserviço '${id}' existe e é do colaborador`,
      !!p && p.roles.employee === true,
      p ? `${p.name} · roles.employee=${p.roles.employee} · targetMode=${p.targetMode}` : 'processo inexistente');
  });

  // O conjunto do gestor tem de bater com as alçadas declaradas nos processos.
  const comAlcadaDeGestor = INITIAL_RH_PROCESSES
    .filter(p => p.approvals.some(a => a.active !== false &&
      (a.responsibilityType === 'gestor-direto' || a.responsibilityType === 'gestor-setor')))
    .map(p => p.id);
  checar(G, 'PROCESSOS_APROVADOS_PELO_GESTOR = processos com alçada de gestor',
    JSON.stringify([...PROCESSOS_APROVADOS_PELO_GESTOR].sort()) === JSON.stringify([...comAlcadaDeGestor].sort()),
    `derivado: ${listar(PROCESSOS_APROVADOS_PELO_GESTOR)}`);

  // Nenhum processo pode ficar sem ninguém que o abra.
  INITIAL_RH_PROCESSES.forEach(p => {
    const abrem = [COLABORADOR, GESTOR, RH, DIRETORIA].filter(u => autorizado(u, p.id, 'solicitar'));
    checar(G, `processo ${p.id} tem quem o abra`, abrem.length > 0,
      `${p.name} → ${abrem.map(u => u.profile).join(', ') || 'NINGUÉM'}`);
  });
}

// ===========================================================================
// 2. CRITÉRIO (a) — Colaborador só vê autosserviço em "Nova Solicitação"
// ===========================================================================
{
  const G = '2. Critério (a) — vitrine do Colaborador';
  const vitrine = vitrineDeNovaSolicitacao(COLABORADOR).map(p => p.id);
  const esperado = PROCESSOS_AUTOSSERVICO.filter(podeAbrirPeloFluxoGenerico);

  checar(G, '"Nova Solicitação" lista exatamente os processos de autosserviço',
    JSON.stringify([...vitrine].sort()) === JSON.stringify([...esperado].sort()),
    `oferecido: ${listar(vitrine)}`);

  // Os processos que motivaram o achado: nenhum deles pode aparecer.
  const PROIBIDOS = ['1', '7', '10', '11', '13', '15'];
  PROIBIDOS.forEach(id => {
    checar(G, `Colaborador NÃO abre '${nome(id)}'`, !vitrine.includes(id),
      `solicitar=${autorizado(COLABORADOR, id, 'solicitar')}`);
  });

  checar(G, 'Colaborador não aprova nada',
    INITIAL_RH_PROCESSES.every(p => !autorizado(COLABORADOR, p.id, 'aprovar')),
    'aprovar=false nos 15 processos');

  checar(G, 'Colaborador não devolve nada',
    INITIAL_RH_PROCESSES.every(p => !autorizado(COLABORADOR, p.id, 'devolver')),
    'devolver=false nos 15 processos — ele nunca é dono de uma alçada');

  checar(G, 'Colaborador não vê conteúdo sigiloso',
    INITIAL_RH_PROCESSES.every(p => !autorizado(COLABORADOR, p.id, 'verSigiloso')),
    'verSigiloso=false nos 15 processos');

  // `ver` fica com o escopo 'proprio', que é quem recorta os registros.
  checar(G, 'Colaborador enxerga os processos (o escopo "proprio" é que recorta)',
    hubDeProcessos(COLABORADOR).length === INITIAL_RH_PROCESSES.length,
    `ver=true nos 15 · escopo do perfil = ${perfilDoUsuario(COLABORADOR, INITIAL_ACCESS_PROFILES)?.escopo}`);
}

// ===========================================================================
// 3. CRITÉRIO (b) — Gestor decide o que cai na fila dele
// ===========================================================================
{
  const G = '3. Critério (b) — botões do Gestor';

  PROCESSOS_APROVADOS_PELO_GESTOR.forEach(id => {
    const botoes = botoesDeDecisao(GESTOR, id);
    checar(G, `'${nome(id)}' mostra Aprovar, Reprovar e Devolver`,
      botoes.includes('Aprovar') && botoes.includes('Reprovar') && botoes.includes('Devolver'),
      `botões: ${botoes.join(', ') || 'nenhum'}`);
  });

  // Simulação de ponta a ponta: pedido do subordinado → fila do gestor → botões.
  const subordinado = INITIAL_EMPLOYEES.find(e => e.id === 'EMP-006')!; // Juliana Costa
  PROCESSOS_APROVADOS_PELO_GESTOR.forEach(id => {
    const processo = INITIAL_RH_PROCESSES.find(p => p.id === id)!;
    const ctx: ContextoDeAlcada = { ...ORGANIZACAO, alvo: subordinado, solicitante: subordinado };
    const chain = buildApprovalChain(processo, {}, ctx);
    const req = {
      id: `sim-${id}`, processId: id, tipoProcesso: id, status: 'Pendente de Aprovação',
      requesterId: COLABORADOR.id, solicitante: COLABORADOR.name,
      employeeId: subordinado.id, approvalChain: chain, historico: [], data: {}
    } as unknown as RHRequest;

    const naFila = isPendingApprover(req, processo, GESTOR, INITIAL_GROUPS, ORGANIZACAO);
    const botoes = botoesDeDecisao(GESTOR, id);
    checar(G, `pedido de ${subordinado.name} em '${nome(id)}' cai na fila do Gestor e ele decide`,
      naFila && botoes.includes('Aprovar'),
      `fila=${naFila} · nível "${getCurrentLevel(chain)?.name}" → ${getCurrentLevel(chain)?.responsibleName} · botões: ${botoes.join(', ') || 'nenhum'}`);
  });

  // O que ele NÃO aprova pela hierarquia também não deve mostrar botão.
  INITIAL_RH_PROCESSES
    .filter(p => !PROCESSOS_APROVADOS_PELO_GESTOR.includes(p.id))
    .forEach(p => {
      checar(G, `'${p.name}' não oferece decisão ao Gestor`,
        botoesDeDecisao(GESTOR, p.id).length === 0,
        `botões: ${botoesDeDecisao(GESTOR, p.id).join(', ') || 'nenhum'} · alçadas: ${p.approvals.map(a => a.responsibilityType).join(', ') || '(padrão rh-filial)'}`);
    });

  checar(G, 'Gestor não vê "Gestão de Hierarquia" no Hub',
    !hubDeProcessos(GESTOR).some(p => p.id === '13'),
    `Hub do Gestor: ${hubDeProcessos(GESTOR).length} de ${INITIAL_RH_PROCESSES.length} processos`);

  checar(G, 'Gestor continua abrindo o próprio autosserviço',
    PROCESSOS_AUTOSSERVICO.every(id => autorizado(GESTOR, id, 'solicitar')),
    listar(PROCESSOS_AUTOSSERVICO));

  const daEquipe = ['1', '7', '10', '11', '14'];
  checar(G, 'Gestor continua abrindo os processos da equipe',
    daEquipe.every(id => autorizado(GESTOR, id, 'solicitar')),
    listar(daEquipe));

  checar(G, 'Gestor não abre as esteiras do RH',
    ['2', '3', '4'].every(id => !autorizado(GESTOR, id, 'solicitar')),
    'Recrutamento e Seleção · Admissão Digital · Onboarding');
}

// ===========================================================================
// 4. CRITÉRIO (c) — nenhuma fila com dono que não pode decidir
// ===========================================================================
{
  const G = '4. Critério (c) — fila sem dono capaz';

  const contaDe = (emp?: Employee) => emp ? DEMO_USERS.find(u => u.employeeId === emp.id) : undefined;
  const solicitantes = DEMO_USERS.filter(u => u.employeeId && u.status === 'Ativo');

  const orfas: string[] = [];
  let combinacoes = 0;

  for (const processo of INITIAL_RH_PROCESSES) {
    for (const alvo of INITIAL_EMPLOYEES) {
      for (const sol of solicitantes) {
        // Só cenários possíveis: quem não pode abrir o processo não o abre.
        if (!autorizado(sol, processo.id, 'solicitar')) continue;
        const ctx: ContextoDeAlcada = {
          ...ORGANIZACAO,
          alvo,
          solicitante: colaboradorDoUsuario(sol.id, DEMO_USERS, INITIAL_EMPLOYEES)
        };
        // Dois valores, para acionar e não acionar os níveis condicionais.
        for (const valor of [5000, 50000]) {
          combinacoes++;
          const chain = buildApprovalChain(processo, { salarioSugerido: valor, salario: valor, valor }, ctx);
          for (const nivel of chain) {
            const dono = INITIAL_EMPLOYEES.find(e => e.id === nivel.responsibleEmployeeId);
            const conta = contaDe(dono);
            // Sem dono resolvido, a fila é do PERFIL da alçada (isPendingApprover
            // cai em PERFIS_POR_ALCADA) — RH/DP ou Diretoria, que aprovam tudo.
            // Sem conta de usuário ninguém entra no sistema como essa pessoa:
            // é característica do cadastro de demonstração, não da matriz.
            if (!dono || !conta) continue;
            if (!autorizado(conta, processo.id, 'aprovar')) {
              orfas.push(
                `P${processo.id} ${processo.name} · nível "${nivel.name}" (${nivel.responsibilityType})` +
                ` → ${dono.name} [${conta.profile}] · alvo=${alvo.name} · solicitante=${sol.name}`
              );
            }
          }
        }
      }
    }
  }

  const unicas = [...new Set(orfas)];
  checar(G, 'nenhum nível cai numa fila cujo dono não pode aprovar',
    unicas.length === 0,
    `${combinacoes} cascatas simuladas (processo × alvo × solicitante × valor)` +
    (unicas.length ? `\n          ${unicas.slice(0, 12).join('\n          ')}` : ''));
}

// ===========================================================================
// 5. GRUPOS alinhados aos perfis
// ===========================================================================
{
  const G = '5. Grupos alinhados aos perfis';

  const pares: [string, string][] = [
    ['g-gestores', 'Gestor'],
    ['g-colaboradores', 'Colaborador'],
    ['g-admin', 'Administrador'],
    ['g-diretoria', 'Diretoria'],
    ['g-rh', 'RH/DP']
  ];

  pares.forEach(([grupoId, perfilNome]) => {
    const grupo = INITIAL_GROUPS.find(g => g.id === grupoId)!;
    const perfil = INITIAL_ACCESS_PROFILES.find(p => p.nome === perfilNome)!;
    const divergentes = INITIAL_RH_PROCESSES.filter(p => {
      const doGrupo = grupo.permissoes[p.id] || {};
      const doPerfil = perfil.permissoes[p.id] || {};
      // O grupo SOMA: só importa o que ele concede além do perfil.
      return (Object.keys(doPerfil) as (keyof ProcessPermission)[])
        .some(k => (doGrupo as ProcessPermission)[k] && !(doPerfil as ProcessPermission)[k]);
    });
    checar(G, `grupo "${grupo.nome}" não concede além do perfil "${perfilNome}"`,
      divergentes.length === 0,
      divergentes.length ? `vaza em: ${listar(divergentes.map(p => p.id))}` : 'matrizes idênticas');
  });

  // O caminho real do vazamento: o usuário casa com o grupo PELO NOME.
  checar(G, 'Colaborador com grupo "Colaboradores" continua sem abrir Desligamento',
    !autorizado(COLABORADOR, '15', 'solicitar'),
    `${COLABORADOR.name} · groups=[${COLABORADOR.groups.join(', ')}]`);

  checar(G, 'Colaborador com grupo "Colaboradores" continua sem abrir Medida Disciplinar',
    !autorizado(COLABORADOR, '10', 'solicitar'),
    `${COLABORADOR.name} · groups=[${COLABORADOR.groups.join(', ')}]`);
}

// ===========================================================================
// 6. Central Adm — a matriz aparece marcada e continua editável
// ===========================================================================
{
  const G = '6. Central Adm > Perfis de Acesso';

  // A tela lê `emEdicao.permissoes[processo.id]?.[chave]` (AdminPerfis.tsx:290).
  // Chave ausente rende checkbox apagada mesmo com a permissão valendo.
  const CHAVES: (keyof ProcessPermission)[] =
    ['ver', 'solicitar', 'aprovar', 'executar', 'devolver', 'cancelar', 'verSigiloso'];

  INITIAL_ACCESS_PROFILES.forEach(perfil => {
    const semEntrada = INITIAL_RH_PROCESSES.filter(p => !perfil.permissoes[p.id]);
    checar(G, `perfil "${perfil.nome}" tem entrada para os 15 processos`,
      semEntrada.length === 0,
      semEntrada.length ? `faltam: ${listar(semEntrada.map(p => p.id))}` : `${INITIAL_RH_PROCESSES.length} processos`);

    const chavesFaltando = INITIAL_RH_PROCESSES.flatMap(p =>
      CHAVES.filter(k => typeof perfil.permissoes[p.id]?.[k] !== 'boolean').map(k => `${p.id}.${k}`));
    checar(G, `perfil "${perfil.nome}" declara todas as ações da tela`,
      chavesFaltando.length === 0,
      chavesFaltando.length ? `indefinidas: ${chavesFaltando.slice(0, 6).join(', ')}` : CHAVES.join(', '));
  });

  // Editável: perfil de sistema não trava a matriz (só o NOME é fixo).
  const editaveis = INITIAL_ACCESS_PROFILES.filter(p => p.ativo);
  checar(G, 'os seis perfis de fábrica continuam ativos e editáveis pelo cliente',
    editaveis.length === INITIAL_ACCESS_PROFILES.length && INITIAL_ACCESS_PROFILES.length === 6,
    `${editaveis.length} perfis: ${INITIAL_ACCESS_PROFILES.map(p => p.nome).join(', ')}`);

  // A matriz do Gestor e a do Colaborador não podem ser a mesma linha repetida.
  [['Gestor', GESTOR], ['Colaborador', COLABORADOR]].forEach(([rotulo]) => {
    const perfil = INITIAL_ACCESS_PROFILES.find(p => p.nome === rotulo)!;
    const linhas = new Set(INITIAL_RH_PROCESSES.map(p => JSON.stringify(perfil.permissoes[p.id])));
    checar(G, `matriz de "${rotulo}" varia por processo (não é laço genérico)`, linhas.size > 1,
      `${linhas.size} combinações distintas em ${INITIAL_RH_PROCESSES.length} processos`);
  });
}

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

const falhas = verificacoes.filter(v => v.nivel === 'falha');
const alertas = verificacoes.filter(v => v.nivel === 'alerta');

if (jsonMode) {
  console.log(JSON.stringify({ total: verificacoes.length, falhas: falhas.length, alertas: alertas.length, verificacoes }, null, 2));
} else {
  let grupoAtual = '';
  for (const v of verificacoes) {
    if (v.grupo !== grupoAtual) {
      grupoAtual = v.grupo;
      console.log(`\n${'='.repeat(78)}\n${grupoAtual}\n${'='.repeat(78)}`);
    }
    const tag = v.nivel === 'ok' ? '[  ok  ]' : v.nivel === 'alerta' ? '[alerta]' : '[FALHA ]';
    console.log(`${tag} ${v.titulo}`);
    if (v.detalhe) console.log(`          ${v.detalhe}`);
  }
  console.log(`\n${'='.repeat(78)}`);
  console.log(`RESUMO: ${verificacoes.length} verificações · ${falhas.length} falhas · ${alertas.length} alertas`);
  console.log('='.repeat(78));
  falhas.forEach(f => console.log(`  FALHA · ${f.grupo} · ${f.titulo}`));
  alertas.forEach(a => console.log(`  ALERTA · ${a.grupo} · ${a.titulo}`));
}

process.exit(falhas.length > 0 ? 1 : 0);
