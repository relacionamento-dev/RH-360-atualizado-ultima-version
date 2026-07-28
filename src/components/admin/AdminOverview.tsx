import React from 'react';
import { Activity, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { SectionHeader } from './AdminUI';

export default function AdminOverview({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { config } = useAppConfig();

  const stats = [
    { label: 'Pessoas com acesso', value: config.usuariosDemo.length },
    { label: 'Processos ativos', value: config.processos.filter(p => p.ativo).length },
    { label: 'Integrações conectadas', value: config.integracoes.filter(i => i.status === 'Conectado').length },
    { label: 'Conteúdos na intranet', value: config.intranet.length },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Visão geral"
        description="Como está a configuração da plataforma hoje."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[12px] border border-gray-100">
            <p className="label-caps">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Últimas alterações" description="O que foi mudado recentemente na plataforma." />
          <Card padding="none">
            <div className="divide-y divide-gray-100">
              {config.auditTrail.length > 0 ? (
                config.auditTrail.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Activity size={15} className="text-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{log.action}</p>
                      <p className="text-[12px] text-gray-400 font-medium truncate">
                        {log.userName} · {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="gray" size="sm">{log.module}</Badge>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-gray-400 font-medium">Nenhuma alteração registrada ainda.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               { tab: 'processes', title: 'Ajustar processos', desc: 'Defina quem aprova cada solicitação e em quanto tempo.' },
               { tab: 'ai', title: 'Configurar a IA', desc: 'Escolha onde a inteligência artificial ajuda o RH.' },
             ].map(action => (
               <button
                 key={action.tab}
                 onClick={() => onNavigate(action.tab)}
                 className="bg-white p-5 rounded-[12px] border border-gray-100 hover:border-gray-200 text-left transition-colors"
               >
                  <p className="text-[14px] font-bold text-gray-900">{action.title}</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-1 leading-relaxed">{action.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-orange-600">
                    Abrir <ChevronRight size={13} />
                  </span>
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Situação do sistema" />
          <Card className="space-y-3">
             {[
               { label: 'Servidor', status: 'No ar', color: 'bg-emerald-500' },
               { label: 'Integração com o ERP', status: 'Sincronizando', color: 'bg-amber-500' },
               { label: 'Banco de dados', status: 'Estável', color: 'bg-emerald-500' },
               { label: 'Backup diário', status: 'Concluído', color: 'bg-emerald-500' },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between gap-3">
                 <span className="text-[13px] font-medium text-gray-600">{item.label}</span>
                 <div className="flex items-center gap-2 shrink-0">
                   <span className="text-[12px] font-bold text-gray-500">{item.status}</span>
                   <div className={`w-2 h-2 rounded-full ${item.color}`} />
                 </div>
               </div>
             ))}
          </Card>

          <SectionHeader title="Precisa de atenção" />
          <div className="space-y-2">
            <div className="rounded-[12px] border border-red-100 bg-red-50/50 px-4 py-3 flex items-start gap-3">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-900 font-medium leading-relaxed">
                3 integrações falharam nas últimas 24 horas.
              </p>
            </div>
            <div className="rounded-[12px] border border-amber-100 bg-amber-50/50 px-4 py-3 flex items-start gap-3">
              <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-900 font-medium leading-relaxed">
                2 processos têm alterações em rascunho aguardando publicação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
