import React, { useState } from 'react';
import { 
  Globe, Search, Plus, MoreHorizontal, MessageSquare, Heart, Share2, 
  Image as ImageIcon, Paperclip, Send, Calendar, ChevronLeft, ChevronRight, 
  TrendingUp, Award, Bell, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar } from './ui/Misc';

import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';

interface IntranetModuleProps {
  onNavigate?: (view: string) => void;
}

export default function IntranetModule({ onNavigate }: IntranetModuleProps) {
  const { config, createAnnouncement } = useAppConfig();
  const { addToast } = useToast();
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [postContent, setPostContent] = useState('');

  const announcements = config.comunicados.length > 0 ? config.comunicados.slice(0, 2).map(c => ({
    id: c.id,
    title: c.title,
    date: c.date,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' // Placeholder image
  })) : [
    { id: '1', title: 'Nova Política de Trabalho Híbrido: Mais flexibilidade para você', date: '10 Jul 2026', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' },
    { id: '2', title: 'Evento de Integração: Participe do nosso próximo Hackathon interno', date: '12 Jul 2026', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1200' },
  ];

  // Safeguard activeAnnouncement index
  const safeActiveAnnouncement = activeAnnouncement < announcements.length ? activeAnnouncement : 0;

  const handlePublish = () => {
    if (!postContent.trim()) return;
    
    createAnnouncement({
      title: postContent.slice(0, 50) + (postContent.length > 50 ? '...' : ''),
      content: postContent,
      category: 'Geral',
      priority: 'Normal'
    });
    
    setPostContent('');
    addToast('Comunicado publicado com sucesso!', 'success');
  };

  const handlePhotoClick = () => {
    addToast('Funcionalidade de upload de foto em breve.', 'info');
  };

  const handleAttachmentClick = () => {
    addToast('Funcionalidade de anexo em breve.', 'info');
  };

  const handleSuggestContent = () => {
    addToast('Sua sugestão foi enviada para o time de Comunicação Corporativa.', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Intranet Corporativa" 
        subtitle="O canal oficial de comunicação e engajamento do ecossistema RH360."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={<Bell size={16} />}>Notificações</Button>
            <Button leftIcon={<Plus size={16} />}>Novo Comunicado</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative h-[300px] rounded-[24px] overflow-hidden group shadow-lg shadow-orange-50">
             <AnimatePresence mode="wait">
                <motion.div
                  key={safeActiveAnnouncement}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <img src={announcements[safeActiveAnnouncement].image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Banner" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 space-y-2">
                     <Badge variant="blue" size="sm" className="bg-[var(--color-brand-primary)] text-white border-transparent uppercase tracking-widest text-[9px]">COMUNICADO OFICIAL</Badge>
                     <h2 className="text-2xl font-bold text-white tracking-tight max-w-xl">{announcements[safeActiveAnnouncement].title}</h2>
                     <p className="text-gray-300 text-[12px] font-bold flex items-center gap-2"><Calendar size={14} /> {announcements[safeActiveAnnouncement].date}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
             <div className="absolute bottom-8 right-8 flex gap-2">
               <Button variant="ghost" size="icon" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => setActiveAnnouncement(0)}><ChevronLeft size={16} /></Button>
               <Button variant="ghost" size="icon" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => setActiveAnnouncement(1)}><ChevronRight size={16} /></Button>
             </div>
          </div>

          <Card className="p-6">
             <div className="flex gap-4">
                <Avatar src={config.usuarioAtual.avatar} name={config.usuarioAtual.name} className="w-10 h-10 ring-2 ring-gray-100" />
                <div className="flex-1 space-y-4">
                   <textarea 
                     placeholder="Compartilhe algo com o time..."
                     value={postContent}
                     onChange={(e) => setPostContent(e.target.value)}
                     className="w-full bg-gray-50 border-none rounded-[16px] p-4 text-[13px] font-medium focus:ring-1 focus:ring-[var(--color-brand-primary)]/20 resize-none outline-none min-h-[100px] transition-all"
                   />
                   <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm" leftIcon={<ImageIcon size={14} />} onClick={handlePhotoClick}>Foto</Button>
                         <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm" leftIcon={<Paperclip size={14} />} onClick={handleAttachmentClick}>Anexo</Button>
                      </div>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 shadow-lg shadow-orange-500/20" leftIcon={<Send size={14} />} disabled={!postContent.trim()} onClick={handlePublish}>Publicar</Button>
                   </div>
                </div>
             </div>
          </Card>

          {/* Atalho de Pendências */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-l-4 border-l-orange-500 bg-orange-50/30 cursor-pointer hover:bg-orange-50 transition-all group" onClick={() => onNavigate?.('tasks')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-orange-500 shadow-sm ring-1 ring-orange-100 group-hover:scale-105 transition-transform">
                  <Bell size={24} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Central de Tarefas</h4>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">12 Ações pendentes</p>
                </div>
                <ChevronRight className="ml-auto text-orange-400 group-hover:translate-x-1 transition-transform" size={20} />
              </div>
            </Card>
            <Card className="p-5 border-l-4 border-l-blue-500 bg-blue-50/30 cursor-pointer hover:bg-blue-50 transition-all group" onClick={() => onNavigate?.('approvals')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-blue-500 shadow-sm ring-1 ring-blue-100 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Minhas Aprovações</h4>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">4 Solicitações</p>
                </div>
                <ChevronRight className="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform" size={20} />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <p className="label-caps opacity-40">FEED RECENTE</p>
                <p className="text-[10px] font-bold text-gray-400">Classificar por: <span className="text-[var(--color-brand-primary)] cursor-pointer">Relevância</span></p>
             </div>
             {config.comunicados.map((item) => (
               <Card key={item.id} className="p-8 space-y-6 hover:border-[var(--color-brand-primary)] transition-all group bg-white">
                  <div className="flex items-start justify-between">
                     <div className="flex gap-4">
                        <Avatar name={item.author} className="w-10 h-10 rounded-[12px] border border-gray-100" />
                        <div>
                           <p className="text-[14px] font-bold text-gray-900">{item.author}</p>
                           <p className="text-[11px] font-bold text-[var(--color-brand-primary)] uppercase tracking-widest">{item.category}</p>
                        </div>
                     </div>
                     <span className="text-[11px] font-bold text-gray-400 tabular-nums uppercase">{item.date}</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                    {item.content}
                  </p>
                  <div className="pt-4 border-t border-gray-50 flex items-center gap-6">
                     <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors">
                        <Heart size={14} /> 0 <span className="hidden sm:inline">curtidas</span>
                     </button>
                     <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-blue-500 transition-colors">
                        <MessageSquare size={14} /> 0 <span className="hidden sm:inline">comentários</span>
                     </button>
                     <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-[var(--color-brand-primary)] transition-colors ml-auto">
                        <Share2 size={14} />
                     </button>
                  </div>
               </Card>
             ))}
          </div>
        </div>

        <div className="space-y-8">
           <Card title="Gente & Celebrações">
              <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3">Aniversariantes do Dia</p>
                    <div className="space-y-4">
                       {[
                         { name: 'Carlos Eduardo', role: 'Dev Frontend • TI', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop' },
                         { name: 'Ana Paula Lima', role: 'Analista de RH • Matriz', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop' }
                       ].map((person, i) => (
                         <div key={i} className="flex gap-4 group">
                            <div className="relative shrink-0">
                               <Avatar src={person.img} name={person.name} size="sm" className="ring-2 ring-gray-100" />
                               <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                                 <Heart size={10} fill="currentColor" />
                               </div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[13px] font-bold text-gray-900 truncate">{person.name}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{person.role}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Boas-vindas (Novos Membros)</p>
                    <div className="space-y-4">
                       {[
                         { name: 'Felipe Albuquerque', role: 'Analista Pleno • Tecnologia', img: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=200&h=200&fit=crop' }
                       ].map((person, i) => (
                         <div key={i} className="flex gap-4 group">
                            <div className="relative shrink-0">
                               <Avatar src={person.img} name={person.name} size="sm" className="ring-2 ring-gray-100" />
                               <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                                 <Plus size={10} strokeWidth={4} />
                               </div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[13px] font-bold text-gray-900 truncate">{person.name}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{person.role}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <Button variant="outline" className="w-full text-[11px]" size="sm">Ver Calendário de Gente</Button>
              </div>
           </Card>

           <Card title="Últimas Notícias">
              <div className="space-y-6">
                 {[
                   { date: '10/07', title: 'RH360 Group expande operações em 2027' },
                   { date: '08/07', title: 'Novo programa de saúde mental lançado' },
                 ].map((news, i) => (
                   <div key={i} className="group cursor-pointer space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 tabular-nums">{news.date}</p>
                      <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-[var(--color-brand-primary)] transition-colors leading-tight">{news.title}</h4>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                 <div>
                   <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Sugira um conteúdo</h3>
                   <p className="text-gray-500 text-[12px] leading-relaxed font-medium">
                     Envie suas pautas ou comunicados para o time de Comunicação Corporativa.
                   </p>
                 </div>
                 <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg shadow-orange-500/20 border-none h-12">Sugerir Pauta</Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
