import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, ClipboardCheck, FileText,
  Landmark, ListChecks, Lock, Paperclip, Upload, User, UserMinus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AvisoPrevioModo,
  DocumentoEncerramento,
  EncerramentoDesligamento,
  ItemChecklistEncerramento,
  VerbaRescisoria
} from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { ExpandableRow, Field, InfoNote, SectionHeader, adminFieldClass } from '../admin/AdminUI';
import { ReadOnlyField, READONLY_BOX } from '../ui/ReadOnlyField';
import { FormRenderer } from '../FormRenderer';
import { TrilhaAprovacoes, TrilhaContainer } from '../request/TrilhaAprovacoes';
import { PROCESS_DEFINITIONS } from '../../processDefinitions';
import { ensureApprovalChain } from '../../utils/approvalFlow';
import { getStatusVariant } from '../../utils/requestStatus';
import { podeExecutarEncerramento } from '../../utils/permissions';
import { findFieldDef, formatCurrencyBR, formatRequestDate, getOptionLabel } from '../../utils/requestFields';
import {
  PRAZO_PAGAMENTO_DIAS,
  TIPO_DESLIGAMENTO_LABELS,
  dataLimitePagamento,
  dataTerminoDaSolicitacao,
  pendenciasEncerramento,
  prepararEncerramento,
  tipoDesligamentoDaSolicitacao,
  totalVerbas
} from '../../utils/desligamento';

/**
 * ETAPA "BENEFÍCIOS E ENCERRAMENTO" (processo 15 — Solicitação de Desligamento)
 *
 * Só existe DEPOIS que a cascata inteira aprovou: enquanto ela não é concluída,
 * a solicitação fica em 'Aguardando Encerramento' e o colaborador continua
 * ativo. É o "Concluir desligamento" que fecha o processo e dispara o handoff de
 * cadastro (colaborador → 'Desligado').
 *
 * Quatro blocos, na ordem em que o DP trabalha:
 *  1. Resumo da solicitação (leitura) — o mesmo que o módulo de aprovação mostra;
 *  2. Verbas rescisórias — lista condicional ao tipo, com valor lançado pelo DP;
 *  3. Checklist de encerramento — benefícios, ativos e acessos;
 *  4. Documentos — um anexo por documento da rescisão.
 *
 * O que é devido em cada tipo vem inteiro de utils/desligamento.ts; esta tela
 * não decide regra nenhuma, só exibe e coleta.
 */
