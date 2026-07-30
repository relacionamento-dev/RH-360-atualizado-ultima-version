import React, { useMemo, useRef, useState } from 'react';
import {
  Plus, MessageSquare, Heart, Share2,
  Image as ImageIcon, Paperclip, Send, Calendar, ChevronLeft, ChevronRight,
  Bell, CheckCircle2, X, Trash2, FileText, Cake, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar, Modal, EmptyState } from './ui/Misc';

import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { AnexoComunicado, Employee } from '../types';

interface IntranetModuleProps {
  onNavigate?: (view: string) => void;
}

/**
 * Acima disso o anexo entra só como chip com o nome do arquivo. O config inteiro
 * é serializado no localStorage; uma foto grande em base64 estoura a cota e
 * derruba o estado da aplicação inteira.
 */
const LIMITE_PREVIA_BYTES = 400 * 1024;

const formatarTamanho = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Dia e mês de uma data `yyyy-mm-dd`, lendo os números direto para o fuso não mexer no dia. */
const diaMes = (iso?: string) => {
  if (!iso) return null;
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  return { dia, mes };
};

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export default function IntranetModule({ onNavigate }: IntranetModuleProps) {
  const { config, createAnnouncement, comentarComunicado, removerComentario } = useAppConfig();
  const { addToast } = useToast();
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [postContent, setPostContent] = useState('');
  const [anexo, setAnexo] = useState<AnexoComunicado | null>(null);
  const [comentandoEm, setComentandoEm] = useState<string | null>(null);
  const [rascunhoComentario, setRascunhoComentario] = useState('');
  const [pautaAberta, setPautaAberta] = useState(false);
  const [pauta, setPauta] = useState({ titulo: '', descricao: '' });
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  const inputArquivo = useRef<HTMLInputElement>(null);

  // Só comunicados com banner entram no carrossel.
  const destaques = useMemo(() => config.comunicados.filter(c => c.imagem), [config.comunicados]);
  const total = destaques.length;
  const indice = total ? activeAnnouncement % total : 0;
  const destaque = destaques[indice];

  const girar = (passo: number) => {
    if (!total) return;
    setActiveAnnouncement(atual => (atual + passo + total) % total);
  };

  const abrirSeletor = (tipo: 'imagem' | 'arquivo') => {
    if (!inputArquivo.current) return;
    // "Foto" filtra imagens (no celular isso abre a câmera); "Anexo" aceita tudo.
    inputArquivo.current.accept = tipo === 'imagem' ? 'image/*' : '';
    inputArquivo.current.click();
  };

  const aoEscolherArquivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    const ehImagem = arquivo.type.startsWith('image/');
    const base: AnexoComunicado = {
      nome: arquivo.name,
      tipo: ehImagem ? 'imagem' : 'arquivo',
      tamanho: arquivo.size
    };

    if (ehImagem && arquivo.size <= LIMITE_PREVIA_BYTES) {
      const leitor = new FileReader();
      leitor.onload = () => setAnexo({ ...base, previa: String(leitor.result) });
      leitor.readAsDataURL(arquivo);
      return;
    }
    if (ehImagem) {
      addToast(`A imagem tem ${formatarTamanho(arquivo.size)}; vai como anexo, sem prévia.`, 'info');
    }
    setAnexo(base);
  };

  const handlePublish = () => {
    if (!postContent.trim() && !anexo) return;
    const texto = postContent.trim();
    createAnnouncement({
      title: texto ? texto.slice(0, 50) + (texto.length > 50 ? '...' : '') : anexo!.nome,
      content: texto,
      category: 'Geral',
      priority: 'Normal',
      anexo: anexo || undefined
    });
    setPostContent('');
    setAnexo(null);
    addToast('Comunicado publicado com sucesso!', 'success');
  };

  const enviarComentario = (comunicadoId: string) => {
    if (!rascunhoComentario.trim()) return;
    comentarComunicado(comunicadoId, rascunhoComentario);
    setRascunhoComentario('');
  };

  const enviarPauta = () => {
    if (!pauta.titulo.trim() || !pauta.descricao.trim()) return;
    setPautaAberta(false);
    setPauta({ titulo: '', descricao: '' });
    addToast('Sua pauta foi enviada para o time de Comunicação Corporativa.', 'success');
  };

  // --- Gente & Celebrações: sai do cadastro real, não de uma lista fixa ---
  const mesAtual = new Date().getMonth() + 1;
  const aniversariantesDoMes = useMemo(
    () =>
      config.colaboradores
        .filter(e => e.status !== 'Desligado' && diaMes(e.birthDate)?.mes === mesAtual)
        .sort((a, b) => diaMes(a.birthDate)!.dia - diaMes(b.birthDate)!.dia),
    [config.colaboradores, mesAtual]
  );
  const novosDoMes = useMemo(
    () =>
      config.colaboradores
        .filter(e => e.status !== 'Desligado' && diaMes(e.admissionDate)?.mes === mesAtual)
        .sort((a, b) => diaMes(a.admissionDate)!.dia - diaMes(b.admissionDate)!.dia),
    [config.colaboradores, mesAtual]
  );

  const LinhaPessoa = ({
    pessoa, data, cor, icone
  }: { pessoa: Employee; data?: string; cor: string; icone: React.ReactNode }) => (
    <div className="flex gap-4 items-center">
      <div className="relative shrink-0">
        <Avatar src={pessoa.avatar} name={pessoa.name} size="sm" className="ring-2 ring-gray-100" />
        <div className={`absolute -top-1 -right-1 w-5 h-5 ${cor} rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm`}>
          {icone}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-900 truncate" title={pessoa.name}>{pessoa.name}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase truncate" title={`${pessoa.role} • ${pessoa.department}`}>
          {pessoa.role} • {pessoa.department}
        </p>
      </div>
      {data && <span className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">{data}</span>}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <input
        ref={inputArquivo}
        type="file"
        className="hidden"
        aria-hidden="true"
        onChange={aoEscolherArquivo}
      />

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
          {destaque && (
            <div className="relative h-[300px] rounded-[24px] overflow-hidden group shadow-lg shadow-orange-50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={destaque.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <img src={destaque.imagem} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 space-y-2">
                    <Badge variant="blue" size="sm" className="bg-[var(--color-brand-primary)] text-white border-transparent uppercase tracking-widest text-[9px]">COMUNICADO OFICIAL</Badge>
                    <h2 className="text-2xl font-bold text-white tracking-tight max-w-xl">{destaque.title}</h2>
                    <p className="text-gray-300 text-[12px] font-bold flex items-center gap-2"><Calendar size={14} /> {destaque.date}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Com um comunicado só as setas não teriam para onde ir. */}
              {total > 1 && (
                <>
                  <div className="absolute bottom-8 right-8 flex items-center gap-2">
                    <span className="text-white/80 text-[11px] font-bold tabular-nums mr-1">{indice + 1}/{total}</span>
                    <Button variant="ghost" size="icon" aria-label="Comunicado anterior" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => girar(-1)}><ChevronLeft size={16} /></Button>
                    <Button variant="ghost" size="icon" aria-label="Próximo comunicado" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => girar(1)}><ChevronRight size={16} /></Button>
                  </div>
                  <div className="absolute bottom-10 left-8 flex gap-1.5">
                    {destaques.map((c, i) => (
                      <button
                        key={c.id}
                        aria-label={`Ir para o comunicado ${i + 1}`}
                        onClick={() => setActiveAnnouncement(i)}
                        className={`h-1.5 rounded-full transition-all ${i === indice ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

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

                {anexo && (
                  <div className="flex items-center gap-3 rounded-[12px] border border-gray-100 bg-gray-50 p-3">
                    {anexo.previa ? (
                      <img src={anexo.previa} alt="" className="w-14 h-14 rounded-[8px] object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-[8px] bg-white flex items-center justify-center text-gray-400 shrink-0">
                        {anexo.tipo === 'imagem' ? <ImageIcon size={20} /> : <FileText size={20} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-700 truncate" title={anexo.nome}>{anexo.nome}</p>
                      <p className="text-[11px] font-medium text-gray-400">{formatarTamanho(anexo.tamanho)}</p>
                    </div>
                    <button
                      onClick={() => setAnexo(null)}
                      aria-label={`Remover ${anexo.nome}`}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm" leftIcon={<ImageIcon size={14} />} onClick={() => abrirSeletor('imagem')}>Foto</Button>
                    <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm" leftIcon={<Paperclip size={14} />} onClick={() => abrirSeletor('arquivo')}>Anexo</Button>
                  </div>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 shadow-lg shadow-orange-500/20" leftIcon={<Send size={14} />} disabled={!postContent.trim() && !anexo} onClick={handlePublish}>Publicar</Button>
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
              <p className="text-[10px] font-bold text-gray-400">Classificar por: <span className="text-[var(--color-brand-primary-text)] cursor-pointer">Relevância</span></p>
            </div>

            {config.comunicados.map((item) => {
              const comentarios = item.comentarios || [];
              const aberto = comentandoEm === item.id;
              return (
                <Card key={item.id} className="p-8 space-y-6 hover:border-[var(--color-brand-primary)] transition-all group bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar name={item.author} className="w-10 h-10 rounded-[12px] border border-gray-100" />
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">{item.author}</p>
                        <p className="text-[11px] font-bold text-[var(--color-brand-primary-text)] uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 tabular-nums uppercase">{item.date}</span>
                  </div>

                  {item.content && (
                    <p className="text-[13px] text-gray-700 leading-relaxed font-medium">{item.content}</p>
                  )}

                  {item.anexo && (
                    item.anexo.previa ? (
                      <img
                        src={item.anexo.previa}
                        alt={item.anexo.nome}
                        className="w-full max-h-[380px] object-cover rounded-[16px] border border-gray-100"
                      />
                    ) : (
                      <div className="flex items-center gap-3 rounded-[12px] border border-gray-100 bg-gray-50 p-4">
                        <div className="w-10 h-10 rounded-[8px] bg-white flex items-center justify-center text-gray-400 shrink-0">
                          {item.anexo.tipo === 'imagem' ? <ImageIcon size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-700 truncate" title={item.anexo.nome}>{item.anexo.nome}</p>
                          <p className="text-[11px] font-medium text-gray-400">{formatarTamanho(item.anexo.tamanho)}</p>
                        </div>
                      </div>
                    )
                  )}

                  <div className="pt-4 border-t border-gray-50 flex items-center gap-6">
                    <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors">
                      <Heart size={14} /> 0 <span className="hidden sm:inline">curtidas</span>
                    </button>
                    <button
                      onClick={() => { setComentandoEm(aberto ? null : item.id); setRascunhoComentario(''); }}
                      aria-expanded={aberto}
                      className={`flex items-center gap-2 text-[12px] font-bold transition-colors ${aberto ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                    >
                      <MessageSquare size={14} /> {comentarios.length} <span className="hidden sm:inline">comentários</span>
                    </button>
                    <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-[var(--color-brand-primary)] transition-colors ml-auto">
                      <Share2 size={14} />
                    </button>
                  </div>

                  {aberto && (
                    <div className="space-y-4 pt-2">
                      {comentarios.length === 0 ? (
                        <p className="text-[12px] font-medium text-gray-400">Nenhum comentário ainda. Seja o primeiro.</p>
                      ) : (
                        <ul className="space-y-3">
                          {comentarios.map(c => {
                            // O botão de apagar só aparece no próprio comentário.
                            // A mesma checagem é refeita no contexto, então não
                            // adianta forçar o clique por fora.
                            const meu = c.autorId === config.usuarioAtual.id;
                            return (
                              <li key={c.id} className="flex gap-3 items-start">
                                <Avatar name={c.autor} size="sm" className="shrink-0" />
                                <div className="flex-1 min-w-0 rounded-[12px] bg-gray-50 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[12px] font-bold text-gray-900">{c.autor}</p>
                                    <span className="text-[10px] font-medium text-gray-400">
                                      {new Date(c.dataHora).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-[13px] text-gray-700 font-medium mt-0.5 break-words">{c.texto}</p>
                                </div>
                                {meu && (
                                  <button
                                    onClick={() => removerComentario(item.id, c.id)}
                                    aria-label="Apagar meu comentário"
                                    title="Apagar comentário"
                                    className="p-1.5 rounded-full text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <div className="flex gap-2">
                        <input
                          value={rascunhoComentario}
                          onChange={e => setRascunhoComentario(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') enviarComentario(item.id); }}
                          placeholder="Escreva um comentário..."
                          className="flex-1 bg-gray-50 border border-gray-100 rounded-[12px] px-4 py-2.5 text-[13px] font-medium outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                        <Button size="sm" disabled={!rascunhoComentario.trim()} onClick={() => enviarComentario(item.id)}>
                          Comentar
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <Card title="Gente & Celebrações">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Aniversariantes do mês</p>
                <div className="space-y-4">
                  {aniversariantesDoMes.slice(0, 3).map(p => (
                    <LinhaPessoa
                      key={p.id}
                      pessoa={p}
                      data={`${doisDigitos(diaMes(p.birthDate)!.dia)}/${doisDigitos(mesAtual)}`}
                      cor="bg-orange-500"
                      icone={<Heart size={10} fill="currentColor" />}
                    />
                  ))}
                  {aniversariantesDoMes.length === 0 && (
                    <p className="text-[12px] font-medium text-gray-400">Ninguém faz aniversário este mês.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Boas-vindas (Novos Membros)</p>
                <div className="space-y-4">
                  {novosDoMes.slice(0, 3).map(p => (
                    <LinhaPessoa
                      key={p.id}
                      pessoa={p}
                      data={`${doisDigitos(diaMes(p.admissionDate)!.dia)}/${doisDigitos(mesAtual)}`}
                      cor="bg-blue-500"
                      icone={<Plus size={10} strokeWidth={4} />}
                    />
                  ))}
                  {novosDoMes.length === 0 && (
                    <p className="text-[12px] font-medium text-gray-400">Nenhuma admissão neste mês.</p>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full text-[11px]" size="sm" onClick={() => setCalendarioAberto(true)}>
                Ver Calendário de Gente
              </Button>
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
                  <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-[var(--color-brand-primary-text)] transition-colors leading-tight">{news.title}</h4>
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
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg shadow-orange-500/20 border-none h-12"
                onClick={() => setPautaAberta(true)}
              >
                Sugerir Pauta
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {pautaAberta && (
        <Modal isOpen title="Sugerir pauta" onClose={() => setPautaAberta(false)} size="md">
          <div className="space-y-5">
            <p className="text-[13px] text-gray-500 font-medium">
              Conte o que você gostaria de ver publicado. O time de Comunicação Corporativa recebe a sugestão e responde pelo canal interno.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="pauta-titulo" className="label-caps ml-1 block">Título</label>
              <input
                id="pauta-titulo"
                value={pauta.titulo}
                onChange={e => setPauta(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex.: Série sobre carreira em Y"
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 placeholder:font-medium placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pauta-descricao" className="label-caps ml-1 block">Descrição</label>
              <textarea
                id="pauta-descricao"
                rows={4}
                value={pauta.descricao}
                onChange={e => setPauta(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Explique em poucas linhas o assunto e por que ele interessa ao time."
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 resize-none placeholder:font-medium placeholder:text-gray-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPautaAberta(false)}>Cancelar</Button>
              <Button disabled={!pauta.titulo.trim() || !pauta.descricao.trim()} onClick={enviarPauta}>
                Enviar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {calendarioAberto && (
        <Modal isOpen title="Calendário de Gente" onClose={() => setCalendarioAberto(false)} size="lg">
          <div className="space-y-8">
            <p className="text-[13px] text-gray-500 font-medium">
              Aniversários e admissões do mês {doisDigitos(mesAtual)}, em ordem de data.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cake size={16} className="text-orange-500" />
                <h4 className="text-[14px] font-black text-gray-900">Aniversariantes ({aniversariantesDoMes.length})</h4>
              </div>
              {aniversariantesDoMes.length === 0 ? (
                <EmptyState icon={<Cake size={32} />} title="Nenhum aniversário este mês" description="Volte no mês que vem." />
              ) : (
                <div className="space-y-3">
                  {aniversariantesDoMes.map(p => (
                    <LinhaPessoa
                      key={p.id}
                      pessoa={p}
                      data={`${doisDigitos(diaMes(p.birthDate)!.dia)}/${doisDigitos(mesAtual)}`}
                      cor="bg-orange-500"
                      icone={<Heart size={10} fill="currentColor" />}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 pt-4">
                <UserPlus size={16} className="text-blue-500" />
                <h4 className="text-[14px] font-black text-gray-900">Novos membros ({novosDoMes.length})</h4>
              </div>
              {novosDoMes.length === 0 ? (
                <EmptyState icon={<UserPlus size={32} />} title="Nenhuma admissão este mês" description="Nada por aqui ainda." />
              ) : (
                <div className="space-y-3">
                  {novosDoMes.map(p => (
                    <LinhaPessoa
                      key={p.id}
                      pessoa={p}
                      data={`${doisDigitos(diaMes(p.admissionDate)!.dia)}/${doisDigitos(mesAtual)}`}
                      cor="bg-blue-500"
                      icone={<Plus size={10} strokeWidth={4} />}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
