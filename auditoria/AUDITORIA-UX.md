# Auditoria de UX/QA — RH360

Varredura de toda a aplicação em Chrome headless, tela por tela, clicando em cada
elemento e comparando o estado antes/depois. **Nada de código de produção foi
alterado nesta rodada** — este documento só mapeia e classifica.

Data: 30/07/2026 · commit base `b68fe3e` (+ alterações não commitadas do Prompt 3)

---

## Como ler

| Campo | Significado |
|---|---|
| **Categoria** | `Funcional` (clicável que não faz nada) · `Fluxo` (navegação/estado incoerente) · `UX-Visual` (feedback e polimento) |
| **Prioridade** | `CORE` — faz parte de um processo de RH e prejudica a demonstração/venda · `COSMÉTICO` — incomoda, mas não quebra o fluxo |
| **Evidência** | `browser` = clicado e medido na tela · `código` = sem handler no fonte · `browser+código` = os dois |

Um achado só é `Funcional` quando o clique **não** navega, **não** muda estado e
**não** dá feedback. Botão que avisa "em breve" (ex.: upload de foto na Intranet)
não entra: o usuário sabe o que aconteceu.

### Método

- **Varredura dinâmica** — 257 clicáveis nas 12 telas do menu + 15 processos do
  Hub. Para cada clique, uma impressão do estado (view ativa, hash do texto da
  tela, config persistido, nº de toasts, nº de overlays) antes e depois.
- **Varredura estática** — todos os `<Button>`/`<button>` do `src/` sem
  `onClick`/`onSubmit`/`type=submit`, com corte da tag por chaves balanceadas
  (um regex ingênuo quebra em `onClick={() => …}`, que contém `>`).
