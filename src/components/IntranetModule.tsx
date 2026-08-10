import React, { useMemo, useRef, useState } from 'react';
import {
  Plus, MessageSquare, Heart, Share2,
  Image as ImageIcon, Paperclip, Send, Calendar, ChevronLeft, ChevronRight,
  Bell, CheckCircle2, X, Trash2, FileText, Cake, UserPlus, MoreHorizontal, Pencil,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar, Modal, EmptyState } from './ui/Misc';

import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { AnexoComunicado, Announcement, Employee } from '../types';
import { ACOES_DE_TELA, podeAcessarView, podeExecutarAcao, podeGerenciarComunicado } from '../utils/permissions';
import { listarMinhasAprovacoes, organizacaoDoConfig } from '../utils/approvalFlow';
import { listarTarefasDaCentral } from '../utils/tarefas';

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

/**
 * Banner de reserva do comunicado criado sem imagem. É um SVG embutido (não
 * depende de rede) só para o item entrar no carrossel com aparência de capa.
 */
const BANNER_PADRAO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1A1D21"/>
          <stop offset="60%" stop-color="#33261f"/>
          <stop offset="100%" stop-color="#F26522"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="400" fill="url(#g)"/>
      <circle cx="1010" cy="90" r="190" fill="#ffffff" opacity="0.05"/>
      <circle cx="180" cy="330" r="130" fill="#ffffff" opacity="0.04"/>
    </svg>`
  );

const fotoDoSeed = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=200&h=200&fit=crop`;

/**
 * Avatar das contas institucionais do feed ("RH", "Comunicação Corporativa",
 * "Tecnologia", "TI"). Elas não são uma pessoa, então iniciais em cima de um
 * quadrado cinza não dizem nada — cada uma usa uma foto que JÁ EXISTE no seed
 * de colaboradores (`data.ts`), sem imagem nova entrando no projeto.
 *
 * Critério da escolha, nesta ordem:
 * 1. uma foto por conta, nenhuma repetida;
 * 2. nada de quem pode assinar um post no feed — as fotos dos DEMO_USERS (todo
 *    login publica com a própria foto) e a da Ana Paula Lima, autora do
 *    comentário do seed, ficaram de fora, senão a mesma cara apareceria com dois
 *    nomes diferentes;
 * 3. só URL que responde 200: as três mortas do seed (Karina Lopes, Giovana
 *    Santos e Isabela Rocha) estão fora. Se alguma cair depois, o `onError` do
 *    Avatar devolve as iniciais.
 */
const AVATARES_INSTITUCIONAIS: Record<string, string> = {
  'rh': fotoDoSeed('1573496359142-b8d87734a5a2'),                         // Ana Souza       · EMP-002 · Departamento Pessoal
  'comunicação corporativa': fotoDoSeed('1560250097-0b93528c311a'),       // Bruno Meirelles · EMP-009 · Vendas
  'tecnologia': fotoDoSeed('1506794778202-cad84cf45f1d'),                 // Daniel Rocha    · EMP-011 · Tech Lead
  'ti': fotoDoSeed('1504257432389-52343af06ae3')                          // Helio Garcia    · EMP-015 · Operações
};

/** Reserva para conta institucional fora da lista acima — mesmo seed, sem repetir as de cima. */
const AVATARES_RESERVA = [
  fotoDoSeed('1554151228-14d9def656e4'), // Eliana Martins   · EMP-012
  fotoDoSeed('1594744803329-e58b31de8bf5'), // Marta Rocha    · EMP-020
  fotoDoSeed('1539571696357-5a69c17a67c6'), // Renato Oliveira · EMP-007
  fotoDoSeed('1544005313-94ddf0286df2'),    // Fabiana Lima    · EMP-008
  fotoDoSeed('1542909168-82c3e7fdca5c'),    // Felipe Neves    · EMP-013
  fotoDoSeed('1492562080023-ab3db95bfbce'), // Jorge Amado     · EMP-017
  fotoDoSeed('1463453091185-61582044d556')  // Leonardo Vinci  · EMP-019
];

