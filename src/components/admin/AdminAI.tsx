import React, { useState } from 'react';
import {
  Cpu, Clock, AlertCircle,
  CheckCircle2, Settings2,
  MessageSquare, Brain, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { SectionHeader, SubTabs, InfoNote } from './AdminUI';

export default function AdminAI() {
  const { config, updateConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'models'>('config');

  const aiStats = [
    { label: 'Análises no mês', value: '14.5k' },
    { label: 'Tempo médio de resposta', value: '1,2s' },
    { label: 'Acerto na triagem', value: '94%' },
    { label: 'Custo no mês', value: 'R$ 124,50' },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Inteligência artificial"
        description="Onde a IA ajuda o RH, qual modelo ela usa e o registro das decisões que tomou."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {aiStats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[12px] border border-gray-100">
            <p className="label-caps">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <SubTabs
        value={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          { id: 'config', label: 'O que a IA faz', icon: <Settings2 size={14} /> },
          { id: 'models', label: 'Modelo usado', icon: <Brain size={14} /> },
          { id: 'logs', label: 'Decisões tomadas', icon: <Clock size={14} /> },
        ]}
      />

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
           <div className="space-y-4">
              <SectionHeader
                title="Onde a IA atua"
                description="Ligue ou desligue cada ajuda automática."
              />
              <div className="space-y-3">
                 {[
                   { id: 'screening', label: 'Leitura de currículos', desc: 'Lê os currículos recebidos e indica quanto cada candidato combina com a vaga.', active: true },
                   { id: 'sentiment', label: 'Leitura de clima', desc: 'Aponta respostas críticas em pesquisas de clima e feedbacks.', active: true },
                   { id: 'chat', label: 'Assistente de dúvidas', desc: 'Responde perguntas sobre políticas, benefícios e férias.', active: false },
                   { id: 'predictive', label: 'Risco de saída', desc: 'Avisa quando um colaborador apresenta sinais de que pode pedir demissão.', active: false },
                 ].map(mod => (
                   <div key={mod.id} className="bg-white p-4 rounded-[12px] border border-gray-100 flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                         <span className={`mt-0.5 w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center ${mod.active ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300'}`}>
                            {mod.id === 'screening' ? <FileText size={18} /> : mod.id === 'sentiment' ? <MessageSquare size={18} /> : <Cpu size={18} />}
                         </span>
                         <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-[14px]">{mod.label}</p>
                            <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{mod.desc}</p>
                         </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={mod.active}
                        aria-label={mod.label}
                        className={`w-10 h-5 rounded-full relative transition-colors shrink-0 mt-1 ${mod.active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                         <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${mod.active ? 'left-[22px]' : 'left-[3px]'}`} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-4">
              <SectionHeader
                title="Cuidados com os dados"
                description="Regras que valem para toda análise feita pela IA."
              />
              <Card className="space-y-5">
                 <InfoNote>
                   Dados sensíveis (CPF, salário) nunca são enviados para a IA sem antes serem anonimizados.
                 </InfoNote>
                 <div className="space-y-4">
                    <label className="flex items-center justify-between gap-4 cursor-pointer">
                       <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-gray-700">Mostrar o porquê de cada decisão</span>
                          <span className="block text-[12px] text-gray-400">O usuário vê a explicação junto com a análise.</span>
                       </span>
                       <input type="checkbox" defaultChecked aria-label="Mostrar o porquê de cada decisão" className="w-5 h-5 accent-orange-500 rounded border-gray-300 shrink-0" />
                    </label>
                    <label className="flex items-center justify-between gap-4 cursor-pointer">
                       <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-gray-700">Guardar histórico completo</span>
                          <span className="block text-[12px] text-gray-400">Perguntas e respostas ficam disponíveis para auditoria.</span>
                       </span>
                       <input type="checkbox" defaultChecked aria-label="Guardar histórico completo" className="w-5 h-5 accent-orange-500 rounded border-gray-300 shrink-0" />
                    </label>
                 </div>
              </Card>

              <div className="rounded-[12px] border border-amber-100 bg-amber-50/50 px-4 py-3 flex items-start gap-3">
                 <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-[13px] text-amber-900 font-medium leading-relaxed">
                   O modelo em uso está respondendo mais devagar que o normal (2,5s). Considere trocar para o modelo rápido.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <SectionHeader
             title="Modelo que processa as análises"
             description="Vale para todas as funcionalidades de IA da plataforma."
             actions={<Badge variant="gray">Google Vertex AI</Badge>}
           />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'pro', name: 'Gemini 1.5 Pro', desc: 'Analisa casos complexos com mais profundidade. Custo maior.', cost: 'Custo alto', selected: true },
                { id: 'flash', name: 'Gemini 1.5 Flash', desc: 'Responde mais rápido, ideal para dúvidas e automações simples. Custo menor.', cost: 'Custo baixo', selected: false },
              ].map(model => (
                <button
                  type="button"
                  key={model.id}
                  aria-pressed={model.selected}
                  className={`text-left p-5 rounded-[12px] border transition-colors ${model.selected ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                   <div className="flex items-center justify-between gap-3 mb-3">
                      <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${model.selected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <Brain size={18} />
                      </span>
                      <Badge variant="gray" size="sm">{model.cost}</Badge>
                   </div>
                   <p className="font-bold text-gray-900 text-[15px] leading-tight">{model.name}</p>
                   <p className="text-[12px] text-gray-500 mt-1 font-medium leading-relaxed">{model.desc}</p>
                   {model.selected && (
                     <p className="mt-4 flex items-center gap-1.5 text-orange-600 font-bold text-[12px]">
                        <CheckCircle2 size={14} /> Em uso
                     </p>
                   )}
                </button>
              ))}
           </div>

           <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <p className="font-bold text-gray-900 text-[14px]">Liberdade das respostas</p>
                 <p className="text-[12px] text-gray-500 font-medium">
                   Quanto menor, mais previsível. Recomendado 0,2 para uso corporativo.
                 </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <input type="range" aria-label="Liberdade das respostas" className="w-40 accent-orange-500" min="0" max="1" step="0.1" defaultValue="0.2" />
                 <span className="text-[14px] font-black text-gray-900 tabular-nums">0,2</span>
              </div>
           </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card padding="none" className="animate-in fade-in duration-500">
           <Table
             columns={[
               { header: 'Quando', accessor: 'time', render: (val) => <span className="text-[12px] font-medium text-gray-500">{val}</span> },
               { header: 'Funcionalidade', accessor: 'module', render: (val) => <Badge variant="gray">{val}</Badge> },
               { header: 'O que a IA concluiu', accessor: 'action', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
               { header: 'Grau de certeza', accessor: 'score', render: (val) => (
                 <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500" style={{ width: `${val}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 tabular-nums">{val}%</span>
                 </div>
               )},
               { header: '', accessor: 'id', render: () => (
                 <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-gray-500">Ver detalhes</Button>
                 </div>
               )}
             ]}
             data={[
               { id: 1, time: 'Hoje, 11:20', module: 'Triagem', action: 'Candidato "Ana Silva" pontuação 9.2/10', score: 92 },
               { id: 2, time: 'Hoje, 11:15', module: 'Sentimento', action: 'Feedback Crítico detectado (Ticket #882)', score: 88 },
               { id: 3, time: 'Hoje, 10:45', module: 'Triagem', action: 'Candidato "Marcos Lima" pontuação 4.5/10', score: 45 },
               { id: 4, time: 'Hoje, 09:30', module: 'Triagem', action: 'Análise de currículo vago para Analista Jr', score: 76 },
             ]}
           />
        </Card>
      )}
    </div>
  );
}