- **Alcance** — grafo de imports a partir de `main.tsx`. Achado em arquivo órfão
  **não** vira defeito de UX (ver [Anexo B](#anexo-b--código-órfão)).
- **Confirmação alvo-a-alvo** — os 32 suspeitos mais relevantes foram reclicados
  com estado limpo garantido, um a um. É a evidência `browser` da tabela.

---

## Resumo

| Categoria | CORE | COSMÉTICO | Total | Corrigidos |
|---|---:|---:|---:|---:|
| Funcional | 17 | 21 | 38 | 0 |
| Fluxo | 4 | 1 | 5 | 0 |
| UX-Visual | 3 | 6 | 9 | 5 |
| **Total** | **24** | **28** | **52** | **5** |

Os cinco já resolvidos estão no [Anexo C](#anexo-c--o-que-já-foi-corrigido):
V01, V02, V03, V04 e V06 — mais V09, aberto e fechado na mesma rodada.

**Os que mais atrapalham uma demonstração**, em ordem:

1. ~~**O toast bloqueia o botão APROVAR por 5 segundos**~~ — ✅ corrigido.
2. ~~**As barras de SLA da Central de Tarefas são `Math.random()`**~~ — ✅ corrigido.
3. ~~**Perfil 360 tem 6 ações mortas**, entre elas "Iniciar Desligamento" e
   "Baixar Tudo"~~ — ✅ corrigido (todas as ações do Perfil 360; ver Anexo C).
4. **Central Adm > Auditoria: os três botões da tela não fazem nada** (Funcional,
   CORE).
5. **Excluir acesso/usuário não pede confirmação** (Fluxo, CORE).

### O que está correto (verificado, não é achado)

- Os **15 processos do Hub** abrem lista, e o botão de ação principal de cada um
  leva ao formulário: `Nova Solicitação`, `Novo Recrutamento`, `Nova Admissão`,
  `Novo Onboarding`, `Novo Lote`, `Nova Alteração`.
- **Aprovar atualiza as listas na hora**: "Minhas Solicitações" e "Minhas
  Aprovações" passam de `PENDENTE DE APROVAÇÃO / RH` para `EM APROVAÇÃO /
  Diretoria` sem recarregar.
- **Item ativo do menu lateral** fica destacado (fundo âmbar + texto laranja),
  inclusive nos submenus do Hub.
- **Botão desabilitado** tem indicação visual clara: `opacity: 0.5` +
  `cursor: not-allowed` (`ui/Button.tsx:14`).
- **Ações assíncronas com espera real têm feedback**: "Exportar PDF"
  (`ReportsModule.tsx:104`) e o reprocessamento de integrações
  (`AdminIntegrations.tsx:24`) mostram spinner e rótulo "Exportando…".
- **Toasts somem sozinhos** em 5s (`Toast.tsx:17`) — o problema é onde ficam, não
  a permanência.

---

## 1. FUNCIONAL — clicável que não faz nada

> **Já corrigidos** (detalhe no Anexo C): todos os do Perfil 360 —
> **F02, F03, F04, F05, F06, F26, F27, F28**.

### 1.1 Confirmados no browser (clicados, estado inalterado)

| # | Tela | Arquivo:linha | Elemento | Prioridade |
|---|---|---|---|---|
| F01 | Detalhe da Solicitação | `src/components/RequestDetail.tsx:263` | **Imprimir** — única ação do cabeçalho da tela que o aprovador mais usa | CORE |
| F02 | Perfil 360 → Documentos | `src/components/Profile360Module.tsx:518` | **Baixar Tudo** | CORE |
| F03 | Perfil 360 → Cargo e Salário | `src/components/Profile360Module.tsx:818` | **Ver Política** | CORE |
| F04 | Perfil 360 → Desligamento | `src/components/Profile360Module.tsx:876` | **Simular Rescisão** | CORE |
| F05 | Perfil 360 → Desligamento | `src/components/Profile360Module.tsx:877` | **Iniciar Desligamento** | CORE |
| F06 | Perfil 360 (cabeçalho) | `src/components/Profile360Module.tsx:171` | **Anexar** | CORE |
| F07 | Consulta Global | `src/components/GlobalQuery.tsx:59` | **Exportar Relatório** | CORE |
| F08 | Relatórios | `src/components/ReportsModule.tsx:119` | **Filtrar Período** — ao lado de "Exportar PDF", que funciona | CORE |
| F09 | Central Adm → Auditoria | `src/components/admin/AdminAudit.tsx:34` | **Últimos 30 dias** | CORE |
| F10 | Central Adm → Auditoria | `src/components/admin/AdminAudit.tsx:35` | **Filtros** | CORE |
| F11 | Central Adm → Auditoria | `src/components/admin/AdminAudit.tsx:36` | **Exportar** | CORE |
| F12 | Central Adm → Integrações | `src/components/admin/AdminIntegrations.tsx:41` | **Conectar sistema** — ação principal da tela | CORE |
| F13 | Central Adm → Integrações | `src/components/admin/AdminIntegrations.tsx:88` | **Gerar novas chaves** | CORE |
| F14 | Central Adm → Organização | `src/components/admin/AdminOrganization.tsx:142` | **Importar planilha** | CORE |
| F15 | Central Adm → Processos | `src/components/admin/AdminProcesses.tsx:89` | **Restaurar** (versão do processo) | CORE |
| F16 | Central de Tarefas | `src/components/TaskCenterModule.tsx:191` | **Mais Filtros** | COSMÉTICO |
| F17 | Dashboard RH | `src/components/Dashboard.tsx:230` | **Ver Relatório Detalhado** | COSMÉTICO |
| F18 | Dashboard RH | `src/components/Dashboard.tsx:252` | **Ver agenda completa** | COSMÉTICO |
| F19 | Intranet | `src/components/IntranetModule.tsx:73` | **Notificações** (o do módulo; o sino da barra superior funciona) | COSMÉTICO |
| F20 | Intranet | `src/components/IntranetModule.tsx:74` | **Novo Comunicado** | COSMÉTICO |
| F21 | Intranet | `src/components/IntranetModule.tsx:175` | **curtidas** do feed | COSMÉTICO |
| F22 | Intranet | `src/components/IntranetModule.tsx:178` | **comentários** do feed | COSMÉTICO |
| F23 | Intranet | `src/components/IntranetModule.tsx:237` | **Ver Calendário de Gente** | COSMÉTICO |
| F24 | Intranet | `src/components/IntranetModule.tsx:263` | **Sugerir Pauta** | COSMÉTICO |

### 1.2 Sem handler no fonte (painéis secundários, não reclicados um a um)

Mesma natureza dos anteriores — nenhum handler no código —, mas em telas que só
aparecem sob condição (registro selecionado, colaborador desligado, painel aberto).

| # | Tela | Arquivo:linha | Elemento | Prioridade |
|---|---|---|---|---|
| F25 | Barra superior → painel de notificações | `src/components/AppShell.tsx:682` | **Marcar todas como lidas** | CORE |
| F26 | Perfil 360 → Desligamento | `src/components/Profile360Module.tsx:859,860` | **TRCT** e **Chave FGTS** (só aparecem com status `Desligado`) | CORE |
| F27 | Perfil 360 → Treinamentos | `src/components/Profile360Module.tsx:740` | **Baixar** (certificado) | COSMÉTICO |
| F28 | Perfil 360 (tabelas) | `src/components/Profile360Module.tsx:172,530,531,584,585,611,632,698,721,741` | 10 botões de ação só-ícone (⋯ / download) nas tabelas de documentos, exames, dependentes, benefícios, férias e movimentações | COSMÉTICO |
| F29 | Central Adm → Pessoas e Acessos | `src/components/admin/AdminAccess.tsx:652,653` | **Membros** e **Salvar** (painel do grupo) | CORE |
| F30 | Central Adm → Integrações | `src/components/admin/AdminIntegrations.tsx:161,181` | **Mostrar** (revelar chave) e **Editar correspondências** | CORE |
| F31 | Central Adm → Processos | `src/components/admin/AdminProcesses.tsx:873,874` | **Duplicar** e **Restaurar** (painel de versões) | COSMÉTICO |
| F32 | Central Adm → IA | `src/components/admin/AdminAI.tsx:193` | **Ver detalhes** | COSMÉTICO |
| F33 | Central Adm (ícones) | `AdminAI.tsx:74,138` · `AdminAccess.tsx:363` · `AdminAudit.tsx:69` · `AdminIntranet.tsx:86,114` · `AdminOrganization.tsx:211,212` · `AdminProcesses.tsx:49` | 9 botões só-ícone sem handler | COSMÉTICO |
| F34 | Hub → Admissão Digital | `src/components/process-managers/AdmissionManager.tsx:92` | **Filtros** | COSMÉTICO |
| F35 | Hub → processos genéricos (9 telas) | `src/components/process-managers/GenericProcessManager.tsx:78` | **Filtros** — some em 9 processos de uma vez | COSMÉTICO |
| F36 | Hub → Recebimento de VR/VA | `src/components/process-managers/BenefitReceiptManager.tsx:45` | **Exportar Lote** | CORE |
| F37 | Hub → Gestão de Hierarquia | `src/components/process-managers/HierarchyManager.tsx:31,71,111,114` | **Histórico de Versões**, **Filtros** e 2 ícones | COSMÉTICO |
| F38 | Hub → Recrutamento / Onboarding / Colaboradores | `RecruitmentKanban.tsx:112,133,136` · `OnboardingManager.tsx:277` · `EmployeesModule.tsx:254` | 5 botões só-ícone (ações de card/linha) | COSMÉTICO |

> **Login** (`Login.tsx:133,222,241`) tem 3 links sem handler — "Ver todas",
> "Esqueci minha senha", "Fale com o administrador.". Fora da contagem por serem
> pré-autenticação, mas são a **primeira** tela que o cliente vê.

---

## 2. FLUXO — navegação e estado incoerentes

| # | Tela | Arquivo:linha | Problema | Prioridade |
|---|---|---|---|---|
| X01 | Detalhe da Solicitação | `src/App.tsx:34` · `src/components/RequestDetail.tsx` | A tela de detalhe ocupa a janela inteira e **remove o menu lateral**. Medido: `temSidebar=false`, `temBreadcrumb=false`. Sobra uma seta ← sem rótulo no canto — de dentro da solicitação não há como ir para outro módulo sem antes voltar. Vale para os 15 processos. | CORE |
| X02 | Gestão de Acessos | `src/components/AccessManagement.tsx:178-183` | **Excluir acesso sem confirmação**: o clique na lixeira remove na hora. A notificação só avisa depois de feito, e não há desfazer. | CORE |
| X03 | Central Adm → Pessoas e Acessos | `src/components/admin/AdminAccess.tsx:182-184` | **Remover usuário sem confirmação e sem nenhum feedback** — nem toast, nem notificação: a linha simplesmente some. | CORE |
| X04 | Modal "Nova Solicitação" (global) | `src/components/ui/Misc.tsx:107-124` | O modal **não fecha com ESC**, não tem `role="dialog"`/`aria-modal` e não prende o foco. Medido: `abriu=true`, `fechouComEsc=false`. Fechar só pelo × ou clicando fora. | CORE |
| X05 | Central Adm → Intranet e Processos | `AdminIntranet.tsx:36` · `AdminProcesses.tsx:37` | Usam `confirm()` nativo do browser para confirmar remoção/publicação. Funciona, mas é a única confirmação do produto e destoa do restante — some no fluxo visual da demonstração. | COSMÉTICO |

---

## 3. UX-VISUAL — feedback e polimento

| # | Tela | Arquivo:linha | Problema | Prioridade | Situação |
|---|---|---|---|---|---|
| V01 | Todas (barra de ação inferior) | `src/components/Toast.tsx:61` | **O toast cobre e bloqueia o botão de ação.** O container era `fixed bottom-8 right-8` com `pointer-events-auto` nos toasts — exatamente onde ficam APROVAR/REPROVAR/DEVOLVER. Medido logo após enviar uma solicitação: toast em `top 1018, left 1134-1468`, botão APROVAR em `top 1019, left 1363-1467`; `elementFromPoint` no centro do botão devolvia o toast e `cliqueChegaNoBotao=false` por 5s. Evidência: `toast-sobre-acao.png`. | CORE | ✅ **CORRIGIDO** |
| V02 | Central de Tarefas | `src/components/TaskCenterModule.tsx:48` | **A barra de SLA era `Math.random()` dentro do render.** Sem nenhuma ação do usuário (só sair da tela e voltar), as barras mudavam de `79%,59%,78%,62%,43%,69%` para `67%,58%,71%,56%,67%,72%`. Números que dançam durante a apresentação. | CORE | ✅ **CORRIGIDO** |
| V03 | Todas | `src/components/ui/Button.tsx:14` · `src/index.css` | **Nenhum botão tinha `cursor: pointer`.** Os 257 clicáveis medidos vieram com `cursor: default`. O Tailwind v4 removeu esse padrão do preflight e o projeto não repôs. | COSMÉTICO | ✅ **CORRIGIDO** |
| V04 | Todas | — | **Toasts empilham.** Três ações seguidas deixaram 2 na tela ao mesmo tempo, crescendo para cima a partir do canto — some a área útil e agrava V01. Não há limite de pilha. | COSMÉTICO | ✅ **CORRIGIDO** (junto de V01) |
| V05 | Todas | `src/components/Toast.tsx:17` | Cada toast dura **5s**, no limite superior do esperado (3-5s). Com V04 junto, a última mensagem fica visível bem mais que isso. | COSMÉTICO | Aberto |
| V06 | Menu lateral, cabeçalhos, links | `src/index.css:8` (`--color-brand-primary: #F26522`) | **Contraste abaixo de WCAG AA**: laranja da marca sobre branco = **3.14:1**, mínimo 4.5:1 para texto normal. Atingia o item ativo do menu (14px), o rótulo "ADMINISTRADOR GERAL" (11px) e links como "Relevância" (10px) — presente nas 8 telas medidas. | COSMÉTICO | ✅ **CORRIGIDO** |
| V07 | Recrutamento e Seleção | `RecruitmentKanban` (legenda Recharts) | Legenda do gráfico em 10px com vermelho `rgb(239,68,68)` = 3.76:1, abaixo de 4.5:1. | COSMÉTICO | Aberto |
| V08 | — | `ModuleView.tsx:74` · `PortalExternal.tsx:90,98` | **`addToast` com argumentos invertidos**: a assinatura é `(message, type)` (`ToastContext.tsx:11`) e essas 3 chamadas passam `('success', 'texto…')`. Renderizaria a palavra "success" como mensagem, sem ícone e sem cor. Hoje **inócuo** — os dois arquivos são órfãos (Anexo B) —, mas vira bug visível no dia em que forem religados. | COSMÉTICO | Aberto |
| V09 | Todas as telas com foto de pessoa | `src/components/ui/Misc.tsx:10` | Avatar com URL quebrada no cadastro (ex.: Karina Lopes) mostrava o ícone de imagem partida do navegador, em vez das iniciais que já aparecem para quem não tem foto. | COSMÉTICO | ✅ **CORRIGIDO** |

---

## Anexo C — o que já foi corrigido

Rodada de correção posterior à auditoria. Cada item foi reverificado no browser
com a medida que sustenta o veredito.

| # | O que mudou | Onde | Como foi confirmado |
|---|---|---|---|
| **V01** | O container de toasts saiu de `bottom-8 right-8` para o **topo-centro** (`top-[68px]`), a única faixa livre em todas as telas — a barra superior termina em y=52 e as ações de cabeçalho ficam à direita (x ≥ 1144 a 1500px). Por garantia, o corpo do toast virou `pointer-events-none`: só o × captura clique, então mesmo num layout imprevisto o clique atravessa. | `src/components/Toast.tsx` | Toast em `y 68-118, x 583-917` com APROVAR em `y 1019, x 1363`; `elementFromPoint` no centro do botão devolve o próprio botão. **Clique de mouse real com o toast na tela levou a solicitação de `Pendente de Aprovação` para `Em Aprovação`.** Reconferido em 1500×1100, 1280×900 e 1100×800. |
| **V02** | `Math.random()` saiu. A barra passou a ser quanto da janela de SLA já foi consumido, calculado do dado real da tarefa (`createdAt` → `dueDate`). Tarefa sem prazo cai num valor derivado do hash do id — pseudo-aleatório, mas estável. | `src/components/TaskCenterModule.tsx` (`consumoDoSLA`) | Duas visitas seguidas à tela devolveram exatamente `67%,100%,67%,100%,67%,100%`. |
| **V03** | Regra na camada base do CSS cobrindo `button`, `[role="button"]`, `a[href]`, `summary` e `label[for]`, com `not-allowed` para desabilitados. Nenhum componente foi tocado. | `src/index.css` | 44 clicáveis medidos na Intranet, **0 sem `cursor: pointer`**; desabilitados todos com `not-allowed`. |
| **V04** | Pilha limitada a 3 toasts simultâneos. | `src/components/ToastContext.tsx` | — |
| **V06** | Novo token `--color-brand-primary-text: #C2511B` (o mesmo laranja 20% mais escuro, **4.68:1** sobre branco), aplicado só em texto pequeno: item ativo do menu e submenu, "ADMINISTRADOR GERAL" e rótulos pequenos da Intranet. Botões e CTAs seguem com `#F26522`, que já cumpre os 3:1 exigidos deles. | `src/index.css` · `AppShell.tsx` · `IntranetModule.tsx` | 0 textos pequenos em laranja abaixo de 4.5:1; "Intranet" no menu ativo mede **4.68:1**. |
| **V09** | O `Avatar` ganhou `onError`: se a imagem falhar, cai nas mesmas iniciais já usadas para quem não tem foto. O estado reinicia quando o `src` muda. | `src/components/ui/Misc.tsx` | Karina Lopes (URL morta no seed) passou a exibir "KL" no Calendário de Gente e na lista de Colaboradores; nenhuma `<img>` quebrada na página. |
| **F06** | **Anexar** abre o seletor de arquivo e grava o documento na aba Documentos da ficha (`anexarDocumentoColaborador`), com registro na auditoria. Só o nome é guardado — mesma regra do Portal do Colaborador, porque o estado vai inteiro para o localStorage. | `Profile360Module.tsx` · `AppConfigContext.tsx` | Renderização do cabeçalho traz `<input type="file">` e o botão ligado a ele. |
| **F02** | **Baixar Tudo** gera um CSV com o índice dos documentos da ficha; o download por linha gera a ficha daquele documento em texto. Os dois dizem, no conteúdo, que a demonstração não guarda o arquivo original. | `Profile360Module.tsx` · `utils/download.ts` | `montarCSV` e `nomeSeguro` cobertos por asserção (inclusive acentuação: "Comprovante de Residência" → `comprovante-de-residencia`). |
| **F03** | **Ver Política** abre as faixas salariais cadastradas (`config.faixasSalariais`), destacando em qual o colaborador está enquadrado — deixou de ser link morto e passou a mostrar dado que já existia no app. | `Profile360Module.tsx` | Aba Cargo e Salário renderiza sem erro para 4 colaboradores. |
| **F04** | **Simular Rescisão** abre a projeção de verbas por tipo de desligamento, reaproveitando `calcularVerbas` da etapa de Benefícios e Encerramento — sem duplicar regra. | `Profile360Module.tsx` · `utils/desligamento.ts` | Mesmo módulo já coberto por `auditoria/simular-verbas-desligamento.ts` (40 verificações). |
| **F05** | **Iniciar Desligamento** abre o formulário do processo 15 já preenchido com o colaborador (`prefillSolicitacao`). | `Profile360Module.tsx` · `RHRequestForm.tsx` | Asserção de que as chaves do prefill existem entre os campos de `PROCESS_DEFINITIONS['15']`. |
| **F26** | A aba Desligamento passou a ler a solicitação real do colaborador (tipo, motivo, aviso prévio, datas) em vez de texto fixo; **TRCT** e **Chave FGTS** deram lugar à lista de documentos anexados na etapa de encerramento, cada um com download. | `Profile360Module.tsx` | Renderização da aba para colaborador com e sem desligamento. |
| **F27** | **Baixar** (certificado) gera a ficha do treinamento; curso em andamento mostra "Em andamento" no lugar do botão. | `Profile360Module.tsx` | Aba Treinamentos renderizada para 4 colaboradores. |
| **F28** | Os botões só-ícone sem ação saíram das tabelas de documentos, exames, dependentes, benefícios, férias e movimentações. Sobraram apenas os que fazem algo (download e abrir solicitação). | `Profile360Module.tsx` | Varredura no fonte: nenhum `<Button>` das ações auditadas sem `onClick`. |

Junto foram fechados dois problemas de apresentação do Perfil 360 que a auditoria
não tinha catalogado:

| O que mudou | Onde | Como foi confirmado |
|---|---|---|
| A barra de rolagem das abas era a nativa, cinza e grossa. Virou navegação própria: barra escondida (`.scrollbar-hide`), rolagem por gesto preservada, setas que só aparecem do lado em que há aba escondida e aba ativa trazida para a área visível. | `ui/ScrollableTabs.tsx` · `index.css` · `Profile360Module.tsx` | HTML renderizado traz `scrollbar-hide` e `role="tablist"`; CSS cobre Firefox (`scrollbar-width`) e WebKit (`::-webkit-scrollbar`). |
| Abas abriam com tabela de cabeçalho e nenhuma linha. Agora o seed deriva a ficha inteira de cada colaborador (documentos, exames, benefícios, férias, movimentações, treinamentos, auditoria) e, onde o vazio é legítimo, entra um `<EmptyState>` explicativo. O `<Table>` também ganhou mensagem padrão para vazio, valendo em todo o app. | `utils/fichaColaborador.ts` · `data.ts` · `ui/CardAndTable.tsx` | 4 colaboradores × 15 abas renderizados: nenhuma `<tbody>` sem `<tr>` e nenhuma aba sem conteúdo ou explicação. |

Seguem abertos os demais achados das seções 1, 2 e 3.

## Anexo A — o que foi varrido

| Grupo | Telas |
|---|---|
| Menu principal (12) | Intranet · Dashboard RH · Central de Tarefas · Minhas Solicitações · Minhas Aprovações · Colaboradores · Perfil 360 · Portal do Colaborador · Consulta Global · Relatórios · Integrações · Gestão de Acessos |
| Central Adm (8 sub-abas) | Visão Geral · Organização · Pessoas e Acessos · Processos · Intranet · Integrações · Inteligência Artificial · Auditoria |
| Hub (15 processos) | Requisição de Vaga · Recrutamento e Seleção · Admissão Digital · Onboarding · Recebimento de VR/VA · Gestão de Dependentes · Alteração de Cargos e Salários · Prestação de Contas · Solicitação de Férias · Medida Disciplinar · Movimentação de Pessoal · Gestão de Horas Extra · Gestão de Hierarquia · Treinamento · Solicitação de Desligamento — cada um em lista, botão de ação principal e "ver detalhes" |
| Abas do Perfil 360 | Resumo · Documentos · Cargo e Salário · Desligamento (as demais entraram na varredura ampla) |

**Cobertura**: 257 clicáveis na varredura ampla + 32 confirmações alvo-a-alvo +
70 ocorrências na varredura estática de arquivos alcançáveis.

**Limite conhecido**: a varredura ampla se contamina quando um modal fica aberto
(cliques seguintes batem no overlay e parecem inertes). Por isso **nenhum achado
`Funcional` desta lista vem só dela** — todos têm confirmação alvo-a-alvo com
estado limpo ou ausência de handler no fonte.

## Anexo B — código órfão

Sem caminho de import a partir de `main.tsx`; o usuário não chega neles. Os
"botões mortos" nesses arquivos **não** entraram na contagem.

`components/ModuleView.tsx` · `components/PlaceholderView.tsx` ·
`components/PortalExternal.tsx` · `components/QuickSignup.tsx` ·
`components/CompanyConfig.tsx` · `components/DashboardPreview.tsx` ·
`components/Drawer.tsx` · `components/Modal.tsx` · `mockData.tsx`

Vale notar que `components/Modal.tsx` está órfão enquanto o modal realmente usado
é o de `components/ui/Misc.tsx` — dois componentes de modal, um deles morto.
