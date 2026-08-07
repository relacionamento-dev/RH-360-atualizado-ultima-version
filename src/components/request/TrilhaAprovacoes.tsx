import { RequestApprovalLevel } from '../../types';
import { formatRequestDate } from '../../utils/requestFields';

// TRILHA DE APROVAÇÕES
//
// Um item por nível da cascata materializada na solicitação, na ordem em que
// precisam aprovar. Nasceu dentro do RequestDetail e saiu para cá quando a etapa
// de Benefícios e Encerramento passou a mostrar a mesma trilha no resumo — é a
// mesma informação, então é o mesmo componente.

export function TrilhaAprovacoes({
  chain,
  currentLevelIndex,
  encerrada = false
}: {
  chain: RequestApprovalLevel[];
  currentLevelIndex: number;
  /** Fluxo sem alçada pendente (concluído/reprovado): ninguém fica "aguardando". */
  encerrada?: boolean;
}) {
  return (
    <>
      {chain.map((level, idx) => {
        const isCurrent = idx === currentLevelIndex && !encerrada;
        const dotColor = level.status === 'aprovado' ? 'bg-green-500'
          : level.status === 'reprovado' ? 'bg-red-500'
          : isCurrent ? 'bg-blue-500' : 'bg-gray-200';
        return (
          <div key={`${level.id}-${idx}`} className="relative flex items-start gap-4">
            <div className={`absolute left-0 mt-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ring-4 ring-white z-10 ${dotColor}`}></div>
            <div className="pl-8">
              <p className="text-[13px] font-black text-gray-900">
                Nível {idx + 1} de {chain.length} — {level.name}
              </p>
              <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">
                {level.responsibleLabel}
                {level.decidedAt ? ` • ${formatRequestDate(level.decidedAt)} • ${level.decidedBy}` : ` • SLA ${level.sla}${level.slaUnit}`}
              </p>
              {level.conditionLabel && (
                <p className="text-[10px] text-amber-600 mt-1 font-bold">Acionado por condição: {level.conditionLabel}</p>
              )}
              <p className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${
                level.status === 'aprovado' ? 'text-green-600'
                : level.status === 'reprovado' ? 'text-red-500'
                : isCurrent ? 'text-blue-500' : 'text-gray-300'
              }`}>
                {level.status === 'aprovado' ? 'Aprovado'
                  : level.status === 'reprovado' ? 'Reprovado'
                  : isCurrent ? 'Aguardando aprovação' : 'Não iniciado'}
              </p>
              {level.comment && (
                <p className="text-[10px] text-gray-400 mt-1 italic leading-relaxed">"{level.comment}"</p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Linha vertical que costura os itens da trilha. */
export function TrilhaContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative space-y-10 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
      {children}
    </div>
  );
}
