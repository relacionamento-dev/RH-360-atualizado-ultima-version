import React from 'react';
import { 
  Users, Target, Share2, Globe, 
  Activity, AlertCircle, ChevronRight,
  TrendingUp, Clock, ShieldCheck
} from 'lucide-react';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { useAppConfig } from '../../contexts/AppConfigContext';

export default function AdminOverview({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { config } = useAppConfig();

  const stats = [
    { label: 'Usuários Ativos', value: config.usuariosDemo.length, icon: <Users size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Processos Ativos', value: config.processos.filter(p => p.ativo).length, icon: <Target size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Integrações OK', value: config.integracoes.filter(i => i.status === 'Conectado').length, icon: <Share2 size={20} />, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Conteúdos Intranet', value: config.intranet.length, icon: <Globe size={20} />, color: 'text-sky-500', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Atividade Recente" icon={<Activity size={18} className="text-orange-500" />}>
            <div className="space-y-4">
              {config.auditTrail.length > 0 ? (
                config.auditTrail.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                       <Activity size={14} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">{log.action}</p>
                      <p className="text-[11px] text-gray-500">{log.userName} • {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant="gray" size="sm">{log.module}</Badge>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-400 font-medium italic">Nenhuma atividade registrada hoje.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button 
              onClick={() => onNavigate('processes')}
              className="bg-gray-900 text-white p-8 rounded-[32px] text-left relative overflow-hidden group shadow-xl"
             >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <Target size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <Badge className="bg-orange-500 border-none">Sprint 2</Badge>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Otimize Processos</h3>
                    <p className="text-gray-400 text-sm mt-2 font-medium">Configure novas alçadas de aprovação e SLAs críticos.</p>
                  </div>
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest">
                    <span>Configurar Agora</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
             </button>

             <button 
              onClick={() => onNavigate('ai')}
              className="bg-indigo-600 text-white p-8 rounded-[32px] text-left relative overflow-hidden group shadow-xl"
             >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <Activity size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <Badge className="bg-white/20 border-none">Beta</Badge>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">IA Generativa</h3>
                    <p className="text-indigo-100 text-sm mt-2 font-medium">Ative o assistente de triagem em processos de recrutamento.</p>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-200 font-bold text-xs uppercase tracking-widest">
                    <span>Acessar Painel IA</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
             </button>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Status do Sistema" icon={<ShieldCheck size={18} className="text-green-500" />}>
             <div className="space-y-6">
                {[
                  { label: 'Servidor Central', status: 'Online', color: 'bg-green-500' },
                  { label: 'Integração ERP', status: 'Processando', color: 'bg-amber-500' },
                  { label: 'Database RH360', status: 'Estável', color: 'bg-green-500' },
                  { label: 'Backup Diário', status: 'Concluído', color: 'bg-green-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.status}</span>
                      <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                    </div>
                  </div>
                ))}
             </div>
          </Card>

          <Card title="Avisos Críticos" icon={<AlertCircle size={18} className="text-red-500" />}>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-[12px] text-red-900 font-bold leading-relaxed">
                  3 integrações falharam nas últimas 24 horas. Verifique os logs de integração.
                </p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <Clock size={18} className="text-amber-500 shrink-0" />
                <p className="text-[12px] text-amber-900 font-bold leading-relaxed">
                  Versão 2.1.0 disponível para publicação em 2 processos em rascunho.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
