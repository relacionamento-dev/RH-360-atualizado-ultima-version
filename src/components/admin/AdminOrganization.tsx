import React, { useState } from 'react';
import {
  Building2, Landmark, Briefcase,
  Hash, Plus, Edit2, Trash2, Download,
  Layers, MapPin, CreditCard, Users
} from 'lucide-react';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { Select } from '../ui/Select';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { SectionHeader, SubTabs, AdminSearch, InfoNote, Field, ADMIN_FIELD_CLASS } from './AdminUI';

type OrgSubTab = 'companies' | 'branches' | 'units' | 'sectors' | 'costCenters' | 'roles' | 'salaryBands' | 'unions';

export default function AdminOrganization() {
  const { config, updateConfig } = useAppConfig();
  const [activeSubTab, setActiveSubTab] = useState<OrgSubTab>('companies');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecordParent, setNewRecordParent] = useState('');

  const subTabs: { id: OrgSubTab; label: string; singular: string; icon: React.ReactNode }[] = [
    { id: 'companies', label: 'Empresas', singular: 'Empresa', icon: <Landmark size={14} /> },
    { id: 'branches', label: 'Filiais', singular: 'Filial', icon: <Building2 size={14} /> },
    { id: 'units', label: 'Unidades', singular: 'Unidade', icon: <MapPin size={14} /> },
    { id: 'sectors', label: 'Setores', singular: 'Setor', icon: <Layers size={14} /> },
    { id: 'costCenters', label: 'Centros de custo', singular: 'Centro de custo', icon: <Hash size={14} /> },
    { id: 'roles', label: 'Cargos', singular: 'Cargo', icon: <Briefcase size={14} /> },
    { id: 'salaryBands', label: 'Faixas salariais', singular: 'Faixa salarial', icon: <CreditCard size={14} /> },
    { id: 'unions', label: 'Sindicatos', singular: 'Sindicato', icon: <Users size={14} /> },
  ];

  const renderTable = () => {
    switch (activeSubTab) {
      case 'companies':
        return (
          <Table 
            columns={[
              { header: 'Empresa', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'CNPJ', accessor: 'document', render: (val) => <span className="text-[12px] font-medium text-gray-500">{val}</span> },
              { header: 'Situação', accessor: 'id', render: () => <Badge variant="green">Ativo</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.empresas.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'branches':
        return (
          <Table 
            columns={[
              { header: 'Filial', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'Empresa', accessor: 'company', render: () => <span className="text-[12px] font-medium text-gray-500">Matriz Corporate</span> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.filiais.map((f, i) => ({ id: i, name: f })).filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'units':
        return (
          <Table 
            columns={[
              { header: 'Unidade', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'Filial', accessor: 'branchId', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.unidades.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'sectors':
        return (
          <Table 
            columns={[
              { header: 'Setor', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'Gestor responsável', accessor: 'manager', render: (val) => <span className="text-[12px] font-bold text-gray-700">{val}</span> },
              { header: 'Filial', accessor: 'branch', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.setores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'costCenters':
        return (
          <Table 
            columns={[
              { header: 'Código', accessor: 'code', render: (val) => <Badge variant="blue">{val}</Badge> },
              { header: 'Nome', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.centrosDeCusto.filter(cc => cc.name.toLowerCase().includes(searchTerm.toLowerCase()) || cc.code.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'roles':
        return (
          <Table 
            columns={[
              { header: 'Cargo', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.cargos.map((c, i) => ({ id: i, name: c })).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      case 'salaryBands':
        return (
          <Table 
            columns={[
              { header: 'Nível', accessor: 'level', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'Salário mínimo', accessor: 'min', render: (val) => <span className="text-[13px] font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span> },
              { header: 'Salário médio', accessor: 'mid', render: (val) => <span className="text-[13px] font-bold text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span> },
              { header: 'Salário máximo', accessor: 'max', render: (val) => <span className="text-[13px] font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span> },
              { header: '', accessor: 'level', render: () => <TableActions /> }
            ]}
            data={config.faixasSalariais}
          />
        );
      case 'unions':
        return (
          <Table 
            columns={[
              { header: 'Sindicato', accessor: 'name', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
              { header: 'Código', accessor: 'code', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: '', accessor: 'id', render: () => <TableActions /> }
            ]}
            data={config.sindicatos.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))}
          />
        );
      default:
        return null;
    }
  };

  const currentTab = subTabs.find(t => t.id === activeSubTab);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Estrutura da empresa"
        description="Empresas, filiais, setores e demais cadastros usados pelos processos de RH."
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>Importar planilha</Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
              Cadastrar {currentTab?.singular.toLowerCase()}
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <SubTabs<OrgSubTab> tabs={subTabs} value={activeSubTab} onChange={setActiveSubTab} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={`Buscar em ${currentTab?.label.toLowerCase()}...`}
          />
          <span className="text-[12px] text-gray-400 font-medium">
            Cadastros sincronizados com o ERP.
          </span>
        </div>
      </div>

      <Card padding="none">
        {renderTable()}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Cadastrar ${currentTab?.singular.toLowerCase()}`}>
        <div className="space-y-6">
           <InfoNote>
             O cadastro é enviado ao ERP automaticamente. Novos registros entram na fila de sincronização.
           </InfoNote>

           <div className="space-y-4">
             <Field label="Nome">
               <input type="text" className={`${ADMIN_FIELD_CLASS} w-full`} placeholder="Digite o nome..." />
             </Field>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Código interno" hint="Opcional — usado na integração com o ERP.">
                  <input type="text" className={`${ADMIN_FIELD_CLASS} w-full`} placeholder="Ex.: COD-001" />
                </Field>
                <Field label="Vinculado a">
                  <Select
                    className="w-full"
                    ariaLabel="Vinculado a"
                    value={newRecordParent}
                    onChange={setNewRecordParent}
                    options={[
                      { value: '', label: 'Selecione...' },
                      ...config.filiais.map(f => ({ value: f, label: f }))
                    ]}
                  />
                </Field>
             </div>
           </div>

           <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setIsModalOpen(false)}>Salvar e sincronizar</Button>
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
