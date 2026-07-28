import React, { useMemo, useState } from 'react';
import { Plus, Search, Copy, RefreshCcw, Lock, Unlock, Trash2, ShieldCheck, CalendarDays } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Misc';
import { PageHeader } from './ui/FormAndHeader';
import { useAppConfig } from '../contexts/AppConfigContext';
import { Accesso } from '../types';
import { isSuperAdmin } from '../utils/permissions';

const PROFILE_OPTIONS = ['Administrador', 'Diretoria', 'RH/DP', 'Gestor', 'Colaborador'];
const DURATION_OPTIONS = [5, 15, 30, 0];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function calculateExpiration(start: string, days: number) {
  const date = new Date(start);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getStatus(access: Accesso) {
  if (access.blocked) return 'Bloqueado';
  const now = new Date();
  const expiration = new Date(access.expirationDate);
  if (expiration < now) return 'Expirado';
  const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 2) return 'Expirando';
  return 'Ativo';
}

function getBadgeVariant(status: string) {
  switch (status) {
    case 'Ativo': return 'green';
    case 'Expirando': return 'amber';
    case 'Expirado': return 'gray';
    case 'Bloqueado': return 'red';
    default: return 'gray';
  }
}

function getDaysRemaining(access: Accesso) {
  const now = new Date();
  const expiration = new Date(access.expirationDate);
  const diff = Math.ceil((expiration.getTime() - now.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function AccessManagement() {
  const { config, updateConfig, addNotification } = useAppConfig();
  const [search, setSearch] = useState('');

  if (!isSuperAdmin(config.usuarioAtual) && !config.usuarioAtual.canManageAccesses) {
    return (
      <div className="rounded-[24px] bg-white p-10 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Acesso não autorizado</h2>
        <p className="mt-3 text-gray-600">Seu perfil não tem permissão para acessar esta área. Caso precise, entre em contato com um Administrador Geral.</p>
      </div>
    );
  }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccess, setNewAccess] = useState<Partial<Accesso>>({
    client: '',
    email: '',
    password: generatePassword(),
    grantedProfile: 'Administrador',
    startDate: new Date().toISOString(),
    expirationDate: calculateExpiration(new Date().toISOString(), 5),
    createdAt: new Date().toISOString(),
    blocked: false
  });
  const [durationValue, setDurationValue] = useState<number>(5);
  const [customDays, setCustomDays] = useState<number>(5);

  const filteredAccess = useMemo(() => {
    return config.accessos.filter((access) => {
      const term = search.toLowerCase();
      return (
        access.client.toLowerCase().includes(term) ||
        access.email.toLowerCase().includes(term) ||
        access.grantedProfile.toLowerCase().includes(term)
      );
    });
  }, [config.accessos, search]);

  const openNewModal = () => {
    const today = new Date().toISOString();
    const initialExpiration = calculateExpiration(today, 5);
    setNewAccess({
      client: '',
      email: '',
      password: generatePassword(),
      grantedProfile: 'Administrador',
      startDate: today,
      expirationDate: initialExpiration,
      createdAt: today,
      blocked: false
    });
    setDurationValue(5);
    setCustomDays(5);
    setIsModalOpen(true);
  };

  const handleDurationChange = (value: number) => {
    setDurationValue(value);
    const days = value === 0 ? customDays : value;
    setNewAccess((prev) => ({
      ...prev,
      expirationDate: prev.startDate ? calculateExpiration(prev.startDate, days) : calculateExpiration(new Date().toISOString(), days)
    }));
  };

  const handleCustomDaysChange = (value: number) => {
    setCustomDays(value);
    if (durationValue === 0) {
      setNewAccess((prev) => ({
        ...prev,
        expirationDate: prev.startDate ? calculateExpiration(prev.startDate, value) : calculateExpiration(new Date().toISOString(), value)
      }));
    }
  };

  const handleCreateAccess = () => {
    if (!newAccess.client || !newAccess.email || !newAccess.password || !newAccess.grantedProfile || !newAccess.startDate || !newAccess.expirationDate) {
      return;
    }
    const access: Accesso = {
      id: `access-${Date.now()}`,
      client: newAccess.client,
      email: newAccess.email,
      password: newAccess.password,
      grantedProfile: newAccess.grantedProfile as Accesso['grantedProfile'],
      startDate: newAccess.startDate,
      expirationDate: newAccess.expirationDate,
      createdAt: newAccess.createdAt || new Date().toISOString(),
      blocked: newAccess.blocked || false
    };
    updateConfig({ accessos: [access, ...config.accessos] });
    setIsModalOpen(false);
    addNotification('Novo Acesso Criado', `Acesso ${access.email} criado para ${access.client}.`, 'sistema');
  };

  const handleCopyCredentials = (access: Accesso) => {
    const payload = `Cliente: ${access.client}\nE-mail: ${access.email}\nSenha: ${access.password}`;
    navigator.clipboard.writeText(payload);
    addNotification('Credenciais copiadas', `Credenciais do acesso ${access.email} copiadas para a área de transferência.`, 'sistema');
  };

  const handleToggleBlock = (access: Accesso) => {
    updateConfig({
      accessos: config.accessos.map((item) => item.id === access.id ? { ...item, blocked: !item.blocked } : item)
    });
    addNotification(
      access.blocked ? 'Acesso reativado' : 'Acesso bloqueado',
      `O acesso de ${access.email} foi ${access.blocked ? 'reativado' : 'bloqueado'}.`,
      'sistema'
    );
  };

  const handleRenew = (access: Accesso) => {
    const expiration = new Date(access.expirationDate);
    const base = expiration > new Date() ? expiration : new Date();
    const extended = new Date(base.getTime() + 5 * 86400000).toISOString();
    updateConfig({
      accessos: config.accessos.map((item) => item.id === access.id ? { ...item, expirationDate: extended } : item)
    });
    addNotification('Acesso renovado', `O prazo do acesso ${access.email} foi estendido em 5 dias.`, 'sistema');
  };

  const handleDelete = (access: Accesso) => {
    updateConfig({
      accessos: config.accessos.filter((item) => item.id !== access.id)
    });
    addNotification('Acesso excluído', `O acesso ${access.email} foi removido.`, 'sistema');
  };

  const columns = [
    { header: 'Cliente/Empresa', accessor: 'client' },
    { header: 'E-mail de acesso', accessor: 'email' },
    { header: 'Perfil concedido', accessor: 'grantedProfile', render: (val: string) => <Badge variant="blue">{val}</Badge> },
    { header: 'Criado em', accessor: 'createdAt', render: (val: string) => formatDate(val) },
    { header: 'Expira em', accessor: 'expirationDate', render: (val: string) => formatDate(val) },
    { header: 'Dias restantes', accessor: 'expirationDate', render: (_: string, row: Accesso) => getDaysRemaining(row) },
    { header: 'Status', accessor: 'id', render: (_: string, row: Accesso) => {
      const status = getStatus(row);
      return <Badge variant={getBadgeVariant(status)}>{status}</Badge>;
    }},
    { header: '', accessor: 'id', render: (_: string, row: Accesso) => (
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" size="icon" onClick={() => handleCopyCredentials(row)} title="Copiar credenciais"><Copy size={16} /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleRenew(row)} title="Renovar prazo"><RefreshCcw size={16} /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(row)} title={row.blocked ? 'Reativar' : 'Bloquear'}>
          {row.blocked ? <Unlock size={16} /> : <Lock size={16} />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} title="Excluir"><Trash2 size={16} /></Button>
      </div>
    ) }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Gestão de Acessos"
          subtitle="Contas de clientes com prazo de avaliação." 
          actions={(
            <Button leftIcon={<Plus size={16} />} onClick={openNewModal}>Novo Acesso</Button>
          )}
        />
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 max-w-md w-full">
            <Search className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, email ou perfil..."
              className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
            <span className="font-bold uppercase tracking-wider">Total:</span>
            <span>{filteredAccess.length} acessos</span>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredAccess}
          rowClassName={(row: Accesso) => row.blocked ? 'bg-red-50/50' : ''}
        />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Acesso" size="lg">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="label-caps">Nome do Cliente/Empresa</label>
            <input
              value={newAccess.client || ''}
              onChange={(e) => setNewAccess((prev) => ({ ...prev, client: e.target.value }))}
              className="w-full rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="space-y-4">
            <label className="label-caps">E-mail de acesso</label>
            <input
              value={newAccess.email || ''}
              onChange={(e) => setNewAccess((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <label className="label-caps">Senha</label>
            <div className="flex gap-3">
              <input
                value={newAccess.password || ''}
                onChange={(e) => setNewAccess((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <Button variant="secondary" onClick={() => setNewAccess((prev) => ({ ...prev, password: generatePassword() }))}>Gerar senha</Button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="label-caps">Perfil concedido</label>
            <select
              value={newAccess.grantedProfile || 'Administrador'}
              onChange={(e) => setNewAccess((prev) => ({ ...prev, grantedProfile: e.target.value as Accesso['grantedProfile'] }))}
              className="w-full rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              {PROFILE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <label className="label-caps">Data de início</label>
            <input
              type="date"
              value={newAccess.startDate ? newAccess.startDate.slice(0, 10) : ''}
              onChange={(e) => {
                const value = e.target.value;
                const expirationDays = durationValue === 0 ? customDays : durationValue;
                setNewAccess((prev) => ({
                  ...prev,
                  startDate: `${value}T00:00:00.000Z`,
                  expirationDate: calculateExpiration(`${value}T00:00:00.000Z`, expirationDays)
                }));
              }}
              className="w-full rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-3">
              <label className="label-caps">Duração do acesso</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {DURATION_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleDurationChange(days)}
                    className={`rounded-[14px] border px-4 py-3 text-sm font-bold transition ${durationValue === days ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'}`}
                  >
                    {days === 0 ? 'Personalizado' : `${days} dias`}
                  </button>
                ))}
              </div>
              {durationValue === 0 && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={customDays}
                    onChange={(e) => handleCustomDaysChange(Number(e.target.value) || 1)}
                    className="w-28 rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="text-sm text-gray-600">dias</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <label className="label-caps">Data de expiração</label>
            <input
              type="text"
              value={newAccess.expirationDate ? formatDate(newAccess.expirationDate) : ''}
              readOnly
              className="w-full rounded-[14px] border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateAccess}>Salvar Acesso</Button>
        </div>
      </Modal>
    </div>
  );
}
