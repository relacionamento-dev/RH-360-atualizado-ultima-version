import React, { useState } from 'react';
import { 
  Users, Shield, UserPlus, Search, 
  Filter, ShieldCheck, ShieldAlert, 
  MoreHorizontal, Plus, Key, Lock,
  Clock, Eye, Edit2, Trash2, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal, Avatar } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { User, Group } from '../../types';

export default function AdminAccess() {
  const { config, updateConfig } = useAppConfig();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'groups' | 'matrix'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(config.grupos[0]?.id || '');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const renderUsersTable = () => {
    const filteredUsers = config.usuariosDemo.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Table 
        columns={[
          { header: 'USUÁRIO', accessor: 'name', render: (val, row: User) => (
            <div className="flex items-center gap-3">
              <Avatar name={val} src={row.avatar} size="xs" />
              <div>
                <p className="font-bold text-[13px] text-gray-900">{val}</p>
                <p className="text-[11px] text-gray-500 font-medium">{row.email}</p>
              </div>
            </div>
          )},
          { header: 'PERFIL BASE', accessor: 'profile', render: (val) => <Badge variant="blue">{val}</Badge> },
          { header: 'GRUPOS', accessor: 'groups', render: (val: string[]) => (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {val.slice(0, 2).map((g, i) => <Badge key={i} variant="gray" size="sm">{g}</Badge>)}
              {val.length > 2 && <span className="text-[10px] text-gray-400 font-bold">+{val.length - 2}</span>}
            </div>
          )},
          { header: 'ESCOPO', accessor: 'scope', render: (val) => <Badge variant="outline" size="sm">{val}</Badge> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Ativo' ? 'green' : 'gray'}>{val}</Badge> },
          { header: '', accessor: 'id', render: (id) => (
            <div className="flex justify-end gap-1">
               <Button variant="ghost" size="icon" className="hover:text-orange-500"><Key size={16} /></Button>
               <Button variant="ghost" size="icon" className="hover:text-orange-500"><Edit2 size={16} /></Button>
               {id !== 'ADMIN-001' && <Button variant="ghost" size="icon" className="hover:text-red-500"><Trash2 size={16} /></Button>}
            </div>
          )}
        ]}
        data={filteredUsers}
      />
    );
  };

  const renderGroupsTable = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="label-caps opacity-60">Grupos</h3>
            <Button variant="ghost" size="icon" className="text-orange-500"><Plus size={16} /></Button>
          </div>
          <div className="space-y-1">
            {config.grupos.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`w-full text-left px-4 py-3 rounded-[14px] font-bold text-[13px] transition-all border ${
                  selectedGroupId === g.id 
                    ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200' 
                    : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {g.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           {selectedGroupId ? (
             <GroupDetail group={config.grupos.find(g => g.id === selectedGroupId)!} />
           ) : (
             <div className="bg-white p-20 text-center border rounded-[32px] border-dashed">
               <Shield size={48} className="mx-auto text-gray-200 mb-4" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Selecione um grupo para configurar</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderMatrix = () => {
    const roles = ['Administrador', 'Diretoria', 'RH/DP', 'Gestor', 'Colaborador'];
    const { getEffectivePermissions, getSensitiveDataPermissions } = useAppConfig();

    // Mapping profiles to representative user IDs for matrix calculation
    const profileRepresentativeMap: Record<string, string> = {
      'Administrador': 'ADMIN-001',
      'Diretoria': 'DIR-001',
      'RH/DP': 'RH-001',
      'Gestor': 'GEST-001',
      'Colaborador': 'COLAB-001'
    };
    
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 flex items-start gap-4">
          <ShieldAlert size={24} className="text-amber-600 shrink-0" />
          <div>
            <h4 className="font-black text-amber-900">Visão Consolidada de Permissões</h4>
            <p className="text-[13px] text-amber-800 font-medium leading-relaxed">
              Esta matriz é somente leitura e calculada automaticamente com base nas permissões atribuídas aos grupos e perfis.
              A permissão exibida é a permissão efetiva (Perfil + Grupos) para um usuário típico de cada perfil.
            </p>
          </div>
        </div>
        
        <Card className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 label-caps opacity-60">PROCESSO RH360</th>
                {roles.map(r => (
                  <th key={r} className="px-6 py-4 text-center label-caps opacity-60">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.processos.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[13px] text-gray-900">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{p.category}</p>
                  </td>
                  {roles.map(role => {
                    const userId = profileRepresentativeMap[role];
                    const perms = getEffectivePermissions(userId, p.id);
                    const hasAccess = perms.ver || perms.solicitar;
                    
                    return (
                      <td key={role} className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          {hasAccess ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <div className="flex gap-0.5 mt-1">
                                {perms.solicitar && <div title="Solicitar" className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                {perms.aprovar && <div title="Aprovar" className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                                {perms.executar && <div title="Executar" className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                              </div>
                            </div>
                          ) : (
                            <AlertCircle size={16} className="text-gray-200" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Solicitar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Aprovar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Executar</span>
            </div>
          </div>
        </Card>

        <Card className="p-8">
           <h4 className="label-caps opacity-60 mb-6">Acesso a Dados Sensíveis por Perfil (Visão Global)</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'visualizarSalario', label: 'Visualizar Salário' },
                { id: 'editarSalario', label: 'Editar Salário' },
                { id: 'visualizarCPF', label: 'Visualizar CPF' },
                { id: 'visualizarDocumentosPessoais', label: 'Documentos Pessoais' },
                { id: 'visualizarDadosBancarios', label: 'Dados Bancários' },
                { id: 'visualizarASO', label: 'ASO' },
                { id: 'visualizarMedidaDisciplinar', label: 'Medidas Disciplinares' },
                { id: 'visualizarDesligamento', label: 'Desligamento' },
                { id: 'visualizarJuridico', label: 'Jurídico' },
                { id: 'visualizarAuditoria', label: 'Auditoria' }
              ].map(item => {
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[12px] font-bold text-gray-700">{item.label}</span>
                    <div className="flex -space-x-2">
                      {roles.map((r, i) => {
                        const userId = profileRepresentativeMap[r];
                        const sensitivePerms = getSensitiveDataPermissions(userId);
                        const hasAccess = (sensitivePerms as any)[item.id];
                        
                        if (!hasAccess) return null;

                        return (
                          <div 
                            key={i} 
                            title={r} 
                            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm transition-transform hover:scale-110 cursor-help ${
                              r === 'Administrador' ? 'bg-gray-900' : 
                              r === 'Diretoria' ? 'bg-blue-600' : 
                              r === 'RH/DP' ? 'bg-orange-500' : 
                              r === 'Gestor' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          >
                            {r[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
           </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-[16px] w-fit">
        {[
          { id: 'users', label: 'Usuários', icon: <Users size={14} /> },
          { id: 'groups', label: 'Grupos e Membros', icon: <Shield size={14} /> },
          { id: 'matrix', label: 'Matriz Global', icon: <Lock size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] transition-all ${
              activeSubTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
        {activeSubTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar usuário por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-[14px] text-[13px] focus:ring-2 focus:ring-orange-500/20 outline-none shadow-sm transition-all"
                />
              </div>
              <Button leftIcon={<UserPlus size={16} />} onClick={() => setIsUserModalOpen(true)}>Novo Usuário</Button>
            </div>
            <Card className="overflow-hidden border-none shadow-xl">
               {renderUsersTable()}
            </Card>
          </div>
        )}

        {activeSubTab === 'groups' && renderGroupsTable()}
        {activeSubTab === 'matrix' && renderMatrix()}
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Convidar Novo Usuário">
         <div className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500" placeholder="Ex: João Silva..." />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                  <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500" placeholder="joao.silva@empresa.com.br" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Perfil Base</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500">
                      <option>Colaborador</option>
                      <option>Gestor</option>
                      <option>RH/DP</option>
                      <option>Diretoria</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Escopo de Acesso</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500">
                      <option>Próprio</option>
                      <option>Equipe</option>
                      <option>Filial</option>
                      <option>Empresa</option>
                      <option>Global</option>
                    </select>
                  </div>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setIsUserModalOpen(false)}>Enviar Convite</Button>
           </div>
         </div>
      </Modal>
    </div>
  );
}

function GroupDetail({ group }: { group: Group }) {
  const { config, updateConfig } = useAppConfig();
  const [expandedProcesses, setExpandedProcesses] = useState<Record<string, boolean>>({});

  const toggleProcess = (id: string) => {
    setExpandedProcesses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updatePermission = (processId: string, action: string, value: boolean) => {
    const updatedGroups = config.grupos.map(g => {
      if (g.id === group.id) {
        const perms = { ...(g.permissoes || {}) };
        const currentPerm = perms[processId] || { 
          ver: false, solicitar: false, executar: false, aprovar: false, 
          devolver: false, cancelar: false, reabrir: false, verHistorico: false, verSigiloso: false 
        };
        perms[processId] = { ...currentPerm, [action]: value } as import('../../types').ProcessPermission;
        return { ...g, permissoes: perms };
      }
      return g;
    });
    updateConfig({ grupos: updatedGroups });
  };

  const updateSensitive = (key: string, value: boolean) => {
    const updatedGroups = config.grupos.map(g => {
      if (g.id === group.id) {
        const newSensitive = { ...g.dadosSensiveis, [key]: value } as import('../../types').SensitiveDataPermission;
        return { ...g, dadosSensiveis: newSensitive };
      }
      return g;
    });
    updateConfig({ grupos: updatedGroups });
  };

  const actions = [
    { id: 'ver', label: 'Ver' },
    { id: 'solicitar', label: 'Solicitar' },
    { id: 'executar', label: 'Executar' },
    { id: 'aprovar', label: 'Aprovar' },
  ];

  const advancedActions = [
    { id: 'devolver', label: 'Devolver' },
    { id: 'cancelar', label: 'Cancelar' },
    { id: 'reabrir', label: 'Reabrir' },
    { id: 'verHistorico', label: 'Ver Histórico' },
    { id: 'verSigiloso', label: 'Ver Dados Sigilosos' },
  ];

  const sensitiveItems = [
    { id: 'visualizarSalario', label: 'Visualizar Salário' },
    { id: 'editarSalario', label: 'Editar Salário' },
    { id: 'visualizarCPF', label: 'Visualizar CPF' },
    { id: 'visualizarDocumentosPessoais', label: 'Docs Pessoais' },
    { id: 'visualizarDadosBancarios', label: 'Dados Bancários' },
    { id: 'visualizarASO', label: 'ASO' },
    { id: 'visualizarMedidaDisciplinar', label: 'Medida Disciplinar' },
    { id: 'visualizarDesligamento', label: 'Desligamento' },
    { id: 'visualizarJuridico', label: 'Jurídico' },
    { id: 'visualizarAuditoria', label: 'Auditoria' },
  ];

  return (
    <Card className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{group.nome}</h3>
          <p className="text-[13px] text-gray-500 font-medium mt-1">Este grupo possui {group.membros.length} membros ativos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Users size={16} />}>Gerenciar Membros</Button>
          <Button size="sm" leftIcon={<ShieldCheck size={16} />}>Salvar Grupo</Button>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="label-caps opacity-60 flex items-center gap-2">
          <Lock size={14} /> Permissões de Dados Sensíveis
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {sensitiveItems.map(item => (
            <label key={item.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
              (group.dadosSensiveis as any)?.[item.id] ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}>
              <input 
                type="checkbox" 
                checked={!!(group.dadosSensiveis as any)?.[item.id]} 
                onChange={(e) => updateSensitive(item.id, e.target.checked)}
                className="hidden" 
              />
              <span className="text-[10px] font-black uppercase tracking-tighter text-center w-full leading-tight">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="label-caps opacity-60">Permissões por Processo RH360</h4>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Ações Oficiais</span>
        </div>
        
        <div className="space-y-3">
          {config.processos.map((p) => {
            const isExpanded = expandedProcesses[p.id];
            const pPerms = group.permissoes?.[p.id] || {};

            return (
              <div key={p.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleProcess(p.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{p.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium">Configure ações básicas e avançadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                      {actions.map(action => (
                        <div key={action.id} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={!!(pPerms as any)?.[action.id]}
                            onChange={(e) => updatePermission(p.id, action.id, e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300" 
                          />
                          <span className="text-[10px] font-bold text-gray-600 uppercase">{action.label}</span>
                        </div>
                      ))}
                    </div>
                    <MoreHorizontal size={16} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
                    {advancedActions.map(action => (
                      <label key={action.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={!!(pPerms as any)?.[action.id]}
                          onChange={(e) => updatePermission(p.id, action.id, e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded border-gray-300" 
                        />
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-gray-900 uppercase tracking-tighter">{action.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
