import { Company, Employee, RHRequest, Task } from '../types';
import { tarefaDaEmpresa } from './empresa';

/**
 * O que a Central de Tarefas precisa saber além das próprias tarefas: a empresa
 * ativa e o que permite descobrir a empresa de cada tarefa (ela não guarda uma —
 * herda a da solicitação que a originou).
 */
export interface RecorteDeTarefas {
  empresaAtual?: Company;
  solicitacoes: RHRequest[];
  colaboradores: Employee[];
}

/** O recorte a partir do estado da aplicação, para nenhuma tela montá-lo pela metade. */
export const recorteDeTarefasDoConfig = (config: {
  empresaAtual?: Company;
  solicitacoes: RHRequest[];
  colaboradores: Employee[];
}): RecorteDeTarefas => ({
  empresaAtual: config.empresaAtual,
  solicitacoes: config.solicitacoes,
  colaboradores: config.colaboradores
});

/**
 * A fila que a Central de Tarefas lista — e, por consequência, o que o atalho
 * "Central de Tarefas" da Intranet conta. Fonte única para os dois, senão o
 * atalho anuncia um número e a tela abre com outro.
 *
 * Concluída fica de fora: a Central é o consolidado de ações PENDENTES, e a
 * tarefa é marcada como concluída quando a solicitação dela é aprovada,
 * devolvida ou cancelada (AppConfigContext). Mantê-la na lista deixava uma
 * linha com barra de SLA e botão "Tratar" para algo que já acabou.
 *
 * O recorte por EMPRESA entra aqui, e não em cada tela, pelo mesmo motivo que a
 * exclusão das concluídas: são dois consumidores da mesma fila, e um recorte
 * aplicado só num deles reabre a divergência que esta função existe para fechar.
 */
export const listarTarefasDaCentral = (tarefas: Task[], recorte: RecorteDeTarefas): Task[] =>
  tarefas.filter(t =>
    t.status !== 'Concluída' &&
    tarefaDaEmpresa(t, recorte.empresaAtual, recorte.solicitacoes, recorte.colaboradores)
  );
