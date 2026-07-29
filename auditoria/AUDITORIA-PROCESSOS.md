# Auditoria dos 15 processos do RH360

**Data:** 29/07/2026 · **Branch:** `main` · **Commit base:** `4fea884`
**Escopo:** os 15 processos de `src/processDefinitions.ts` e `INITIAL_RH_PROCESSES` (`src/data.ts:1346-1424`).
**Nenhuma alteração de código foi aplicada.** Esta rodada é só diagnóstico.

---

## 0. Método e limitações

### O que foi analisado

| Eixo | Fonte | Como |
|---|---|---|
| 1. Campo × processo | `processDefinitions.ts`, varredura de `src/**` | Script `mapear-campos.ts` + leitura manual |
| 2. Aderência do tipo de fluxo | `data.ts`, `AppConfigContext.tsx`, `processDefinitions.ts` | Leitura manual |
| 3. Motor de aprovação | `utils/approvalFlow.ts` + config de cada processo | Script `simular-aprovacoes.ts` (159 verificações) |
| 4. Etapas / esteira | `RHProcess.etapas`, `RHProcess.trail`, handoffs | Script + rastreio de uso |

### Limitação importante sobre o eixo 4

**Não há material de arquitetura na pasta do projeto.** A varredura por `.md`, `.pdf`, `.docx` e `.txt` (excluindo `node_modules`) retorna **apenas `README.md`**, que é o boilerplate do Google AI Studio ("Run and deploy your AI Studio app") e não descreve processo nenhum. A única descrição de negócio existente é o parágrafo de `metadata.json`.

Portanto o eixo 4 **não pôde ser avaliado contra a documentação** — foi avaliado contra duas referências alternativas, e isso está sinalizado em cada achado:
- **(a)** a esteira efetivamente implementada em código (handoffs de `approveRequest`);
- **(b)** a prática corrente de operação de RH no Brasil.

Se existirem materiais de arquitetura fora do repositório, o eixo 4 merece uma segunda passada.

### Limitação dos scripts

- `mapear-campos.ts` detecta **órfão** com alta confiança (zero ocorrências da chave em todo o `src/`, fora do `processDefinitions.ts`). O contrário — a contagem de "leituras" — é **ruidosa**: chaves genéricas como `data`, `email` e `cargo` casam em dezenas de linhas não relacionadas. Use a coluna de leituras como indício, não como prova.
- `simular-aprovacoes.ts` importa o motor real (`approvalFlow.ts`) mas **espelha** as transições de `createRequest`/`approveRequest`, que hoje vivem dentro do provider React e não são importáveis fora do browser. Cada transição espelhada cita a linha de origem. Ver §6.
- A verificação automática de etapas conta etapas cujo nome casa com `/aprova|valida|audit|board/i`. É heurística: o **processo 7 passou como OK por coincidência numérica** (2 etapas de aprovação, 2 níveis) embora os nomes não correspondam. Corrigido manualmente em §5.

---

## 1. Sumário executivo

| # | Achado | Gravidade | Processos |
|---|---|---|---|
| **T1** | Processo 10 tem identidade dupla: metadados dizem "Medida Disciplinar", o formulário é "Aviso de Desligamento" | 🔴 Crítico | 10 |
| **T2** | Alçada da Diretoria da Requisição de Vaga **nunca dispara** — compara campo inexistente | 🔴 Crítico | 1 |
| **T3** | Handoffs de atualização cadastral são **código inalcançável**: promoção não altera salário, desligamento não inativa colaborador | 🔴 Crítico | 7, 11, 15 |
| **T4** | `etapas` e `trail` (esteira) são **dados mortos**: configurados nos 15 processos e lidos por nenhuma tela | 🟠 Alto | todos |
| **T5** | VR/VA expõe `Valor Creditado` ao colaborador e trata "Tipo de Benefício" como texto único | 🟠 Alto | 5 |
| **T6** | VR/VA é iniciado pelo colaborador, não pelo RH — não existe o "aviso na data prevista" | 🟠 Alto | 5 |
| **T7** | Medida Disciplinar é aviso com ciência, mas está modelado como aprovação | 🟠 Alto | 10 |
| **T8** | 53 de 164 chaves de campo são órfãs (nenhuma leitura em todo o `src/`) | 🟡 Médio | 1,4,5,6,7,8,9,10,11,12,13,14,15 |
| **T9** | `handoffs` declarados na config sem implementação correspondente | 🟡 Médio | 6, 9, 10, 14 |
| **T10** | Prefill de Férias grava chaves que nenhum campo consome (`periodoaquisitivo`, `saldo`) | 🟡 Médio | 9 |
| **T11** | Painel de VR/VA com números e valores fixos no código | 🟡 Médio | 5 |
| **T12** | Processos gerenciais aparecem no modal genérico "Nova Solicitação" | 🟡 Médio | 2, 4, 5, 13 |

**Resultado do motor de aprovação (eixo 3):** 159 verificações · **1 falha** (T2) · 4 alertas de etapas. A mecânica da cascata — ordem, condição, status final, histórico, tarefas — **está correta em todos os 15 processos**. O único defeito é de *configuração de dado*, não de motor.

---

## 2. Achados transversais

### T1 — Processo 10 tem duas identidades 🔴

O mesmo `id: '10'` descreve dois processos diferentes:

