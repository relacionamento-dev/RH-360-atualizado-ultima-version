import React, { useState } from 'react';
import { 
  Building2, Upload, Save, CheckCircle2, Plus, Globe, Mail, Phone, MapPin, Trash2
} from 'lucide-react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { Button } from './ui/Button';
import { Card } from './ui/CardAndTable';
import { PageHeader } from './ui/FormAndHeader';

export default function CompanyConfig() {
  const { config, updateConfig } = useAppConfig();
  const [localConfig, setLocalConfig] = useState({ ...config });

  const handleSave = () => {
    updateConfig(localConfig);
    // In a real app, this would be a persist call
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Configurações da Empresa" 
        subtitle="Gerencie a identidade visual e os parâmetros globais da plataforma."
        actions={
          <Button leftIcon={<Save size={16} />} onClick={handleSave}>Salvar Alterações</Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8" title="Dados Institucionais">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="label-caps opacity-40">NOME DA PLATAFORMA</label>
                <input 
                  type="text" 
                  value={localConfig.appName ?? ''}
                  onChange={e => setLocalConfig({...localConfig, appName: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-[12px] p-4 text-[13px] font-bold text-gray-900 focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="label-caps opacity-40">RAZÃO SOCIAL</label>
                <input 
                  type="text" 
                  defaultValue="RH360 Soluções Corporativas LTDA"
                  className="w-full bg-gray-50 border-none rounded-[12px] p-4 text-[13px] font-bold text-gray-900 focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="label-caps opacity-40">COR DE DESTAQUE (HEX)</label>
                <div className="flex gap-3">
                   <div className="w-12 h-12 rounded-[12px] border border-gray-100 shrink-0 overflow-hidden">
                      <input 
                        type="color" 
                        value={localConfig.primaryColor ?? '#F26522'}
                        onChange={e => setLocalConfig({...localConfig, primaryColor: e.target.value})}
                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                   </div>
                   <input 
                     type="text" 
                     value={localConfig.primaryColor ?? '#F26522'}
                     onChange={e => setLocalConfig({...localConfig, primaryColor: e.target.value})}
                     className="flex-1 bg-gray-50 border-none rounded-[12px] px-4 text-[13px] font-bold text-gray-900 focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all outline-none"
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label-caps opacity-40">UNIDADE PADRÃO</label>
                <select className="w-full bg-gray-50 border-none rounded-[12px] p-4 text-[13px] font-bold text-gray-900 focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all outline-none">
                   <option>Sede Brasília</option>
                   <option>Unidade São Paulo</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-8" title="Identidade Visual">
             <div className="flex items-start gap-8 mt-6">
                <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center text-center p-4 group hover:border-[var(--color-brand-primary)] transition-all cursor-pointer">
                   <Upload className="w-6 h-6 text-gray-300 group-hover:text-[var(--color-brand-primary)] transition-colors mb-2" />
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">UPLOAD LOGO PNG</span>
                </div>
                <div className="flex-1 space-y-4">
                   <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                     A logo será aplicada no topo de todas as comunicações oficiais, relatórios e e-mails gerados pela plataforma. Recomendamos o formato PNG transparente com dimensões mínimas de 400x400px.
                   </p>
                   <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 font-bold">REMOVER IMAGEM ATUAL</Button>
                </div>
             </div>
          </Card>
        </div>

        <div className="space-y-8">
           <Card title="Unidades Ativas">
              <div className="space-y-3 mt-4">
                 {[
                   { name: 'Sede Brasília', status: 'Ativa' },
                   { name: 'Unidade SP', status: 'Inativa' }
                 ].map((u, i) => (
                   <div key={i} className={`p-4 rounded-[16px] border flex items-center justify-between group transition-all cursor-pointer ${i === 0 ? 'border-[var(--color-brand-primary)] bg-orange-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center text-gray-400 border border-gray-100">
                            <Building2 size={18} />
                         </div>
                         <div>
                            <p className="text-[13px] font-bold text-gray-900">{u.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{u.status}</p>
                         </div>
                      </div>
                      {i === 0 && <CheckCircle2 size={16} className="text-[var(--color-brand-primary)]" />}
                   </div>
                 ))}
                 <Button variant="outline" className="w-full mt-2" size="sm" leftIcon={<Plus size={14} />}>Adicionar Unidade</Button>
              </div>
           </Card>

           <div className="bg-gray-900 rounded-[24px] p-8 text-white space-y-6">
              <p className="label-caps opacity-40">PLANO ENTERPRISE</p>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[13px] font-bold">
                    <span className="text-gray-500">Colaboradores</span>
                    <span>124 / 500</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px] font-bold">
                    <span className="text-gray-500">Armazenamento</span>
                    <span>42% (21GB)</span>
                 </div>
                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-[var(--color-brand-primary)] w-[42%]" />
                 </div>
              </div>
              <Button variant="primary" className="w-full">Gerenciar Assinatura</Button>
           </div>
        </div>
      </div>
    </div>
  );
}
