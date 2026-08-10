import { useMemo } from 'react';
import { Users, FileText, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

import { useAppConfig } from '../contexts/AppConfigContext';
import { resumoDaOperacao, formatarPercentual } from '../utils/visaoGeral';
import { MiniBarrasMensais } from './ui/MiniBarrasMensais';

/**
 * Painel decorativo da tela de login. Os números saem do mesmo `resumoDaOperacao`
 * que o Login usa — nenhum valor aqui pode discordar do que o Dashboard RH e
 * Relatórios mostram depois do acesso.
 */
export default function DashboardPreview() {
  const { config } = useAppConfig();
  const resumo = useMemo(
    () => resumoDaOperacao(config.colaboradores, config.solicitacoes, config.processos),
    [config.colaboradores, config.solicitacoes, config.processos]
  );

  return (
    <div className="w-full max-w-[800px] bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 p-6 pointer-events-none select-none">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Visão geral da operação</h3>
        {/* Os números são a base inteira, não um recorte do mês. */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600">
          Base completa
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5 text-orange-500" />}
          iconBg="bg-orange-50"
          title="Headcount Ativo"
          value={String(resumo.headcount)}
          subValue={`+${resumo.admitidosNoMes} no mês`}
          subLabel={`${resumo.totalColaboradores} cadastrados`}
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-50"
          title="Solicitações"
          value={String(resumo.emAndamento)}
          subValue={`${resumo.processosEmAndamento} processos`}
          subLabel="Em andamento"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          iconBg="bg-red-50"
          title="SLA Estourado"
          value={String(resumo.slaEstourado)}
          subValue="Solicitações"
          subLabel="SLA crítico"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          iconBg="bg-purple-50"
          title="Turnover"
          value={`${formatarPercentual(resumo.turnover)}%`}
          subValue={`${resumo.desligados} de ${resumo.totalColaboradores}`}
          subLabel="Vínculos encerrados"
        />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-800">Solicitações por mês</div>
            <span className="text-[10px] font-bold text-gray-400 tabular-nums">
              Pico: {resumo.pico.total} em {resumo.pico.labelCompleto}
            </span>
          </div>
          <MiniBarrasMensais meses={resumo.porMes} pico={resumo.pico.total} alturaTrilha="h-24" />
        </div>

        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-semibold text-gray-800">Pendências por processo</div>
            <div className="text-gray-400 text-[10px] font-bold tabular-nums">{resumo.emAndamento} em aberto</div>
          </div>
          <div className="space-y-4">
            {resumo.pendenciasPorProcesso.slice(0, 3).map(p => (
              <ActivityItem
                key={p.nome}
                icon={<Calendar className="w-3.5 h-3.5 text-orange-500" />}
                title={p.nome}
                date={`${p.total} em aberto`}
                active={p.criticos > 0}
              />
            ))}
            {resumo.pendenciasPorProcesso.length === 0 && (
              <p className="text-xs font-medium text-gray-400">Nenhuma solicitação em aberto.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, title, value, subValue, subLabel }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col justify-between">
      <div className="flex items-start gap-2 mb-2">
        <div className={`p-1.5 rounded-full ${iconBg}`}>
          {icon}
        </div>
        <div className="leading-tight pt-0.5">
          <div className="text-[10px] font-medium text-gray-500 mb-0.5 max-w-[80px] leading-[1.1]">{title}</div>
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900 mb-1 leading-none">{value}</div>
        <div className="text-[10px] font-semibold text-gray-800">{subValue}</div>
        <div className="text-[9px] text-gray-400">{subLabel}</div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, date, active }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-800 truncate">{title}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">{date}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-red-500' : 'bg-amber-400'}`}></div>
      </div>
    </div>
  );
}
