import React, { useState } from 'react';
import { 
  Cpu, Zap, Shield, Search, 
  BarChart3, Clock, AlertCircle, 
  CheckCircle2, Settings2, Power,
  ChevronRight, ArrowRight, Bot,
  Layers, MessageSquare, Brain, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';

export default function AdminAI() {
  const { config, updateConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'models'>('config');

  const aiStats = [
    { label: 'Requisições (Mês)', value: '14.5k', icon: <Cpu size={20} />, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Tempo Médio Resposta', value: '1.2s', icon: <Zap size={20} />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Precisão de Triagem', value: '94%', icon: <TargetIcon size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Custo Estimado', value: 'R$ 124,50', icon: <BarChart3 size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-[16px] w-fit">
        {[
          { id: 'config', label: 'Funcionalidades', icon: <Settings2 size={14} /> },
          { id: 'models', label: 'Modelos e API', icon: <Brain size={14} /> },
          { id: 'logs', label: 'Histórico de Decisões', icon: <Clock size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="p-8 space-y-8 border-none shadow-xl">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                       <Bot size={20} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-gray-900">Assistentes Ativos</h3>
                       <p className="text-[13px] text-gray-500 font-medium">Módulos de IA habilitados na plataforma.</p>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 {[
                   { id: 'screening', label: 'Triagem de Currículos', desc: 'Analisa currículos e pontua aderência à vaga automaticamente.', active: true },
                   { id: 'sentiment', label: 'Análise de Sentimento', desc: 'Identifica tons críticos em pesquisas de clima e feedback.', active: true },
                   { id: 'chat', label: 'Chatbot de Suporte RH', desc: 'Responde dúvidas sobre políticas, benefícios e férias.', active: false },
                   { id: 'predictive', label: 'Análise Preditiva de Turnover', desc: 'Alerta sobre colaboradores com alto risco de saída.', active: false },
                 ].map(mod => (
                   <div key={mod.id} className="p-5 rounded-[24px] border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-4 group hover:bg-white hover:border-pink-200 transition-all">
                      <div className="flex gap-4">
                         <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${mod.active ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-gray-200 text-gray-400'}`}>
                            {mod.id === 'screening' ? <FileText size={20} /> : mod.id === 'sentiment' ? <MessageSquare size={20} /> : <Cpu size={20} />}
                         </div>
                         <div>
                            <p className="font-black text-gray-900 text-[14px]">{mod.label}</p>
                            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{mod.desc}</p>
                         </div>
                      </div>
                      <button className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${mod.active ? 'bg-pink-500' : 'bg-gray-300'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${mod.active ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                 ))}
              </div>
           </Card>

           <div className="space-y-6">
              <Card title="Restrições e Ética" icon={<Shield size={18} className="text-emerald-500" />}>
                 <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                       <CheckCircle2 size={16} className="text-emerald-600" />
                       <p className="text-[11px] text-emerald-900 font-bold leading-relaxed">
                         Privacidade por Design: Nenhum dado sensível (CPF, Salário) é enviado para modelos externos sem anonimização.
                       </p>
                    </div>
                    <div className="space-y-4">
                       <label className="flex items-center justify-between cursor-pointer group">
                          <div>
                             <p className="text-[13px] font-bold text-gray-700">Explicação de Decisão</p>
                             <p className="text-[11px] text-gray-500">Exibir o "porquê" da IA em cada análise.</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-pink-500 rounded border-gray-300" />
                       </label>
                       <label className="flex items-center justify-between cursor-pointer group">
                          <div>
                             <p className="text-[13px] font-bold text-gray-700">Auditabilidade</p>
                             <p className="text-[11px] text-gray-500">Log completo de prompts e respostas para auditoria.</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-pink-500 rounded border-gray-300" />
                       </label>
                    </div>
                 </div>
              </Card>

              <Card title="Alertas de Sistema" icon={<AlertCircle size={18} className="text-amber-500" />}>
                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <Clock size={18} className="text-amber-600 shrink-0" />
                    <p className="text-[12px] text-amber-900 font-bold leading-relaxed">
                      O modelo Gemini 1.5 Pro está com latência acima da média (2.5s). Considere mudar para o Flash temporariamente.
                    </p>
                 </div>
              </Card>
           </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <Card className="p-8 space-y-8 border-none shadow-xl">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="text-lg font-black text-gray-900">Motor de Inteligência</h3>
                    <p className="text-[13px] text-gray-500 font-medium">Selecione o modelo que processa as requisições globais.</p>
                 </div>
                 <Badge variant="blue">API Google Vertex AI</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { id: 'pro', name: 'Gemini 1.5 Pro', desc: 'Raciocínio complexo, ideal para triagem e análise de sentimento profunda.', cost: '$$$', selected: true },
                   { id: 'flash', name: 'Gemini 1.5 Flash', desc: 'Alta velocidade, ideal para chat de suporte e automações simples.', cost: '$', selected: false },
                 ].map(model => (
                   <div key={model.id} className={`p-6 rounded-[28px] border-2 transition-all cursor-pointer ${model.selected ? 'border-pink-500 bg-pink-50/30 shadow-lg' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${model.selected ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Brain size={20} />
                         </div>
                         <Badge variant={model.selected ? 'blue' : 'gray'}>{model.cost}</Badge>
                      </div>
                      <h4 className="font-black text-gray-900 text-lg leading-tight">{model.name}</h4>
                      <p className="text-[12px] text-gray-500 mt-2 font-medium leading-relaxed">{model.desc}</p>
                      {model.selected && (
                        <div className="mt-6 flex items-center gap-2 text-pink-500 font-black text-[11px] uppercase tracking-widest">
                           <CheckCircle2 size={14} /> Ativo no Sistema
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Settings2 size={24} className="text-gray-400" />
                    <div>
                       <p className="font-bold text-gray-900">Temperatura do Modelo (Criatividade)</p>
                       <p className="text-[11px] text-gray-500 font-medium">Recomendado: 0.2 para tarefas corporativas.</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <input type="range" title="range" className="w-48 accent-pink-500" min="0" max="1" step="0.1" defaultValue="0.2" />
                    <span className="text-[14px] font-black text-gray-900">0.2</span>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card className="overflow-hidden border-none shadow-xl animate-in fade-in duration-500">
           <Table 
             columns={[
               { header: 'DATA/HORA', accessor: 'time', render: (val) => <span className="text-[12px] font-medium text-gray-500">{val}</span> },
               { header: 'FUNCIONALIDADE', accessor: 'module', render: (val) => <Badge variant="gray">{val}</Badge> },
               { header: 'DECISÃO / AÇÃO', accessor: 'action', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
               { header: 'CONFIANÇA', accessor: 'score', render: (val) => (
                 <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-pink-500" style={{ width: `${val}%` }} />
                    </div>
                    <span className="text-[11px] font-black text-gray-900">{val}%</span>
                 </div>
               )},
               { header: '', accessor: 'id', render: () => (
                 <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest text-pink-500">Ver JSON</Button>
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

function TargetIcon({ size, className }: { size?: number, className?: string }) {
  return <BarChart3 size={size} className={className} />; // Fallback since Target is already used
}
