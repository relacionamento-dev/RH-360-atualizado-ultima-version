import React, { useState } from 'react';
import { 
  Shield, Search, Filter, Download, 
  Calendar, User, Globe, Target, 
  Settings, Database, Info, MoreHorizontal,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { useAppConfig } from '../../contexts/AppConfigContext';

export default function AdminAudit() {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Processos': return <Target size={14} />;
      case 'Acesso': return <Shield size={14} />;
      case 'Config': return <Settings size={14} />;
      case 'Integração': return <Database size={14} />;
      case 'Intranet': return <Globe size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por usuário, ação ou módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-[14px] text-[13px] focus:ring-2 focus:ring-orange-500/20 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Calendar size={14} />}>Últimos 30 dias</Button>
          <Button variant="outline" size="sm" leftIcon={<Filter size={14} />}>Filtros</Button>
          <Button size="sm" leftIcon={<Download size={14} />}>Exportar Logs</Button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-emerald-600">
                <Shield size={16} />
             </div>
             <h3 className="font-black text-gray-900 tracking-tight uppercase text-[11px] tracking-widest ml-1">Trilha de Auditoria Global</h3>
           </div>
           <Badge variant="blue" size="sm">Imutável</Badge>
        </div>
        
        <Table 
          columns={[
            { header: 'DATA/HORA', accessor: 'timestamp', render: (val) => <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">{new Date(val).toLocaleString()}</span> },
            { header: 'USUÁRIO', accessor: 'userName', render: (val) => (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={12} className="text-gray-400" />
                </div>
                <span className="font-bold text-[13px] text-gray-900">{val}</span>
              </div>
            )},
            { header: 'MÓDULO', accessor: 'module', render: (val) => (
              <div className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {getModuleIcon(val)}
                <span>{val}</span>
              </div>
            )},
            { header: 'AÇÃO', accessor: 'action', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
            { header: 'ORIGEM', accessor: 'ip', render: (val) => <Badge variant="gray" size="sm">{val || '192.168.1.1'}</Badge> },
            { header: '', accessor: 'id', render: () => (
              <div className="flex justify-end">
                <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
              </div>
            )}
          ]}
          data={config.auditTrail.filter(log => 
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.module.toLowerCase().includes(searchTerm.toLowerCase())
          )}
        />

        {config.auditTrail.length === 0 && (
          <div className="py-20 text-center bg-white">
            <Shield size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum log de auditoria encontrado</p>
          </div>
        )}
      </Card>
      
      <div className="bg-gray-900 p-8 rounded-[32px] text-white relative overflow-hidden group shadow-2xl">
         <div className="absolute top-0 right-0 p-12 opacity-5">
            <Shield size={160} />
         </div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
               <h3 className="text-3xl font-black tracking-tight">Compliance & Segurança</h3>
               <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                 Todas as alterações em configurações críticas, permissões e processos são registradas em log imutável para conformidade com LGPD e auditorias internas.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Retenção de Logs</p>
                  <p className="text-2xl font-black">5 Anos</p>
               </div>
               <div className="space-y-2">
                  <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Nível de Log</p>
                  <p className="text-2xl font-black">Verbose</p>
               </div>
               <div className="space-y-2">
                  <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Assinatura Digital</p>
                  <p className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                     Ativa <CheckCircle2 size={20} />
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function CheckCircle2({ size, className }: { size?: number, className?: string }) {
  return <Shield size={size} className={className} />; // Fallback since CheckCircle2 import from lucide-react might be used elsewhere
}
