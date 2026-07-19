import React, { useState } from 'react';
import { 
  Search, Plus, Filter, ChevronDown, MoreHorizontal, Eye, Clock, 
  CheckCircle2, XCircle, FileText, Download, Calendar, ArrowRight, 
  User as UserIcon, Trash2, Edit3, CheckCircle, AlertCircle, TrendingUp,
  BarChart3, PieChart, Activity, Users, DollarSign, Package, Truck, 
  ShieldCheck, HardHat, Headphones, Zap, Globe, MessageSquare, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Drawer from './Drawer';
import { ToastContainer, ToastType } from './Toast';

export interface ModuleKPI {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export interface ModuleAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export interface ModuleTableColumn {
  header: string;
  accessor: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface ModuleViewProps {
  title: string;
  subtitle: string;
  kpis?: ModuleKPI[];
  actions?: ModuleAction[];
  columns?: ModuleTableColumn[];
  data?: any[];
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  searchPlaceholder?: string;
  hideHeader?: boolean;
}

export default function ModuleView({
  title,
  subtitle,
  kpis = [],
  actions = [],
  columns = [],
  data = [],
  tabs = [],
  activeTab,
  onTabChange,
  searchPlaceholder = "Buscar...",
  hideHeader = false
}: ModuleViewProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleExport = () => {
    addToast('success', 'Relatório exportado com sucesso! O download começará em breve.');
  };

  const content = (
    <>
      {/* Table */}
      {columns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-4">{col.header}</th>
                ))}
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length > 0 ? (
                data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                    {columns.map((col, j) => (
                      <td key={j} className="px-6 py-4">
                        {col.render ? col.render(item[col.accessor], item) : (
                          <span className="text-sm font-bold text-gray-700">{item[col.accessor]}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors" title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative group/menu">
                          <button className="p-1.5 text-gray-400 hover:text-[#F26522] transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
                            <button className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                              <Edit3 className="w-3.5 h-3.5" /> Editar
                            </button>
                            <button className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" /> Detalhes
                            </button>
                            <button className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-20 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">Nenhum registro encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const filterDrawer = (
    <Drawer
      isOpen={isFilterDrawerOpen}
      onClose={() => setIsFilterDrawerOpen(false)}
      title="Filtros Avançados"
      footer={
        <>
          <button 
            onClick={() => setIsFilterDrawerOpen(false)}
            className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Limpar filtros
          </button>
          <button 
            onClick={() => setIsFilterDrawerOpen(false)}
            className="px-6 py-3 rounded-2xl font-bold bg-[#F26522] text-white hover:bg-[#d9561a] transition-colors"
          >
            Aplicar filtros
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período</label>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
            <option>Todos</option>
            <option>Ativo</option>
            <option>Pendente</option>
            <option>Concluído</option>
            <option>Cancelado</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável</label>
          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
            <option>Todos</option>
            <option>Mariana Souza</option>
            <option>Ana Paula Lima</option>
            <option>Ricardo Gomes</option>
          </select>
        </div>
      </div>
    </Drawer>
  );

  if (hideHeader) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {content}
        {filterDrawer}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F9FAFB]">
      <main className="p-8 max-w-[1500px] mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl flex items-center gap-2 text-sm transition-all hover:bg-gray-50 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className={`
                  font-bold py-3 px-6 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm
                  ${action.variant === 'primary' ? 'bg-[#F26522] hover:bg-[#d9561a] text-white shadow-orange-500/20 shadow-lg' : 
                    action.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg' :
                    'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                    <span className="text-gray-400 group-hover:text-[#F26522] transition-colors">{kpi.icon}</span>
                  </div>
                  {kpi.trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${kpi.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                      {kpi.trend}
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{kpi.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs, Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm mb-8">
          {(tabs.length > 0 || searchPlaceholder) && (
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {tabs.length > 0 ? (
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-2xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange?.(tab.id)}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1" />
              )}
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder={searchPlaceholder} 
                    className="pl-9 pr-4 py-2 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]/20 min-w-[250px]"
                  />
                </div>
                <button 
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
              </div>
            </div>
          )}

          {content}
        </div>
      </main>
      {filterDrawer}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