export default function DesligamentoEncerramento({
  requestId,
  onBack
}: {
  requestId: string;
  onBack: () => void;
}) {
  const { config, atualizarEncerramentoDesligamento, concluirEncerramentoDesligamento } = useAppConfig();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Um seletor de arquivo serve a tela inteira; o alvo diz em qual documento o
  // arquivo cai — mesmo padrão do Portal do Colaborador.
  const [documentoAlvo, setDocumentoAlvo] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [formularioAberto, setFormularioAberto] = useState(false);

  const request = config.solicitacoes.find(r => r.id === requestId);
  const tipo = tipoDesligamentoDaSolicitacao(request?.data);

  const encerramento = useMemo<EncerramentoDesligamento | null>(() => {
    if (!request || !tipo) return null;
    return prepararEncerramento(tipo, request.encerramento, {
      admissao: request.data?.admissao,
      termino: dataTerminoDaSolicitacao(request.data)
    });
  }, [request, tipo]);

  if (!request || !tipo || !encerramento) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-12 text-center space-y-4">
        <AlertCircle size={48} className="text-gray-300" />
        <h2 className="text-xl font-black">Etapa de encerramento indisponível</h2>
        <p className="text-gray-500 text-sm max-w-md">
          {request
            ? 'Esta solicitação não tem um tipo de desligamento definido.'
            : 'Solicitação não encontrada.'}
        </p>
        <Button onClick={onBack} variant="outline">Voltar</Button>
      </div>
    );
  }

  const concluido = !!encerramento.concluidoEm;
  const podeEditar = podeExecutarEncerramento(config.usuarioAtual) && !concluido;

  const processDef = PROCESS_DEFINITIONS[request.processId || '15'];
  const colaborador = config.colaboradores.find(
    e => e.id === request.employeeId || e.id === request.data?.colaboradorIdId || e.name === request.data?.colaboradorId
  );
  const admissao = request.data?.admissao || colaborador?.admissionDate;
  const termino = dataTerminoDaSolicitacao(request.data);
  const limitePagamento = dataLimitePagamento(termino);

  const approvalProcess = config.processos.find(p => p.id === (request.tipoProcesso || request.processId));
  const approvalChain = ensureApprovalChain(request, approvalProcess);

  const tipoLabel = TIPO_DESLIGAMENTO_LABELS[tipo];
  const motivoField = findFieldDef(processDef, 'motivo', request.data);
  const motivo = request.data?.motivo
    ? (motivoField?.type === 'select' ? getOptionLabel(motivoField, request.data.motivo) : String(request.data.motivo))
    : '';
  const pendencias = pendenciasEncerramento(encerramento);
  const total = totalVerbas(encerramento.verbas);

  // ---------------------------------------------------------------------
  // Edições — gravam direto na solicitação; a tela sempre lê do estado.
  // ---------------------------------------------------------------------

  const salvar = (updates: Partial<EncerramentoDesligamento>) => {
    atualizarEncerramentoDesligamento(request.id, { ...encerramento, ...updates });
  };

  const definirValorVerba = (verbaId: string, valor?: number) => {
    salvar({
      verbas: encerramento.verbas.map(v => (v.id === verbaId ? { ...v, valor } : v))
    });
  };

  const definirAvisoPrevioModo = (modo: AvisoPrevioModo) => salvar({ avisoPrevioModo: modo });

  const atualizarItem = (itemId: string, mudanca: Partial<ItemChecklistEncerramento>) => {
    salvar({
      checklist: encerramento.checklist.map(i => (i.id === itemId ? { ...i, ...mudanca } : i))
    });
  };

  const anexarDocumento = (documentoId: string) => {
    setDocumentoAlvo(documentoId);
    fileInputRef.current?.click();
  };

  const handleArquivoSelecionado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    const alvo = documentoAlvo;
    event.target.value = '';
    setDocumentoAlvo(null);
    if (!arquivo || !alvo) return;
    // Só o nome do arquivo é guardado: o config inteiro vai para o localStorage
    // e o conteúdo em base64 de um TRCT estouraria a cota.
    salvar({
      documentos: encerramento.documentos.map(d =>
        d.id === alvo ? { ...d, anexo: { nome: arquivo.name, enviadoEm: new Date().toISOString() } } : d
      )
    });
    addToast(`Arquivo "${arquivo.name}" anexado.`, 'success');
  };

  const removerAnexo = (documentoId: string) => {
    salvar({
      documentos: encerramento.documentos.map(d => (d.id === documentoId ? { ...d, anexo: undefined } : d))
    });
  };

  const concluir = () => {
    concluirEncerramentoDesligamento(request.id, encerramento);
    setConfirmando(false);
    addToast('Desligamento concluído. O colaborador agora consta como Desligado.', 'success');
    onBack();
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        aria-hidden="true"
        onChange={handleArquivoSelecionado}
      />

      <ModalConfirmacao
        aberto={confirmando}
        pendencias={pendencias}
        total={total}
        colaborador={colaborador?.name || request.alvo || 'colaborador'}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={concluir}
      />

      {/* Header */}
      <header className="bg-white border-b border-brand-border px-4 sm:px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="w-10 h-10 shrink-0 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 shrink-0 bg-brand-primary/5 rounded-2xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/10">
              <UserMinus size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Benefícios e Encerramento</h1>
                <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Protocolo #{request.numero} • {tipoLabel}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-32">
        <div className="max-w-5xl mx-auto space-y-8">
          {concluido ? (
            <div className="rounded-[16px] border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-green-900 font-medium leading-relaxed">
                Desligamento concluído em {formatRequestDate(encerramento.concluidoEm)} por{' '}
                {encerramento.concluidoPor || 'RH/DP'}. Esta etapa é somente leitura.
              </p>
            </div>
          ) : !podeEditar ? (
            <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-900 font-medium leading-relaxed">
                A execução desta etapa é do RH/DP. Você pode acompanhar o andamento, mas não editar.
              </p>
            </div>
          ) : null}

          <InfoNote>
            Valores e verbas devem ser conferidos pelo DP conforme a convenção coletiva aplicável.
          </InfoNote>

          {/* ---------------------------------------------------------------
              BLOCO 1 — RESUMO DA SOLICITAÇÃO (LEITURA)
          --------------------------------------------------------------- */}
          <BlocoCard icone={<User size={18} />} titulo="Resumo da Solicitação" legenda="Somente leitura">
            <div className="p-6 sm:p-8 space-y-8">
              {/* Bloco inteiro em leitura: mesma caixa cinza dos campos
                  auto-preenchidos do formulário (ui/ReadOnlyField). */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                <ReadOnlyField label="Colaborador" value={colaborador?.name || request.alvo} />
                <ReadOnlyField label="Matrícula" value={colaborador?.registration} />
                <ReadOnlyField label="Cargo" value={colaborador?.role || request.data?.cargo} />
                <ReadOnlyField label="Setor" value={colaborador?.department || request.data?.setor} />
                <ReadOnlyField label="Centro de custo" value={colaborador?.costCenter || request.data?.centroCusto} />
                <ReadOnlyField label="Data de admissão" value={admissao ? formatRequestDate(admissao) : undefined} />
                <ReadOnlyField label="Tipo de desligamento" value={tipoLabel} />
                <ReadOnlyField
                  label="Data prevista do desligamento"
                  value={request.data?.dataPrevistaDesligamento ? formatRequestDate(request.data.dataPrevistaDesligamento) : undefined}
                />
                <ReadOnlyField
                  label="Último dia trabalhado"
                  value={request.data?.ultimoDiaTrabalhado ? formatRequestDate(request.data.ultimoDiaTrabalhado) : undefined}
                />
              </div>

              {motivo && <ReadOnlyField label="Motivo" value={motivo} multiline />}

              <div className="space-y-6">
                <span className="label-caps">Trilha de aprovações</span>
                <TrilhaContainer>
                  <TrilhaAprovacoes chain={approvalChain} currentLevelIndex={approvalChain.length} encerrada />
                </TrilhaContainer>
              </div>

              {/* O formulário original inteiro, em leitura, para o DP conferir
                  qualquer campo sem sair da etapa. */}
              <ExpandableRow
                open={formularioAberto}
                onToggle={() => setFormularioAberto(!formularioAberto)}
                leading={<span className="w-9 h-9 shrink-0 rounded-[10px] bg-gray-50 text-gray-500 flex items-center justify-center"><FileText size={16} /></span>}
                title="Ver formulário completo da solicitação"
                subtitle="Todos os campos preenchidos na abertura"
              >
                {processDef && (
                  <FormRenderer
                    definition={processDef}
                    initialData={request.data}
                    onSubmit={() => undefined}
                    onCancel={() => undefined}
                    readOnly
                    hideActions
                  />
                )}
              </ExpandableRow>
            </div>
          </BlocoCard>

          {/* ---------------------------------------------------------------
              BLOCO 2 — VERBAS RESCISÓRIAS
          --------------------------------------------------------------- */}
          <BlocoCard icone={<Landmark size={18} />} titulo="Verbas Rescisórias" legenda={tipoLabel}>
            <div className="p-6 sm:p-8 space-y-4">
              <SectionHeader
                title="O que é devido neste desligamento"
                description="A lista muda conforme o tipo. O valor de cada verba é lançado pelo DP."
              />

              <div className="space-y-2">
                {encerramento.verbas.map(verba => (
                  <LinhaVerba
                    key={verba.id}
                    verba={verba}
                    editavel={podeEditar}
                    avisoPrevioModo={encerramento.avisoPrevioModo}
                    mostrarModoAviso={verba.id === 'aviso_previo' && tipo === 'pedido_demissao'}
                    onValor={valor => definirValorVerba(verba.id, valor)}
                    onModoAviso={definirAvisoPrevioModo}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[12px] bg-gray-50 px-5 py-4">
                <div>
                  <p className="label-caps">Total das verbas lançadas</p>
                  <p className="text-[12px] text-gray-500 font-medium">
                    {pendencias.verbasDevidas - pendencias.verbasSemValor} de {pendencias.verbasDevidas} verbas com valor informado
                  </p>
                </div>
                <p className="text-[24px] font-black text-gray-900 tabular-nums">{formatCurrencyBR(total)}</p>
              </div>

              <div className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3">
                <Calendar size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-amber-900 font-medium leading-relaxed">
                  Prazo legal de pagamento: <strong>{PRAZO_PAGAMENTO_DIAS} dias corridos</strong> a partir do término do contrato
                  {limitePagamento
                    ? <> — até <strong>{limitePagamento.toLocaleDateString('pt-BR')}</strong>.</>
                    : '.'}
                </p>
              </div>
            </div>
          </BlocoCard>

          {/* ---------------------------------------------------------------
              BLOCO 3 — CHECKLIST DE ENCERRAMENTO
          --------------------------------------------------------------- */}
          <BlocoCard
            icone={<ListChecks size={18} />}
            titulo="Checklist de Encerramento"
            legenda={`${pendencias.checklistFeitos} de ${pendencias.checklistTotal}`}
          >
            <div className="p-6 sm:p-8 space-y-2">
              {encerramento.checklist.map(item => (
                <LinhaChecklist
                  key={item.id}
                  item={item}
                  editavel={podeEditar}
                  onChange={mudanca => atualizarItem(item.id, mudanca)}
                />
              ))}
            </div>
          </BlocoCard>

          {/* ---------------------------------------------------------------
              BLOCO 4 — DOCUMENTOS
          --------------------------------------------------------------- */}
          <BlocoCard
            icone={<Paperclip size={18} />}
            titulo="Documentos da Rescisão"
            legenda={`${pendencias.documentosAnexados} de ${pendencias.documentosTotal}`}
          >
            <div className="p-6 sm:p-8 space-y-2">
              {encerramento.documentos.map(documento => (
                <LinhaDocumento
                  key={documento.id}
                  documento={documento}
                  editavel={podeEditar}
                  onAnexar={() => anexarDocumento(documento.id)}
                  onRemover={() => removerAnexo(documento.id)}
                />
              ))}
            </div>
          </BlocoCard>

          {!concluido && (
            <div className="bg-white rounded-[24px] border border-brand-border shadow-sm p-6 sm:p-8">
              <Field label="Observações do encerramento (opcional)">
                <textarea
                  value={encerramento.observacao || ''}
                  disabled={!podeEditar}
                  onChange={e => salvar({ observacao: e.target.value })}
                  placeholder="Registre aqui qualquer particularidade da rescisão (homologação, acordo sindical, pendências)."
                  className={`${adminFieldClass(podeEditar)} w-full h-28 resize-none font-medium`}
                />
              </Field>
            </div>
          )}

          {concluido && encerramento.observacao && (
            <div className="bg-white rounded-[24px] border border-brand-border shadow-sm p-6 sm:p-8">
              <ReadOnlyField label="Observações do encerramento" value={encerramento.observacao} multiline />
            </div>
          )}
        </div>
      </main>

      {/* Ação final */}
      <div className="fixed right-4 bottom-4 z-50 w-[min(96vw,520px)] rounded-[28px] border border-gray-200 bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-black text-gray-900 tabular-nums">{formatCurrencyBR(total)} em verbas</p>
            <p className="text-[11px] font-medium text-gray-500">
              {pendencias.checklistFeitos}/{pendencias.checklistTotal} do checklist •{' '}
              {pendencias.documentosAnexados}/{pendencias.documentosTotal} documentos
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 rounded-xl text-[11px] font-black uppercase tracking-widest" onClick={onBack}>
              Voltar
            </Button>
            {!concluido && (
              <Button
                className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20"
                leftIcon={<ClipboardCheck size={16} />}
                disabled={!podeEditar}
                onClick={() => setConfirmando(true)}
              >
                Concluir desligamento
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blocos e linhas
// ---------------------------------------------------------------------------

function BlocoCard({
  icone,
  titulo,
  legenda,
  children
}: {
  icone: React.ReactNode;
  titulo: string;
  legenda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
      <div className="px-6 sm:px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-brand-primary shrink-0">{icone}</span>
          <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900 truncate">{titulo}</h2>
        </div>
        {legenda && <Badge variant="gray" size="sm">{legenda}</Badge>}
      </div>
      {children}
    </div>
  );
}

/** Campo de moeda: string vazia = não lançado (diferente de R$ 0,00). */
function CampoValor({
  valor,
  editavel,
  ariaLabel,
  onChange
}: {
  valor?: number;
  editavel: boolean;
  ariaLabel: string;
  onChange: (valor?: number) => void;
}) {
  // Em leitura vira a mesma caixa cinza dos demais campos, não texto solto.
  if (!editavel) {
    return (
      <span className={`${READONLY_BOX} inline-block w-full sm:w-[180px] text-right tabular-nums`}>
        {valor === undefined ? '—' : formatCurrencyBR(valor)}
      </span>
    );
  }
  return (
    <div className="relative w-full sm:w-[180px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400">R$</span>
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={valor === undefined ? '' : valor}
        placeholder="0,00"
        onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${adminFieldClass(true)} w-full pl-9 text-right tabular-nums min-h-[42px]`}
      />
    </div>
  );
}

function LinhaVerba({
  verba,
  editavel,
  mostrarModoAviso,
  avisoPrevioModo,
  onValor,
  onModoAviso
}: {
  verba: VerbaRescisoria;
  editavel: boolean;
  mostrarModoAviso: boolean;
  avisoPrevioModo?: AvisoPrevioModo;
  onValor: (valor?: number) => void;
  onModoAviso: (modo: AvisoPrevioModo) => void;
}) {
  return (
    <div
      className={`rounded-[12px] border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
        verba.devida ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50/60'
      }`}
    >
      <span
        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${
          verba.devida ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {verba.devida ? <CheckCircle2 size={15} /> : <X size={15} />}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[14px] font-bold ${verba.devida ? 'text-gray-900' : 'text-gray-400'}`}>
            {verba.label}
          </span>
          <Badge variant={verba.devida ? 'green' : 'gray'} size="sm">
            {verba.devida ? 'Devido' : 'Não devido'}
          </Badge>
        </div>
        <p className="text-[12px] text-gray-500 font-medium leading-relaxed mt-0.5">{verba.detalhe}</p>

        {mostrarModoAviso && verba.devida && (
          <div className="mt-2 max-w-[260px]">
            <Select
              value={avisoPrevioModo || 'trabalhado'}
              onChange={valor => onModoAviso(valor as AvisoPrevioModo)}
              ariaLabel="Aviso prévio trabalhado ou descontado"
              disabled={!editavel}
              className="w-full"
              options={[
                { value: 'trabalhado', label: 'Aviso prévio trabalhado' },
                { value: 'descontado', label: 'Aviso prévio descontado' }
              ]}
            />
          </div>
        )}
      </div>

      <div className="shrink-0 sm:text-right">
        {!verba.devida ? (
          <span className="text-[13px] font-bold text-gray-300">—</span>
        ) : verba.semValor ? (
          <Badge variant="green" size="sm">Habilitado</Badge>
        ) : (
          <CampoValor
            valor={verba.valor}
            editavel={editavel}
            ariaLabel={`Valor de ${verba.label}`}
            onChange={onValor}
          />
        )}
      </div>
    </div>
  );
}

function LinhaChecklist({
  item,
  editavel,
  onChange
}: {
  item: ItemChecklistEncerramento;
  editavel: boolean;
  onChange: (mudanca: Partial<ItemChecklistEncerramento>) => void;
}) {
  return (
    <div
      className={`rounded-[12px] border px-4 py-3 space-y-3 ${
        item.concluido ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'
      }`}
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={item.concluido}
          disabled={!editavel}
          onChange={e => onChange({ concluido: e.target.checked })}
          className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--color-brand-primary)] cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-gray-900">{item.label}</span>
          {item.descricao && (
            <span className="block text-[12px] text-gray-500 font-medium leading-relaxed">{item.descricao}</span>
          )}
        </span>
      </label>

      {(item.labelData || item.labelValor) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
          {item.labelData && (
            <Field label={item.labelData}>
              <input
                type="date"
                value={item.data || ''}
                disabled={!editavel}
                aria-label={`${item.labelData} — ${item.label}`}
                onChange={e => onChange({ data: e.target.value })}
                className={`${adminFieldClass(editavel)} w-full min-h-[42px]`}
              />
            </Field>
          )}
          {item.labelValor && (
            <Field label={item.labelValor}>
              <CampoValor
                valor={item.valor}
                editavel={editavel}
                ariaLabel={`${item.labelValor} — ${item.label}`}
                onChange={valor => onChange({ valor })}
              />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

function LinhaDocumento({
  documento,
  editavel,
  onAnexar,
  onRemover
}: {
  documento: DocumentoEncerramento;
  editavel: boolean;
  onAnexar: () => void;
  onRemover: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-gray-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <span
        className={`w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center ${
          documento.anexo ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
        }`}
      >
        <FileText size={16} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-gray-900">{documento.label}</p>
        {documento.descricao && (
          <p className="text-[12px] text-gray-500 font-medium leading-relaxed">{documento.descricao}</p>
        )}
      </div>

      {documento.anexo ? (
        <div className="flex items-center gap-2 rounded-[8px] bg-gray-50 px-3 py-2 shrink-0 max-w-full sm:max-w-[280px]">
          <Paperclip size={14} className="text-gray-400 shrink-0" />
          <span className="flex-1 min-w-0 text-[13px] font-bold text-gray-700 truncate">{documento.anexo.nome}</span>
          {editavel && (
            <button
              type="button"
              onClick={onRemover}
              aria-label={`Remover ${documento.anexo.nome}`}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0 min-h-[38px]"
          leftIcon={<Upload size={14} />}
          disabled={!editavel}
          onClick={onAnexar}
        >
          Anexar
        </Button>
      )}
    </div>
  );
}

/** Confirmação: a conclusão é irreversível e encerra o vínculo. */
function ModalConfirmacao({
  aberto,
  pendencias,
  total,
  colaborador,
  onCancelar,
  onConfirmar
}: {
  aberto: boolean;
  pendencias: ReturnType<typeof pendenciasEncerramento>;
  total: number;
  colaborador: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const faltas = [
    pendencias.verbasSemValor > 0 && `${pendencias.verbasSemValor} verba(s) sem valor lançado`,
    pendencias.checklistFeitos < pendencias.checklistTotal &&
      `${pendencias.checklistTotal - pendencias.checklistFeitos} item(ns) do checklist em aberto`,
    pendencias.documentosAnexados < pendencias.documentosTotal &&
      `${pendencias.documentosTotal - pendencias.documentosAnexados} documento(s) sem anexo`
  ].filter(Boolean) as string[];

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Concluir desligamento</h3>
                <button onClick={onCancelar} aria-label="Fechar" className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                A solicitação será concluída e <strong>{colaborador}</strong> passará a constar como{' '}
                <strong>Desligado</strong> no cadastro. Total de verbas lançadas:{' '}
                <strong className="tabular-nums">{formatCurrencyBR(total)}</strong>.
              </p>

              {faltas.length > 0 && (
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Pendências</p>
                  <ul className="text-[13px] text-amber-900 font-medium leading-relaxed list-disc pl-4">
                    {faltas.map(falta => <li key={falta}>{falta}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onCancelar}>Cancelar</Button>
                <Button className="flex-1" onClick={onConfirmar}>Confirmar</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
