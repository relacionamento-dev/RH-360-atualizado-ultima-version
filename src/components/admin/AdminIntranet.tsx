import React, { useState } from 'react';
import {
  Layout, FileText, Link as LinkIcon,
  Plus, Edit2, Trash2, Upload,
  ExternalLink, Calendar, Image as ImageIcon,
  CheckCircle2, XCircle, Power
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Misc';
import { Select } from '../ui/Select';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { IntranetItem } from '../../types';
import { SectionHeader, SubTabs, AdminSearch, Field, ADMIN_FIELD_CLASS } from './AdminUI';

export default function AdminIntranet() {
  const { config, updateConfig } = useAppConfig();
  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'news' | 'widgets' | 'links'>('banners');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // O campo de busca existia mas não filtrava nada; agora vale para todas as abas.
  const matchesSearch = (item: IntranetItem) =>
    !searchTerm || (item.title || '').toLowerCase().includes(searchTerm.toLowerCase());

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
      <SectionHeader
        title="Conteúdo da intranet"
        description="O que os colaboradores veem na página inicial: destaques, comunicados, atalhos e blocos laterais."
        actions={<Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>Novo conteúdo</Button>}
      />

      <div className="space-y-4">
        <SubTabs
          value={activeSubTab}
          onChange={(id) => setActiveSubTab(id as any)}
          tabs={[
            { id: 'banners', label: 'Destaques', icon: <ImageIcon size={14} /> },
            { id: 'news', label: 'Comunicados', icon: <FileText size={14} /> },
            { id: 'widgets', label: 'Blocos laterais', icon: <Layout size={14} /> },
            { id: 'links', label: 'Atalhos', icon: <LinkIcon size={14} /> },
          ]}
        />

        <AdminSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar conteúdo..." />
      </div>

      <div className="animate-in fade-in duration-500">
         {activeSubTab === 'banners' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.intranet.filter(i => i.type === 'banner').filter(matchesSearch).map(banner => (
                <IntranetCard key={banner.id} item={banner} onToggle={toggleStatus} onRemove={removeItem} />
              ))}
           </div>
         )}

         {activeSubTab === 'news' && (
           <Card padding="none">
             <Table
               columns={[
                 { header: 'Comunicado', accessor: 'title', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
                 { header: 'Tipo', accessor: 'category', render: (val) => <Badge variant="gray">{val}</Badge> },
                 { header: 'Publicado em', accessor: 'date', render: (val) => <span className="text-[12px] font-medium text-gray-500">{val}</span> },
                 { header: 'Situação', accessor: 'active', render: (val) => <Badge variant={val ? 'green' : 'gray'}>{val ? 'Publicado' : 'Oculto'}</Badge> },
                 { header: '', accessor: 'id', render: (id, row: any) => (
                   <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={row.active ? 'Ocultar' : 'Publicar'} title={row.active ? 'Ocultar' : 'Publicar'} onClick={() => toggleStatus(id)}>
                        {row.active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Editar" title="Editar"><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" aria-label="Remover" title="Remover" className="hover:text-red-500" onClick={() => removeItem(id)}><Trash2 size={16} /></Button>
                   </div>
                 )}
               ]}
               data={config.intranet.filter(i => i.type === 'news' || i.category === 'Notícia' || i.category === 'Comunicado').filter(matchesSearch)}
             />
           </Card>
         )}

         {activeSubTab === 'widgets' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {config.intranet.filter(i => i.type === 'widget').filter(matchesSearch).map(widget => (
                <IntranetCard key={widget.id} item={widget} onToggle={toggleStatus} onRemove={removeItem} />
              ))}
           </div>
         )}

         {activeSubTab === 'links' && (
           <Card padding="none">
             <Table
               columns={[
                 { header: 'Atalho', accessor: 'title', render: (val) => <span className="font-bold text-[13px] text-gray-900">{val}</span> },
                 { header: 'Leva para', accessor: 'url', render: (val) => <span className="text-[12px] font-medium text-blue-500 truncate max-w-[240px] inline-block align-bottom">{val}</span> },
                 { header: 'Situação', accessor: 'active', render: (val) => <Badge variant={val ? 'green' : 'gray'}>{val ? 'Visível' : 'Oculto'}</Badge> },
                 { header: '', accessor: 'id', render: (id) => (
                   <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Mostrar ou ocultar" title="Mostrar ou ocultar" onClick={() => toggleStatus(id)}><Power size={16} /></Button>
                      <Button variant="ghost" size="icon" aria-label="Editar" title="Editar"><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" aria-label="Remover" title="Remover" className="hover:text-red-500" onClick={() => removeItem(id)}><Trash2 size={16} /></Button>
                   </div>
                 )}
               ]}
               data={config.intranet.filter(i => i.type === 'link').filter(matchesSearch)}
             />
           </Card>
         )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo conteúdo da intranet">
         <div className="space-y-6">
            <div className="space-y-4">
               <Field label="O que você quer publicar">
                  <Select
                    className="w-full"
                    ariaLabel="Tipo de conteúdo"
                    value={activeSubTab}
                    onChange={(value) => setActiveSubTab(value as any)}
                    options={[
                      { value: 'banners', label: 'Destaque na página inicial' },
                      { value: 'news', label: 'Comunicado' },
                      { value: 'widgets', label: 'Bloco lateral' },
                      { value: 'links', label: 'Atalho' },
                    ]}
                  />
               </Field>
               <Field label="Título">
                  <input type="text" className={`${ADMIN_FIELD_CLASS} w-full`} placeholder="Digite o título..." />
               </Field>
               {activeSubTab === 'banners' && (
                 <Field label="Imagem" hint="Tamanho recomendado: 1920 x 600 pixels.">
                    <div className="border border-dashed border-gray-200 rounded-[12px] p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                       <Upload className="w-7 h-7 text-gray-300 mb-2" />
                       <p className="text-[13px] text-gray-500 font-medium">Arraste uma imagem ou clique para selecionar</p>
                    </div>
                 </Field>
               )}
               {activeSubTab === 'news' && (
                 <Field label="Texto do comunicado">
                    <textarea className={`${ADMIN_FIELD_CLASS} w-full h-32 resize-none`} placeholder="Escreva o comunicado..." />
                 </Field>
               )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => setIsModalOpen(false)}>Publicar</Button>
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
    <div className={`bg-white border border-gray-100 rounded-[12px] overflow-hidden transition-colors hover:border-gray-200 ${item.active ? '' : 'opacity-60'}`}>
       {imageUrl && (
         <div className="relative h-32 overflow-hidden">
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
         </div>
       )}
       <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
             <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-[14px] leading-tight truncate">{item.title}</h4>
                {(item.description || item.summary) && (
                  <p className="text-[12px] text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                    {item.description || item.summary}
                  </p>
                )}
             </div>
             <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  title={item.active ? 'Ocultar' : 'Publicar'}
                  aria-label={item.active ? 'Ocultar' : 'Publicar'}
                  onClick={() => onToggle(item.id)}
                  className="p-1.5 rounded-[8px] text-gray-300 hover:text-emerald-500 hover:bg-gray-50 transition-colors"
                >
                   {item.active ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                </button>
                <button
                  type="button"
                  title="Remover"
                  aria-label="Remover"
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 rounded-[8px] text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                   <Trash2 size={15} />
                </button>
             </div>
          </div>
          <div className="flex items-center justify-between gap-2">
             <div className="flex items-center gap-2 min-w-0">
                <Badge variant={item.active ? 'green' : 'gray'} size="sm">{item.active ? 'Publicado' : 'Oculto'}</Badge>
                <span className="text-[12px] text-gray-400 font-medium truncate">{item.category || itemType}</span>
             </div>
             <span className="text-[12px] text-gray-400 font-medium flex items-center gap-1 shrink-0">
                <Calendar size={12} /> {item.date}
                {item.url && <ExternalLink size={12} className="text-gray-300 ml-1" />}
             </span>
          </div>
       </div>
    </div>
  );
}
