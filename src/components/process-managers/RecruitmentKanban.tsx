import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, MoreHorizontal, Paperclip, Clock, 
  ChevronRight, Star, User, MessageSquare, ArrowLeft
} from 'lucide-react';
import { RHProcess, RHRequest } from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Card } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'motion/react';

const steps = ['Triagem', 'Prova', 'Entrevista RH', 'Entrevista Gestor', 'Aprovado', 'Reprovado'];

export default function RecruitmentKanban({ process, onNewRequest }: { process: RHProcess, onNewRequest: () => void }) {
  const { config, updateRequest, updateConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = config.solicitacoes.filter(r => r.processId === process.id);
  
  const filtered = candidates.filter(r => 
    r.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.alvo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const moveCandidate = (id: string, nextStep: string) => {
    const cand = candidates.find(c => c.id === id);
    if (!cand) return;

    const historyEntry = { 
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name, 
      userName: config.usuarioAtual.name,
      timestamp: new Date().toISOString(),
      dataHora: new Date().toISOString(),
      action: `Mover para ${nextStep}`,
      etapa: 'Recrutamento',
      de: cand.etapaAtual || 'Triagem',
      para: nextStep
    };

    updateRequest(id, { 
      etapaAtual: nextStep,
      historico: [
        ...(cand.historico || []),
        historyEntry
      ]
    });
  };

  const handleOpenDetail = (id: string) => {
    updateConfig({ activeView: 'request-detail', currentRequestId: id });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recrutamento e Seleção</h2>
           <p className="text-gray-500 font-medium text-[14px]">Acompanhe o funil de contratação e pipeline de talentos</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Buscar candidato..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
             />
           </div>
           <Button leftIcon={<Plus size={18} />} onClick={onNewRequest}>
             Novo Recrutamento
           </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar h-[calc(100vh-300px)]">
        {steps.map(step => (
          <div key={step} className="min-w-[320px] flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{step}</h3>
              </div>
              <Badge variant="gray" className="font-black">
                {filtered.filter(c => c.etapaAtual === step || (step === 'Triagem' && !steps.includes(c.etapaAtual))).length}
              </Badge>
            </div>

             <div className="flex-1 bg-gray-50/50 rounded-[20px] p-3 border border-dashed border-gray-200 space-y-4 overflow-y-auto custom-scrollbar">
               {filtered
                 .filter(c => (c.etapaAtual === step) || (step === 'Triagem' && !steps.includes(c.etapaAtual)))
                 .map(cand => (
                   <motion.div 
                     layoutId={cand.id}
                     key={cand.id}
                     onClick={() => handleOpenDetail(cand.id)}
                   >
                     <Card className="p-4 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all group relative bg-white">
                       <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600">
                             {(cand.alvo || 'C').charAt(0)}
                           </div>
                           <div>
                             <p className="font-bold text-[14px] text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">{cand.alvo}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{cand.data?.cargo || 'Analista Sênior'}</p>
                           </div>
                         </div>
                         <button className="text-gray-300 hover:text-gray-600">
                           <MoreHorizontal size={16} />
                         </button>
                       </div>

                       <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                            <Clock size={12} className="text-gray-300" />
                            2d na etapa
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold justify-end">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            {cand.data?.nota || '4.5'}
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                         <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">AP</div>
                         </div>
                         <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors" title="Ver Currículo">
                              <Paperclip size={14} />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors" title="Mensagem">
                              <MessageSquare size={14} />
                            </button>
                            <div className="flex gap-1 ml-2 border-l border-gray-100 pl-2">
                               {steps.indexOf(step) > 0 && (
                                 <button 
                                  onClick={() => {
                                    const prevStep = steps[steps.indexOf(step) - 1];
                                    moveCandidate(cand.id, prevStep);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors" 
                                  title="Etapa Anterior"
                                 >
                                   <ArrowLeft size={14} />
                                 </button>
                               )}
                               {steps.indexOf(step) < steps.length - 1 && (
                                 <button 
                                  onClick={() => {
                                    const nextStep = steps[steps.indexOf(step) + 1];
                                    moveCandidate(cand.id, nextStep);
                                  }}
                                  className="p-1.5 hover:bg-orange-100 rounded-md text-orange-500 transition-colors" 
                                  title="Próxima Etapa"
                                 >
                                   <ChevronRight size={14} />
                                 </button>
                               )}
                             </div>
                         </div>
                       </div>
                     </Card>
                   </motion.div>
                 ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
