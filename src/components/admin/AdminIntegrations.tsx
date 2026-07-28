import React, { useState } from 'react';
import {
  Database, Zap, RefreshCw,
  Settings, Power, Plus,
  Globe, ArrowRightLeft, Shield
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Integration } from '../../types';
import { SectionHeader, Field, ADMIN_FIELD_CLASS } from './AdminUI';

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
      <SectionHeader
        title="Integrações"
        description="Sistemas conectados ao RH360 e o envio automático de dados entre eles."
        actions={<Button variant="outline" size="sm" leftIcon={<Plus size={14} />}>Conectar sistema</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="space-y-4">
           <div className="flex items-center justify-between gap-3">
              <div>
                 <p className="label-caps">Aguardando envio</p>
                 <p className="text-3xl font-black text-gray-900 tracking-tight mt-1">142</p>
                 <p className="text-[12px] text-gray-500 font-medium">registros na fila</p>
              </div>
              <Database size={18} className="text-gray-300 shrink-0" />
           </div>
           <Button
             variant="outline"
             size="sm"
             onClick={reprocessQueue}
             isLoading={isReprocessing}
             className="w-full"
           >
             Enviar agora
           </Button>
        </Card>

        <Card className="space-y-4">
           <div className="flex items-center justify-between gap-3">
              <div>
                 <p className="label-caps">Conexões funcionando</p>
                 <p className="text-3xl font-black text-gray-900 tracking-tight mt-1">8<span className="text-gray-300 text-xl"> / 10</span></p>
                 <p className="text-[12px] text-gray-500 font-medium">tempo de resposta médio: 450ms</p>
              </div>
              <Zap size={18} className="text-gray-300 shrink-0" />
           </div>
           <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="w-[80%] h-full bg-emerald-500 rounded-full" />
           </div>
        </Card>

        <Card className="space-y-4">
           <div className="flex items-center justify-between gap-3">
              <div>
                 <p className="label-caps">Segurança das chaves</p>
                 <p className="text-[14px] font-bold text-gray-900 mt-2">Criptografia AES-256</p>
                 <p className="text-[12px] text-gray-500 font-medium">a chave de acesso expira em 14 dias</p>
              </div>
              <Shield size={18} className="text-gray-300 shrink-0" />
           </div>
           <Button variant="outline" size="sm" className="w-full">Gerar novas chaves</Button>
        </Card>
      </div>

      <div className="space-y-4">
        <SectionHeader
          title="Sistemas conectados"
          description="Clique em um sistema para ver e ajustar a configuração da conexão."
        />

        <div className="space-y-3">
           {config.integracoes.map(integ => {
             const conectado = integ.status === 'Conectado';
             return (
             <div
               key={integ.id}
               className="bg-white rounded-[12px] border border-gray-100 hover:border-gray-200 transition-colors flex flex-wrap items-center gap-3 px-4 py-3"
             >
                <button
                  type="button"
                  onClick={() => setSelectedInteg(integ)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left"
                >
                   <span className={`w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center ${conectado ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-500'}`}>
                      {integ.type === 'ERP' ? <Database size={18} /> : integ.type === 'Ponto' ? <RefreshCw size={18} /> : <Globe size={18} />}
                   </span>
                   <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-gray-900 truncate">{integ.name}</span>
                      <span className="block text-[12px] text-gray-400 font-medium truncate">
                        {integ.type} · última troca de dados em {integ.lastSync}
                      </span>
                   </span>
                </button>
                <Badge variant={conectado ? 'green' : 'red'} size="sm">
                  {conectado ? 'Conectado' : 'Com erro'}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                   <Button
                     variant="ghost"
                     size="sm"
                     title="Configurar conexão"
                     aria-label={`Configurar ${integ.name}`}
                     onClick={() => setSelectedInteg(integ)}
                     className="text-gray-400 hover:text-gray-900 px-2"
                   >
                      <Settings size={16} />
                   </Button>
                   <Button
                     variant="ghost"
                     size="sm"
                     title={conectado ? 'Desligar conexão' : 'Religar conexão'}
                     aria-label={conectado ? `Desligar ${integ.name}` : `Religar ${integ.name}`}
                     onClick={() => toggleIntegration(integ.id)}
                     className={`px-2 ${conectado ? 'text-emerald-500 hover:text-emerald-600' : 'text-red-500 hover:text-red-600'}`}
                   >
                      <Power size={16} />
                   </Button>
                </div>
             </div>
             );
           })}
        </div>
      </div>

      <Modal isOpen={!!selectedInteg} onClose={() => setSelectedInteg(null)} title={`Conexão com ${selectedInteg?.name}`}>
         <div className="space-y-6">
            <div className="space-y-4">
               <Field label="Endereço do sistema" hint="Para onde o RH360 envia e busca os dados.">
                 <input type="text" className={`${ADMIN_FIELD_CLASS} w-full`} defaultValue="https://api.empresa.com.br/v2/sync" />
               </Field>
               <Field label="Chave de acesso">
                 <div className="flex gap-2">
                    <input type="password" aria-label="Chave de acesso" className={`${ADMIN_FIELD_CLASS} flex-1`} defaultValue="************************" />
                    <Button variant="outline" size="sm">Mostrar</Button>
                 </div>
               </Field>
            </div>

            <div className="space-y-2">
               <p className="label-caps ml-1">De onde vem cada informação</p>
               <div className="rounded-[12px] border border-gray-100 divide-y divide-gray-100">
                  {[
                    { local: 'Centro de custo', erp: 'CC_CODIGO' },
                    { local: 'Cargo', erp: 'FUNCAO_ERP' },
                    { local: 'Filial', erp: 'BRANCH_KEY' },
                  ].map((map, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                       <span className="flex-1 text-[13px] font-bold text-gray-700">{map.local}</span>
                       <ArrowRightLeft size={14} className="text-gray-300 shrink-0" />
                       <span className="flex-1 text-[12px] font-medium text-gray-500 text-right">{map.erp}</span>
                    </div>
                  ))}
               </div>
               <Button variant="ghost" size="sm" className="w-full text-gray-500">Editar correspondências</Button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedInteg(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setSelectedInteg(null)}>Testar e salvar</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
