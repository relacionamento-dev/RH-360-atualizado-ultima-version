import React, { useState } from 'react';
import { 
  Share2, Database, Zap, RefreshCw, 
  Settings, Power, AlertCircle, CheckCircle2,
  MoreHorizontal, Plus, Download, Upload,
  Cpu, Layout, FileText, Globe, Search,
  ChevronRight, ArrowRightLeft, Shield
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Integration } from '../../types';

export default function AdminIntegrations() {
  const { config, updateConfig } = useAppConfig();
  const { addToast } = useToast();
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [selectedInteg, setSelectedInteg] = useState<Integration | null>(null);

  const reprocessQueue = () => {
    setIsReprocessing(true);
    setTimeout(() => {
      setIsReprocessing(false);
      addToast('Fila de integração reprocessada com sucesso. 12 registros sincronizados.', 'success');
    }, 2000);
  };

  const toggleIntegration = (id: string) => {
    updateConfig({
      integracoes: config.integracoes.map(i => i.id === id ? { ...i, status: i.status === 'Conectado' ? 'Erro' : 'Conectado' } : i)
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-8 bg-gray-900 text-white border-none shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
             <RefreshCw size={120} />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-lg">
                    <Database size={20} className="text-orange-400" />
                 </div>
                 <h3 className="label-caps text-white opacity-60">Fila de Integração</h3>
              </div>
              <div>
                 <p className="text-4xl font-black tracking-tight">142</p>
                 <p className="text-gray-400 font-medium text-sm mt-1">Registros aguardando sincronismo</p>
              </div>
              <Button 
                onClick={reprocessQueue}
                isLoading={isReprocessing}
                className="w-full bg-orange-500 hover:bg-orange-600 border-none font-black text-xs uppercase tracking-widest py-6"
              >
                Forçar Reprocessamento
              </Button>
           </div>
        </Card>

        <Card className="p-8 space-y-6 border-none shadow-xl">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                 <Zap size={20} />
              </div>
              <h3 className="label-caps opacity-60">Status de Saúde</h3>
           </div>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <span className="text-[13px] font-bold text-gray-700">Conexões Ativas</span>
                 <span className="text-[13px] font-black text-emerald-600">8/10</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                 <div className="w-[80%] h-full bg-emerald-500 rounded-full" />
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 mt-2">
                 <CheckCircle2 size={16} className="text-emerald-600" />
                 <p className="text-[11px] text-emerald-900 font-bold leading-relaxed">
                   Todos os Webhooks estão operando dentro do tempo de resposta esperado (450ms).
                 </p>
              </div>
           </div>
        </Card>

        <Card className="p-8 space-y-6 border-none shadow-xl">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                 <Shield size={20} />
              </div>
              <h3 className="label-caps opacity-60">Segurança de Dados</h3>
           </div>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <span className="text-[13px] font-bold text-gray-700">Criptografia de Chaves</span>
                 <Badge variant="blue" size="sm">AES-256</Badge>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-[13px] font-bold text-gray-700">Expiração do Token</span>
                 <span className="text-[11px] font-black text-gray-400">EM 14 DIAS</span>
              </div>
              <Button variant="outline" size="sm" className="w-full font-black text-[10px] uppercase tracking-widest mt-2">Rotacionar Chaves API</Button>
           </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 text-white rounded-lg">
                 <Share2 size={18} />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Gerenciador de Conectores</h3>
           </div>
           <Button variant="outline" size="sm" leftIcon={<Plus size={16} />}>Novo Conector</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {config.integracoes.map(integ => (
             <Card key={integ.id} className={`p-6 border-none shadow-xl group hover:scale-[1.02] transition-all cursor-pointer ${integ.status === 'Erro' ? 'bg-red-50/30 ring-1 ring-red-100' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-6">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${integ.status === 'Conectado' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'}`}>
                      {integ.type === 'ERP' ? <Database size={24} /> : integ.type === 'Ponto' ? <RefreshCw size={24} /> : <Globe size={24} />}
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedInteg(integ)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900">
                         <Settings size={18} />
                      </button>
                      <button onClick={() => toggleIntegration(integ.id)} className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${integ.status === 'Conectado' ? 'text-emerald-500' : 'text-red-500'}`}>
                         <Power size={18} />
                      </button>
                   </div>
                </div>
                <div>
                   <div className="flex items-center gap-2">
                      <h4 className="font-black text-gray-900 tracking-tight text-lg">{integ.name}</h4>
                      <Badge variant={integ.status === 'Conectado' ? 'green' : 'red'} size="sm">{integ.status}</Badge>
                   </div>
                   <p className="text-[12px] text-gray-500 font-medium mt-1">Último sincronismo: {integ.lastSync}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-1 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <ArrowRightLeft size={12} />
                      <span>{integ.type}</span>
                   </div>
                   <button className="text-[11px] font-black text-orange-500 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                      Logs <ChevronRight size={12} />
                   </button>
                </div>
             </Card>
           ))}
        </div>
      </div>

      <Modal isOpen={!!selectedInteg} onClose={() => setSelectedInteg(null)} title={`Configurar Integração: ${selectedInteg?.name}`}>
         <div className="space-y-8">
            <div className="space-y-4">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="label-caps opacity-60 flex items-center gap-2">Autenticação API</h4>
                  <div className="space-y-3">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Endpoint</label>
                        <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-bold outline-none" defaultValue="https://api.empresa.com.br/v2/sync" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Secret / Token</label>
                        <div className="flex gap-2">
                           <input type="password" title="password" className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-bold outline-none" defaultValue="************************" />
                           <Button variant="outline" size="sm" className="font-black text-[10px] uppercase tracking-widest">Mostrar</Button>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="label-caps opacity-60 flex items-center gap-2">Mapeamento de De-Para</h4>
                  <div className="space-y-2">
                     {[
                       { local: 'centro_custo', erp: 'CC_CODIGO' },
                       { local: 'cargo_id', erp: 'FUNCAO_ERP' },
                       { local: 'unidade_filial', erp: 'BRANCH_KEY' },
                     ].map((map, i) => (
                       <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                          <span className="flex-1 text-[12px] font-bold text-gray-700">{map.local}</span>
                          <ArrowRightLeft size={14} className="text-gray-300" />
                          <span className="flex-1 text-[12px] font-bold text-orange-500 text-right">{map.erp}</span>
                       </div>
                     ))}
                     <Button variant="ghost" size="sm" className="w-full font-black text-[10px] uppercase tracking-widest">Editar Mapeamento Completo</Button>
                  </div>
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedInteg(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setSelectedInteg(null)}>Testar Conexão e Salvar</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
