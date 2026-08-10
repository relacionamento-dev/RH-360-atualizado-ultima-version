import React, { useState } from 'react';
import { ArrowLeft, Check, X, Lock } from 'lucide-react';

import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/Misc';
import { Select } from '../ui/Select';
import { AccessProfile, EscopoDeDados, ProcessPermission } from '../../types';
import {
  ACOES_DE_TELA, AcaoDeTela, ROTULO_DA_ACAO, ROTULO_DA_VIEW, VIEWS_DO_MENU, ViewDoMenu
} from '../../utils/permissions';
import { ROTULO_DO_ESCOPO } from '../../utils/escopo';
import { ROTA_PERFIS, perfilNovo, permissaoVazia } from './perfilForm';

/** As sete ações que a matriz por processo oferece, na ordem do fluxo. */
const ACOES_DE_PROCESSO: { chave: keyof ProcessPermission; rotulo: string }[] = [
  { chave: 'ver', rotulo: 'Visualizar' },
  { chave: 'solicitar', rotulo: 'Solicitar' },
  { chave: 'aprovar', rotulo: 'Aprovar' },
  { chave: 'executar', rotulo: 'Executar' },
  { chave: 'devolver', rotulo: 'Devolver' },
  { chave: 'cancelar', rotulo: 'Cancelar' },
  { chave: 'verSigiloso', rotulo: 'Ver sigiloso' }
];

/**
 * EDIÇÃO DE PERFIL — TELA, não diálogo.
 *
 * Era um modal e não cabia: descrição, 14 telas, 4 ações, dado sensível e a
 * matriz de 15 processos × 7 ações passam de qualquer altura de diálogo. Pior,
 * o conteúdo da Central Adm é envolvido por `slide-in-from-right-4`, que aplica
 * `transform` — e um ancestral com transform vira o bloco de contenção de
 * `position: fixed`. O `inset-0` do modal deixava de valer contra a viewport, e
 * era daí que vinha o corte no topo e no rodapé.
 *
 * Como tela, o conteúdo flui no documento: menu e cabeçalho continuam visíveis,
 * a página rola normalmente e a barra de ações fica presa no rodapé da área de
 * conteúdo.
 */
