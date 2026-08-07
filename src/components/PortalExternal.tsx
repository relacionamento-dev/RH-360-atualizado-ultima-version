import React, { useState } from 'react';
import { 
  FileText, Search, Plus, Eye, MoreHorizontal, Download, 
  MapPin, CheckCircle2, AlertCircle, Clock, FileDown, 
  Calendar, CreditCard, ChevronRight, LayoutDashboard, User, 
  LogOut, Shield, Wrench, FileSignature, ArrowRight
} from 'lucide-react';
import { ToastContainer, ToastType } from './Toast';
import Modal from './Modal';
import { READONLY_INPUT } from './ui/ReadOnlyField';

export function PortalExternalLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L16 9" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M16 23L16 30" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M26 16L30 16" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M2 16L9 16" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 8L19.5 12.5" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12.5 19.5L8 24" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 24L19.5 19.5" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12.5 12.5L8 8" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Portal do Cliente</h2>
          <p className="text-sm text-gray-500 font-bold mt-1">Acesse sua conta para continuar</p>
        </div>
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">E-mail</label>
            <input
              type="email"
              defaultValue="felipe@email.com"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#F26522]/20 outline-none font-bold text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Senha</label>
            <input
              type="password"
              defaultValue="123456"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#F26522]/20 outline-none font-bold text-sm"
              required
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#F26522] focus:ring-[#F26522]" defaultChecked />
              <span className="text-xs font-bold text-gray-500">Manter conectado</span>
            </label>
            <a href="#" className="text-xs font-bold text-[#F26522] hover:underline">Esqueci minha senha</a>
          </div>
          <button type="submit" className="w-full bg-[#F26522] hover:bg-[#d9561a] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-6 shadow-md">
            Entrar <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

interface PortalExternalProps {
  view: string;
  onNavigate: (view: string) => void;
}

