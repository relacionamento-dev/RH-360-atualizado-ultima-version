import React, { useState } from 'react';
import { Plus, Shield, Power, Trash2, Pencil, Check, X, Lock } from 'lucide-react';

import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal, EmptyState } from '../ui/Misc';
import { Select } from '../ui/Select';
import { AccessProfile, EscopoDeDados, ProcessPermission } from '../../types';
import {
  ACOES_DE_TELA, AcaoDeTela, ROTULO_DA_ACAO, ROTULO_DA_VIEW, VIEWS_DO_MENU, ViewDoMenu
} from '../../utils/permissions';
import { ROTULO_DO_ESCOPO } from '../../utils/escopo';

/**
 * PERFIS DE ACESSO — a matriz que era union type em `types.ts`.
 *
 * Enquanto os seis perfis eram um tipo, criar "Analista de DP com acesso
 * parcial" exigia editar código e recompilar. Aqui cada perfil é um registro:
 * escopo de dados, telas, ações de tela e permissões por processo. Um perfil
 * criado nesta tela aparece no menu, no "Visualizar como" e nos botões sem
 * passar por nenhuma lista escrita à mão.
 */

const ACOES_DE_PROCESSO: { chave: keyof ProcessPermission; rotulo: string }[] = [
  { chave: 'ver', rotulo: 'Visualizar' },
  { chave: 'solicitar', rotulo: 'Solicitar' },
  { chave: 'aprovar', rotulo: 'Aprovar' },
  { chave: 'executar', rotulo: 'Executar' },
  { chave: 'devolver', rotulo: 'Devolver' },
  { chave: 'cancelar', rotulo: 'Cancelar' },
  { chave: 'verSigiloso', rotulo: 'Ver sigiloso' }
];

const permissaoVazia = (): ProcessPermission => ({
  ver: false, solicitar: false, executar: false, aprovar: false,
  devolver: false, cancelar: false, reabrir: false, verHistorico: false, verSigiloso: false
});

const perfilNovo = (): AccessProfile => ({
  id: `perf-${Date.now()}`,
  nome: '',
  descricao: '',
  escopo: 'proprio',
  ativo: true,
  telas: ['intranet', 'requests'],
  permissoes: {},
  acoesDeTela: {},
  dadosSensiveis: {
    visualizarSalario: false, editarSalario: false, visualizarCPF: false,
    visualizarDocumentosPessoais: false, visualizarDadosBancarios: false, visualizarASO: false,
    visualizarMedidaDisciplinar: false, visualizarDesligamento: false, visualizarJuridico: false,
    visualizarAuditoria: false
  }
});

