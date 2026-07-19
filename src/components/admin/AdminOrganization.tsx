import React, { useState } from 'react';
import { 
  Building2, Landmark, Briefcase, 
  Target, Hash, Plus, Search, 
  Filter, Edit2, Trash2, Download,
  Layers, MapPin, CreditCard, Users, 
  Calendar, Info
} from 'lucide-react';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';

type OrgSubTab = 'companies' | 'branches' | 'units' | 'sectors' | 'costCenters' | 'roles' | 'salaryBands' | 'unions';

export default function AdminOrganization() {
  const { config, updateConfig } = useAppConfig();
  const [activeSubTab, setActiveSubTab] = useState<OrgSubTab>('companies');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const subTabs: { id: OrgSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'companies', label: 'Empresas', icon: <Landmark size={14} /> },
    { id: 'branches', label: 'Filiais', icon: <Building2 size={14} /> },
    { id: 'units', label: 'Unidades', icon: <MapPin size={14} /> },
    { id: 'sectors', label: 'Setores', icon: <Layers size={14} /> },
    { id: 'costCenters', label: 'C. Custo', icon: <Hash size={14} /> },
    { id: 'roles', label: 'Cargos', icon: <Briefcase size={14} /> },
    { id: 'salaryBands', label: 'Faixas', icon: <CreditCard size={14} /> },
    { id: 'unions', label: 'Sindicatos', icon: <Users size={14} /> },
  ];

  const renderTable = () => {
    switch (activeSubTab) {
      case 'companies':
        return (
          <Table 
            columns={[
              { header: 'EMPRESA', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'CNPJ', accessor: 'document', render: (val) => <span className="text-[12px] font-medium text-gray-500">{val}</span> },
              { header: 'STATUS', accessor: 'id', render: () => <Badge variant="green">Ativo</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.empresas.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'branches':
        return (
          <Table 
            columns={[
              { header: 'FILIAL', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'EMPRESA', accessor: 'company', render: () => <span className="text-[12px] font-medium text-gray-500">Matriz Corporate</span> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.filiais.map((f, i) => ({ id: i, name: f })).filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'units':
        return (
          <Table 
            columns={[
              { header: 'UNIDADE', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'FILIAL', accessor: 'branchId', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.unidades.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'sectors':
        return (
          <Table 
            columns={[
              { header: 'SETOR', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'GESTOR', accessor: 'manager', render: (val) => <span className="text-[12px] font-bold text-gray-700">{val}</span> },
              { header: 'FILIAL', accessor: 'branch', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.setores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'costCenters':
        return (
          <Table 
            columns={[
              { header: 'CÓDIGO', accessor: 'code', render: (val) => <Badge variant="blue">{val}</Badge> },
              { header: 'NOME', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.centrosDeCusto.filter(cc => cc.name.toLowerCase().includes(searchTerm.toLowerCase()) || cc.code.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'roles':
        return (
          <Table 
            columns={[
              { header: 'CARGO', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.cargos.map((c, i) => ({ id: i, name: c })).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'salaryBands':
        return (
          <Table 
            columns={[
              { header: 'NÍVEL', accessor: 'level', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'MÍNIMO', accessor: 'min', render: (val) => <span className="text-[13px] font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span> },
              { header: 'MÉDIO', accessor: 'mid', render: (val) => <span className="text-[13px] font-bold text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span> },
              { header: 'MÁXIMO', accessor: 'max', render: (val) => <span className="text-[13px] font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span> },
              { header: '', accessor: 'level', render: () => <TableActions /> }
            ]}
            data={config.faixasSalariais}
          />
        );
      case 'unions':
        return (
          <Table 
            columns={[
              { header: 'SINDICATO', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'CÓDIGO', accessor: 'code', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.sindicatos.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-2 rounded-[18px] border border-gray-100 shadow-sm flex flex-wrap gap-1">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[12px] transition-all ${
              activeSubTab === tab.id 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={`Buscar em ${subTabs.find(t => t.id === activeSubTab)?.label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-[14px] text-[13px] focus:ring-2 focus:ring-orange-500/20 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>Importar Planilha</Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Novo Registro</Button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                {subTabs.find(t => t.id === activeSubTab)?.icon}
             </div>
             <h3 className="font-black text-gray-900 tracking-tight uppercase text-[11px] tracking-widest ml-1">Listagem de {subTabs.find(t => t.id === activeSubTab)?.label}</h3>
           </div>
           <Badge variant="blue" size="sm">ERP Integrado</Badge>
        </div>
        {renderTable()}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Novo Registro: ${subTabs.find(t => t.id === activeSubTab)?.label}`}>
        <div className="space-y-6">
           <div className="bg-orange-50 p-4 rounded-xl flex gap-3 border border-orange-100">
             <Info size={18} className="text-orange-500 shrink-0" />
             <p className="text-[12px] text-orange-800 font-medium">
               Este cadastro é sincronizado automaticamente com o ERP Protheus. Registros criados aqui entrarão em fila de integração.
             </p>
           </div>
           
           <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome / Descrição</label>
               <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500" placeholder="Digite o nome..." />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Código Interno</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500" placeholder="Ex: COD-001" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Relacionamento</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500">
                    <option>Selecione...</option>
                    <option>Matriz SP</option>
                    <option>Filial PR</option>
                  </select>
                </div>
             </div>
           </div>

           <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setIsModalOpen(false)}>Salvar e Sincronizar</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}

function TableActions() {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" className="hover:text-orange-500"><Edit2 size={16} /></Button>
      <Button variant="ghost" size="icon" className="hover:text-red-500"><Trash2 size={16} /></Button>
    </div>
  );
}
