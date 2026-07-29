import { useState } from 'react';
import { MonitorSmartphone, ChevronRight, Clock } from 'lucide-react';
import { PageHeader } from '../ui/FormAndHeader';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Avatar, EmptyState } from '../ui/Misc';
import { AdminSearch, InfoNote } from '../admin/AdminUI';
import { useAppConfig } from '../../contexts/AppConfigContext';
import PortalColaborador from './PortalColaborador';
import {
  aguardandoColaborador,
  ESTADO_ADMISSAO_BADGE,
  ESTADO_ADMISSAO_LABEL,
  prazoFinal,
  progressoAdmissao
} from '../../utils/admissaoDigital';

/**
 * Menu "Portal do Colaborador": lista quem tem link de admissão em aberto
 * (aguardando preenchimento ou em correção) e abre o portal daquela pessoa.
 */
export default function PortalColaboradorModule() {
  const { config } = useAppConfig();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const selecionado = selectedId ? config.colaboradores.find(e => e.id === selectedId) : null;

  if (selecionado?.admissaoDigital) {
    return <PortalColaborador employee={selecionado} onBack={() => setSelectedId(null)} />;
  }

  const pendentes = config.colaboradores
    .filter(aguardandoColaborador)
    .filter(e => e.name.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Portal do Colaborador"
        subtitle="Links de admissão digital em aberto — abra para ver o que a pessoa enxerga no celular"
      />

      <InfoNote>
        Esta é a visão que o colaborador acessa pelo link — exibida aqui apenas para demonstração.
      </InfoNote>

      <Card padding="none">
        <div className="p-5 border-b border-[var(--color-brand-border)] bg-gray-50/30">
          <AdminSearch value={busca} onChange={setBusca} placeholder="Buscar pessoa..." />
        </div>

        {pendentes.length === 0 ? (
          <EmptyState
            icon={<MonitorSmartphone size={40} />}
            title="Nenhum link em aberto"
            description="Quando o RH disparar um link de admissão digital, a pessoa aparece aqui até concluir o envio."
            className="border-none bg-white rounded-none"
          />
        ) : (
          <ul className="divide-y divide-[var(--color-brand-border)]">
            {pendentes.map(emp => {
              const admissao = emp.admissaoDigital!;
              return (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(emp.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/70 transition-colors"
                  >
                    <Avatar name={emp.name} src={emp.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{emp.name}</p>
                      <p className="text-[12px] text-gray-500 font-medium truncate">{emp.email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium text-gray-400 shrink-0">
                      <Clock size={13} />
                      Até {prazoFinal(admissao).toLocaleDateString('pt-BR')}
                    </div>
                    <span className="hidden md:block text-[12px] font-bold text-gray-500 tabular-nums shrink-0">
                      {progressoAdmissao(admissao)}%
                    </span>
                    <Badge variant={ESTADO_ADMISSAO_BADGE[admissao.estado]}>
                      {ESTADO_ADMISSAO_LABEL[admissao.estado]}
                    </Badge>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
