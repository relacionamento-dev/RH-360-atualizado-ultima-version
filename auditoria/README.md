# auditoria/

Diagnóstico dos 15 processos do RH360. **Nada aqui altera código de produção** — a pasta contém o relatório e as duas ferramentas usadas para produzi-lo.

| Arquivo | O que é |
|---|---|
| [AUDITORIA-PROCESSOS.md](AUDITORIA-PROCESSOS.md) | O relatório. Sumário executivo, achados transversais, VR/VA em profundidade e uma seção por processo (OK / inconsistente com arquivo:linha / recomendação). |
| [AUDITORIA-UX.md](AUDITORIA-UX.md) | Auditoria de UX/QA de toda a aplicação em Chrome headless: botão morto, fluxo incoerente e feedback visual, com prioridade CORE/COSMÉTICO. 51 achados. |
| [simular-aprovacoes.ts](simular-aprovacoes.ts) | Simula a abertura de uma solicitação em cada processo e percorre a cascata de alçadas, conferindo condição, status final, histórico e tarefas. 159 verificações. |
| [mapear-campos.ts](mapear-campos.ts) | Cruza cada campo de `processDefinitions.ts` com o uso real no `src/`, apontando campos órfãos e chaves declaradas mais de uma vez. |

## Rodar

A partir da raiz do projeto:

```bash
npx tsx auditoria/simular-aprovacoes.ts          # cascata de aprovação
npx tsx auditoria/simular-aprovacoes.ts --json   # saída JSON

npx tsx auditoria/mapear-campos.ts               # mapa completo de campos
npx tsx auditoria/mapear-campos.ts --orfaos      # só os órfãos
```

`simular-aprovacoes.ts` sai com código 1 se houver falha — dá para plugar em CI como teste de regressão do motor de aprovação.

## Estado na data da auditoria (29/07/2026, commit `4fea884`)

```
simular-aprovacoes: 159 verificações · 1 falha · 4 alertas
mapear-campos:      164 chaves · 53 órfãs · 10 com declaração múltipla
```

A falha é o `conditionField: 'salario'` do processo 1, que aponta para um campo inexistente (o certo é `salarioSugerido`) e impede a alçada da Diretoria de disparar. Detalhes em **T2** do relatório.