export default function PortalExternal({ view, onNavigate }: PortalExternalProps) {
  const [isSigned, setIsSigned] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSign = () => {
    setIsSigned(true);
    setIsSignModalOpen(false);
    addToast('success', 'Proposta aprovada e assinada. Projeto criado com sucesso.');
    setTimeout(() => {
      onNavigate('portal-external-tracking');
    }, 2000);
  };

  const handleSendTicket = () => {
    setIsTicketModalOpen(false);
    addToast('success', 'Solicitação enviada com sucesso!');
  };

  const menu = [
    { label: 'Início', view: 'portal-external-home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Minhas Propostas', view: 'portal-external-proposals', icon: <FileText className="w-5 h-5" /> },
    { label: 'Documentos', view: 'portal-external-docs', icon: <FileSignature className="w-5 h-5" /> },
    { label: 'Atendimento', view: 'portal-external-tickets', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Andamento', view: 'portal-external-tracking', icon: <Clock className="w-5 h-5" /> },
    { label: 'Minha Conta', view: 'portal-external-account', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E293B] text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-xl font-black tracking-tight text-white">RH360</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Portal do Colaborador</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menu.map(item => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                view === item.view ? 'bg-[#F26522] text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-black">FA</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Felipe Albuquerque</p>
              <button onClick={() => onNavigate('portal-external-login')} className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 mt-1">
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          {view === 'portal-external-home' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Olá, Felipe Albuquerque!</h1>
                <p className="text-gray-500 font-bold mt-1">Bem-vindo ao seu portal de acompanhamento.</p>
              </div>

              {!isSigned ? (
                <div className="bg-white border border-orange-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-orange-100 text-[#F26522] rounded-2xl flex items-center justify-center shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900">Minha Solicitação</h3>
                    <p className="text-gray-500 font-bold mt-1">Você tem uma proposta aguardando sua revisão e assinatura.</p>
                  </div>
                  <button onClick={() => onNavigate('portal-external-proposals')} className="bg-[#F26522] text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-[#d9561a]">
                    Revisar Proposta
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-green-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900">Minhas Movimentações</h3>
                    <p className="text-gray-500 font-bold mt-1">Seu projeto (PRJ-2025-0432) está em andamento.</p>
                  </div>
                  <button onClick={() => onNavigate('portal-external-tracking')} className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-green-700">
                    Acompanhar Etapas
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => onNavigate('portal-external-docs')} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-[#F26522] cursor-pointer group">
                  <FileSignature className="w-8 h-8 text-gray-400 group-hover:text-[#F26522] mb-4" />
                  <h4 className="font-black text-gray-900">Documentos</h4>
                  <p className="text-sm font-bold text-gray-500 mt-1">Enviar fatura ou ver contratos.</p>
                </div>
                <div onClick={() => onNavigate('portal-external-tickets')} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-[#F26522] cursor-pointer group">
                  <Wrench className="w-8 h-8 text-gray-400 group-hover:text-[#F26522] mb-4" />
                  <h4 className="font-black text-gray-900">Atendimento</h4>
                  <p className="text-sm font-bold text-gray-500 mt-1">Abrir chamados ou acionar garantia.</p>
                </div>
                <div onClick={() => onNavigate('portal-external-tracking')} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-[#F26522] cursor-pointer group">
                  <Clock className="w-8 h-8 text-gray-400 group-hover:text-[#F26522] mb-4" />
                  <h4 className="font-black text-gray-900">Andamento</h4>
                  <p className="text-sm font-bold text-gray-500 mt-1">Próxima etapa do seu projeto.</p>
                </div>
              </div>
            </div>
          )}

          {view === 'portal-external-proposals' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Minhas Propostas</h1>
                <p className="text-gray-500 font-bold mt-1">Orçamentos gerados para você.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Proposta</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Validade</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-[#F26522]">PROP-2025-0432</td>
                      <td className="px-6 py-4 font-black text-gray-900">R$ 312.500,00</td>
                      <td className="px-6 py-4 font-bold text-gray-500">15/06/2025</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          isSigned ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {isSigned ? 'Aceita' : 'Em Assinatura'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isSigned ? (
                          <button onClick={() => setIsSignModalOpen(true)} className="bg-[#F26522] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d9561a]">
                            Aprovar e Assinar
                          </button>
                        ) : (
                          <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200">
                            Ver PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'portal-external-docs' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Documentos & Assinaturas</h1>
                <p className="text-gray-500 font-bold mt-1">Envie documentos ou acesse arquivos do projeto.</p>
              </div>
              <div className="flex gap-4 mb-6">
                <button className="bg-[#F26522] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Pendentes</button>
                <button className="bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold">Histórico</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center">
                <FileDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-black text-gray-900 mb-2">Enviar Fatura de Energia</h3>
                <p className="text-gray-500 font-bold text-sm mb-6">Precisamos da sua última fatura para dimensionamento.</p>
                <button className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800">
                  Fazer Upload (PDF ou Imagem)
                </button>
              </div>
            </div>
          )}

          {view === 'portal-external-tickets' && (
            <div className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Atendimento e Garantia</h1>
                  <p className="text-gray-500 font-bold mt-1">Abra chamados para suporte ou dúvidas.</p>
                </div>
                <button onClick={() => setIsTicketModalOpen(true)} className="bg-[#F26522] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#d9561a]">
                  Nova Solicitação
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden p-8 text-center">
                <p className="text-gray-500 font-bold">Nenhum chamado aberto no momento.</p>
              </div>
            </div>
          )}

          {view === 'portal-external-tracking' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Andamento do Processo</h1>
                <p className="text-gray-500 font-bold mt-1">Acompanhe as etapas do seu projeto solar.</p>
              </div>

              {!isSigned ? (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-gray-900">Aguardando Aprovação</h3>
                  <p className="text-gray-500 font-bold mt-2">Revise e assine sua proposta para iniciarmos o projeto.</p>
                  <button onClick={() => onNavigate('portal-external-proposals')} className="bg-[#F26522] text-white mt-6 px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#d9561a]">
                    Ver Proposta
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                    <div className="h-full bg-[#F26522]" style={{ width: '20%' }}></div>
                  </div>
                  <div className="flex items-center justify-between mb-8 mt-4">
                    <div>
                      <p className="text-xs font-black text-[#F26522] uppercase tracking-widest">Projeto PRJ-2025-0432</p>
                      <h2 className="text-2xl font-black text-gray-900">Em Engenharia</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Concluído</p>
                      <p className="text-2xl font-black text-gray-900">20%</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                    <p className="font-bold text-orange-900">Seu projeto está sendo dimensionado por nossos engenheiros.</p>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                      <p className="font-bold text-gray-900">Proposta Aprovada</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full border-4 border-[#F26522] bg-white"></div>
                      <p className="font-black text-[#F26522]">Engenharia e Projetos</p>
                    </div>
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="w-8 h-8 rounded-full border-4 border-gray-300 bg-white"></div>
                      <p className="font-bold text-gray-500">Homologação na Concessionária</p>
                    </div>
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="w-8 h-8 rounded-full border-4 border-gray-300 bg-white"></div>
                      <p className="font-bold text-gray-500">Logística e Instalação</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'portal-external-account' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Minha Conta</h1>
                <p className="text-gray-500 font-bold mt-1">Seus dados pessoais.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm max-w-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Nome</label>
                    <input type="text" disabled defaultValue="Felipe Albuquerque" className={`w-full px-4 py-3 border rounded-xl font-bold outline-none ${READONLY_INPUT}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">E-mail</label>
                    <input type="email" disabled defaultValue="felipe@email.com" className={`w-full px-4 py-3 border rounded-xl font-bold outline-none ${READONLY_INPUT}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">CPF / CNPJ</label>
                    <input type="text" disabled defaultValue="000.000.000-00" className={`w-full px-4 py-3 border rounded-xl font-bold outline-none ${READONLY_INPUT}`} />
                  </div>
                </div>
                <button className="mt-8 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-200">
                  Trocar Senha
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Assinar Proposta (ZapSign Simulado)"
        size="md"
        footer={
          <>
            <button onClick={() => setIsSignModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-gray-500">Cancelar</button>
            <button onClick={handleSign} className="px-6 py-3 rounded-2xl font-bold bg-[#F26522] text-white shadow-md">Assinar Digitalmente</button>
          </>
        }
      >
        <div className="text-center py-6">
          <FileSignature className="w-16 h-16 text-[#F26522] mx-auto mb-4" />
          <h3 className="font-black text-gray-900">Proposta PROP-2025-0432</h3>
          <p className="text-gray-500 font-bold mt-2">Ao assinar, você concorda com os termos propostos. Um projeto será criado automaticamente em nosso sistema.</p>
        </div>
      </Modal>

      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Nova Solicitação"
        size="md"
        footer={
          <>
            <button onClick={() => setIsTicketModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-gray-500">Cancelar</button>
            <button onClick={handleSendTicket} className="px-6 py-3 rounded-2xl font-bold bg-[#F26522] text-white shadow-md">Enviar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Categoria</label>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none">
              <option>Dúvida Técnica</option>
              <option>Reclamação</option>
              <option>Acionar Garantia</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Assunto</label>
            <input type="text" placeholder="Ex: Inversor desligando" className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Descrição</label>
            <textarea rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none" placeholder="Detalhes do problema..." />
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