export default function AdminPerfis() {
  const { config, salvarPerfil, alternarPerfilAtivo, excluirPerfil } = useAppConfig();
  const { addToast } = useToast();
  const [emEdicao, setEmEdicao] = useState<AccessProfile | null>(null);

  const usuariosDoPerfil = (nome: string) => config.usuariosDemo.filter(u => u.profile === nome).length;

  const salvar = () => {
    if (!emEdicao) return;
    const nome = emEdicao.nome.trim();
    if (!nome) return addToast('Dê um nome ao perfil.', 'error');
    const duplicado = config.perfis.some(p => p.nome.toLowerCase() === nome.toLowerCase() && p.id !== emEdicao.id);
    if (duplicado) return addToast(`Já existe um perfil chamado "${nome}".`, 'error');

    salvarPerfil({ ...emEdicao, nome });
    addToast(`Perfil "${nome}" salvo. Ele já vale no menu e no "Visualizar como".`, 'success');
    setEmEdicao(null);
  };

  const remover = (perfil: AccessProfile) => {
    const r = excluirPerfil(perfil.id);
    addToast(r.ok ? `Perfil "${perfil.nome}" excluído.` : r.motivo || 'Não foi possível excluir.', r.ok ? 'success' : 'error');
  };

  const alternarTela = (view: ViewDoMenu) => setEmEdicao(p => p && ({
    ...p,
    telas: p.telas.includes(view) ? p.telas.filter(t => t !== view) : [...p.telas, view]
  }));

  const alternarAcao = (acao: AcaoDeTela) => setEmEdicao(p => p && ({
    ...p,
    acoesDeTela: { ...(p.acoesDeTela || {}), [acao]: !(p.acoesDeTela?.[acao]) }
  }));

  const alternarProcesso = (processId: string, chave: keyof ProcessPermission) => setEmEdicao(p => {
    if (!p) return p;
    const atual = p.permissoes[processId] || permissaoVazia();
    return { ...p, permissoes: { ...p.permissoes, [processId]: { ...atual, [chave]: !atual[chave] } } };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Perfis de Acesso</h2>
          <p className="text-[13px] text-gray-500 font-medium max-w-2xl mt-1">
            Cada perfil define até onde a visão alcança (escopo), quais telas aparecem e o que pode
            ser feito em cada processo. Perfis criados aqui valem imediatamente, sem alteração de código.
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setEmEdicao(perfilNovo())}>Novo Perfil</Button>
      </div>

      {config.perfis.length === 0 ? (
        <EmptyState icon={<Shield size={40} />} title="Nenhum perfil cadastrado" description="Crie o primeiro perfil de acesso." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.perfis.map(perfil => (
            <Card key={perfil.id} className={`p-5 space-y-4 ${perfil.ativo ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-black text-gray-900 truncate">{perfil.nome}</h3>
                    {perfil.sistema && (
                      <span title="Perfil que acompanha o produto"><Lock size={12} className="text-gray-400" /></span>
                    )}
                    <Badge variant={perfil.ativo ? 'green' : 'gray'} size="sm">
                      {perfil.ativo ? 'ATIVO' : 'INATIVO'}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">{perfil.descricao || '—'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" title="Editar" aria-label={`Editar ${perfil.nome}`} onClick={() => setEmEdicao({ ...perfil })}>
                    <Pencil size={16} className="text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    title={perfil.ativo ? 'Desativar' : 'Ativar'}
                    aria-label={`${perfil.ativo ? 'Desativar' : 'Ativar'} ${perfil.nome}`}
                    onClick={() => alternarPerfilAtivo(perfil.id)}
                  >
                    <Power size={16} className={perfil.ativo ? 'text-green-600' : 'text-gray-400'} />
                  </Button>
                  {!perfil.sistema && (
                    <Button variant="ghost" size="icon" title="Excluir" aria-label={`Excluir ${perfil.nome}`} onClick={() => remover(perfil)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[10px] bg-gray-50 border border-gray-100 py-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Escopo</p>
                  <p className="text-[12px] font-bold text-gray-700 truncate" title={ROTULO_DO_ESCOPO[perfil.escopo]}>
                    {perfil.escopo}
                  </p>
                </div>
                <div className="rounded-[10px] bg-gray-50 border border-gray-100 py-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Telas</p>
                  <p className="text-[12px] font-bold text-gray-700 tabular-nums">{perfil.telas.length}</p>
                </div>
                <div className="rounded-[10px] bg-gray-50 border border-gray-100 py-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Usuários</p>
                  <p className="text-[12px] font-bold text-gray-700 tabular-nums">{usuariosDoPerfil(perfil.nome)}</p>
                </div>
              </div>

              {perfil.dadosSensiveis.visualizarSalario && (
                <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-[8px] px-3 py-2">
                  Vê remuneração e faixa salarial
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {emEdicao && (
        <Modal isOpen title={emEdicao.nome ? `Perfil: ${emEdicao.nome}` : 'Novo perfil de acesso'} onClose={() => setEmEdicao(null)} size="lg">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="perfil-nome" className="label-caps ml-1 block">Nome do perfil</label>
                <input
                  id="perfil-nome"
                  value={emEdicao.nome}
                  disabled={emEdicao.sistema}
                  onChange={e => setEmEdicao({ ...emEdicao, nome: e.target.value })}
                  placeholder="Ex.: Analista de DP"
                  className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                />
                {emEdicao.sistema && (
                  <p className="text-[11px] text-gray-400 font-medium ml-1">
                    O nome de um perfil de fábrica é fixo — há usuários e regras presos a ele.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <span className="label-caps ml-1 block">Escopo de dados</span>
                <Select
                  ariaLabel="Escopo de dados"
                  value={emEdicao.escopo}
                  onChange={v => setEmEdicao({ ...emEdicao, escopo: v as EscopoDeDados })}
                  options={(Object.keys(ROTULO_DO_ESCOPO) as EscopoDeDados[]).map(e => ({ value: e, label: ROTULO_DO_ESCOPO[e] }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="perfil-desc" className="label-caps ml-1 block">Descrição</label>
              <input
                id="perfil-desc"
                value={emEdicao.descricao || ''}
                onChange={e => setEmEdicao({ ...emEdicao, descricao: e.target.value })}
                placeholder="O que este perfil faz no dia a dia"
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <section className="space-y-2">
              <h4 className="label-caps">Telas que este perfil alcança</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {VIEWS_DO_MENU.map(view => {
                  const marcada = emEdicao.telas.includes(view);
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
            </section>

            <section className="space-y-2">
              <h4 className="label-caps">Ações de tela</h4>
              <div className="space-y-2">
                {(Object.values(ACOES_DE_TELA) as AcaoDeTela[]).map(acao => (
                  <label key={acao} className="flex items-center gap-3 px-3 py-2 rounded-[8px] border border-gray-100 bg-gray-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!emEdicao.acoesDeTela?.[acao]}
                      onChange={() => alternarAcao(acao)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-[13px] font-bold text-gray-700">{ROTULO_DA_ACAO[acao]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h4 className="label-caps">Dado sensível</h4>
              <label className="flex items-center gap-3 px-3 py-2 rounded-[8px] border border-amber-100 bg-amber-50/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emEdicao.dadosSensiveis.visualizarSalario}
                  onChange={() => setEmEdicao({
                    ...emEdicao,
                    dadosSensiveis: {
                      ...emEdicao.dadosSensiveis,
                      visualizarSalario: !emEdicao.dadosSensiveis.visualizarSalario
                    }
                  })}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-[13px] font-bold text-gray-700">
                  Visualizar salário, faixa salarial e histórico de cargo e salário
                </span>
              </label>
            </section>

            <section className="space-y-2">
              <h4 className="label-caps">Permissões por processo</h4>
              <div className="max-h-[260px] overflow-y-auto rounded-[12px] border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Processo</th>
                      {ACOES_DE_PROCESSO.map(a => (
                        <th key={a.chave} className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">
                          {a.rotulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {config.processos.filter(p => p.ativo).map(processo => (
                      <tr key={processo.id} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-[12px] font-bold text-gray-700 truncate max-w-[180px]" title={processo.name}>
                          {processo.name}
                        </td>
                        {ACOES_DE_PROCESSO.map(a => (
                          <td key={a.chave} className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${a.rotulo} em ${processo.name}`}
                              checked={!!emEdicao.permissoes[processo.id]?.[a.chave]}
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
            </section>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setEmEdicao(null)}>Cancelar</Button>
              <Button onClick={salvar}>Salvar perfil</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
