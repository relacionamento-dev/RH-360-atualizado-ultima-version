import React, { useState } from 'react';
import { 
  Globe, Layout, FileText, Link as LinkIcon, 
  Plus, Edit2, Trash2, Eye, Upload, 
  Search, ExternalLink, Calendar,
  MoreHorizontal, Image as ImageIcon,
  CheckCircle2, XCircle, Power
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { IntranetItem } from '../../types';

export default function AdminIntranet() {
  const { config, updateConfig } = useAppConfig();
  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'news' | 'widgets' | 'links'>('banners');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateIntranet = (items: IntranetItem[]) => {
    updateConfig({ intranet: items });
  };

  const toggleStatus = (id: string) => {
    updateIntranet(config.intranet.map(item => item.id === id ? { ...item, active: !item.active } : item));
  };

  const removeItem = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      updateIntranet(config.intranet.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-[16px] w-fit">
        {[
          { id: 'banners', label: 'Banners (Hero)', icon: <ImageIcon size={14} /> },
          { id: 'news', label: 'Notícias e Comunicados', icon: <FileText size={14} /> },
          { id: 'widgets', label: 'Widgets Laterais', icon: <Layout size={14} /> },
          { id: 'links', label: 'Links Rápidos', icon: <LinkIcon size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] transition-all ${
              activeSubTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar conteúdos..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-[14px] text-[13px] focus:ring-2 focus:ring-orange-500/20 outline-none shadow-sm transition-all"
          />
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>Novo Conteúdo</Button>
      </div>

      <div className="animate-in fade-in duration-500">
         {activeSubTab === 'banners' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.intranet.filter(i => i.type === 'banner').map(banner => (
                <IntranetCard key={banner.id} item={banner} onToggle={toggleStatus} onRemove={removeItem} />
              ))}
           </div>
         )}

         {activeSubTab === 'news' && (
           <Card className="overflow-hidden">
             <Table 
               columns={[
                 { header: 'TÍTULO', accessor: 'title', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
                 { header: 'CATEGORIA', accessor: 'category', render: (val) => <Badge variant="gray">{val}</Badge> },
                 { header: 'DATA', accessor: 'date', render: (val) => <span className="text-[12px] font-medium text-gray-500">{val}</span> },
                 { header: 'STATUS', accessor: 'active', render: (val) => <Badge variant={val ? 'green' : 'gray'}>{val ? 'Ativo' : 'Inativo'}</Badge> },
                 { header: '', accessor: 'id', render: (id, row: any) => (
                   <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(id)}>
                        {row.active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon"><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(id)}><Trash2 size={16} /></Button>
                   </div>
                 )}
               ]}
               data={config.intranet.filter(i => i.type === 'news' || i.category === 'Notícia' || i.category === 'Comunicado')}
             />
           </Card>
         )}

         {activeSubTab === 'widgets' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {config.intranet.filter(i => i.type === 'widget').map(widget => (
                <IntranetCard key={widget.id} item={widget} onToggle={toggleStatus} onRemove={removeItem} />
              ))}
           </div>
         )}

         {activeSubTab === 'links' && (
           <Card className="overflow-hidden">
             <Table 
               columns={[
                 { header: 'DESCRIÇÃO', accessor: 'title', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
                 { header: 'URL / DESTINO', accessor: 'url', render: (val) => <span className="text-[12px] font-medium text-blue-500 truncate max-w-[200px]">{val}</span> },
                 { header: 'STATUS', accessor: 'active', render: (val) => <Badge variant={val ? 'green' : 'gray'}>{val ? 'Ativo' : 'Inativo'}</Badge> },
                 { header: '', accessor: 'id', render: (id) => (
                   <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(id)}><Power size={16} /></Button>
                      <Button variant="ghost" size="icon"><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(id)}><Trash2 size={16} /></Button>
                   </div>
                 )}
               ]}
               data={config.intranet.filter(i => i.type === 'link')}
             />
           </Card>
         )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Conteúdo Intranet">
         <div className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Conteúdo</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold"
                    value={activeSubTab}
                    onChange={(e) => setActiveSubTab(e.target.value as any)}
                  >
                     <option value="banner">Banner Hero</option>
                     <option value="news">Notícia / Comunicado</option>
                     <option value="widget">Widget Lateral</option>
                     <option value="link">Link Rápido</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Título</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500" placeholder="Digite o título..." />
               </div>
               {activeSubTab === 'banners' && (
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Imagem de Fundo</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-all cursor-pointer">
                       <Upload className="w-8 h-8 text-gray-300 mb-2" />
                       <p className="text-[12px] text-gray-500 font-medium">Arraste uma imagem ou clique para selecionar</p>
                       <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Recomendado: 1920x600px</p>
                    </div>
                 </div>
               )}
               {activeSubTab === 'news' && (
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Conteúdo (Markdown/HTML)</label>
                    <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500 h-32" placeholder="Escreva o comunicado..." />
                 </div>
               )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setIsModalOpen(false)}>Publicar Agora</Button>
           </div>
         </div>
      </Modal>
    </div>
  );
}

function IntranetCard({ item, onToggle, onRemove }: { item: IntranetItem, onToggle: (id: string) => void, onRemove: (id: string) => void }) {
  const imageUrl = item.imageUrl || item.image;
  const itemType = item.type || '';

  return (
    <div className={`bg-white border rounded-[28px] overflow-hidden transition-all hover:shadow-xl group ${item.active ? 'border-gray-100 shadow-sm' : 'border-gray-100 opacity-60 grayscale'}`}>
       {imageUrl && (
         <div className="relative h-40 overflow-hidden">
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
            <div className="absolute top-4 right-4 flex gap-2">
               <button onClick={() => onToggle(item.id)} className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-md transition-colors ${item.active ? 'bg-emerald-500/80 hover:bg-emerald-600' : 'bg-gray-500/80 hover:bg-gray-600'}`}>
                  {item.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
               </button>
            </div>
         </div>
       )}
       <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
             <Badge variant={item.active ? 'blue' : 'gray'} size="sm">{item.category || itemType.toUpperCase()}</Badge>
             {!imageUrl && (
               <div className="flex gap-1">
                  <button onClick={() => onToggle(item.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-500 transition-colors">
                     {item.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </button>
                  <button onClick={() => onRemove(item.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                     <Trash2 size={16} />
                  </button>
               </div>
             )}
          </div>
          <div>
             <h4 className="font-black text-gray-900 tracking-tight text-lg leading-tight">{item.title}</h4>
             {(item.description || item.summary) && <p className="text-[12px] text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">{item.description || item.summary}</p>}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} /> {item.date}
             </span>
             {item.url && <ExternalLink size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors" />}
          </div>
       </div>
    </div>
  );
}
