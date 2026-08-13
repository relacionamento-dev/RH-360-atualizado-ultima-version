# auditoria/

Diagnóstico dos 15 processos do RH360. **Nada aqui altera código de produção** — a pasta contém o relatório e as duas ferramentas usadas para produzi-lo.

| Arquivo | O que é |
|---|---|
| [AUDITORIA-PROCESSOS.md](AUDITORIA-PROCESSOS.md) | O relatório. Sumário executivo, achados transversais, VR/VA em profundidade e uma seção por processo (OK / inconsistente com arquivo:linha / recomendação). |
| [AUDITORIA-UX.md](AUDITORIA-UX.md) | Auditoria de UX/QA de toda a aplicação em Chrome headless: botão morto, fluxo incoerente e feedback visual, com prioridade CORE/COSMÉTICO. 51 achados. |
| [simular-aprovacoes.ts](simular-aprovacoes.ts) | Simula a abertura de uma solicitação em cada processo e percorre a cascata de alçadas, conferindo condição, status final, histórico e tarefas. |
| [simular-permissoes.ts](simular-permissoes.ts) | Confere a matriz de permissão por processo dos perfis e grupos de fábrica: o que cada papel abre, o que decide e se alguma solicitação para numa fila cujo dono não pode aprovar. |
| [mapear-campos.ts](mapear-campos.ts) | Cruza cada campo de `processDefinitions.ts` com o uso real no `src/`, apontando campos órfãos e chaves declaradas mais de uma vez. |

## Rodar

A partir da raiz do projeto:

```bash
npx tsx auditoria/simular-aprovacoes.ts          # cascata de aprovação
npx tsx auditoria/simular-aprovacoes.ts --json   # saída JSON

npx tsx auditoria/simular-permissoes.ts          # matriz de permissão por papel
npx tsx auditoria/simular-permissoes.ts --json   # saída JSON

npx tsx auditoria/mapear-campos.ts               # mapa completo de campos
npx tsx auditoria/mapear-campos.ts --orfaos      # só os órfãos
```

`simular-aprovacoes.ts` e `simular-permissoes.ts` saem com código 1 se houver falha — dá para plugar em CI como teste de regressão do motor de aprovação e do RBAC.

### O que `simular-permissoes.ts` verifica

As três perguntas que o laço genérico `for (let i = 1; i <= 15; i++)` errava, mais o que sustenta as respostas:

1. **Conjuntos derivados** — autosserviço é processo de `roles.employee`; o conjunto que o Gestor aprova é exatamente o dos processos com alçada `gestor-direto`/`gestor-setor`; nenhum processo fica sem quem o abra.
2. **Critério (a)** — a vitrine de "Nova Solicitação" do Colaborador lista só os cinco processos de autosserviço.
3. **Critério (b)** — a solicitação do subordinado cai na fila do Gestor **e** o detalhe mostra Aprovar, Reprovar e Devolver.
4. **Critério (c)** — percorre processo × alvo × solicitante × valor e falha se algum nível resolver para uma pessoa cujo perfil nega `aprovar` naquele processo.
5. **Grupos** — grupo soma por cima do perfil, então nenhum grupo de fábrica pode conceder além do perfil correspondente.
6. **Central Adm** — todo perfil declara as 15 linhas e as 7 colunas que a tela de Perfis de Acesso renderiza, para nenhuma permissão aparecer desmarcada valendo.

## Estado na data da auditoria (29/07/2026, commit `4fea884`)

```
simular-aprovacoes: 159 verificações · 1 falha · 4 alertas
mapear-campos:      164 chaves · 53 órfãs · 10 com declaração múltipla
```

A falha era o `conditionField: 'salario'` do processo 1, que apontava para um campo inexistente (o certo é `salarioSugerido`) e impedia a alçada da Diretoria de disparar. Detalhes em **T2** do relatório.

## Estado atual (13/08/2026)

```
simular-aprovacoes: 180 verificações · 0 falhas · 4 alertas
simular-permissoes:  79 verificações · 0 falhas · 0 alertas
mapear-campos:      163 chaves · 47 órfãs · 10 com declaração múltipla
```

Os 4 alertas de `simular-aprovacoes` são divergência entre as `etapas` declaradas no processo e o nº de níveis da cascata (processos 1, 6, 8 e 10) — rótulo de tela, não roteamento.
