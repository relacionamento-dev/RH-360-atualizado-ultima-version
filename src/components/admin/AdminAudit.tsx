import React, { useState } from 'react';
import {
  Shield, Filter, Download,
  Calendar, User, Globe, Target,
  Settings, Database, Info, MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { SectionHeader, AdminSearch } from './AdminUI';

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
      <SectionHeader
        title="Registro de atividades"
        description="Tudo o que foi alterado na plataforma, por quem e quando. O registro não pode ser editado."
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Calendar size={14} />}>Últimos 30 dias</Button>
            <Button variant="outline" size="sm" leftIcon={<Filter size={14} />}>Filtros</Button>
            <Button size="sm" leftIcon={<Download size={14} />}>Exportar</Button>
          </>
        }
      />

      <AdminSearch
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por pessoa, ação ou área..."
      />

      <Card padding="none">
        <Table
          columns={[
            { header: 'Quando', accessor: 'timestamp', render: (val) => <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">{new Date(val).toLocaleString('pt-BR')}</span> },
            { header: 'Quem fez', accessor: 'userName', render: (val) => (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={12} className="text-gray-400" />
                </div>
                <span className="font-bold text-[13px] text-gray-900">{val}</span>
              </div>
            )},
            { header: 'Área', accessor: 'module', render: (val) => (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
                {getModuleIcon(val)}
                <span>{val}</span>
              </div>
            )},
            { header: 'O que aconteceu', accessor: 'action', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
            { header: 'Origem', accessor: 'ip', render: (val) => <span className="text-[12px] font-medium text-gray-400 tabular-nums">{val || '192.168.1.1'}</span> },
            { header: '', accessor: 'id', render: () => (
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" aria-label="Mais opções"><MoreHorizontal size={16} /></Button>
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
          <div className="py-16 text-center bg-white">
            <p className="text-[13px] font-bold text-gray-500">Nenhuma atividade registrada ainda</p>
            <p className="text-[12px] text-gray-400 font-medium mt-1">
              As alterações feitas na plataforma aparecem aqui automaticamente.
            </p>
          </div>
        )}
      </Card>

      {/* Fatos de conformidade em uma faixa discreta — antes era um bloco preto
          de 32px de raio que dominava a tela sem acrescentar função. */}
      <div className="rounded-[12px] border border-gray-100 px-5 py-4 space-y-4">
         <div className="flex items-start gap-3">
            <Shield size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
              Alterações em configurações, permissões e processos ficam registradas de forma permanente, para conformidade com a LGPD e auditorias internas.
            </p>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-6">
            {[
              { label: 'Registros mantidos por', value: '5 anos' },
              { label: 'Detalhamento', value: 'Completo' },
              { label: 'Assinatura digital', value: 'Ativa' },
            ].map(item => (
              <div key={item.label}>
                 <p className="label-caps">{item.label}</p>
                 <p className="text-[14px] font-bold text-gray-900 mt-0.5">{item.value}</p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