export default function AdminPerfilEditor() {
  const { config, salvarPerfil, updateConfig } = useAppConfig();
  const { addToast } = useToast();

  const original = config.perfis.find(p => p.id === config.perfilEmEdicaoId);
  // Sem id na rota é "novo perfil". O rascunho vive no estado local: só o
  // "Salvar" grava, e sair fora isso descarta — como qualquer formulário.
  const [rascunho, setRascunho] = useState<AccessProfile>(() => original || perfilNovo());

  const voltar = () => updateConfig({ activeView: ROTA_PERFIS, perfilEmEdicaoId: null });

  const salvar = () => {
    const nome = rascunho.nome.trim();
    if (!nome) return addToast('Dê um nome ao perfil.', 'error');
    const duplicado = config.perfis.some(p => p.nome.toLowerCase() === nome.toLowerCase() && p.id !== rascunho.id);
    if (duplicado) return addToast(`Já existe um perfil chamado "${nome}".`, 'error');

    salvarPerfil({ ...rascunho, nome });
    addToast(`Perfil "${nome}" salvo. Ele já vale no menu e no "Visualizar como".`, 'success');
    voltar();
  };

  const alternarTela = (view: ViewDoMenu) => setRascunho(p => ({
    ...p,
    telas: p.telas.includes(view) ? p.telas.filter(t => t !== view) : [...p.telas, view]
  }));

  const alternarAcao = (acao: AcaoDeTela) => setRascunho(p => ({
    ...p,
    acoesDeTela: { ...(p.acoesDeTela || {}), [acao]: !(p.acoesDeTela?.[acao]) }
  }));

  const alternarProcesso = (processId: string, chave: keyof ProcessPermission) => setRascunho(p => {
    const atual = p.permissoes[processId] || permissaoVazia();
    return { ...p, permissoes: { ...p.permissoes, [processId]: { ...atual, [chave]: !atual[chave] } } };
  });

  // Id na rota que não existe mais (perfil excluído noutra aba, por exemplo).
  if (config.perfilEmEdicaoId && !original) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={voltar}>
          Voltar para Perfis de Acesso
        </Button>
        <EmptyState
          icon={<Lock size={40} />}
          title="Perfil não encontrado"
          description="Ele pode ter sido excluído. Volte para a lista e escolha outro."
        />
      </div>
    );
  }

  const processosAtivos = config.processos.filter(p => p.ativo);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da tela: volta para a lista e diz qual perfil está aberto. */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={voltar} className="-ml-2 mb-1">
            Perfis de Acesso
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">
              {original ? original.nome : 'Novo perfil de acesso'}
            </h2>
            {rascunho.sistema && (
              <Badge variant="gray" size="sm">PERFIL DE FÁBRICA</Badge>
            )}
            <Badge variant={rascunho.ativo ? 'green' : 'gray'} size="sm">
              {rascunho.ativo ? 'ATIVO' : 'INATIVO'}
            </Badge>
          </div>
          <p className="text-[13px] text-gray-500 font-medium mt-1 max-w-2xl">
            Escopo de dados, telas alcançadas, ações e o que pode ser feito em cada processo.
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="perfil-nome" className="label-caps ml-1 block">Nome do perfil</label>
            <input
              id="perfil-nome"
              value={rascunho.nome}
              disabled={rascunho.sistema}
              onChange={e => setRascunho({ ...rascunho, nome: e.target.value })}
              placeholder="Ex.: Analista de DP"
              className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-gray-50 disabled:text-gray-500"
            />
            {rascunho.sistema && (
              <p className="text-[11px] text-gray-400 font-medium ml-1">
                O nome de um perfil de fábrica é fixo — há usuários e regras presos a ele.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <span className="label-caps ml-1 block">Escopo de dados</span>
            <Select
              ariaLabel="Escopo de dados"
              value={rascunho.escopo}
              onChange={v => setRascunho({ ...rascunho, escopo: v as EscopoDeDados })}
              options={(Object.keys(ROTULO_DO_ESCOPO) as EscopoDeDados[]).map(e => ({ value: e, label: ROTULO_DO_ESCOPO[e] }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="perfil-desc" className="label-caps ml-1 block">Descrição</label>
          <input
            id="perfil-desc"
            value={rascunho.descricao || ''}
            onChange={e => setRascunho({ ...rascunho, descricao: e.target.value })}
            placeholder="O que este perfil faz no dia a dia"
            className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="label-caps">Telas que este perfil alcança</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
          {VIEWS_DO_MENU.map(view => {
            const marcada = rascunho.telas.includes(view);
            return (
              <button
                key={view}
                type="button"
                onClick={() => alternarTela(view)}
                aria-pressed={marcada}
                className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border text-[12px] font-bold text-left transition-colors ${
                  marcada ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {marcada ? <Check size={14} className="shrink-0" /> : <X size={14} className="shrink-0 opacity-40" />}
                <span className="truncate">{ROTULO_DA_VIEW[view]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <h3 className="label-caps">Ações de tela</h3>
          <div className="space-y-2">
            {(Object.values(ACOES_DE_TELA) as AcaoDeTela[]).map(acao => (
              <label key={acao} className="flex items-center gap-3 px-3 py-2 rounded-[8px] border border-gray-100 bg-gray-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!rascunho.acoesDeTela?.[acao]}
                  onChange={() => alternarAcao(acao)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-[13px] font-bold text-gray-700">{ROTULO_DA_ACAO[acao]}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="label-caps">Dado sensível</h3>
          <label className="flex items-center gap-3 px-3 py-2 rounded-[8px] border border-amber-100 bg-amber-50/40 cursor-pointer">
            <input
              type="checkbox"
              checked={rascunho.dadosSensiveis.visualizarSalario}
              onChange={() => setRascunho({
                ...rascunho,
                dadosSensiveis: {
                  ...rascunho.dadosSensiveis,
                  visualizarSalario: !rascunho.dadosSensiveis.visualizarSalario
                }
              })}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-[13px] font-bold text-gray-700">
              Visualizar salário, faixa salarial e histórico de cargo e salário
            </span>
          </label>
          <p className="text-[12px] text-gray-500 font-medium">
            Sem esta permissão, a remuneração aparece mascarada e a aba "Cargo e Salário" do
            Perfil 360 não é oferecida.
          </p>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <h3 className="label-caps">Permissões por processo</h3>
        {/*
          Na tela inteira a tabela não precisa mais de altura máxima: eram 15
          linhas dentro de um diálogo, e scroll dentro de scroll. O que sobra é
          a rolagem HORIZONTAL das 7 colunas de ação em telas estreitas, com a
          primeira coluna e o cabeçalho fixos para não se perder a referência.
        */}
        <div className="overflow-x-auto rounded-[12px] border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider min-w-[200px]">
                  Processo
                </th>
                {ACOES_DE_PROCESSO.map(a => (
                  <th key={a.chave} className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                    {a.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processosAtivos.map(processo => (
                <tr key={processo.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 text-[12px] font-bold text-gray-700 min-w-[200px]" title={processo.name}>
                    {processo.name}
                  </td>
                  {ACOES_DE_PROCESSO.map(a => (
                    <td key={a.chave} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${a.rotulo} em ${processo.name}`}
                        checked={!!rascunho.permissoes[processo.id]?.[a.chave]}
                        onChange={() => alternarProcesso(processo.id, a.chave)}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-gray-400 font-medium">
          {processosAtivos.length} processo(s) ativo(s). Processo desativado não aparece aqui.
        </p>
      </Card>

      {/*
        Barra de ações presa no rodapé da área de conteúdo. Numa tela longa como
        esta, o "Salvar" no fim do documento obrigaria a rolar tudo de volta.
      */}
      <div className="sticky bottom-0 -mx-1 px-1 pb-1 pt-3 bg-gradient-to-t from-[var(--color-brand-bg)] via-[var(--color-brand-bg)] to-transparent">
        <div className="flex items-center justify-end gap-2 rounded-[12px] border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <Button variant="ghost" onClick={voltar}>Cancelar</Button>
          <Button onClick={salvar}>Salvar perfil</Button>
        </div>
      </div>
    </div>
  );
}

