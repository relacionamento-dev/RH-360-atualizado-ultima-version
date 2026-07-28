import React, { useState } from 'react';
import {
  Users, Shield, UserPlus, ShieldCheck,
  Plus, Lock, Edit2, Trash2, Power,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal, Avatar } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Select } from '../ui/Select';
import { User, Group } from '../../types';
import { isSuperAdmin } from '../../utils/permissions';
import { SectionHeader, SubTabs, AdminSearch, Field, ExpandableRow, ADMIN_FIELD_CLASS } from './AdminUI';

export default function AdminAccess() {
  const { config, updateConfig, getEffectivePermissions } = useAppConfig();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'groups' | 'matrix'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(config.grupos[0]?.id || '');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    email: '',
    profile: 'Colaborador',
    groups: [],
    scope: 'proprio',
    status: 'Ativo'
  });

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'proprio': return 'Próprio';
      case 'equipe': return 'Equipe';
      case 'setor': return 'Setor';
      case 'centro-custo': return 'Centro de Custo';
      case 'filial': return 'Filial';
      case 'empresa': return 'Empresa';
      case 'global': return 'Global';
      default: return scope;
    }
  };

  const allScreens = [
    'Intranet',
    'Dashboard RH',
    'Minhas Solicitações',
    'Minhas Aprovações',
    'Minhas Tarefas',
    'Consulta Global',
    'Colaboradores',
    'Perfil 360',
    'Central Adm',
    'Pessoas e Acessos',
    'Gestão de Acessos',
    'Relatórios',
    'Integrações'
  ];

  const getUserVision = (user: User) => {
    const visible = new Set<string>();
    const openable = new Set<string>();
    const notSee = new Set<string>(allScreens);

    // Administrador Geral: acesso irrestrito — todas as telas e todos os
    // processos, sem nada na lista de "não vê".
    if (isSuperAdmin(user)) {
      return {
        title: `${user.name} — ${user.profile}`,
        scopeLabel: getScopeLabel('global'),
        visible: [...allScreens],
        openable: config.processos.map(p => p.name),
        notSee: []
      };
    }

    visible.add('Intranet');
    visible.add('Minhas Solicitações');

    if (['Administrador Geral', 'Administrador', 'RH/DP'].includes(user.profile)) {
      visible.add('Dashboard RH');
    }
    if (['Administrador Geral', 'Administrador', 'Gestor', 'RH/DP'].includes(user.profile)) {
      visible.add('Minhas Aprovações');
      visible.add('Minhas Tarefas');
    }
    if (['Administrador Geral', 'Administrador', 'RH/DP', 'Diretoria'].includes(user.profile)) {
      visible.add('Consulta Global');
    }
    if (['Administrador Geral', 'Administrador', 'RH/DP'].includes(user.profile)) {
      visible.add('Colaboradores');
    }
    if (['Administrador Geral', 'Administrador', 'RH/DP', 'Gestor'].includes(user.profile)) {
      visible.add('Perfil 360');
    }
    if (user.profile === 'Administrador') {
      visible.add('Central Adm');
      visible.add('Pessoas e Acessos');
    }
    if (user.profile === 'Administrador Geral') {
      visible.add('Gestão de Acessos');
    }
    if (['Administrador', 'Diretoria', 'RH/DP'].includes(user.profile)) {
      visible.add('Relatórios');
    }
    if (user.profile === 'Administrador') {
      visible.add('Integrações');
    }

    config.processos.forEach(process => {
      const perms = getEffectivePermissions(user.id, process.id);
      if (perms.solicitar) {
        openable.add(process.name);
      }
    });

    visible.forEach(item => notSee.delete(item));

    return {
      title: `${user.name} — ${user.profile}`,
      scopeLabel: getScopeLabel(user.scope),
      visible: Array.from(visible),
      openable: Array.from(openable),
      notSee: Array.from(notSee)
    };
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setIsEditMode(true);
      setUserForm({
        ...user,
        groups: [...user.groups]
      });
    } else {
      setSelectedUser(null);
      setIsEditMode(false);
      setUserForm({
        name: '',
        email: '',
        profile: 'Colaborador',
        groups: [],
        scope: 'proprio',
        status: 'Ativo'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email || !userForm.profile || !userForm.scope) return;
    const updatedUsers = config.usuariosDemo.map((user) => {
      if (selectedUser && user.id === selectedUser.id) {
        return { ...user, ...userForm, groups: userForm.groups || [], scope: userForm.scope as any, profile: userForm.profile as any } as User;
      }
      return user;
    });

    if (!selectedUser) {
      const newUser: User = {
        id: `USER-${Date.now()}`,
        name: userForm.name!,
        email: userForm.email!,
        avatar: '',
        profile: userForm.profile as any,
        groups: userForm.groups || [],
        scope: userForm.scope as any,
        status: userForm.status as any || 'Ativo',
        role: `${userForm.profile}`,
      } as User;
      updateConfig({ usuariosDemo: [newUser, ...config.usuariosDemo] });
    } else {
      updateConfig({ usuariosDemo: updatedUsers });
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    updateConfig({ usuariosDemo: config.usuariosDemo.filter((user) => user.id !== userId) });
  };

  const handleToggleStatus = (user: User) => {
    updateConfig({
      usuariosDemo: config.usuariosDemo.map((item) => item.id === user.id ? { ...item, status: item.status === 'Ativo' ? 'Inativo' : 'Ativo' } : item)
    });
  };

  const renderUsersTable = () => {
    const filteredUsers = config.usuariosDemo.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Table
        columns={[
          { header: 'Pessoa', accessor: 'name', render: (val, row: User) => (
            <div className="flex items-center gap-3">
              <Avatar name={val} src={row.avatar} size="xs" />
              <div className="min-w-0">
                <p className="font-bold text-[13px] text-gray-900 truncate">{val}</p>
                <p className="text-[12px] text-gray-500 font-medium truncate">{row.email}</p>
              </div>
            </div>
          )},
          { header: 'Perfil de acesso', accessor: 'profile', render: (val) => <Badge variant="gray">{val}</Badge> },
          { header: 'Grupos', accessor: 'groups', render: (val: string[]) => (
            val.length === 0
              ? <span className="text-[12px] text-gray-300 font-medium">—</span>
              : <span className="text-[12px] text-gray-600 font-medium">
                  {val.slice(0, 2).join(', ')}{val.length > 2 ? ` +${val.length - 2}` : ''}
                </span>
          )},
          { header: 'Dados que enxerga', accessor: 'scope', render: (val) => (
            <span className="text-[12px] text-gray-600 font-medium">{getScopeLabel(val)}</span>
          )},
          { header: 'Situação', accessor: 'status', render: (val) => <Badge variant={val === 'Ativo' ? 'green' : 'gray'}>{val}</Badge> },
          { header: '', accessor: 'id', render: (id, row: User) => (
            <div className="flex justify-end gap-1">
               <Button variant="ghost" size="icon" title="Editar" aria-label={`Editar ${row.name}`} className="hover:text-orange-500" onClick={() => openUserModal(row)}><Edit2 size={16} /></Button>
               <Button variant="ghost" size="icon" className="hover:text-orange-500" onClick={() => handleToggleStatus(row)} title={row.status === 'Ativo' ? 'Desativar acesso' : 'Reativar acesso'} aria-label={row.status === 'Ativo' ? `Desativar ${row.name}` : `Reativar ${row.name}`}>
                 <Power size={16} />
               </Button>
               {row.id !== 'ADMIN-001' && (
                 <Button variant="ghost" size="icon" title="Remover" aria-label={`Remover ${row.name}`} className="hover:text-red-500" onClick={() => handleDeleteUser(row.id)}><Trash2 size={16} /></Button>
               )}
            </div>
          )}
        ]}
        data={filteredUsers}
      />
    );
  };

  const userVision = selectedUser ? getUserVision(selectedUser) : null;

  const renderUserModal = () => (
    <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={isEditMode ? 'Editar Usuário' : 'Novo Usuário'} size="lg">
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(240px,340px)]">
        <div className="space-y-5">
          <div className="space-y-4">
            <Field label="Nome completo">
              <input
                value={userForm.name || ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                className={`${ADMIN_FIELD_CLASS} w-full`}
                placeholder="Ex.: João Silva"
              />
            </Field>
            <Field label="E-mail de acesso">
              <input
                value={userForm.email || ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                className={`${ADMIN_FIELD_CLASS} w-full`}
                placeholder="joao.silva@empresa.com.br"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Perfil de acesso" hint="Define o que a pessoa pode fazer.">
                <Select
                  className="w-full"
                  ariaLabel="Perfil de acesso"
                  value={userForm.profile || 'Colaborador'}
                  onChange={(value) => setUserForm(prev => ({ ...prev, profile: value as User['profile'] }))}
                  options={[
                    { value: 'Colaborador', label: 'Colaborador' },
                    { value: 'Gestor', label: 'Gestor' },
                    { value: 'RH/DP', label: 'RH / DP' },
                    { value: 'Diretoria', label: 'Diretoria' },
                    { value: 'Administrador', label: 'Administrador' },
                    // Só um Administrador Geral concede o próprio perfil. A opção
                    // também aparece ao editar quem já o tem, para o campo não
                    // ficar vazio e rebaixar o usuário sem querer.
                    ...((isSuperAdmin(config.usuarioAtual) || userForm.profile === 'Administrador Geral')
                      ? [{ value: 'Administrador Geral', label: 'Administrador Geral' }]
                      : [])
                  ]}
                />
              </Field>
              <Field label="Dados que ela enxerga" hint="Até onde vai a visão dela na empresa.">
                <Select
                  className="w-full"
                  ariaLabel="Dados que ela enxerga"
                  value={userForm.scope || 'proprio'}
                  onChange={(value) => setUserForm(prev => ({ ...prev, scope: value as User['scope'] }))}
                  options={[
                    { value: 'proprio', label: 'Apenas os próprios' },
                    { value: 'equipe', label: 'Da equipe' },
                    { value: 'setor', label: 'Do setor' },
                    { value: 'centro-custo', label: 'Do centro de custo' },
                    { value: 'filial', label: 'Da filial' },
                    { value: 'empresa', label: 'Da empresa' },
                    { value: 'global', label: 'De todas as empresas' },
                  ]}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Grupos" hint="Separe por vírgula.">
                <input
                  value={(userForm.groups || []).join(', ')}
                  onChange={(e) => setUserForm(prev => ({ ...prev, groups: e.target.value.split(',').map(item => item.trim()).filter(Boolean) }))}
                  className={`${ADMIN_FIELD_CLASS} w-full`}
                  placeholder="Administradores, RH Corporativo"
                />
              </Field>
              <Field label="Situação">
                <Select
                  className="w-full"
                  ariaLabel="Situação"
                  value={userForm.status || 'Ativo'}
                  onChange={(value) => setUserForm(prev => ({ ...prev, status: value as User['status'] }))}
                  options={[
                    { value: 'Ativo', label: 'Ativo' },
                    { value: 'Inativo', label: 'Inativo' },
                  ]}
                />
              </Field>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSaveUser}>{isEditMode ? 'Salvar alterações' : 'Criar acesso'}</Button>
          </div>
        </div>

        {userVision && (
          <div className="space-y-4 rounded-[12px] border border-gray-100 bg-gray-50 p-5">
            <div>
              <p className="text-[13px] font-bold text-gray-900">O que esta pessoa vai ver</p>
              <p className="text-[12px] text-gray-500 font-medium">{userVision.title} · {userVision.scopeLabel}</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="label-caps">Telas disponíveis</p>
                <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{userVision.visible.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="label-caps">Processos que pode abrir</p>
                <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{userVision.openable.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="label-caps">Não terá acesso a</p>
                <p className="text-[13px] text-gray-400 font-medium leading-relaxed">{userVision.notSee.join(', ') || 'Nada — acesso total'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );

  const renderGroupsTable = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="label-caps">Grupos</h3>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-orange-500 px-2" title="Novo grupo" aria-label="Novo grupo">
              <Plus size={16} />
            </Button>
          </div>
          <div className="space-y-1">
            {config.grupos.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`w-full text-left px-4 py-3 rounded-[12px] text-[13px] transition-colors border ${
                  selectedGroupId === g.id
                    ? 'bg-white border-gray-200 text-gray-900 font-bold'
                    : 'bg-transparent border-transparent text-gray-600 font-medium hover:bg-white hover:border-gray-100'
                }`}
              >
                <span className="block truncate">{g.nome}</span>
                <span className="block text-[12px] text-gray-400 font-medium">{g.membros.length} pessoa(s)</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
           {selectedGroupId ? (
             <GroupDetail group={config.grupos.find(g => g.id === selectedGroupId)!} />
           ) : (
             <div className="rounded-[12px] border border-dashed border-gray-200 px-6 py-16 text-center">
               <p className="text-[13px] font-bold text-gray-500">Escolha um grupo</p>
               <p className="text-[12px] text-gray-400 font-medium mt-1">
                 Os grupos dão permissões extras além do perfil de cada pessoa.
               </p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderMatrix = () => {
    const roles = ['Administrador Geral', 'Administrador', 'Diretoria', 'RH/DP', 'Gestor', 'Colaborador'];
    const { getEffectivePermissions, getSensitiveDataPermissions } = useAppConfig();

    // Mapping profiles to representative user IDs for matrix calculation
    const profileRepresentativeMap: Record<string, string> = {
      'Administrador Geral': 'ADMIN-GERAL-001',
      'Administrador': 'ADMIN-001',
      'Diretoria': 'DIR-001',
      'RH/DP': 'RH-001',
      'Gestor': 'GEST-001',
      'Colaborador': 'COLAB-001'
    };
    
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Quem pode o quê"
          description="Resumo automático do acesso de cada perfil aos processos. Esta tela é apenas de leitura — as permissões vêm dos grupos e dos perfis."
        />

        <Card padding="none" className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-brand-border)]">
                <th className="px-6 py-4 label-caps bg-gray-50/50">Processo</th>
                {roles.map(r => (
                  <th key={r} className="px-6 py-4 text-center label-caps bg-gray-50/50">{r}</th>
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
          <div className="p-4 bg-gray-50/50 border-t border-[var(--color-brand-border)] flex flex-wrap gap-5 justify-center">
            {[
              { color: 'bg-blue-400', label: 'Pode solicitar' },
              { color: 'bg-orange-400', label: 'Pode aprovar' },
              { color: 'bg-purple-400', label: 'Pode executar' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[12px] font-medium text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
           <div>
             <h4 className="text-[14px] font-bold text-gray-900">Quem enxerga dados sensíveis</h4>
             <p className="text-[12px] text-gray-500 font-medium">As iniciais mostram os perfis com acesso liberado a cada informação.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] border border-gray-100">
                    <span className="text-[13px] font-medium text-gray-600">{item.label}</span>
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
      <SectionHeader
        title="Pessoas e acessos"
        description="Quem entra na plataforma, o que cada um pode fazer e quais dados enxerga."
        actions={
          activeSubTab === 'users'
            ? <Button size="sm" leftIcon={<UserPlus size={14} />} onClick={() => openUserModal()}>Dar acesso a alguém</Button>
            : undefined
        }
      />

      <SubTabs
        value={activeSubTab}
        onChange={(id) => setActiveSubTab(id as any)}
        tabs={[
          { id: 'users', label: 'Pessoas', icon: <Users size={14} /> },
          { id: 'groups', label: 'Grupos', icon: <Shield size={14} /> },
          { id: 'matrix', label: 'Quem pode o quê', icon: <Lock size={14} /> },
        ]}
      />

      <div className="animate-in fade-in duration-500">
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            <AdminSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nome ou e-mail..."
            />
            <Card padding="none">
               {renderUsersTable()}
            </Card>
          </div>
        )}

        {activeSubTab === 'groups' && renderGroupsTable()}
        {activeSubTab === 'matrix' && renderMatrix()}
      </div>

      {renderUserModal()}
    </div>
  );
}

function GroupDetail({ group }: { group: Group }) {
  const { config, updateConfig } = useAppConfig();
  const [expandedProcesses, setExpandedProcesses] = useState<Record<string, boolean>>({});
  const [sensitiveOpen, setSensitiveOpen] = useState(false);

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

  // Rótulos em linguagem de uso, não de banco: é isto que a pessoa do grupo
  // passa a poder fazer no processo.
  const actions = [
    { id: 'ver', label: 'Ver as solicitações' },
    { id: 'solicitar', label: 'Abrir solicitações' },
    { id: 'executar', label: 'Executar as etapas' },
    { id: 'aprovar', label: 'Aprovar' },
    { id: 'devolver', label: 'Devolver para ajuste' },
    { id: 'cancelar', label: 'Cancelar' },
    { id: 'reabrir', label: 'Reabrir' },
    { id: 'verHistorico', label: 'Ver o histórico' },
    { id: 'verSigiloso', label: 'Ver dados sigilosos' },
  ];

  const sensitiveItems = [
    { id: 'visualizarSalario', label: 'Ver salário' },
    { id: 'editarSalario', label: 'Alterar salário' },
    { id: 'visualizarCPF', label: 'Ver CPF' },
    { id: 'visualizarDocumentosPessoais', label: 'Ver documentos pessoais' },
    { id: 'visualizarDadosBancarios', label: 'Ver dados bancários' },
    { id: 'visualizarASO', label: 'Ver exames (ASO)' },
    { id: 'visualizarMedidaDisciplinar', label: 'Ver medidas disciplinares' },
    { id: 'visualizarDesligamento', label: 'Ver desligamentos' },
    { id: 'visualizarJuridico', label: 'Ver processos jurídicos' },
    { id: 'visualizarAuditoria', label: 'Ver registro de atividades' },
  ];

  const sensitiveCount = sensitiveItems.filter(item => !!(group.dadosSensiveis as any)?.[item.id]).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title={group.nome}
        description={`${group.membros.length} pessoa(s) neste grupo. As permissões abaixo são somadas ao perfil de cada uma.`}
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Users size={14} />}>Membros</Button>
            <Button size="sm" leftIcon={<ShieldCheck size={14} />}>Salvar</Button>
          </>
        }
      />

      {/* Dados sensíveis: resumo em uma linha, marcação só ao abrir. */}
      <ExpandableRow
        leading={<Lock size={15} className="text-gray-400 shrink-0" />}
        title="Dados sensíveis"
        subtitle={sensitiveCount === 0 ? 'Nenhum liberado' : `${sensitiveCount} de ${sensitiveItems.length} liberados`}
        open={sensitiveOpen}
        onToggle={() => setSensitiveOpen(o => !o)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sensitiveItems.map(item => {
            const checked = !!(group.dadosSensiveis as any)?.[item.id];
            return (
              <label
                key={item.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border cursor-pointer transition-colors ${
                  checked ? 'bg-orange-50/60 border-orange-200' : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateSensitive(item.id, e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded border-gray-300 shrink-0"
                />
                <span className={`text-[13px] font-medium ${checked ? 'text-orange-900' : 'text-gray-600'}`}>{item.label}</span>
              </label>
            );
          })}
        </div>
      </ExpandableRow>

      <div className="space-y-3">
        <SectionHeader
          title="Permissões por processo"
          description="Abra um processo para escolher o que este grupo pode fazer nele."
        />

        <div className="space-y-2">
          {config.processos.map((p) => {
            const pPerms = (group.permissoes?.[p.id] || {}) as Record<string, boolean>;
            const granted = actions.filter(a => pPerms[a.id]);

            return (
              <ExpandableRow
                key={p.id}
                title={p.name}
                subtitle={granted.length === 0
                  ? 'Sem permissões'
                  : granted.map(a => a.label).join(', ')}
                open={!!expandedProcesses[p.id]}
                onToggle={() => toggleProcess(p.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {actions.map(action => {
                    const checked = !!pPerms[action.id];
                    return (
                      <label
                        key={action.id}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border cursor-pointer transition-colors ${
                          checked ? 'bg-orange-50/60 border-orange-200' : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => updatePermission(p.id, action.id, e.target.checked)}
                          className="w-4 h-4 accent-orange-500 rounded border-gray-300 shrink-0"
                        />
                        <span className={`text-[13px] font-medium ${checked ? 'text-orange-900' : 'text-gray-600'}`}>{action.label}</span>
                      </label>
                    );
                  })}
                </div>
              </ExpandableRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}
