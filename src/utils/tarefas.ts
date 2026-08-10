import { Task } from '../types';

/**
 * A fila que a Central de Tarefas lista — e, por consequência, o que o atalho
 * "Central de Tarefas" da Intranet conta. Fonte única para os dois, senão o
 * atalho anuncia um número e a tela abre com outro.
 *
 * Concluída fica de fora: a Central é o consolidado de ações PENDENTES, e a
 * tarefa é marcada como concluída quando a solicitação dela é aprovada,
 * devolvida ou cancelada (AppConfigContext). Mantê-la na lista deixava uma
 * linha com barra de SLA e botão "Tratar" para algo que já acabou.
 */
export const listarTarefasDaCentral = (tarefas: Task[]): Task[] =>
  tarefas.filter(t => t.status !== 'Concluída');