/** `chave` já vem normalizada (minúsculas, sem espaços nas pontas). */
const avatarInstitucional = (chave: string) => {
  const definido = AVATARES_INSTITUCIONAIS[chave];
  if (definido) return definido;
  // Hash do nome: a conta desconhecida ganha sempre a mesma foto, sem sorteio
  // que mude a cada render.
  let hash = 0;
  for (let i = 0; i < chave.length; i++) hash = (hash * 31 + chave.charCodeAt(i)) % 9973;
  return AVATARES_RESERVA[hash % AVATARES_RESERVA.length];
};

export default function IntranetModule({ onNavigate }: IntranetModuleProps) {
  const { config, createAnnouncement, editarComunicado, excluirComunicado, comentarComunicado, removerComentario } = useAppConfig();
  const { addToast } = useToast();
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [postContent, setPostContent] = useState('');
  const [anexo, setAnexo] = useState<AnexoComunicado | null>(null);
  const [comentandoEm, setComentandoEm] = useState<string | null>(null);
  const [rascunhoComentario, setRascunhoComentario] = useState('');
  // Ações do post: menu aberto, post em edição inline e post aguardando
  // confirmação de exclusão.
  const [menuPost, setMenuPost] = useState<string | null>(null);
  const [editandoPost, setEditandoPost] = useState<string | null>(null);
  const [rascunhoPost, setRascunhoPost] = useState('');
  const [excluindoPost, setExcluindoPost] = useState<Announcement | null>(null);
  const [pautaAberta, setPautaAberta] = useState(false);
  const [pauta, setPauta] = useState({ titulo: '', descricao: '' });
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [comunicadoAberto, setComunicadoAberto] = useState(false);
  const [comunicado, setComunicado] = useState<{ titulo: string; descricao: string; imagem?: string; nomeImagem?: string }>({
    titulo: '', descricao: ''
  });

  const inputArquivo = useRef<HTMLInputElement>(null);
  const inputBanner = useRef<HTMLInputElement>(null);

  // O QUE ESTE PERFIL PODE FAZER NESTA TELA
  //
  // A Intranet é a única tela do Colaborador, e era a única que oferecia ação
  // sem checar perfil: ele via "Novo Comunicado" e atalhos para Central de
  // Tarefas e Minhas Aprovações — telas que o menu lateral dele não tem.
  // Os atalhos usam a MESMA função do menu, para não existirem duas regras.
  const podeComunicar = podeExecutarAcao(config.usuarioAtual, ACOES_DE_TELA.COMUNICADO_OFICIAL, config.perfis);
  const podeVerTarefas = podeAcessarView(config.usuarioAtual, 'tasks', config.perfis);
  const podeVerAprovacoes = podeAcessarView(config.usuarioAtual, 'approvals', config.perfis);

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

  /** Post do feed não tem título próprio: ele sai do começo do texto. */
  const tituloDoTexto = (texto: string) => texto.slice(0, 50) + (texto.length > 50 ? '...' : '');

  const handlePublish = () => {
    if (!postContent.trim() && !anexo) return;
    const texto = postContent.trim();
    createAnnouncement({
      title: texto ? tituloDoTexto(texto) : anexo!.nome,
      content: texto,
      category: 'Geral',
      priority: 'Normal',
      anexo: anexo || undefined
    });
    setPostContent('');
    setAnexo(null);
    addToast('Comunicado publicado com sucesso!', 'success');
  };

  const abrirEdicao = (item: Announcement) => {
    setMenuPost(null);
    setEditandoPost(item.id);
    setRascunhoPost(item.content);
  };

  const cancelarEdicao = () => {
    setEditandoPost(null);
    setRascunhoPost('');
  };

  const salvarEdicao = (item: Announcement) => {
    const texto = rascunhoPost.trim();
    if (!texto) return;
    // O título só acompanha o texto quando foi derivado dele (post do feed).
    // Comunicado oficial tem título próprio, digitado no modal — esse fica.
    const derivado = item.title === tituloDoTexto(item.content);
    editarComunicado(item.id, derivado ? { content: texto, title: tituloDoTexto(texto) } : { content: texto });
    cancelarEdicao();
    addToast('Publicação atualizada.', 'success');
  };

  const confirmarExclusao = () => {
    if (!excluindoPost) return;
    excluirComunicado(excluindoPost.id);
    if (editandoPost === excluindoPost.id) cancelarEdicao();
    if (comentandoEm === excluindoPost.id) setComentandoEm(null);
    setExcluindoPost(null);
    setActiveAnnouncement(0); // o carrossel pode ter perdido o item em que estava
    addToast('Publicação excluída do feed.', 'success');
  };

  const enviarComentario = (comunicadoId: string) => {
    if (!rascunhoComentario.trim()) return;
    comentarComunicado(comunicadoId, rascunhoComentario);
    setRascunhoComentario('');
  };

  const aoEscolherBanner = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    if (arquivo.size > LIMITE_PREVIA_BYTES) {
      addToast(`A imagem tem ${formatarTamanho(arquivo.size)}. Escolha uma até 400 KB.`, 'warning');
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () =>
      setComunicado(c => ({ ...c, imagem: String(leitor.result), nomeImagem: arquivo.name }));
    leitor.readAsDataURL(arquivo);
  };

  const publicarComunicado = () => {
    if (!comunicado.titulo.trim() || !comunicado.descricao.trim()) return;
    createAnnouncement({
      title: comunicado.titulo.trim(),
      content: comunicado.descricao.trim(),
      category: 'Geral',
      priority: 'Importante',
      // Sem imagem o comunicado não apareceria no carrossel; o banner de
      // reserva garante que ele entre lá como comunicado oficial.
      imagem: comunicado.imagem || BANNER_PADRAO
    });
    setComunicado({ titulo: '', descricao: '' });
    setComunicadoAberto(false);
    setActiveAnnouncement(0); // o novo entra no topo da lista
    addToast('Comunicado oficial publicado no carrossel.', 'success');
  };

  // Notificações não lidas primeiro; as lidas ficam no fim como histórico.
  const notificacoes = useMemo(() => {
    const todas = config.notificacoes || [];
    return [...todas].sort((a, b) => Number(a.lida) - Number(b.lida));
  }, [config.notificacoes]);
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Os atalhos anunciam exatamente o que a tela que eles abrem lista — mesma
  // função, mesmo recorte. Contar "tudo em aberto" mostrava a base inteira a
  // quem, em Minhas Aprovações, só vê as alçadas que são dele.
  const minhasAprovacoes = useMemo(
    () => listarMinhasAprovacoes(config.solicitacoes, config.processos, config.usuarioAtual, config.grupos, organizacaoDoConfig(config)).length,
    [config.solicitacoes, config.processos, config.usuarioAtual, config.grupos]
  );
  const tarefasPendentes = useMemo(
    () => listarTarefasDaCentral(config.tarefas).length,
    [config.tarefas]
  );

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

  // --- Foto de quem assina o post/comentário do feed ---
  // O comunicado só guarda o nome do autor (o comentário guarda também o id),
  // então a foto tem que vir do cadastro. Indexa por id e por nome; contas
  // genéricas ("RH", "Comunicação Corporativa", "Tecnologia") não existem no
  // cadastro e ficam sem `src` — o próprio Avatar mostra as iniciais, o mesmo
  // fallback que ele já usa no `onError` de URL quebrada.
  const fotosDoCadastro = useMemo(() => {
    const porId = new Map<string, string>();
    const porNome = new Map<string, string>();
    // Quem existe no cadastro, com ou sem foto: é o que separa uma pessoa real
    // sem retrato (fica nas iniciais) de uma conta institucional (silhueta).
    const pessoas = new Set<string>();
    const registrar = (id?: string, nome?: string, avatar?: string) => {
      if (id) pessoas.add(id);
      if (nome) pessoas.add(nome.trim().toLowerCase());
      if (!avatar) return;
      if (id) porId.set(id, avatar);
      if (nome) porNome.set(nome.trim().toLowerCase(), avatar);
    };
    // Ordem: o cadastro do colaborador vale mais que o usuário de demonstração,
    // e o usuário logado (que pode ter trocado a foto na sessão) vale mais que os dois.
    (config.usuariosDemo || []).forEach(u => registrar(u.id, u.name, u.avatar));
    config.colaboradores.forEach(e => registrar(e.id, e.name, e.avatar));
    registrar(config.usuarioAtual.id, config.usuarioAtual.name, config.usuarioAtual.avatar);
    return { porId, porNome, pessoas };
  }, [config.colaboradores, config.usuariosDemo, config.usuarioAtual]);

  /**
   * O que entra no `src` do Avatar: a foto do cadastro; a foto institucional
   * quando o autor não é uma pessoa cadastrada; e `undefined` — as iniciais do
   * próprio Avatar — para a pessoa cadastrada que não tem foto.
   */
  const avatarDoAutor = (nome?: string, id?: string): string | undefined => {
    if (id) {
      const porId = fotosDoCadastro.porId.get(id);
      if (porId) return porId;
    }
    const chave = nome?.trim().toLowerCase();
    if (chave) {
      const porNome = fotosDoCadastro.porNome.get(chave);
      if (porNome) return porNome;
    }
    const ehPessoa = (id && fotosDoCadastro.pessoas.has(id)) || (chave && fotosDoCadastro.pessoas.has(chave));
    if (ehPessoa || !chave) return undefined;
    return avatarInstitucional(chave);
  };

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
      <input
        ref={inputBanner}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        onChange={aoEscolherBanner}
      />

      <PageHeader
        title="Intranet Corporativa"
        subtitle="O canal oficial de comunicação e engajamento do ecossistema RH360."
        actions={
          <div className="flex gap-3">
            <div className="relative">
              <Button
                variant="outline"
                leftIcon={<Bell size={16} />}
                aria-expanded={notificacoesAbertas}
                onClick={() => setNotificacoesAbertas(a => !a)}
              >
                Notificações
                {naoLidas > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-brand-primary)] text-white text-[10px] font-black">
                    {naoLidas}
                  </span>
                )}
              </Button>

              {notificacoesAbertas && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setNotificacoesAbertas(false)} />
                  <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-100 rounded-[12px] shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 text-left">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pendências e avisos</span>
                      <Badge variant="blue" size="sm">{naoLidas} NOVAS</Badge>
                    </div>

                    {podeVerAprovacoes && minhasAprovacoes > 0 && (
                      <button
                        onClick={() => { setNotificacoesAbertas(false); onNavigate?.('approvals'); }}
                        className="w-full p-4 border-b border-gray-50 hover:bg-orange-50/40 transition-colors text-left flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-[10px] bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-black text-gray-900 leading-tight">
                            {minhasAprovacoes} solicitaç{minhasAprovacoes === 1 ? 'ão' : 'ões'} aguardando a sua aprovação
                          </p>
                          <p className="text-[12px] text-gray-500">Abrir Minhas Aprovações</p>
                        </div>
                      </button>
                    )}

                    <div className="max-h-[360px] overflow-y-auto">
                      {notificacoes.length > 0 ? (
                        notificacoes.map(n => (
                          <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.lida ? 'bg-gray-200' : 'bg-orange-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-gray-900 leading-tight">{n.titulo}</p>
                                <p className="text-[12px] text-gray-500 mt-1">{n.mensagem}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">
                                  {new Date(n.dataHora).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        (!podeVerAprovacoes || minhasAprovacoes === 0) && (
                          <div className="p-8 text-center">
                            <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-[13px] font-bold text-gray-400">Nenhuma notificação</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {podeComunicar && (
              <Button leftIcon={<Plus size={16} />} onClick={() => setComunicadoAberto(true)}>Novo Comunicado</Button>
            )}
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
                    {/* `shrink-0`: sem ele o SVG é item flexível e pode ser
                        comprimido contra o primeiro dígito da data. */}
                    <p className="text-gray-300 text-[12px] font-bold flex items-center gap-2.5">
                      <Calendar size={14} className="shrink-0" />
                      <span>{destaque.date}</span>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Com um comunicado só as setas não teriam para onde ir. */}
              {total > 1 && (
                <>
                  {/*
                    Controles todos no mesmo canto. As bolinhas ficavam em
                    `bottom-10 left-8` e caíam em cima da linha da data — a
                    bolinha ativa é uma barra branca de 24px e cortava o
                    "/07/" de "18/07/2026".
                  */}
                  <div className="absolute bottom-8 right-8 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {destaques.map((c, i) => (
                        <button
                          key={c.id}
                          aria-label={`Ir para o comunicado ${i + 1}`}
                          onClick={() => setActiveAnnouncement(i)}
                          className={`h-1.5 rounded-full transition-all ${i === indice ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                        />
                      ))}
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tabular-nums">{indice + 1}/{total}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" aria-label="Comunicado anterior" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => girar(-1)}><ChevronLeft size={16} /></Button>
                      <Button variant="ghost" size="icon" aria-label="Próximo comunicado" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => girar(1)}><ChevronRight size={16} /></Button>
                    </div>
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

          {/* Atalho de Pendências — só para as telas que este perfil alcança.
              O Colaborador não tem nenhuma das duas no menu, então o bloco
              inteiro some para ele em vez de virar um atalho para uma tela que
              o menu dele não oferece. */}
          {(podeVerTarefas || podeVerAprovacoes) && (
            <div className={`grid grid-cols-1 gap-4 ${podeVerTarefas && podeVerAprovacoes ? 'md:grid-cols-2' : ''}`}>
              {podeVerTarefas && (
                <Card className="p-5 border-l-4 border-l-orange-500 bg-orange-50/30 cursor-pointer hover:bg-orange-50 transition-all group" onClick={() => onNavigate?.('tasks')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-orange-500 shadow-sm ring-1 ring-orange-100 group-hover:scale-105 transition-transform">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-900">Central de Tarefas</h4>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        {tarefasPendentes} {tarefasPendentes === 1 ? 'Ação pendente' : 'Ações pendentes'}
                      </p>
                    </div>
                    <ChevronRight className="ml-auto text-orange-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </div>
                </Card>
              )}
              {podeVerAprovacoes && (
                <Card className="p-5 border-l-4 border-l-blue-500 bg-blue-50/30 cursor-pointer hover:bg-blue-50 transition-all group" onClick={() => onNavigate?.('approvals')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-blue-500 shadow-sm ring-1 ring-blue-100 group-hover:scale-105 transition-transform">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-900">Minhas Aprovações</h4>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        {minhasAprovacoes} {minhasAprovacoes === 1 ? 'Solicitação' : 'Solicitações'}
                      </p>
                    </div>
                    <ChevronRight className="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </div>
                </Card>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <p className="label-caps opacity-40">FEED RECENTE</p>
              <p className="text-[10px] font-bold text-gray-400">Classificar por: <span className="text-[var(--color-brand-primary-text)] cursor-pointer">Relevância</span></p>
            </div>

            {config.comunicados.map((item) => {
              const comentarios = item.comentarios || [];
              const aberto = comentandoEm === item.id;
              // Mesma regra que o estado aplica ao salvar/excluir: autor do post
              // ou Administrador Geral (incluído o bypass @jynx.com.br).
              const podeGerenciar = podeGerenciarComunicado(config.usuarioAtual, item);
              const editando = editandoPost === item.id;
              return (
                <Card key={item.id} className="p-8 space-y-6 hover:border-[var(--color-brand-primary)] transition-all group bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar src={avatarDoAutor(item.author, item.authorId)} name={item.author} className="w-10 h-10 rounded-[12px] border border-gray-100" />
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">{item.author}</p>
                        <p className="text-[11px] font-bold text-[var(--color-brand-primary-text)] uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-gray-400 tabular-nums uppercase">{item.date}</span>
                      {podeGerenciar && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuPost(m => (m === item.id ? null : item.id))}
                            aria-label={`Ações da publicação de ${item.author}`}
                            aria-expanded={menuPost === item.id}
                            className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {menuPost === item.id && (
                            <>
                              <div className="fixed inset-0 z-[55]" onClick={() => setMenuPost(null)} />
                              <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-100 rounded-[12px] shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1">
                                <button
                                  onClick={() => abrirEdicao(item)}
                                  className="w-full px-4 py-2.5 flex items-center gap-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Pencil size={14} /> Editar
                                </button>
                                <button
                                  onClick={() => { setMenuPost(null); setExcluindoPost(item); }}
                                  className="w-full px-4 py-2.5 flex items-center gap-2 text-[12px] font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                                >
                                  <Trash2 size={14} /> Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editando ? (
                    <div className="space-y-3">
                      <textarea
                        value={rascunhoPost}
                        onChange={e => setRascunhoPost(e.target.value)}
                        aria-label="Editar publicação"
                        className="w-full bg-gray-50 border border-gray-100 rounded-[16px] p-4 text-[13px] font-medium outline-none focus:ring-2 focus:ring-orange-500/20 resize-none min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelarEdicao}>Cancelar</Button>
                        <Button size="sm" disabled={!rascunhoPost.trim()} onClick={() => salvarEdicao(item)}>Salvar</Button>
                      </div>
                    </div>
                  ) : (
                    item.content && (
                      <p className="text-[13px] text-gray-700 leading-relaxed font-medium">{item.content}</p>
                    )
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
                                <Avatar src={avatarDoAutor(c.autor, c.autorId)} name={c.autor} size="sm" className="shrink-0" />
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

      {excluindoPost && (
        <Modal isOpen title="Excluir publicação" onClose={() => setExcluindoPost(null)} size="sm">
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-gray-900">
                  Esta publicação sai do feed para todo mundo.
                </p>
                <p className="text-[13px] text-gray-500 font-medium">
                  Os comentários dela também são apagados, e não dá para desfazer.
                </p>
              </div>
            </div>

            <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{excluindoPost.author}</p>
              <p className="text-[13px] text-gray-700 font-medium mt-1 line-clamp-3">
                {excluindoPost.content || excluindoPost.title}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setExcluindoPost(null)}>Cancelar</Button>
              <Button variant="danger" leftIcon={<Trash2 size={14} />} onClick={confirmarExclusao}>Excluir publicação</Button>
            </div>
          </div>
        </Modal>
      )}

      {comunicadoAberto && podeComunicar && (
        <Modal isOpen title="Novo comunicado oficial" onClose={() => setComunicadoAberto(false)} size="md">
          <div className="space-y-5">
            <p className="text-[13px] text-gray-500 font-medium">
              O comunicado entra no carrossel do topo da Intranet e no feed, com seu nome como autor.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="com-titulo" className="label-caps ml-1 block">Título</label>
              <input
                id="com-titulo"
                value={comunicado.titulo}
                onChange={e => setComunicado(c => ({ ...c, titulo: e.target.value }))}
                placeholder="Ex.: Novo horário de atendimento do RH"
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 placeholder:font-medium placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="com-descricao" className="label-caps ml-1 block">Descrição</label>
              <textarea
                id="com-descricao"
                rows={4}
                value={comunicado.descricao}
                onChange={e => setComunicado(c => ({ ...c, descricao: e.target.value }))}
                placeholder="O que o time precisa saber, em poucas linhas."
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 resize-none placeholder:font-medium placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <span className="label-caps ml-1 block">Imagem de capa (opcional)</span>
              {comunicado.imagem ? (
                <div className="flex items-center gap-3 rounded-[12px] border border-gray-100 bg-gray-50 p-3">
                  <img src={comunicado.imagem} alt="" className="w-20 h-14 rounded-[8px] object-cover shrink-0" />
                  <p className="flex-1 min-w-0 text-[13px] font-bold text-gray-700 truncate" title={comunicado.nomeImagem}>
                    {comunicado.nomeImagem}
                  </p>
                  <button
                    onClick={() => setComunicado(c => ({ ...c, imagem: undefined, nomeImagem: undefined }))}
                    aria-label="Remover imagem de capa"
                    className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" leftIcon={<ImageIcon size={14} />} onClick={() => inputBanner.current?.click()}>
                    Escolher imagem
                  </Button>
                  <span className="text-[12px] font-medium text-gray-400">Sem imagem, entra com uma capa padrão.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setComunicadoAberto(false)}>Cancelar</Button>
              <Button
                disabled={!comunicado.titulo.trim() || !comunicado.descricao.trim()}
                onClick={publicarComunicado}
              >
                Publicar comunicado
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
