import React, { useRef, useState } from 'react';
import { Building2, Upload, CheckCircle2, AlertTriangle, Rocket, Download, ArrowRight } from 'lucide-react';

import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/Misc';
import { Company } from '../../types';
import { baixarTexto } from '../../utils/download';
import {
  abrirPlanilha, EXTENSOES_ACEITAS, importarLinhas, MODELO_CSV, PlanilhaAberta, ResultadoImportacao
} from '../../utils/importacao';

/**
 * IMPLANTAÇÃO DE CLIENTE — o caminho de colocar uma empresa nova no ar.
 *
 * Quatro passos, na ordem em que uma implantação acontece: cadastrar a empresa,
 * carregar a base por planilha, conferir a parametrização e publicar. A empresa
 * fica em 'implantacao' até publicar — ou seja, não aparece no seletor do topo
 * nem recebe operação enquanto estiver pela metade.
 */
export default function AdminImplantacao() {
  const {
    config, criarEmpresa, importarColaboradores, atualizarParametrizacao, publicarEmpresa
  } = useAppConfig();
  const { addToast } = useToast();

  const [form, setForm] = useState({ name: '', document: '' });
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  // Arquivo aberto e aba escolhida — só relevantes para XLSX com várias abas.
  const [arquivo, setArquivo] = useState<{ nome: string; planilha: PlanilhaAberta; abas: string[] } | null>(null);
  const [abaEscolhida, setAbaEscolhida] = useState<string | null>(null);
  const inputCsv = useRef<HTMLInputElement>(null);

  const empresa = config.empresas.find(e => e.id === empresaId);
  const emImplantacao = config.empresas.filter(e => e.status === 'implantacao');
  const quadro = empresa ? config.colaboradores.filter(e => e.company === empresa.name) : [];
  const param = empresaId ? config.parametrizacao[empresaId] : undefined;

  const cadastrar = () => {
    if (!form.name.trim()) return addToast('Informe a razão social.', 'error');
    if (config.empresas.some(e => e.name.trim().toLowerCase() === form.name.trim().toLowerCase())) {
      return addToast('Já existe uma empresa com esse nome.', 'error');
    }
    const nova = criarEmpresa(form);
    setEmpresaId(nova.id);
    setForm({ name: '', document: '' });
    addToast(`${nova.name} cadastrada. Agora importe a base de colaboradores.`, 'success');
  };

  /** Aplica o resultado do parser: fichas + estrutura derivada da planilha. */
  const aplicarImportacao = (r: ResultadoImportacao) => {
    if (!empresa) return;
    setResultado(r);
    if (r.colaboradores.length === 0) {
      addToast('Nenhuma linha pôde ser importada. Veja o relatório de erros.', 'error');
      return;
    }
    // A estrutura da planilha vira a parametrização da empresa: setores,
    // centros de custo, cargos e filiais saem da própria carga.
    importarColaboradores(empresa.id, r.colaboradores);
    atualizarParametrizacao(empresa.id, {
      setores: r.setores,
      centrosDeCusto: r.centrosDeCusto,
      cargos: r.cargos,
      filiais: r.filiais
    });
    addToast(
      `${r.colaboradores.length} de ${r.totalLinhas} linha(s) importadas${r.erros.length ? `, ${r.erros.length} com erro` : ''}.`,
      r.erros.length ? 'warning' : 'success'
    );
  };

  const importarAba = (aba: string, planilha = arquivo?.planilha) => {
    if (!planilha || !empresa) return;
    aplicarImportacao(importarLinhas(planilha.linhasDaAba(aba), empresa.name, empresa.id.slice(-4).toUpperCase()));
  };

  /**
   * O MESMO campo aceita .csv, .xlsx e .xls. O formato é decidido pela extensão
   * e pelo conteúdo (`abrirPlanilha`); o parser de validação é um só.
   */
  const aoEscolherArquivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const escolhido = evento.target.files?.[0];
    evento.target.value = '';
    if (!escolhido || !empresa) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const planilha = abrirPlanilha(leitor.result as ArrayBuffer, escolhido.name);
        setArquivo({ nome: escolhido.name, planilha, abas: planilha.abas });

        // Uma aba só: importa direto. Mais de uma: quem está implantando
        // escolhe — chutar a primeira faz a carga entrar de "Instruções" ou
        // "Plan2" sem ninguém perceber.
        if (planilha.abas.length === 1) {
          setAbaEscolhida(planilha.abas[0]);
          importarAba(planilha.abas[0], planilha);
        } else {
          setAbaEscolhida(null);
          setResultado(null);
          addToast(`${planilha.abas.length} abas encontradas em "${escolhido.name}". Escolha qual importar.`, 'info');
        }
      } catch {
        setArquivo(null);
        addToast(`Não foi possível ler "${escolhido.name}". Envie .xlsx, .xls ou .csv.`, 'error');
      }
    };
    // ArrayBuffer serve aos dois: o XLSX lê binário e o CSV é decodificado
    // como UTF-8 dentro de `abrirPlanilha`.
    leitor.readAsArrayBuffer(escolhido);
  };

  const publicar = () => {
    if (!empresa) return;
    const r = publicarEmpresa(empresa.id);
    addToast(
      r.ok ? `${empresa.name} está no ar. Ela já aparece no seletor de empresa do topo.` : r.motivo || 'Não foi possível publicar.',
      r.ok ? 'success' : 'error'
    );
  };

  const Passo = ({ n, titulo, feito, children }: { n: number; titulo: string; feito?: boolean; children: React.ReactNode }) => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black shrink-0 ${
          feito ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {feito ? <CheckCircle2 size={16} /> : n}
        </div>
        <h3 className="text-[15px] font-black text-gray-900">{titulo}</h3>
      </div>
      <div className="pl-11 space-y-3">{children}</div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input ref={inputCsv} type="file" accept={EXTENSOES_ACEITAS} className="hidden" aria-hidden="true" onChange={aoEscolherArquivo} />

      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Implantação de Cliente</h2>
        <p className="text-[13px] text-gray-500 font-medium max-w-2xl mt-1">
          Da razão social ao primeiro pedido: cadastre a empresa, carregue a base por planilha,
          confira a parametrização e publique. Enquanto não publicar, a empresa não aparece no
          seletor do topo nem recebe operação.
        </p>
      </div>

      {emImplantacao.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emImplantacao.map(e => (
            <button
              key={e.id}
              onClick={() => { setEmpresaId(e.id); setResultado(null); setArquivo(null); setAbaEscolhida(null); }}
              className={`px-3 py-2 rounded-[8px] border text-[12px] font-bold transition-colors ${
                e.id === empresaId ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {e.name} <Badge variant="amber" size="sm">EM IMPLANTAÇÃO</Badge>
            </button>
          ))}
        </div>
      )}

      <Passo n={1} titulo="Cadastrar a empresa" feito={!!empresa}>
        {empresa ? (
          <div className="flex items-center gap-3 flex-wrap">
            <Building2 size={18} className="text-gray-400" />
            <span className="text-[14px] font-black text-gray-900">{empresa.name}</span>
            <span className="text-[12px] font-medium text-gray-400 tabular-nums">{empresa.document || 'sem CNPJ'}</span>
            <Badge variant={empresa.status === 'ativa' ? 'green' : 'amber'} size="sm">
              {empresa.status === 'ativa' ? 'PUBLICADA' : 'EM IMPLANTAÇÃO'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => { setEmpresaId(null); setResultado(null); setArquivo(null); setAbaEscolhida(null); }}>Trocar</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <label htmlFor="emp-nome" className="label-caps ml-1 block">Razão social</label>
              <input
                id="emp-nome" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Nova Indústria S.A."
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="emp-doc" className="label-caps ml-1 block">CNPJ</label>
              <input
                id="emp-doc" value={form.document}
                onChange={e => setForm({ ...form, document: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <Button onClick={cadastrar} rightIcon={<ArrowRight size={16} />}>Cadastrar</Button>
          </div>
        )}
      </Passo>

      <Passo n={2} titulo="Importar colaboradores e estrutura (CSV)" feito={quadro.length > 0}>
        <p className="text-[12px] text-gray-500 font-medium">
          Aceita o arquivo que sai do ERP (.xlsx/.xls) ou .csv. Colunas obrigatórias:{' '}
          <strong>nome, cargo, setor</strong>. Opcionais: e-mail, CPF, centro de custo, filial, gestor,
          admissão e salário. Setores, centros de custo, cargos e filiais são criados a partir da
          própria planilha.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />}
            onClick={() => baixarTexto('modelo-colaboradores.csv', MODELO_CSV, 'text/csv;charset=utf-8')}>
            Baixar modelo
          </Button>
          <Button size="sm" leftIcon={<Upload size={14} />} disabled={!empresa} onClick={() => inputCsv.current?.click()}>
            Escolher planilha
          </Button>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">.xlsx · .xls · .csv</span>
          {arquivo && (
            <span className="text-[12px] font-bold text-gray-600 truncate max-w-[240px]" title={arquivo.nome}>
              {arquivo.nome}
            </span>
          )}
        </div>

        {/* Seletor de aba: só aparece quando o arquivo tem mais de uma. */}
        {arquivo && arquivo.abas.length > 1 && (
          <div className="rounded-[12px] border border-gray-100 bg-gray-50/60 p-3 space-y-2">
            <p className="text-[12px] font-bold text-gray-700">
              Este arquivo tem {arquivo.abas.length} abas. Qual delas contém os colaboradores?
            </p>
            <div className="flex flex-wrap gap-2">
              {arquivo.abas.map(aba => (
                <button
                  key={aba}
                  type="button"
                  onClick={() => { setAbaEscolhida(aba); importarAba(aba); }}
                  aria-pressed={aba === abaEscolhida}
                  className={`px-3 py-2 rounded-[8px] border text-[12px] font-bold transition-colors ${
                    aba === abaEscolhida
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {aba}
                </button>
              ))}
            </div>
          </div>
        )}

        {quadro.length > 0 && (
          <p className="text-[13px] font-bold text-green-700 bg-green-50 border border-green-100 rounded-[8px] px-3 py-2">
            {quadro.length} colaborador(es) na base · {param?.setores?.length || 0} setor(es) ·{' '}
            {param?.centrosDeCusto?.length || 0} centro(s) de custo · {param?.filiais?.length || 0} filial(is)
          </p>
        )}

        {resultado && resultado.erros.length > 0 && (
          <div className="rounded-[12px] border border-red-100 bg-red-50/50 overflow-hidden">
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-[12px] font-black text-red-700">
                {resultado.erros.length} linha(s) recusada(s) de {resultado.totalLinhas}
              </span>
            </div>
            <ul className="max-h-[200px] overflow-y-auto divide-y divide-red-100/60">
              {resultado.erros.map((e, i) => (
                <li key={i} className="px-4 py-2 text-[12px] text-red-700 font-medium">
                  <span className="font-black">Linha {e.linha}</span>
                  {e.coluna ? <span className="opacity-70"> · {e.coluna}</span> : null} — {e.mensagem}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Passo>

      <Passo n={3} titulo="Conferir a parametrização" feito={!!param?.processos?.some(p => p.ativo)}>
        {param ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { rotulo: 'Processos ativos', valor: param.processos.filter(p => p.ativo).length },
              { rotulo: 'Perfis de acesso', valor: param.perfis.length },
              { rotulo: 'Cargos', valor: param.cargos.length },
              { rotulo: 'Filiais', valor: param.filiais.length }
            ].map(item => (
              <div key={item.rotulo} className="rounded-[10px] bg-gray-50 border border-gray-100 p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{item.rotulo}</p>
                <p className="text-[18px] font-black text-gray-900 tabular-nums">{item.valor}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-gray-400 font-medium">Cadastre a empresa para ver a parametrização de partida.</p>
        )}
        <p className="text-[12px] text-gray-500 font-medium">
          A empresa nasce com os processos e perfis do produto e estrutura vazia — cargos, centros de
          custo e filiais vêm da planilha. Ajustes finos ficam nas abas <strong>Processos</strong> e{' '}
          <strong>Perfis de Acesso</strong>, e valem só para esta empresa.
        </p>
      </Passo>

      <Passo n={4} titulo="Publicar" feito={empresa?.status === 'ativa'}>
        {empresa?.status === 'ativa' ? (
          <p className="text-[13px] font-bold text-green-700">
            {empresa.name} está no ar. Troque de empresa pelo seletor do topo para operar nela.
          </p>
        ) : (
          <>
            <p className="text-[12px] text-gray-500 font-medium">
              Publicar exige ao menos um colaborador importado, um processo ativo e uma filial.
            </p>
            <Button leftIcon={<Rocket size={16} />} disabled={!empresa} onClick={publicar}>
              Publicar empresa
            </Button>
          </>
        )}
      </Passo>

      {!empresa && emImplantacao.length === 0 && config.empresas.length > 0 && (
        <EmptyState
          icon={<Building2 size={40} />}
          title="Nenhuma implantação em andamento"
          description="Cadastre uma empresa acima para iniciar."
        />
      )}
    </div>
  );
}