| Fonte | Diz que é |
|---|---|
| [data.ts:1399](../src/data.ts#L1399) | `name: 'Medida Disciplinar'`, `description: 'Advertências, suspensões e registros disciplinares'`, `etapas: ['Registro', 'Ciência Colaborador', 'Arquivado']` |
| [processDefinitions.ts:336-357](../src/processDefinitions.ts#L336-L357) | `name: 'Aviso de Desligamento'`, com `tipoDesligamento`, `avisoPrevio`, `ultimoDia`, `substituto` |

Como o formulário é resolvido por `PROCESS_DEFINITIONS[processId]` ([RequestDetail.tsx:62](../src/components/RequestDetail.tsx#L62), [RHRequestForm.tsx:52](../src/components/RHRequestForm.tsx#L52)), **quem abrir "Medida Disciplinar" recebe um formulário de rescisão contratual** — pedindo tipo de desligamento e último dia trabalhado para registrar uma advertência.

Agrava: o processo 15 já é "Solicitação de Desligamento", com um formulário muito mais completo (5 tipos, aviso prévio por tipo, ASO, anexos condicionais). O formulário do 10 é uma versão anterior e reduzida do 15.

**Recomendação:** decidir qual das duas identidades o processo 10 tem. Se for Medida Disciplinar (o que os metadados, o ícone `AlertCircle`, a categoria e `requireSignature: true` indicam), reescrever `PROCESS_DEFINITIONS['10']` com os campos do domínio disciplinar — tipo de medida (Advertência Verbal / Advertência Escrita / Suspensão), data da ocorrência, dias de suspensão, descrição do fato, testemunhas, ciência do colaborador — e descartar os campos de desligamento, que o 15 já cobre.

---

### T2 — A alçada da Diretoria na Requisição de Vaga nunca dispara 🔴

**Única falha apontada pela simulação.**

[data.ts:1365](../src/data.ts#L1365) configura o nível 2:

```ts
{ id: 'app-2', name: 'Diretoria', order: 2, ..., conditionField: 'salario', conditionOperator: '>', conditionValue: 10000 }
```

Mas o campo monetário do formulário do processo 1 chama-se **`salarioSugerido`** ([processDefinitions.ts:67](../src/processDefinitions.ts#L67)). Não existe chave `salario` no processo 1.

O que o motor faz ([approvalFlow.ts:61-85](../src/utils/approvalFlow.ts#L61-L85)): `resolveConditionField` devolve `'salario'` porque o passo declarou explicitamente; `data['salario']` é `undefined`; `toNumber(undefined)` é `null`; e o caso `'>'` exige `left !== null` → **retorna `false`**. O nível é filtrado para fora da cascata.

Saída da simulação, nos dois cenários:

```
[FALHA!] (config) conditionField inexistente no formulário
         Nível "Diretoria" compara "salario", que não é campo de PROCESS_DEFINITIONS['1'].
         Campos monetários disponíveis: salarioSugerido.
[  ok  ] (valor alto (R$ 50.000)) condição do nível "Diretoria"
         regra: salario > 10000 · campo resolvido: salario · valor lido: undefined · disparou: NÃO
```

Uma requisição de vaga com remuneração sugerida de R$ 50.000 é concluída **só com o Gestor Direto**. A Diretoria nunca é chamada.

Detalhe que torna o defeito silencioso: o fallback protetivo de [approvalFlow.ts:66-68](../src/utils/approvalFlow.ts#L66-L68) ("condição incompleta aciona o nível") só age quando o campo **não pode ser resolvido**. Aqui o campo foi resolvido — ele apenas não existe nos dados. O caminho perigoso (deixar de acionar a alçada) é exatamente o que acontece.

Segundo efeito, na tela de configuração: `fieldOf` ([AdminProcesses.tsx:296-297](../src/components/admin/AdminProcesses.tsx#L296-L297)) não encontra `salario` na lista de campos, e `describeTrigger` cai no rótulo genérico — o admin lê **"Se valor da solicitação for maior que R$ 10.000"** e acredita que a alçada está ativa.

**Recomendação:** duas correções complementares.
1. Trocar `conditionField: 'salario'` por `'salarioSugerido'` em [data.ts:1365](../src/data.ts#L1365).
2. Tornar o defeito impossível de repetir: validar em `AdminProcesses` que o `conditionField` escolhido pertence a `PROCESS_DEFINITIONS[process.id]`, e sinalizar visualmente o nível cujo campo não existe mais (o formulário pode ser editado depois da alçada). A checagem já está implementada em `auditoria/simular-aprovacoes.ts` (`auditarCamposDeCondicao`) e pode virar teste de regressão.

---

### T3 — Os handoffs de atualização cadastral são código inalcançável 🔴

Existem **dois** blocos de "lógica de conclusão" no contexto, e o que atualiza o cadastro do colaborador está no caminho que o fluxo de aprovação nunca percorre.

| Bloco | Onde | O que faz | Alcançável? |
|---|---|---|---|
| A | [AppConfigContext.tsx:612-640](../src/contexts/AppConfigContext.tsx#L612-L640), dentro de `updateRequest` | Processos 7 e 11: grava `role`, `salary`, `department`, `costCenter`, `branch` no colaborador. Processo 15: marca `status: 'Inativo'`. | ❌ **Não** |
| B | [AppConfigContext.tsx:769-896](../src/contexts/AppConfigContext.tsx#L769-L896), dentro de `approveRequest` | Processos 1, 2, 3, 15: cria vaga e tarefas de esteira. | ✅ Sim |

O bloco A só roda quando alguém chama `updateRequest` com `status: 'Concluída'`. Os únicos chamadores de `updateRequest` são [RecruitmentKanban.tsx:42](../src/components/process-managers/RecruitmentKanban.tsx#L42) e [RHRequestForm.tsx:202](../src/components/RHRequestForm.tsx#L202) — nenhum passa `'Concluída'`. O botão de aprovar chama `approveRequest` ([RequestDetail.tsx:79](../src/components/RequestDetail.tsx#L79)), que faz o próprio `setConfig` e **nunca invoca `updateRequest`**.

Confirma-se pelo próprio código do bloco B: `newColaboradores` é declarado em [AppConfigContext.tsx:734](../src/contexts/AppConfigContext.tsx#L734) e devolvido em [:902](../src/contexts/AppConfigContext.tsx#L902) **sem nunca ser modificado**.

Consequência prática, com toda a cascata aprovada:
- **Processo 7** — promoção aprovada em duas alçadas: o colaborador continua com o cargo e o salário antigos.
- **Processo 11** — transferência aprovada por origem e destino: o colaborador continua na filial, setor e centro de custo antigos.
- **Processo 15** — desligamento aprovado pela Diretoria: o colaborador **continua Ativo** na base. Apenas a tarefa de sugestão de reposição é criada ([:872-895](../src/contexts/AppConfigContext.tsx#L872-L895)).

Note que os três declaram `handoffs.updateProfile: true` ([data.ts:1396](../src/data.ts#L1396), [:1400](../src/data.ts#L1400), [:1421](../src/data.ts#L1421)).

**Recomendação:** mover o bloco A para dentro do `if (isFinal)` de `approveRequest`, operando sobre o `newColaboradores` que já está ali à espera, e remover o bloco morto de `updateRequest`. Manter uma única lógica de conclusão evita que a divergência volte.

---

### T4 — A esteira (`etapas`/`trail`) é dado morto 🟠

O modelo declara a esteira em **dois lugares**, e nenhum é lido:

| Campo | Declaração | Preenchido? | Lido? |
|---|---|---|---|
| `RHProcess.etapas: string[]` | [types.ts:108](../src/types.ts#L108) | Sim, nos 15 processos | **Não** — nenhuma ocorrência de `.etapas` fora de `data.ts` |
| `RHProcess.trail?: ProcessTrailStep[]` | [types.ts:126](../src/types.ts#L126), tipo em [:71-82](../src/types.ts#L71-L82) | **Não** — nenhum processo o define | **Não** — sem editor em `AdminProcesses` |

A sequência que o usuário realmente vê é `RHRequest.trail`, montada na abertura a partir da cascata: `['Solicitação', ...níveis, 'Conclusão']` ([AppConfigContext.tsx:423](../src/contexts/AppConfigContext.tsx#L423)) e refeita a cada aprovação ([:714](../src/contexts/AppConfigContext.tsx#L714)).

Ou seja: **o produto não tem esteira configurável.** Tem cascata de aprovação, e o stepper mostra a cascata. As listas de `etapas` são rótulos decorativos que ninguém consegue ver nem editar — e que, por não estarem sob os olhos de ninguém, divergiram da realidade em 4 dos 15 processos (§5).

**Recomendação:** escolher um caminho antes de mexer em qualquer `etapas` individual, porque a correção depende da escolha:
- **(a) Assumir que não há esteira** — remover `etapas` e `trail` do `RHProcess` e da seed. Honesto e barato; o stepper continua sendo a cascata.
- **(b) Implementar a esteira** — `ProcessTrailStep` já prevê `actorType`, `sla`, `condition` e `requireApproval`, ou seja, o modelo foi desenhado para uma esteira com etapas executivas *além* das de aprovação (Entrevista de Desligamento, Pagamento, Certificação — coisas que hoje não existem como estado). Exige editor em Central Adm e um motor de avanço de etapa ao lado do de aprovação.

A opção (b) é a que resolve os alertas de §5 na raiz; a (a) os torna sem objeto.

---

### T8 — 53 de 164 chaves de campo são órfãs 🟡

Chaves que **não têm nenhuma leitura em todo o `src/`** fora do `processDefinitions.ts`. Isso não impede o campo de aparecer na consulta — o `RequestDetail` renderiza a definição inteira de forma genérica — mas significa que o dado não alimenta regra, handoff, relatório ou integração nenhuma.

| Processo | Órfãos |
|---|---|
| 1 | `dataDesejada`, `prioridade` |
| 4 | `empresaFilial`, `template`, `dataInicial`, `prazo` |
| 5 | `beneficio`, `valorCreditado`, `dataCredito`, `confirmacaoRecebimento` |
| 6 | `dependenteId`, `beneficioRelacionado` |
| 7 | `salarioAtual`, `tipoAlteracao`, `percentual` |
| 8 | `tipoDespesa` |
| 9 | `periodoAquisitivo`, `diasDireito`, `diasGozados`, `saldoDisponivel`, `ultimaFerias`, `dataInicio`, `diasGozo`, `abonoPecuniario`, `adianta13`, `dataRetorno` — **o formulário inteiro** |
| 10 | `avisoPrevio`, `ultimoDia` |
| 11 | `filialAtual`, `setorAtual`, `tipoMovimentacao` |
| 12 | `horaInicio`, `horaFim` |
| 13 | `gestorAtual`, `novoGestorId` |
| 14 | `curso`, `instituicao`, `dataInicial`, `dataFinal`, `cargaHoraria`, `custo` |
| 15 | `motivoComplementar`, `avisoPrevio`, `dataAvisoPrevio`, `dataTerminoContrato`, `ultimoDiaTrabalhado`, `dataPrevistaDesligamento`, `verbas`, `asoData`, `asoAnexo`, `cartaDemissao`, `documentosComprobatorios`, `anexoGeral` |

Nem todo órfão é defeito. Há três naturezas distintas, e a recomendação difere:

1. **Órfão legítimo — insumo de campo calculado.** `salarioAtual` e `percentual` (proc. 7), `diasDireito`/`saldoDisponivel` (proc. 9): existem para o `calculate` e para o olho de quem aprova. Manter.
2. **Órfão de destino ausente.** `novoGestorId` (proc. 13) e `ultimoDiaTrabalhado`/`asoAnexo` (proc. 15): o dado é pedido, é obrigatório, e a aprovação final não faz nada com ele. Aqui o órfão é sintoma de T3 — falta o handoff, não sobra o campo.
3. **Órfão de campo dispensável.** `prioridade` e `dataDesejada` (proc. 1), `tipoDespesa` (proc. 8), `tipoMovimentacao` (proc. 11): pedidos ao usuário e ignorados por tudo. Ou viram critério (alçada, SLA, filtro de relatório) ou saem do formulário.

Rodar `npx tsx auditoria/mapear-campos.ts --orfaos` reproduz a lista.

---

### T9 — Handoffs declarados sem implementação 🟡

Além de T3, quatro processos declaram handoff que não existe em lugar nenhum:

| Processo | Declara | Implementado |
|---|---|---|
| 6 — Gestão de Dependentes | `updateProfile: true`, `createRecord360: true` ([data.ts:1395](../src/data.ts#L1395)) | Nada. O dependente aprovado não entra no cadastro. |
| 9 — Solicitação de Férias | `updateProfile: true`, `createRecord360: true` ([data.ts:1398](../src/data.ts#L1398)) | Nada. `vacationRecords` não recebe o período aprovado — daí `diasGozadosHist` nunca crescer. |
| 10 — Medida Disciplinar | `createRecord360: true`, `generateDoc: true`, `requireSignature: true` ([data.ts:1399](../src/data.ts#L1399)) | Nada. |
| 14 — Treinamento | `createRecord360: true` ([data.ts:1403](../src/data.ts#L1403)) | Nada. |

**Recomendação:** tratar `handoffs` como contrato. Ou implementar no `if (isFinal)` de `approveRequest` (junto com a correção de T3), ou baixar as flags para `false` para que a Central Adm pare de prometer o que não entrega.

---

## 3. Eixo 2 em profundidade — Recebimento de VR/VA (processo 5)

### O que já está certo ✅

O processo **já não usa o padrão "abrir solicitação → aprovar"**. Isso foi resolvido no commit `bf83606`/anteriores e a estrutura está correta:

- `acknowledgement` declarado em [processDefinitions.ts:172-177](../src/processDefinitions.ts#L172-L177): ao enviar, a solicitação nasce em `'Recebimento Confirmado'`, sem cascata e sem tarefa de aprovação.
- `approvals: []` ([data.ts:1394](../src/data.ts#L1394)) e o caminho de acknowledgement **evita** o nível implícito de RH — `buildApprovalChain` nem chega a ser chamado ([AppConfigContext.tsx:376](../src/contexts/AppConfigContext.tsx#L376)).
- Nenhuma tarefa de aprovação é criada ([:449](../src/contexts/AppConfigContext.tsx#L449)).
- Trilha própria: `['Crédito Lançado', 'Confirmação do Colaborador', 'Recebimento Registrado']`.
- Os campos do benefício são `origin: 'F'` (leitura), preenchidos pelo RH via `getBenefitCredit` ([FormRenderer.tsx:155-169](../src/components/FormRenderer.tsx#L155-L169)).
- Status `'Recebimento Confirmado'` reconhecido como conclusão em [requestStatus.ts:19-22](../src/utils/requestStatus.ts#L19-L22).

A simulação confirma, nos dois cenários:

```
[  ok  ] protocolo sem aprovação
         status="Recebimento Confirmado", cascata=0 nível(is), tarefas=0,
         trilha=[Crédito Lançado → Confirmação do Colaborador → Recebimento Registrado]
```

**Ou seja: a premissa de que o processo 5 "está usando o mesmo padrão de abrir solicitação → aprovar" não se confirma no eixo da alçada.** A ausência de aprovação está correta. Os problemas reais são outros quatro, listados abaixo.

### T5 — `Valor Creditado` exposto onde deveria haver categoria 🟠

[processDefinitions.ts:182-185](../src/processDefinitions.ts#L182-L185):

```ts
{ name: 'competencia',    label: 'Mês de Referência',    type: 'text',     origin: 'F', ... },
{ name: 'beneficio',      label: 'Tipo de Benefício',    type: 'text',     origin: 'F', ... },
{ name: 'valorCreditado', label: 'Valor Creditado (R$)', type: 'currency', origin: 'F', ... },
{ name: 'dataCredito',    label: 'Data do Crédito',      type: 'date',     origin: 'F', ... },
```

Dois problemas distintos no mesmo trecho:

**(i) O valor não deveria estar ali.** O que o colaborador precisa confirmar é *que recebeu o benefício da competência*, não *quanto*. Expor o valor cria dois efeitos indesejados: transforma a confirmação numa conferência de valor (e a nota de [:186](../src/processDefinitions.ts#L186) admite isso ao instruir "confirme apenas se realmente recebeu e descreva o ocorrido"), e coloca dado financeiro numa tela que `isSensitive: false` ([data.ts:1394](../src/data.ts#L1394)) — sem controle de dado sensível.

**(ii) "Tipo de Benefício" é texto único, mas a operação é multi-benefício.** O campo é `type: 'text'` recebendo **um** nome. E `getBenefitCredit` ([benefitCredit.ts:33-37](../src/utils/benefitCredit.ts#L33-L37)) escolhe **um** cartão:

```ts
const card =
  benefits.find(b => b.active && b.type === 'Refeição') ||
  benefits.find(b => b.active && b.type === 'Alimentação');
```

Com a seed atual ([data.ts:2196-2197](../src/data.ts#L2196-L2197)), Vale Refeição (R$ 800) e Vale Alimentação (R$ 400) estão os dois ativos — **e o colaborador só vê o Refeição**. O Alimentação é silenciosamente descartado pelo `||`.

**Bilhete Único não existe no sistema.** `BenefitConfig['type']` ([types.ts:759](../src/types.ts#L759)) admite `'Saúde' | 'Refeição' | 'Seguro' | 'Alimentação' | 'Auxílio' | 'Outros'` — não há tipo de transporte, e `INITIAL_BENEFITS` ([data.ts:2194-2202](../src/data.ts#L2194-L2202)) não traz nenhum.

**Recomendação:**
1. Acrescentar `'Transporte'` a `BenefitConfig['type']` e um item Bilhete Único a `INITIAL_BENEFITS`.
2. Trocar `beneficio: text` por um campo de múltipla seleção em leitura, listando **todos** os benefícios de crédito ativos da competência (Refeição, Alimentação, Transporte) — não um só.
3. Alterar `getBenefitCredit` para devolver uma **lista** de créditos em vez de um `BenefitCredit` único, eliminando o `||` que descarta benefícios.
4. Remover `valorCreditado` do formulário do colaborador. O valor continua no lançamento do RH e na tela de gestão; a confirmação passa a ser por benefício ("recebi o VR", "recebi o VA"), que é o que tem valor jurídico no aceite.

### T6 — O crédito não é lançado pelo RH nem avisa o colaborador 🟠

A operação descrita é: **RH define o crédito → sistema avisa o colaborador na data prevista → colaborador confirma.** O que existe hoje é o inverso.

| Etapa esperada | Situação atual |
|---|---|
| RH define o crédito (competência, benefícios, data) | Não existe tela de lançamento. O crédito é **derivado** da config de benefícios da empresa e da data de hoje ([benefitCredit.ts:29-45](../src/utils/benefitCredit.ts#L29-L45)) — `dataCredito` é sempre dia 5 do mês corrente, fixo em [:14](../src/utils/benefitCredit.ts#L14). |
| Sistema avisa na data prevista | Não existe. Nenhuma notificação, nenhum agendamento, nenhum disparo. |
| Colaborador confirma | Existe — mas **só se ele próprio abrir** "Nova Solicitação → Recebimento de VR/VA". |

O processo 5 não está em `PROCESSOS_SEM_ABERTURA_GENERICA` ([permissions.ts:47](../src/utils/permissions.ts#L47)), então aparece no modal genérico ([AppShell.tsx:718](../src/components/AppShell.tsx#L718), [RHRequests.tsx:164](../src/components/RHRequests.tsx#L164)). O gatilho é o colaborador, não o RH.

E o botão que deveria ser o lançamento do RH não é: **"Novo Lote"** ([BenefitReceiptManager.tsx:48-50](../src/components/process-managers/BenefitReceiptManager.tsx#L48-L50)) chama `onNewRequest`, que abre o mesmo formulário genérico ([RHRequests.tsx:94](../src/components/RHRequests.tsx#L94)) — e como o processo é `TargetMode.CURRENT_USER`, o RH cai num formulário que confirma o recebimento **para ele mesmo**. Não há criação de lote.

**Recomendação:** inverter o gatilho, no mesmo padrão já usado na Admissão Digital (que é o precedente do próprio produto):
1. Tela de lançamento do RH ("Novo Lote"): competência, benefícios creditados, valor por benefício, data prevista do crédito, população alvo.
2. O lançamento **gera as confirmações pendentes** — uma por colaborador — em vez de o colaborador abri-las.
3. Na data prevista, notificar (`addNotification`) e criar a tarefa de confirmação para cada colaborador.
4. Acrescentar `'5'` a `PROCESSOS_SEM_ABERTURA_GENERICA`, como já foi feito com o `'3'` — o colaborador confirma o que recebeu, não abre um recebimento do nada.

Com isso as três etapas de `etapas` (`Crédito Lançado → Confirmação do Colaborador → Recebimento Registrado`) passam a corresponder a estados reais; hoje as duas primeiras acontecem no mesmo instante, no envio do formulário.

### T11 — Painel de VR/VA com dados fixos no código 🟡

[BenefitReceiptManager.tsx:29-35](../src/components/process-managers/BenefitReceiptManager.tsx#L29-L35) — `lotes: 4`, `aguardando: 124`, `confirmado: 856`, `divergente: 12`, `assinatura: 45`, todos literais. Os cinco cartões de KPI mostram esses números independentemente do que existe em `config.solicitacoes`.

Também fixos: competência `JULHO/2026` ([:57](../src/components/process-managers/BenefitReceiptManager.tsx#L57)); `VALOR VR` = `R$ 840,00` e `VALOR VA` = `R$ 450,00` em toda linha da tabela ([:113-114](../src/components/process-managers/BenefitReceiptManager.tsx#L113-L114)) — que nem batem com a seed de benefícios (R$ 800 e R$ 400).

**Recomendação:** derivar os contadores de `receipts` (a variável já existe em [:22](../src/components/process-managers/BenefitReceiptManager.tsx#L22)) e os valores de `row.data`, junto com a correção de T5.

### T7 — Medida Disciplinar tem o mesmo problema de fluxo 🟠

Vale registrar aqui porque é o **outro** processo que é aviso, não solicitação.

Processo 10: `etapas: ['Registro', 'Ciência Colaborador', 'Arquivado']`, `requireSignature: true`, `generateDoc: true`, `allowCancel: false` ([data.ts:1399](../src/data.ts#L1399)). É exatamente a forma de um aviso com ciência: o RH/gestor **registra** a medida, o colaborador **dá ciência** (assina), e o documento é arquivado. Não existe alçada — ninguém "aprova" uma advertência já aplicada; e uma advertência que dependesse de aprovação para valer seria outra coisa.

Ainda assim o processo tem `approvals: [{ name: 'RH', responsibilityType: 'rh-filial' }]` e a simulação confirma que ele percorre a cascata como uma solicitação comum:

```
[  ok  ] cascata = níveis configurados que passaram na condição
         esperado [RH] · obtido [RH]
[  ok  ] cascata percorrida até a conclusão
         1/1 aprovações · status final "Concluída"
```

Repare que a etapa "Ciência Colaborador" **não tem nenhum estado correspondente** — a simulação acusou `etapas cita 0 (—) e a cascata tem 1 (RH)`. A ciência do colaborador, que é o ato central do processo, não existe no sistema.

**Recomendação:** aplicar ao 10 o mesmo padrão do 5, e pela mesma razão — mas com o ator invertido. Declarar `acknowledgement` em `PROCESS_DEFINITIONS['10']` e zerar `approvals`, de modo que o registro nasça em "Aguardando Ciência" e a assinatura do colaborador o leve a "Ciência Registrada". Isso depende de resolver T1 antes: hoje o formulário do 10 é de desligamento.

Nota de projeto: com 5 e 10 no mesmo padrão, vale generalizar `AcknowledgementConfig` ([types.ts:509-514](../src/types.ts#L509-L514)) para distinguir **quem** inicia (RH) de **quem** confirma (colaborador) — hoje `createRequest` assume que quem envia é quem confirma ([AppConfigContext.tsx:416-418](../src/contexts/AppConfigContext.tsx#L416-L418)).

---

## 4. Eixo 3 — Motor de aprovação parametrizado

Script: **`auditoria/simular-aprovacoes.ts`**. Roda com `npx tsx auditoria/simular-aprovacoes.ts`, sem browser.

Para cada um dos 15 processos, em dois cenários (valor monetário R$ 3.000 e R$ 50.000, para exercitar as condições "Se maior que"), o script abre uma solicitação com o formulário real preenchido e percorre a cascata inteira, verificando:

| Verificação | Resultado |
|---|---|
| `conditionField` de cada nível existe no formulário do processo | **1 falha** (processo 1 — T2) |
| Cascata materializada = níveis configurados que passaram na condição, na ordem | 15/15 OK |
| Processos sem alçadas caem no nível implícito de RH | OK (proc. 2, 3, 4, 6, 14) |
| Processos de protocolo nascem concluídos, sem cascata e sem tarefa | OK (proc. 5) |
| Abertura: `status`, `etapaAtual` e responsável do primeiro nível | 15/15 OK |
| Cascata percorrida até `'Concluída'`, todos os níveis `'aprovado'` | 15/15 OK |
| Histórico: 1 entrada de abertura + 1 por nível | 15/15 OK |
| Tarefas: 1 por nível, no responsável configurado | 15/15 OK |

```
RESUMO: 159 verificações · 1 falhas · 4 alertas
  FALHA  · Processo 1  (config) · conditionField inexistente no formulário
  ALERTA · Processo 1  (etapas) · nº de etapas de aprovação ≠ nº de níveis da cascata
  ALERTA · Processo 6  (etapas) · etapas prometem aprovação que não existe
  ALERTA · Processo 8  (etapas) · nº de etapas de aprovação ≠ nº de níveis da cascata
  ALERTA · Processo 10 (etapas) · nº de etapas de aprovação ≠ nº de níveis da cascata
```

**Conclusão do eixo 3: `approvalFlow.ts` está correto.** Ordem, filtro por condição, congelamento da cascata na abertura, avanço de um nível por aprovação, conclusão só após o último nível, histórico e criação de tarefa — nada divergiu da configuração em nenhum dos 15 processos. As cascatas de dois níveis (7 e 11) encadeiam corretamente, com o responsável do segundo nível recebendo a tarefa após a primeira aprovação.

Os quatro alertas de etapas são T4 (a esteira não existe), não defeito do motor.

Sobre o comportamento condicional: o único nível condicional configurado em todo o produto é o `app-2` do processo 1 — e ele está quebrado (T2). **Não existe hoje nenhuma alçada condicional funcionando**, o que significa que o recurso "Se maior que" da Central Adm nunca foi exercitado em produção. Depois de corrigir T2, vale rodar o script novamente: com `conditionField: 'salarioSugerido'`, o cenário de R$ 50.000 deve produzir `[Gestor Direto → Diretoria]` e o de R$ 3.000 apenas `[Gestor Direto]`.

---

## 5. Processo a processo

Legenda: ✅ OK · ⚠️ Inconsistente · 💡 Recomendação

### Processo 1 — Requisição de Vaga
- ✅ Campos coerentes com o domínio. Seções condicionais por `tipoRequisicao` bem construídas ([processDefinitions.ts:7-9](../src/processDefinitions.ts#L7-L9), [:47-63](../src/processDefinitions.ts#L47-L63)) — Aumento de Quadro, Reposição e Transformação pedem cada um o que lhe cabe.
- ✅ Reuso intencional de chave via `id`: `setorRep`/`ccRep`/`cargoRep` gravam em `setor`/`centroCusto`/`cargo` ([:55-57](../src/processDefinitions.ts#L55-L57)). Como as condições são mutuamente exclusivas, não há colisão. O handoff de criação de vaga lê os dois nomes por segurança ([AppConfigContext.tsx:771](../src/contexts/AppConfigContext.tsx#L771), [:778](../src/contexts/AppConfigContext.tsx#L778)).
- ✅ Único processo do produto com esteira real implementada: aprovação final cria a vaga e a tarefa de triagem ([:770-815](../src/contexts/AppConfigContext.tsx#L770-L815)).
- ⚠️ **T2** — alçada da Diretoria nunca dispara ([data.ts:1365](../src/data.ts#L1365)).
- ⚠️ `prioridade` e `dataDesejada` órfãos ([processDefinitions.ts:68](../src/processDefinitions.ts#L68), [:52](../src/processDefinitions.ts#L52)). "Nível de Prioridade" com opção `Urgente` não altera SLA, ordem de fila nem nada.
- ⚠️ `etapas` cita `Aprovação Gestor → Aprovação Diretor` mas a cascata entrega só Gestor (consequência de T2).
- 💡 Corrigir `conditionField` para `salarioSugerido`. Ligar `prioridade` ao SLA do primeiro nível ou removê-la. Propagar `dataDesejada` para o `Job` criado no handoff (a vaga hoje nasce sem previsão de início).

### Processo 2 — Recrutamento e Seleção
- ✅ Sem campo sensível indevido. `vagaId` amarra o candidato à requisição aprovada.
- ✅ Handoff correto: decisão `Aprovado` gera tarefa de Admissão Digital ([AppConfigContext.tsx:817-841](../src/contexts/AppConfigContext.tsx#L817-L841)).
- ⚠️ `approvals: []` faz o processo cair no nível implícito de RH ([approvalFlow.ts:110-121](../src/utils/approvalFlow.ts#L110-L121)) — mas seleção não é alçada, e o `viewType: 'recruitment'` já entrega um Kanban de funil. O nível implícito é um estado fantasma.
- ⚠️ Aparece no modal genérico "Nova Solicitação" (T12), abrindo formulário de candidato fora do Kanban.
- 💡 O funil é o fluxo; a aprovação genérica não deveria existir. Avaliar `acknowledgement` ou um tipo de fluxo "gerencial sem alçada" que dispense o nível implícito. Acrescentar `'2'` a `PROCESSOS_SEM_ABERTURA_GENERICA`.

### Processo 3 — Admissão Digital
- ✅ Formulário enxuto e correto após o commit `4fea884`: a seção "Status da Admissão" saiu porque a documentação vem do Portal do Colaborador ([processDefinitions.ts:137-139](../src/processDefinitions.ts#L137-L139)).
- ✅ `salario`, `dataAdmissao` e `tipoContrato` justificados — são as condições contratuais do disparo, lidas pelo `AdmissaoDigitalDisparo` ([:97](../src/components/admissao-digital/AdmissaoDigitalDisparo.tsx#L97), [:105](../src/components/admissao-digital/AdmissaoDigitalDisparo.tsx#L105), [:113](../src/components/admissao-digital/AdmissaoDigitalDisparo.tsx#L113)). `isSensitive: true` corretamente marcado.
- ✅ Já protegido do modal genérico ([permissions.ts:47](../src/utils/permissions.ts#L47)) — é o precedente a seguir nos processos 2, 4, 5 e 13.
- ✅ Handoff para Onboarding implementado ([AppConfigContext.tsx:843-867](../src/contexts/AppConfigContext.tsx#L843-L867)).
- ⚠️ `approvals: []` → nível implícito de RH, apesar de a revisão do RH já acontecer na tela própria (`AdmissaoDigitalRevisao`). Mesma observação do processo 2.
- ⚠️ `etapas: ['Documentação', 'Exame Médico', 'Contrato', 'Finalizado']` não corresponde aos blocos reais do portal (`criarBlocosAdmissao`), que são bem mais granulares.
- 💡 Alinhar `etapas` aos blocos do portal, ou removê-las conforme a decisão de T4.

### Processo 4 — Onboarding
- ✅ `colaboradorId` com zoom em `employee-admitted` — restringe corretamente a quem já foi admitido.
- ⚠️ **Quatro dos nove campos são órfãos**: `template`, `dataInicial`, `prazo`, `empresaFilial`. A "Trilha de Integração" (`Padrão Administrativo` / `Técnico TI` / `Operacional` / `Liderança`, [processDefinitions.ts:157](../src/processDefinitions.ts#L157)) é escolhida e ignorada — o `OnboardingManager` não a consulta. Escolher a trilha não muda o checklist.
- ⚠️ `approvals: []` → nível implícito. Onboarding não é solicitação aprovável; é checklist (`viewType: 'onboarding'`).
- ⚠️ `handoffs.handoffType: 'desativado'` mas `createTask: true` — combinação contraditória.
- 💡 Ligar `template` à montagem do checklist (é o campo que dá sentido ao formulário) ou removê-lo. Tratar como processo sem alçada, junto de 2 e 3.

### Processo 5 — Recebimento de VR/VA
Ver §3. Resumo: ✅ ausência de aprovação correta e verificada · ⚠️ T5 (valor exposto, benefício único, sem Bilhete Único), T6 (gatilho invertido, sem aviso), T11 (painel fixo).

### Processo 6 — Gestão de Dependentes
- ✅ Modelagem condicional por `operacao` (Inclusão/Alteração/Exclusão) correta: os campos `_fonte` ([processDefinitions.ts:208](../src/processDefinitions.ts#L208), [:210](../src/processDefinitions.ts#L210), [:212](../src/processDefinitions.ts#L212)) mostram o valor atual ao lado do novo, só em Alteração.
- ✅ Nenhum campo financeiro. Documento comprobatório obrigatório onde deve ser.
- ⚠️ `dependenteId` e `beneficioRelacionado` órfãos. "Vincular a Benefício" (Plano de Saúde / Odontológico / Seguro de Vida) não vincula nada.
- ⚠️ **T9** — `updateProfile: true` e `createRecord360: true` sem implementação: o dependente aprovado não entra no cadastro do colaborador.
- ⚠️ `etapas: ['Solicitado', 'Validação RH', 'Concluído']` com `approvals: []` — a "Validação RH" da esteira só existe como o nível implícito.
- 💡 Implementar o handoff de inclusão no cadastro (é o propósito do processo). Configurar explicitamente o nível de RH em `approvals` em vez de depender do implícito.

### Processo 7 — Alteração de Cargos e Salários
- ✅ Cascata de dois níveis (RH → Diretoria) funcionando, verificada nos dois cenários. `isSensitive: true` correto.
- ✅ `salarioAtual` e `percentual` são órfãos **legítimos**: alimentam o cálculo ([processDefinitions.ts:243-249](../src/processDefinitions.ts#L243-L249)) e o julgamento de quem aprova.
- ⚠️ **T3** — promoção aprovada **não altera** cargo nem salário do colaborador. É o processo em que o defeito é mais grave.
- ⚠️ `tipoAlteracao` (Promoção / Mérito / Enquadramento) órfão. É o candidato natural a critério de alçada — mérito e promoção não deveriam ter a mesma governança.
- ⚠️ `etapas` lista `Análise RH → Aprovação Financeira → Aprovação Diretor` (3), a cascata tem `RH → Diretoria` (2). **"Aprovação Financeira" não existe.** (A verificação automática marcou este processo como OK por coincidência de contagem — ver §0.)
- 💡 Prioridade: corrigir T3. Depois, decidir se a alçada Financeira entra de fato (é o nível que faltaria num fluxo de folha) e usar `tipoAlteracao` ou `percentual` como condição de acionamento — este é o caso de uso que justifica o recurso "Se maior que".

### Processo 8 — Prestação de Contas
- ✅ Campos adequados a reembolso; comprovante obrigatório.
- ✅ `valor` é financeiro mas **necessário** — é o objeto do pedido.
- ⚠️ Nome divergente: processo chama-se "Prestação de Contas" ([data.ts:1397](../src/data.ts#L1397)), o formulário chama-se "Reembolso de Despesas" ([processDefinitions.ts:263](../src/processDefinitions.ts#L263)).
- ⚠️ `tipoDespesa` órfão — a categoria (Alimentação, KM, Pedágio…) não gera regra nem limite.
- ⚠️ `etapas` cita `Validação Gestor → Audit RH → Pagamento`; a cascata tem só `Gestor`. **Não existe etapa de pagamento nem de auditoria** — o reembolso é "concluído" sem que nada seja pago.
- ⚠️ `competencia` é `select` com opções fixas `Janeiro/2026`, `Fevereiro/2026`, `Março/2026` ([processDefinitions.ts:265](../src/processDefinitions.ts#L265)) — hoje é julho/2026, então **nenhuma opção válida está disponível**.
- 💡 Gerar `competencia` dinamicamente. Ligar `tipoDespesa` a limites por categoria (é a regra que todo reembolso tem). Reconhecer que "Pagamento" é etapa executiva, não alçada — depende de T4(b).

### Processo 9 — Solicitação de Férias
- ✅ Lógica de saldo bem resolvida: `diasGozados` reflete só o histórico, nunca a solicitação em digitação, e `diasGozo` valida contra o saldo ([processDefinitions.ts:289-309](../src/processDefinitions.ts#L289-L309)). O comentário de [:312-314](../src/processDefinitions.ts#L312-L314) sobre parse local de data evita um bug real de fuso.
- ⚠️ **O formulário inteiro é órfão** — 10 de 11 chaves. Nada além da `justificativa` é lido em qualquer lugar.
- ⚠️ **T9** — `updateProfile: true` sem implementação: as férias aprovadas não entram em `vacationRecords`. Por isso `diasGozadosHist` nunca cresce e o saldo do colaborador é sempre o mesmo, pedido após pedido.
- ⚠️ **T10** — o prefill grava `periodoaquisitivo` (minúsculo) e `saldo` ([FormRenderer.tsx:130-131](../src/components/FormRenderer.tsx#L130-L131)), mas o formulário usa `periodoAquisitivo` (camelCase) e não tem campo `saldo`. As duas chaves não chegam a lugar nenhum, e o "Período Aquisitivo" abre em branco apesar de haver prefill escrito para ele.
- ⚠️ `periodoAquisitivo` é `select` fixo em `2024/2025` e `2023/2024` — não deriva da data de admissão do colaborador.
- ⚠️ `ultimaFerias` é `origin: 'F'` e nada o preenche: renderiza sempre vazio.
- ⚠️ `abonoPecuniario` e `adianta13` órfãos — dois direitos com efeito financeiro real, coletados e ignorados.
- 💡 O de maior efeito é corrigir T10 (uma letra) e implementar a gravação em `vacationRecords`. Sem isso o controle de saldo, que é a parte bem-feita do processo, não fecha o ciclo.

### Processo 10 — Medida Disciplinar
- ⚠️ **T1** — identidade dupla: o formulário é de desligamento. 🔴
- ⚠️ **T7** — deveria ser aviso com ciência, está modelado como aprovação.
- ⚠️ A etapa "Ciência Colaborador", que é o ato central, não tem estado no sistema.
- ⚠️ **T9** — `generateDoc`, `requireSignature`, `createRecord360` declarados, nenhum implementado.
- ⚠️ `avisoPrevio` e `ultimoDia` órfãos (e alheios ao domínio disciplinar).
- 💡 Reescrever `PROCESS_DEFINITIONS['10']` para o domínio disciplinar e adotar `acknowledgement`, na ordem: T1 primeiro, T7 depois.

### Processo 11 — Movimentação de Pessoal
- ✅ Cascata de dois níveis (Gestor Origem → Gestor Destino) modelada corretamente — é o desenho certo para transferência.
- ⚠️ **T3** — movimentação aprovada não altera filial, setor nem centro de custo do colaborador.
- ⚠️ Ambos os níveis resolvem para o **mesmo usuário demo** `GEST-001` ([approvalFlow.ts:31-32](../src/utils/approvalFlow.ts#L31-L32)), então na prática a mesma pessoa aprova as duas pontas. É limitação conhecida do mock (o comentário de [:28-29](../src/utils/approvalFlow.ts#L28-L29) admite), mas invalida a demonstração justamente do processo que melhor mostra a cascata.
- ⚠️ `filialAtual`, `setorAtual` e `tipoMovimentacao` órfãos. `tipoMovimentacao` inclui "Promoção Vertical", que **sobrepõe o processo 7** sem ter os campos salariais dele.
- ⚠️ O handoff morto lê `data.gestorDestino?.name` ([AppConfigContext.tsx:626](../src/contexts/AppConfigContext.tsx#L626)) — campo que **não existe** no formulário do processo 11. Mesmo que T3 fosse corrigido, o gestor não seria atualizado.
- 💡 Corrigir T3 incluindo `gestorDestino` no formulário (ou removendo a linha). Remover "Promoção Vertical" das opções ou encaminhá-la ao processo 7.

### Processo 12 — Gestão de Horas Extra
- ✅ O processo mais enxuto e coerente do conjunto: 6 campos, todos pertinentes, sem campo sensível.
- ✅ `etapas: ['Solicitado', 'Aprovação Gestor', 'Processado']` bate com a cascata (1 nível de gestor).
- ⚠️ `horaInicio` e `horaFim` órfãos e sem validação: são `type: 'text'` com placeholder `00:00`, aceitam qualquer string, e **a quantidade de horas nunca é calculada**. Um pedido de hora extra que não sabe quantas horas são.
- ⚠️ `destino` (Banco de Horas / Pagamento 50% / Pagamento 100%) é lido só na seed. Não gera lançamento.
- 💡 Acrescentar campo calculado de total de horas (mesmo padrão do `dataRetorno` do processo 9) e validar `horaFim > horaInicio`. É o único processo em que o cálculo faltante é o valor do processo inteiro.

### Processo 13 — Gestão de Hierarquia
- ✅ Escopo restrito corretamente: `roles.employee: false`, `roles.manager: false`, só RH e Diretoria. `isSensitive: true`.
- ✅ Alçada única de Diretoria coerente com mudança de estrutura.
- ⚠️ `novoGestorId` órfão — **o campo principal do processo**. A aprovação não repontua a hierarquia; o `HierarchyManager` não consome a solicitação aprovada.
- ⚠️ `gestorAtual` órfão (`origin: 'F'`, nada o preenche).
- ⚠️ Aparece no modal genérico (T12) apesar de ter `viewType: 'hierarchy'` próprio.
- 💡 Implementar a repontuação do gestor no `if (isFinal)` — junto de T3, é o mesmo tipo de handoff faltante.

### Processo 14 — Treinamento
- ✅ Campos coerentes com inscrição em capacitação.
- ⚠️ **Sete de nove campos órfãos**, incluindo `curso` e `instituicao` — nem o nome do treinamento é lido em lugar nenhum. `createRecord360: true` sem implementação (T9): o treinamento concluído não entra no Perfil 360.
- ⚠️ `custo` ("Investimento Estimado") é campo financeiro **e** `approvals: []` — ou seja, um pedido de investimento sem alçada, caindo no nível implícito de RH. É o segundo caso claro que pediria alçada condicional por valor (o primeiro é o processo 7).
- ⚠️ `etapas: ['Inscrição', 'Realização', 'Certificação']` são etapas executivas pós-aprovação — nenhuma existe como estado (T4).
- 💡 Configurar alçada por valor de `custo` (a Central Adm já suporta; falta só usar, depois de T2 provar que o recurso funciona). Implementar o registro no Perfil 360, que é o destino natural de uma certificação.

### Processo 15 — Solicitação de Desligamento
- ✅ **O formulário mais bem modelado do produto.** Os cinco tipos de desligamento ajustam campos, aviso prévio e anexos obrigatórios de forma correta ([processDefinitions.ts:12-19](../src/processDefinitions.ts#L12-L19), [:454-500](../src/processDefinitions.ts#L454-L500)): Justa Causa exige motivo detalhado e documentos comprobatórios; Pedido de Demissão exige carta; Acordo mostra a nota do art. 484-A; Fim de Contrato não pede aviso prévio.
- ✅ Reuso de chave por `id` bem aplicado: quatro variantes de `motivo` e duas de `avisoPrevio`/`reposicao`/`verbas`, com condições mutuamente exclusivas. **Não é duplicação defeituosa** — é o padrão de campo variante por tipo, e é o melhor exemplo dele no código.
- ✅ Handoff de reposição implementado e correto, incluindo compatibilidade com o formato antigo ([AppConfigContext.tsx:871-895](../src/contexts/AppConfigContext.tsx#L871-L895)).
- ⚠️ **T3** — desligamento aprovado pela Diretoria **não inativa o colaborador**. Ele segue Ativo na base, aparecendo em zooms e relatórios.
- ⚠️ 12 chaves órfãs, entre elas `ultimoDiaTrabalhado`, `dataPrevistaDesligamento`, `asoAnexo`, `cartaDemissao` e `documentosComprobatorios`. Documentos legalmente obrigatórios são coletados e nunca lidos — nem para bloquear a conclusão. O rótulo diz "ASO — Exame Demissional (obrigatório na conclusão)" ([processDefinitions.ts:495](../src/processDefinitions.ts#L495)) mas o campo é `required: false` e **nada valida isso na conclusão**.
- ⚠️ `etapas` cita "Entrevista Desligamento" e "Rescisão" — nenhuma existe como estado (T4).
- ⚠️ Sobreposição com o processo 10 (T1).
- 💡 Corrigir T3 (inativação) e implementar a trava de conclusão do ASO que o próprio rótulo promete. São as duas coisas com consequência jurídica.

---

## 6. Como reproduzir

Ambos os scripts rodam sem browser, a partir da raiz do projeto:

```bash
npx tsx auditoria/simular-aprovacoes.ts          # eixo 3 — cascata de aprovação
npx tsx auditoria/simular-aprovacoes.ts --json   # mesma coisa, saída JSON

npx tsx auditoria/mapear-campos.ts               # eixo 1 — campos × uso no código
npx tsx auditoria/mapear-campos.ts --orfaos      # só os órfãos
```

`simular-aprovacoes.ts` sai com código 1 se houver qualquer falha — serve como teste de regressão em CI.

**Sobre o que é real e o que é espelho em `simular-aprovacoes.ts`:** o motor de decisão é importado de verdade (`buildApprovalChain`, `isStepApplicable`, `resolveConditionField`, `getCurrentLevelIndex`, `ensureApprovalChain`, `levelLabel`, `slaToMs`), assim como a configuração dos 15 processos e as definições de formulário. As funções `abrirSolicitacao` e `aprovarUmNivel` **espelham** `createRequest` e `approveRequest`, que hoje vivem dentro do provider React e não são importáveis fora do browser; cada transição cita a linha de origem em comentário. Se `AppConfigContext.tsx` mudar, o espelho precisa acompanhar — o que é, em si, um argumento para extrair essas transições para um módulo puro e testável.

---

## 7. Ordem sugerida de ataque

Nenhuma correção foi aplicada. Se for para agir, esta é a ordem que rende mais por esforço:

1. **T2** — uma palavra em [data.ts:1365](../src/data.ts#L1365). Restaura a única alçada condicional do produto e destrava o recurso "Se maior que" para os processos 7 e 14.
2. **T3** — mover um bloco de código. Faz promoção, transferência e desligamento surtirem efeito no cadastro. É o achado com maior distância entre o que o sistema diz que faz e o que faz.
3. **T1** — decidir a identidade do processo 10 antes de qualquer outra coisa nele.
4. **T5 + T6** — VR/VA: tirar o valor da tela do colaborador, tratar benefício como lista com Bilhete Único, e inverter o gatilho para o lançamento do RH.
5. **T4** — decidir entre remover `etapas`/`trail` ou implementar a esteira. Os alertas de etapas dos processos 1, 6, 7, 8, 10, 14 e 15 dependem dessa decisão e não devem ser mexidos um a um antes dela.
6. **T8/T9/T10** — limpeza de campos órfãos e handoffs prometidos, processo a processo, usando `mapear-campos.ts` como lista de trabalho.
