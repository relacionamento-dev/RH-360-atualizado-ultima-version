import React from 'react';
import { 
  Building2, Users, Target, Share2, Cpu, 
  Search, Shield, BarChart3, Clock, 
  ChevronRight, Globe,
  MoreHorizontal, Plus, Download, Edit2,
  Power, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { useAppConfig } from '../contexts/AppConfigContext';
import { isSuperAdmin } from '../utils/permissions';

import AdminOverview from './admin/AdminOverview';
import AdminOrganization from './admin/AdminOrganization';
import AdminAccess from './admin/AdminAccess';
import AdminPerfis from './admin/AdminPerfis';
import AdminPerfilEditor from './admin/AdminPerfilEditor';
import { ROTA_PERFIL_EDITAR } from './admin/perfilForm';
import AdminImplantacao from './admin/AdminImplantacao';
import AdminProcesses from './admin/AdminProcesses';
import AdminIntranet from './admin/AdminIntranet';
import AdminIntegrations from './admin/AdminIntegrations';
import AdminAI from './admin/AdminAI';
import AdminAudit from './admin/AdminAudit';

type AdminTab = 'overview' | 'org' | 'implantacao' | 'access' | 'perfis' | 'processes' | 'intranet' | 'integrations' | 'ai' | 'audit';

const ABAS: AdminTab[] = [
  'overview', 'org', 'implantacao', 'access', 'perfis', 'processes', 'intranet', 'integrations', 'ai', 'audit'
];

/** Rota canônica de cada aba: `admin-perfis`, `admin-org`… */
export const viewDaAbaAdmin = (aba: AdminTab) => `admin-${aba}`;

/**
 * A aba que a rota pede. Aceita a rota canônica (`admin-perfis`), a entrada
 * geral (`admin`/`configuracoes`) e o item de menu próprio das Integrações
 * (`integrations`), que abre a Central Adm já naquela aba.
 */
const abaDaView = (view: string): AdminTab => {
  const canonica = ABAS.find(a => view === viewDaAbaAdmin(a));
  if (canonica) return canonica;
  // A edição de perfil é uma tela DENTRO da aba Perfis: a aba segue acesa.
  if (view === ROTA_PERFIL_EDITAR) return 'perfis';
  if (view === 'integrations') return 'integrations';
  if (view === 'intranet-admin') return 'intranet';
  return 'overview';
};

export default function AdminModule({ view = 'admin' }: { view?: string }) {
  const { config, updateConfig } = useAppConfig();
  // Administrador Geral enxerga todas as abas, sem exceção.
  const isAdmin = isSuperAdmin(config.usuarioAtual) || config.usuarioAtual.profile === 'Administrador';

  const activeTab = abaDaView(view);

  /**
   * A aba VIRA ROTA. Antes ela era estado interno, então `activeView` ficava
   * congelada no caminho de entrada: quem chegava por "Integrações" e clicava
   * em "Perfis de Acesso" continuava com o menu acendendo Integrações, porque
   * a rota nunca mudava. Mesma correção de rota canônica que 'solicitacoes'
   * e 'requests' já receberam em App.tsx.
   */
  const setActiveTab = (aba: AdminTab) => updateConfig({ activeView: viewDaAbaAdmin(aba) });

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={18} />, color: 'bg-blue-500' },
    { id: 'org', label: 'Organização', icon: <Building2 size={18} />, color: 'bg-indigo-500' },
    { id: 'access', label: 'Pessoas e Acessos', icon: <Users size={18} />, color: 'bg-orange-500' },
    { id: 'implantacao', label: 'Implantação de Cliente', icon: <Building2 size={18} />, color: 'bg-rose-500' },
    { id: 'perfis', label: 'Perfis de Acesso', icon: <Shield size={18} />, color: 'bg-amber-500' },
    { id: 'processes', label: 'Processos', icon: <Target size={18} />, color: 'bg-emerald-500' },
    { id: 'intranet', label: 'Intranet', icon: <Globe size={18} />, color: 'bg-sky-500' },
    { id: 'integrations', label: 'Integrações', icon: <Share2 size={18} />, color: 'bg-purple-500' },
    { id: 'ai', label: 'Inteligência Artificial', icon: <Cpu size={18} />, color: 'bg-pink-500' },
    { id: 'audit', label: 'Auditoria', icon: <Shield size={18} />, color: 'bg-gray-500' },
  ];

  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'access') return isAdmin;
    if (tab.id === 'perfis') return isAdmin;
    // Implantação é operação da JYNX: só o Administrador Geral.
    if (tab.id === 'implantacao') return isSuperAdmin(config.usuarioAtual);
    if (tab.id === 'integrations') return isAdmin;
    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview onNavigate={setActiveTab} />;
      case 'org': return <AdminOrganization />;
      case 'access': return <AdminAccess />;
      case 'perfis': return view === ROTA_PERFIL_EDITAR ? <AdminPerfilEditor /> : <AdminPerfis />;
      case 'implantacao': return <AdminImplantacao />;
      case 'processes': return <AdminProcesses />;
      case 'intranet': return <AdminIntranet />;
      case 'integrations': return <AdminIntegrations />;
      case 'ai': return <AdminAI />;
      case 'audit': return <AdminAudit />;
      default: return <AdminOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="bg-white p-3 rounded-[12px] border border-gray-100 space-y-0.5">
          <h3 className="label-caps px-3 py-2">Administração</h3>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white font-bold'
                  : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
