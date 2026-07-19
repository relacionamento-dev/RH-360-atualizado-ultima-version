const fs = require('fs');

const content = `import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Calendar, Clock, 
  DollarSign, Target, Activity, Phone, Mail, MessageSquare, 
  MapPin, User, ChevronRight, Eye, Trash2, Edit3, 
  AlertCircle, CheckCircle2, FileText, Send, Paperclip, Zap, X, ArrowUpRight,
  Download, ChevronDown, List, LayoutGrid
} from 'lucide-react';
import { Project } from '../types';
import Modal from './Modal';
import Drawer from './Drawer';
import { ToastContainer, ToastType } from './Toast';

interface CrmProps {
  onBack: () => void;
  onNavigate: (view: string, projectId?: string) => void;
  projects: Project[];
}

interface KanbanCard {
  id: string;
  code: string;
  customer: string;
  phone: string;
  origin: string;
  consumption: string;
  power: string;
  value: string;
  seller: string;
  nextActivity: string;
  status: string;
  city: string;
  email: string;
  observations?: string;
  originColor: string;
}

const COLUMNS = [
  { id: 'Novo lead', title: 'Novo lead', color: 'bg-blue-500', text: 'text-blue-500' },
  { id: 'Em contato', title: 'Em contato', color: 'bg-indigo-500', text: 'text-indigo-500' },
  { id: 'Conta de energia recebida', title: 'Conta de energia', color: 'bg-purple-500', text: 'text-purple-500' },
  { id: 'Orçamento em elaboração', title: 'Orçamento em elab.', color: 'bg-yellow-500', text: 'text-yellow-500' },
  { id: 'Proposta enviada', title: 'Proposta enviada', color: 'bg-orange-500', text: 'text-orange-500' },
  { id: 'Em negociação', title: 'Em negociação', color: 'bg-pink-500', text: 'text-pink-500' },
  { id: 'Fechado ganho', title: 'Fechado ganho', color: 'bg-green-500', text: 'text-green-500' },
  { id: 'Fechado perdido', title: 'Fechado perdido', color: 'bg-red-500', text: 'text-red-500' },
];

export default function Crm({ onBack, onNavigate, projects }: CrmProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const [cards, setCards] = useState<KanbanCard[]>([
    {
      id: '1',
      code: 'OP-2025-0432',
      customer: 'Felipe Albuquerque',
      phone: '(61) 99888-7766',
      origin: 'WhatsApp',
      consumption: '680',
      power: '8,00',
      value: '31250',
      seller: 'Ana Paula Lima',
      nextActivity: 'Implementação Engenharia',
      status: 'Fechado ganho',
      city: 'Brasília/DF',
      email: 'felipe.alb@gmail.com',
      observations: 'Proposta aceita e assinada digitalmente.',
      originColor: 'text-green-600 bg-green-50'
    },
    {
      id: '2',
      code: 'OP-2025-0435',
      customer: 'João Martins',
      phone: '(11) 98765-4321',
      origin: 'Site',
      consumption: '750',
      power: '8,40',
      value: '36800',
      seller: 'Ricardo Silva',
      nextActivity: 'Ligar para confirmar dados',
      status: 'Em contato',
      city: 'São Paulo/SP',
      email: 'joao.martins@gmail.com',
      originColor: 'text-blue-600 bg-blue-50'
    },
    {
      id: '3',
      code: 'OP-2025-0433',
      customer: 'Mercado Bom Preço',
      phone: '(11) 98765-4321',
      origin: 'Indicação',
      consumption: '2500',
      power: '30,24',
      value: '132450',
      seller: 'Juliana Costa',
      nextActivity: 'Follow up da proposta',
      status: 'Proposta enviada',
      city: 'São Paulo/SP',
      email: 'contato@bompreco.com.br',
      originColor: 'text-emerald-600 bg-emerald-50'
    },
    {
      id: '4',
      code: 'OP-2025-0436',
      customer: 'Condomínio Vila Verde',
      phone: '(21) 98888-7777',
      origin: 'Instagram',
      consumption: '1500',
      power: '15,12',
      value: '66500',
      seller: 'Ana Paula Lima',
      nextActivity: 'Solicitar conta de energia',
      status: 'Novo lead',
      city: 'Rio de Janeiro/RJ',
      email: 'sindico@vilaverde.com.br',
      originColor: 'text-purple-600 bg-purple-50'
    },
    {
      id: '5',
      code: 'OP-2025-0437',
      customer: 'Escola Mundo Melhor',
      phone: '(62) 99999-1111',
      origin: 'Indicação',
      consumption: '1800',
      power: '22,68',
      value: '99000',
      seller: 'Ricardo Silva',
      nextActivity: 'Reunião de negociação',
      status: 'Em negociação',
      city: 'Goiânia/GO',
      email: 'diretoria@mundomelhor.edu.br',
      originColor: 'text-emerald-600 bg-emerald-50'
    }
  ]);

  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isNewOpportunityModalOpen, setIsNewOpportunityModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
    setIsSidePanelOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('cardId', cardId);
  };

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    if (statusId === 'Fechado perdido') {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        setSelectedCard(card);
        setIsLossModalOpen(true);
      }
    } else {
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, status: statusId } : card
      ));
      addToast('success', \`Status atualizado para \${statusId}\`);
    }
  };

  const handleLossSubmit = () => {
    if (selectedCard) {
      setCards(prev => prev.map(card => 
        card.id === selectedCard.id ? { ...card, status: 'Fechado perdido' } : card
      ));
      setIsLossModalOpen(false);
      setIsSidePanelOpen(false);
      addToast('warning', 'Oportunidade marcada como perdida.');
    }
  };

  const handleCreateBudget = () => {
    onNavigate('energy-bill');
  };
  
  const formatCurrency = (value: string) => {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // KPIs
  const totalOpps = cards.length;
  const potentialValue = cards.reduce((acc, card) => acc + Number(card.value), 0);
  const wonCount = cards.filter(c => c.status === 'Fechado ganho').length;
  const conversionRate = totalOpps > 0 ? Math.round((wonCount / totalOpps) * 100) : 0;
  const inNegotiation = cards.filter(c => c.status === 'Em negociação').length;

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-none">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Oportunidades</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Gestão comercial e funil de vendas em tempo real.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('list')}
                className={\`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors \${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}\`}
              >
                <List className="w-4 h-4" /> Lista
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={\`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors \${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}\`}
              >
                <LayoutGrid className="w-4 h-4" /> Kanban
              </button>
            </div>
            
            <div className="relative ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar oportunidade..."
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-[#F26522]/20 outline-none transition-all"
              />
            </div>
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsNewOpportunityModalOpen(true)}
              className="bg-[#F26522] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-[#d9561a] transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2 uppercase tracking-wider"
            >
              <Plus className="w-5 h-5" /> Nova Oportunidade
            </button>
          </div>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="px-8 py-4 bg-white border-b border-gray-100 flex-none">
        <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-4">
           <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Oportunidades</p>
                <p className="text-xl font-black text-gray-900">{totalOpps}</p>
              </div>
           </div>
           <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Potencial</p>
                <p className="text-xl font-black text-gray-900">{formatCurrency(potentialValue.toString())}</p>
              </div>
           </div>
           <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxa de Conversão</p>
                <p className="text-xl font-black text-gray-900">{conversionRate}%</p>
              </div>
           </div>
           <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Negociação</p>
                <p className="text-xl font-black text-gray-900">{inNegotiation}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="h-full p-8 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <th className="px-6 py-4">Código</th>
                     <th className="px-6 py-4">Cliente</th>
                     <th className="px-6 py-4">Telefone</th>
                     <th className="px-6 py-4">Etapa</th>
                     <th className="px-6 py-4">Consumo</th>
                     <th className="px-6 py-4">Potência</th>
                     <th className="px-6 py-4">Valor</th>
                     <th className="px-6 py-4">Vendedor</th>
                     <th className="px-6 py-4">Próxima Atividade</th>
                     <th className="px-6 py-4 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {cards.map(card => {
                     const stageColor = COLUMNS.find(c => c.id === card.status)?.color || 'bg-gray-500';
                     const stageText = COLUMNS.find(c => c.id === card.status)?.text || 'text-gray-500';
                     return (
                       <tr key={card.id} onClick={() => handleCardClick(card)} className="hover:bg-gray-50/50 cursor-pointer transition-colors group">
                         <td className="px-6 py-4 font-mono font-bold text-[#F26522] text-xs">{card.code}</td>
                         <td className="px-6 py-4 font-bold text-gray-900 text-sm">{card.customer}</td>
                         <td className="px-6 py-4 text-xs font-bold text-gray-500">{card.phone}</td>
                         <td className="px-6 py-4">
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-50 border border-gray-200">
                             <div className={\`w-2 h-2 rounded-full \${stageColor}\`}></div>
                             <span className={stageText}>{card.status}</span>
                           </span>
                         </td>
                         <td className="px-6 py-4 text-xs font-bold text-gray-600">{card.consumption} kWh</td>
                         <td className="px-6 py-4 text-xs font-bold text-gray-600">{card.power} kWp</td>
                         <td className="px-6 py-4 text-sm font-black text-gray-900">{formatCurrency(card.value)}</td>
                         <td className="px-6 py-4 text-xs font-bold text-gray-700 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px]">
                              <User className="w-3 h-3" />
                            </div>
                            {card.seller.split(' ')[0]}
                         </td>
                         <td className="px-6 py-4 text-xs font-bold text-gray-500 truncate max-w-[150px]">{card.nextActivity}</td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                             <button onClick={() => handleCardClick(card)} className="p-2 text-gray-400 hover:text-[#F26522] transition-colors"><Eye className="w-4 h-4" /></button>
                             <div className="relative group/actions">
                               <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                               <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible z-20 overflow-hidden">
                                 <button onClick={() => setIsActivityModalOpen(true)} className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50">Nova atividade</button>
                                 <button onClick={handleCreateBudget} className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50">Criar orçamento</button>
                                 <button className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50">Editar</button>
                                 <button onClick={() => { setSelectedCard(card); setIsLossModalOpen(true); }} className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50">Marcar como perdido</button>
                               </div>
                             </div>
                           </div>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
               {cards.length === 0 && (
                 <div className="p-12 text-center text-gray-400 font-bold">Nenhuma oportunidade encontrada.</div>
               )}
            </div>
          </div>
        ) : (
          <div className="h-full px-8 py-6 overflow-x-auto snap-x snap-mandatory flex gap-4 custom-scrollbar">
            {COLUMNS.map(column => {
              const columnCards = cards.filter(c => c.status === column.id);
              const columnTotal = columnCards.reduce((acc, card) => acc + Number(card.value), 0);
              
              return (
                <div 
                  key={column.id} 
                  className="w-[280px] lg:w-[320px] flex-none snap-start flex flex-col h-full max-h-full"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="flex items-center justify-between mb-3 bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm flex-none">
                    <div className="flex items-center gap-2">
                      <div className={\`w-3 h-3 rounded-full \${column.color}\`}></div>
                      <h3 className="font-bold text-gray-900 text-sm">{column.title}</h3>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{columnCards.length}</span>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-[#F26522] transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  
                  {columnCards.length > 0 && (
                     <div className="mb-2 text-right">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         {formatCurrency(columnTotal.toString())}
                       </span>
                     </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-8 custom-scrollbar">
                    {columnCards.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                          <Activity className="w-4 h-4 text-gray-300" />
                        </div>
                        <p className="text-xs font-bold text-gray-400">Nenhuma oportunidade</p>
                      </div>
                    ) : (
                      columnCards.map(card => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, card.id)}
                          onClick={() => handleCardClick(card)}
                          className="bg-white border border-gray-200 rounded-2xl p-4 cursor-grab active:cursor-grabbing hover:border-[#F26522] hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-400">{card.code}</span>
                              <h4 className="font-black text-gray-900 text-sm leading-tight mt-0.5">{card.customer}</h4>
                            </div>
                            <div className="relative group/cardactions" onClick={e => e.stopPropagation()}>
                              <button className="p-1 text-gray-300 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover/cardactions:opacity-100 group-hover/cardactions:visible z-20 overflow-hidden">
                                <button onClick={() => setIsActivityModalOpen(true)} className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50">Nova atividade</button>
                                <button onClick={handleCreateBudget} className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50">Criar orçamento</button>
                                <button onClick={() => { setSelectedCard(card); setIsLossModalOpen(true); }} className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50">Perdido</button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded text-[10px] font-black">{card.consumption} kWh</span>
                            <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded text-[10px] font-black">{card.power} kWp</span>
                          </div>
                          
                          <div className="flex items-end justify-between mt-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500" title={card.seller}>
                                {card.seller.charAt(0)}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold truncate max-w-[100px]">Próx: {card.nextActivity}</div>
                            </div>
                            <span className="text-xs font-black text-gray-900">{formatCurrency(card.value)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Drawer 
        isOpen={isSidePanelOpen} 
        onClose={() => setIsSidePanelOpen(false)} 
        title={\`Detalhes \${selectedCard?.code}\`}
      >
        {selectedCard && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F26522]">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedCard.customer}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase \${selectedCard.originColor}\`}>
                    {selectedCard.origin}
                  </span>
                  <span className="text-xs font-bold text-gray-500">{selectedCard.city}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fase Atual</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-white border border-gray-200">
                  <div className={\`w-2 h-2 rounded-full \${COLUMNS.find(c => c.id === selectedCard.status)?.color}\`}></div>
                  {selectedCard.status}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Próxima Atividade</p>
                  <p className="text-sm font-bold text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">{selectedCard.nextActivity}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Consumo</p>
                <p className="text-sm font-black text-gray-900">{selectedCard.consumption} kWh</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Potência</p>
                <p className="text-sm font-black text-gray-900">{selectedCard.power} kWp</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl col-span-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Potencial</p>
                <p className="text-lg font-black text-[#F26522]">{formatCurrency(selectedCard.value)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Contatos</h4>
              <div className="space-y-2">
                <a href={\`tel:\${selectedCard.phone}\`} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-colors">
                    <Phone className="w-4 h-4 text-gray-400 group-hover:text-[#F26522]" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{selectedCard.phone}</span>
                </a>
                <a href={\`mailto:\${selectedCard.email}\`} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-colors">
                    <Mail className="w-4 h-4 text-gray-400 group-hover:text-[#F26522]" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{selectedCard.email}</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ações Rápidas</h4>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setIsSidePanelOpen(false); setIsActivityModalOpen(true); }} className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Agendar
                </button>
                <button onClick={handleCreateBudget} className="p-3 bg-[#F26522] text-white rounded-xl text-sm font-bold hover:bg-[#d9561a] shadow-md flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> Orçar
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Fechado Perdido */}
      <Modal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        title="Oportunidade Perdida"
        size="md"
        footer={
          <>
            <button 
              onClick={() => setIsLossModalOpen(false)}
              className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleLossSubmit}
              className="px-6 py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20"
            >
              Confirmar Perda
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">Você está marcando esta oportunidade como perdida. Esta ação atualizará suas métricas de conversão.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivo da Perda</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20">
              <option>Preço alto</option>
              <option>Fechou com concorrente</option>
              <option>Falta de limite financeiro</option>
              <option>Desistiu do projeto</option>
              <option>Sem resposta (Ghosting)</option>
              <option>Outros</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações adicionais (Opcional)</label>
            <textarea 
              rows={4}
              placeholder="Detalhe o motivo para histórico..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Nova Atividade */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Nova Atividade"
        size="md"
        footer={
          <>
            <button 
              onClick={() => setIsActivityModalOpen(false)}
              className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsActivityModalOpen(false);
                addToast('success', 'Atividade agendada com sucesso!');
              }}
              className="px-6 py-3 rounded-2xl font-bold bg-[#F26522] text-white hover:bg-[#d9561a] transition-colors shadow-lg shadow-orange-900/20"
            >
              Agendar Atividade
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Atividade</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20">
                <option>Ligação</option>
                <option>WhatsApp</option>
                <option>E-mail</option>
                <option>Visita Técnica</option>
                <option>Reunião</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prioridade</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20">
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título da Atividade</label>
            <input 
              type="text" 
              placeholder="Ex: Follow-up da proposta enviada"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
              <input 
                type="date" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
              <input 
                type="time" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição / Pauta</label>
            <textarea 
              rows={3}
              placeholder="O que será tratado nesta atividade?"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#F26522]/20"
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Nova Oportunidade */}
      <Modal
        isOpen={isNewOpportunityModalOpen}
        onClose={() => setIsNewOpportunityModalOpen(false)}
        title="Nova Oportunidade"
        size="lg"
        footer={
          <>
            <button 
              onClick={() => setIsNewOpportunityModalOpen(false)}
              className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsNewOpportunityModalOpen(false);
                addToast('success', 'Nova oportunidade criada com sucesso!');
              }}
              className="px-6 py-3 rounded-2xl font-bold bg-[#F26522] text-white hover:bg-[#d9561a] transition-colors shadow-lg shadow-orange-900/20"
            >
              Criar Oportunidade
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-8">
           <div className="space-y-6">
             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
               <User className="w-4 h-4 text-[#F26522]" /> Dados do Cliente
             </h4>
             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</label>
                 <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20">
                    <option>Selecione um cliente...</option>
                    <option>Felipe Albuquerque</option>
                    <option>Mercado Bom Preço</option>
                    <option value="new">+ Cadastrar Novo Cliente</option>
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Origem</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20">
                        <option>WhatsApp</option>
                        <option>Instagram</option>
                        <option>Indicação</option>
                        <option>Site</option>
                        <option>Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendedor</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20">
                        <option>Ana Paula Lima</option>
                        <option>Ricardo Silva</option>
                        <option>Juliana Costa</option>
                    </select>
                  </div>
               </div>
             </div>
           </div>
           <div className="space-y-6">
             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
               <Zap className="w-4 h-4 text-yellow-500" /> Dados Técnicos
             </h4>
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consumo (kWh)</label>
                    <input type="text" placeholder="Ex: 680" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cidade/UF</label>
                    <input type="text" placeholder="Ex: Brasília/DF" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F26522]/20" />
                  </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observação</label>
                 <textarea rows={3} placeholder="Observações comerciais iniciais..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#F26522]/20" />
               </div>
             </div>
           </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
`

fs.writeFileSync('src/components/Crm.tsx', content);
