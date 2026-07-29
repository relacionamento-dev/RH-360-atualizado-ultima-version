import { useRef, useState } from 'react';
import {
  Camera, Upload, CheckCircle2, AlertTriangle, X, Paperclip, Check, Plus, Trash2,
  CornerUpLeft, ShieldCheck, Clock, Send, FileText, User, CreditCard, Home,
  Vote, ScrollText, Car, Shield, Users, GraduationCap
} from 'lucide-react';
import { AdmissaoBloco, AdmissaoCampo, AdmissaoCertificado, Dependent, Employee } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { ADMIN_FIELD_CLASS, ExpandableRow, Field, InfoNote } from '../admin/AdminUI';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { BlocoResumo } from './BlocoResumo';
import {
  blocoConcluido,
  blocosQueExigemAcao,
  podeConfirmarBloco,
  podeEnviarAdmissao,
  prazoFinal,
  progressoAdmissao,
  tituloBloco,
  PARENTESCO_OPCOES
} from '../../utils/admissaoDigital';

/**
 * Visão que o colaborador acessa pelo link da admissão digital.
 *
 * Mobile-first: coluna única com alvos de toque grandes; no desktop fica
 * centralizada e estreita, porque é assim que ela é usada de verdade.
 *
 * Os blocos são um acordeão de etapa única: um aberto por vez, os outros
 * colapsados mostrando só título, descrição e a bolinha de status. "Confirmar
 * etapa" fecha o bloco e abre o próximo pendente, então a pessoa é levada pela
 * sequência sem precisar decidir onde clicar.
 *
 * Três formatos de bloco convivem no mesmo acordeão — anexo, formulário e lista
 * (dependentes/certificados) — e os condicionais abrem com uma pergunta
 * Sim/Não: respondido "Não", o bloco fecha verde sem pedir mais nada.
 *
 * Dois modos, definidos pelo `estado`:
 *  - AGUARDANDO_PREENCHIMENTO: termo LGPD → todos os blocos → "Concluir e enviar";
 *  - EM_CORRECAO: banner de pendência + todos os blocos, mas só os devolvidos
 *    pelo RH abrem sozinhos (com o motivo escrito pelo RH); os já aprovados
 *    ficam colapsados e verdes → "Corrigir e reenviar".
 */
export default function PortalColaborador({
  employee,
  onBack
}: {
  employee: Employee;
  onBack: () => void;
}) {
  const { atualizarAdmissaoDigital, enviarAdmissaoDigital } = useAppConfig();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Um seletor de arquivo serve o portal inteiro: o alvo diz onde o arquivo cai
  // (bloco, ou um certificado específico dentro do bloco).
  const [alvoUpload, setAlvoUpload] = useState<{ blocoId: string; certificadoId?: string } | null>(null);

  const admissao = employee.admissaoDigital;

  // Primeiro bloco que pede ação e ainda não foi concluído — é por ele que o
  // acordeão começa aberto. Calculado só na montagem; daí em diante quem move a
  // sequência é o "Confirmar etapa".
  const [abertoId, setAbertoId] = useState<string | null>(() => {
    if (!admissao) return null;
    return blocosQueExigemAcao(admissao).find(b => !blocoConcluido(b))?.id || null;
  });

  if (!admissao) return null;

  const emCorrecao = admissao.estado === 'EM_CORRECAO';
  const enviado = admissao.estado === 'EM_ANALISE';
  const exigemAcao = blocosQueExigemAcao(admissao);
  const progresso = progressoAdmissao(admissao);
  const podeEnviar = podeEnviarAdmissao(admissao);
  const prazo = prazoFinal(admissao);

  const salvarBlocos = (blocos: AdmissaoBloco[]) => {
    atualizarAdmissaoDigital(employee.id, { blocos });
  };

  // Mexer no conteúdo derruba a confirmação: o bloco volta a pedir "Confirmar
  // etapa" para a bolinha ficar verde de novo.
  const atualizarBloco = (blocoId: string, mudanca: (bloco: AdmissaoBloco) => AdmissaoBloco) => {
    salvarBlocos(
      admissao.blocos.map(bloco => (bloco.id === blocoId ? { ...mudanca(bloco), confirmado: false } : bloco))
    );
  };

  const definirCampo = (blocoId: string, campoId: string, valor: string) => {
    atualizarBloco(blocoId, bloco => ({ ...bloco, dados: { ...bloco.dados, [campoId]: valor } }));
  };

  const definirAplicavel = (blocoId: string, aplicavel: boolean) => {
    atualizarBloco(blocoId, bloco => ({ ...bloco, aplicavel }));
  };

  const adicionarAnexo = (blocoId: string, nome: string, origem: 'Foto' | 'Arquivo') => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      anexos: [
        ...bloco.anexos,
        { id: `anx-${Date.now()}`, nome, origem, enviadoEm: new Date().toISOString() }
      ]
    }));
    addToast(origem === 'Foto' ? 'Foto anexada.' : `Arquivo "${nome}" anexado.`, 'success');
  };

  const removerAnexo = (blocoId: string, anexoId: string) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      anexos: bloco.anexos.filter(a => a.id !== anexoId)
    }));
  };

  // --- Dependentes: mesma estrutura do processo "Gestão de Dependentes" ---
  const adicionarDependente = (blocoId: string) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      dependentes: [
        ...(bloco.dependentes || []),
        { id: `dep-${Date.now()}`, name: '', relationship: '', birthDate: '', cpf: '', benefits: [] }
      ]
    }));
  };

  const atualizarDependente = (blocoId: string, depId: string, campo: keyof Dependent, valor: any) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      dependentes: (bloco.dependentes || []).map(d => (d.id === depId ? { ...d, [campo]: valor } : d))
    }));
  };

  const removerDependente = (blocoId: string, depId: string) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      dependentes: (bloco.dependentes || []).filter(d => d.id !== depId)
    }));
  };

  // --- Certificados ---
  const adicionarCertificado = (blocoId: string) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      certificados: [
        ...(bloco.certificados || []),
        { id: `cert-${Date.now()}`, nome: '', arquivo: '', enviadoEm: new Date().toISOString() }
      ]
    }));
  };

  const atualizarCertificado = (
    blocoId: string,
    certId: string,
    campo: keyof AdmissaoCertificado,
    valor: string
  ) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      certificados: (bloco.certificados || []).map(c => (c.id === certId ? { ...c, [campo]: valor } : c))
    }));
  };

  const removerCertificado = (blocoId: string, certId: string) => {
    atualizarBloco(blocoId, bloco => ({
      ...bloco,
      certificados: (bloco.certificados || []).filter(c => c.id !== certId)
    }));
  };

  /**
   * Fecha a etapa: marca o bloco como concluído e abre o próximo que ainda pede
   * ação. Sem próximo, o acordeão fecha inteiro e sobra só o botão de envio.
   */
  const confirmarEtapa = (blocoId: string) => {
    salvarBlocos(
      admissao.blocos.map(bloco => (bloco.id === blocoId ? { ...bloco, confirmado: true } : bloco))
    );
    const proximo = exigemAcao.find(b => b.id !== blocoId && !blocoConcluido(b));
    setAbertoId(proximo?.id || null);
  };

  // Na demo a câmera é simulada para funcionar em qualquer navegador; o
  // "Importar arquivo" abre o seletor real e usa o nome do arquivo escolhido.
  const tirarFoto = (bloco: AdmissaoBloco) => {
    const numero = bloco.anexos.filter(a => a.origem === 'Foto').length + 1;
    adicionarAnexo(bloco.id, `${bloco.id}-foto-${numero}.jpg`, 'Foto');
  };

  const importarArquivo = (blocoId: string, certificadoId?: string) => {
    setAlvoUpload({ blocoId, certificadoId });
    fileInputRef.current?.click();
  };

  const handleArquivoSelecionado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (arquivo && alvoUpload) {
      if (alvoUpload.certificadoId) {
        atualizarCertificado(alvoUpload.blocoId, alvoUpload.certificadoId, 'arquivo', arquivo.name);
      } else {
        adicionarAnexo(alvoUpload.blocoId, arquivo.name, 'Arquivo');
      }
    }
    event.target.value = '';
    setAlvoUpload(null);
  };

  const aceitarTermo = (aceito: boolean) => {
    atualizarAdmissaoDigital(employee.id, { termoAceito: aceito });
  };

  const enviar = () => {
    enviarAdmissaoDigital(employee.id);
    addToast(
      emCorrecao ? 'Documentos corrigidos e reenviados ao RH.' : 'Documentos enviados. O RH vai analisar.',
      'success'
    );
  };

  const bloqueado = !admissao.termoAceito;

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-5 animate-in fade-in duration-300">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        aria-hidden="true"
        onChange={handleArquivoSelecionado}
      />

      <Button variant="ghost" size="sm" leftIcon={<CornerUpLeft size={14} />} onClick={onBack}>
        Voltar para a lista
      </Button>

      <InfoNote>
        Esta é a visão que o colaborador acessa pelo link — exibida aqui apenas para demonstração.
      </InfoNote>

      {/* Cabeçalho + barra de progresso */}
      <div className="bg-white rounded-[12px] hairline-border subtle-shadow p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps opacity-60">Admissão digital</p>
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight truncate">{employee.name}</h1>
            <p className="text-[13px] text-gray-500 font-medium">{employee.company}</p>
          </div>
          <Badge variant={emCorrecao ? 'red' : enviado ? 'amber' : 'blue'}>
            {emCorrecao ? 'Correção' : enviado ? 'Em análise' : 'Em preenchimento'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="label-caps">Etapas concluídas</span>
            <span className="text-[13px] font-black text-gray-900 tabular-nums">{progresso}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-brand-primary)] rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500">
          <Clock size={14} className="text-gray-400" />
          Prazo para envio: {prazo.toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Enviado: nada mais a fazer até o RH analisar */}
      {enviado ? (
        <div className="bg-white rounded-[12px] hairline-border subtle-shadow p-8 text-center space-y-3">
          <CheckCircle2 size={40} className="mx-auto text-green-500" />
          <h2 className="text-[17px] font-black text-gray-900 tracking-tight">Documentos enviados</h2>
          <p className="text-[13px] text-gray-500 font-medium">
            O RH vai conferir os documentos. Se faltar algo, você recebe um aviso com o que precisa
            ser corrigido.
          </p>
        </div>
      ) : (
        <>
          {/* Modo correção: banner com a mensagem do RH */}
          {emCorrecao && (
            <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <h2 className="text-[15px] font-black text-red-900 tracking-tight">Pendência de Revisão</h2>
              </div>
              <p className="text-[13px] text-red-800 font-medium leading-relaxed">
                {admissao.mensagemRevisao ||
                  'O RH encontrou pendências nos documentos abaixo. Reenvie apenas o que foi apontado.'}
              </p>
            </div>
          )}

          {/* Termo LGPD: fica fora do acordeão porque libera todo o resto */}
          <div className="bg-white rounded-[12px] hairline-border subtle-shadow p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--color-brand-primary)]" />
              <h2 className="text-[15px] font-black text-gray-900 tracking-tight">Uso dos seus dados</h2>
            </div>
            <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
              Os documentos enviados aqui são usados só para a sua contratação e ficam guardados
              pelo prazo exigido em lei. Você pode pedir acesso, correção ou exclusão dos seus dados
              a qualquer momento, conforme a LGPD (Lei 13.709/2018).
            </p>
            <label className="flex items-start gap-3 p-3 rounded-[8px] bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={admissao.termoAceito}
                onChange={e => aceitarTermo(e.target.checked)}
                className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--color-brand-primary)] cursor-pointer"
              />
              <span className="text-[13px] font-bold text-gray-800 leading-snug">
                Li e concordo com o uso dos meus dados para fins de admissão.
              </span>
            </label>
          </div>

          {/* Acordeão dos blocos */}
          {bloqueado ? (
            <div className="rounded-[12px] border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
              <FileText size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-[13px] font-bold text-gray-500">
                Aceite o termo acima para liberar o envio dos documentos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {admissao.blocos.map(bloco => (
                <BlocoAdmissao
                  key={bloco.id}
                  bloco={bloco}
                  titulo={tituloBloco(admissao, bloco)}
                  aberto={abertoId === bloco.id}
                  exigeAcao={exigemAcao.some(b => b.id === bloco.id)}
                  onToggle={() => setAbertoId(abertoId === bloco.id ? null : bloco.id)}
                  onCampo={(campoId, valor) => definirCampo(bloco.id, campoId, valor)}
                  onAplicavel={valor => definirAplicavel(bloco.id, valor)}
                  onTirarFoto={() => tirarFoto(bloco)}
                  onImportar={() => importarArquivo(bloco.id)}
                  onRemover={anexoId => removerAnexo(bloco.id, anexoId)}
                  onAddDependente={() => adicionarDependente(bloco.id)}
                  onDependente={(depId, campo, valor) => atualizarDependente(bloco.id, depId, campo, valor)}
                  onRemoverDependente={depId => removerDependente(bloco.id, depId)}
                  onAddCertificado={() => adicionarCertificado(bloco.id)}
                  onCertificado={(certId, campo, valor) => atualizarCertificado(bloco.id, certId, campo, valor)}
                  onArquivoCertificado={certId => importarArquivo(bloco.id, certId)}
                  onRemoverCertificado={certId => removerCertificado(bloco.id, certId)}
                  onConfirmar={() => confirmarEtapa(bloco.id)}
                  resumo={<BlocoResumo admissao={admissao} bloco={bloco} />}
                />
              ))}
            </div>
          )}

          {/* Ação final */}
          <div className="sticky bottom-0 pt-2 pb-4 bg-gradient-to-t from-[var(--color-brand-bg)] via-[var(--color-brand-bg)] to-transparent">
            <Button
              size="lg"
              fullWidth
              disabled={!podeEnviar}
              leftIcon={<Send size={16} />}
              onClick={enviar}
            >
              {emCorrecao ? 'Corrigir e reenviar' : 'Concluir e enviar'}
            </Button>
            {!podeEnviar && (
              <p className="text-[12px] text-gray-500 font-medium text-center mt-2">
                {!admissao.termoAceito
                  ? 'Aceite o termo para continuar.'
                  : 'Confirme as etapas obrigatórias para liberar o botão.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Ícone do cabeçalho por bloco; qualquer bloco novo cai no padrão. */
const ICONE_BLOCO: Record<string, typeof FileText> = {
  'foto-perfil': Camera,
  'dados-pessoais': User,
  rg: CreditCard,
  'titulo-eleitor': Vote,
  certidao: ScrollText,
  ctps: FileText,
  cnh: Car,
  reservista: Shield,
  endereco: Home,
  dependentes: Users,
  certificados: GraduationCap
};

function IconeBloco({ blocoId }: { blocoId: string }) {
  const Icone = ICONE_BLOCO[blocoId] || FileText;
  return (
    <span className="w-9 h-9 shrink-0 rounded-[10px] bg-gray-50 text-gray-500 flex items-center justify-center">
      <Icone size={16} />
    </span>
  );
}

/**
 * Indicador de status do cabeçalho: bolinha verde preenchida quando a etapa foi
 * confirmada, anel laranja vazado enquanto está pendente.
 */
function StatusEtapa({ concluido }: { concluido: boolean }) {
  return (
    <span
      role="img"
      aria-label={concluido ? 'Etapa concluída' : 'Etapa pendente'}
      className={`w-[18px] h-[18px] shrink-0 rounded-full border-2 flex items-center justify-center ${
        concluido ? 'border-green-500' : 'border-[var(--color-brand-primary)]'
      }`}
    >
      {concluido && <span className="w-2.5 h-2.5 rounded-full bg-green-500" />}
    </span>
  );
}

/** Pergunta Sim/Não que abre os blocos condicionais (CNH, dependentes...). */
function PerguntaSimNao({
  pergunta,
  valor,
  onChange
}: {
  pergunta: string;
  valor?: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-bold text-gray-800">{pergunta}</p>
      <div className="flex gap-2">
        {[
          { label: 'Sim', v: true },
          { label: 'Não', v: false }
        ].map(opcao => {
          const ativo = valor === opcao.v;
          return (
            <button
              key={opcao.label}
              type="button"
              onClick={() => onChange(opcao.v)}
              className={`flex-1 min-h-[44px] rounded-[8px] border text-[13px] font-bold transition-colors ${
                ativo
                  ? 'bg-orange-50 border-[var(--color-brand-primary)] text-orange-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opcao.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Campos declarados no bloco, em grid de 2 colunas. */
function CamposBloco({
  campos,
  dados,
  onCampo
}: {
  campos: AdmissaoCampo[];
  dados: Record<string, any>;
  onCampo: (campoId: string, valor: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {campos.map(campo => {
        const valor = String(dados?.[campo.id] ?? '');
        return (
          <Field
            key={campo.id}
            label={campo.label}
            className={campo.largura === 2 ? 'sm:col-span-2' : ''}
          >
            {campo.somenteLeitura ? (
              <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-500 truncate">
                {valor || '—'}
              </div>
            ) : campo.tipo === 'select' ? (
              <Select
                value={valor}
                onChange={v => onCampo(campo.id, v)}
                ariaLabel={campo.label}
                className="w-full min-h-[42px]"
                options={(campo.opcoes || []).map(o => ({ value: o, label: o }))}
              />
            ) : (
              <input
                type={campo.tipo === 'date' ? 'date' : 'text'}
                value={valor}
                placeholder={campo.placeholder}
                aria-label={campo.label}
                onChange={e => onCampo(campo.id, e.target.value)}
                className={`${ADMIN_FIELD_CLASS} w-full min-h-[42px]`}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

/**
 * Editor de dependentes: mesmos campos do processo "Gestão de Dependentes"
 * (nome, parentesco, nascimento, CPF e benefício vinculado), gravados no mesmo
 * formato `Dependent` usado na ficha do colaborador.
 */
function EditorDependentes({
  dependentes,
  onAdd,
  onChange,
  onRemove
}: {
  dependentes: Dependent[];
  onAdd: () => void;
  onChange: (depId: string, campo: keyof Dependent, valor: any) => void;
  onRemove: (depId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {dependentes.map((dep, indice) => (
        <div key={dep.id} className="rounded-[8px] border border-gray-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-caps">Dependente {indice + 1}</span>
            <button
              type="button"
              onClick={() => onRemove(dep.id)}
              aria-label={`Remover dependente ${indice + 1}`}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome completo do dependente" className="sm:col-span-2">
              <input
                type="text"
                value={dep.name}
                aria-label="Nome completo do dependente"
                onChange={e => onChange(dep.id, 'name', e.target.value)}
                className={`${ADMIN_FIELD_CLASS} w-full min-h-[42px]`}
              />
            </Field>
            <Field label="Grau de parentesco">
              <Select
                value={dep.relationship}
                onChange={v => onChange(dep.id, 'relationship', v)}
                ariaLabel="Grau de parentesco"
                className="w-full min-h-[42px]"
                options={PARENTESCO_OPCOES.map(o => ({ value: o, label: o }))}
              />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                value={dep.birthDate}
                aria-label="Data de nascimento do dependente"
                onChange={e => onChange(dep.id, 'birthDate', e.target.value)}
                className={`${ADMIN_FIELD_CLASS} w-full min-h-[42px]`}
              />
            </Field>
            <Field label="CPF do dependente" className="sm:col-span-2">
              <input
                type="text"
                value={dep.cpf}
                placeholder="000.000.000-00"
                aria-label="CPF do dependente"
                onChange={e => onChange(dep.id, 'cpf', e.target.value)}
                className={`${ADMIN_FIELD_CLASS} w-full min-h-[42px]`}
              />
            </Field>
          </div>
        </div>
      ))}

      <Button variant="secondary" fullWidth leftIcon={<Plus size={16} />} onClick={onAdd}>
        Adicionar dependente
      </Button>
    </div>
  );
}

/** Lista de certificados: nome do curso + arquivo, um por linha. */
function EditorCertificados({
  certificados,
  onAdd,
  onChange,
  onArquivo,
  onRemove
}: {
  certificados: AdmissaoCertificado[];
  onAdd: () => void;
  onChange: (certId: string, campo: keyof AdmissaoCertificado, valor: string) => void;
  onArquivo: (certId: string) => void;
  onRemove: (certId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {certificados.map((cert, indice) => (
        <div key={cert.id} className="rounded-[8px] border border-gray-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-caps">Certificado {indice + 1}</span>
            <button
              type="button"
              onClick={() => onRemove(cert.id)}
              aria-label={`Remover certificado ${indice + 1}`}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Field label="Nome do certificado / curso">
            <input
              type="text"
              value={cert.nome}
              placeholder="Ex.: Técnico em Administração"
              aria-label="Nome do certificado ou curso"
              onChange={e => onChange(cert.id, 'nome', e.target.value)}
              className={`${ADMIN_FIELD_CLASS} w-full min-h-[42px]`}
            />
          </Field>
          {cert.arquivo ? (
            <div className="flex items-center gap-3 rounded-[8px] bg-gray-50 px-3 py-2">
              <Paperclip size={14} className="text-gray-400 shrink-0" />
              <span className="flex-1 min-w-0 text-[13px] font-bold text-gray-700 truncate">{cert.arquivo}</span>
              <button
                type="button"
                onClick={() => onChange(cert.id, 'arquivo', '')}
                aria-label={`Remover arquivo ${cert.arquivo}`}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              className="min-h-[44px]"
              leftIcon={<Upload size={16} />}
              onClick={() => onArquivo(cert.id)}
            >
              Anexar arquivo
            </Button>
          )}
        </div>
      ))}

      <Button variant="secondary" fullWidth leftIcon={<Plus size={16} />} onClick={onAdd}>
        Adicionar certificado
      </Button>
    </div>
  );
}

function BlocoAdmissao({
  bloco,
  titulo,
  aberto,
  exigeAcao,
  onToggle,
  onCampo,
  onAplicavel,
  onTirarFoto,
  onImportar,
  onRemover,
  onAddDependente,
  onDependente,
  onRemoverDependente,
  onAddCertificado,
  onCertificado,
  onArquivoCertificado,
  onRemoverCertificado,
  onConfirmar,
  resumo
}: {
  bloco: AdmissaoBloco;
  titulo: string;
  aberto: boolean;
  exigeAcao: boolean;
  onToggle: () => void;
  onCampo: (campoId: string, valor: string) => void;
  onAplicavel: (valor: boolean) => void;
  onTirarFoto: () => void;
  onImportar: () => void;
  onRemover: (anexoId: string) => void;
  onAddDependente: () => void;
  onDependente: (depId: string, campo: keyof Dependent, valor: any) => void;
  onRemoverDependente: (depId: string) => void;
  onAddCertificado: () => void;
  onCertificado: (certId: string, campo: keyof AdmissaoCertificado, valor: string) => void;
  onArquivoCertificado: (certId: string) => void;
  onRemoverCertificado: (certId: string) => void;
  onConfirmar: () => void;
  resumo: React.ReactNode;
}) {
  const concluido = blocoConcluido(bloco);
  const aguardandoCorrecao = bloco.statusRevisao === 'AGUARDANDO_CORRECAO';

  // No modo correção, bloco já aprovado abre só para conferência: sem editar e
  // sem reconfirmar, senão o colaborador refaria o que o RH já aceitou.
  const somenteLeitura = !exigeAcao;
  const podeConfirmar = podeConfirmarBloco(bloco);
  // Condicional respondido "Não" some com o corpo — nada mais a preencher.
  const mostrarConteudo = !bloco.perguntaCondicional || bloco.aplicavel === true;

  return (
    <ExpandableRow
      open={aberto}
      onToggle={onToggle}
      leading={<IconeBloco blocoId={bloco.id} />}
      title={titulo}
      subtitle={bloco.descricao}
      badge={
        <span className="flex items-center gap-2 shrink-0">
          {!bloco.obrigatorio && <Badge variant="gray" size="sm">Opcional</Badge>}
          <StatusEtapa concluido={concluido} />
        </span>
      }
    >
      <div className="space-y-4">
        {/* Box do motivo escrito pelo RH */}
        {aguardandoCorrecao && bloco.motivoRevisao && (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
              Motivo da revisão (RH)
            </p>
            <p className="text-[13px] font-medium text-red-900 leading-relaxed">{bloco.motivoRevisao}</p>
          </div>
        )}

        {somenteLeitura ? (
          <>
            <InfoNote>
              O RH já aprovou este bloco. Você está só conferindo — não precisa reenviar nada.
            </InfoNote>
            {resumo}
          </>
        ) : (
          <>
            {bloco.perguntaCondicional && (
              <PerguntaSimNao
                pergunta={bloco.perguntaCondicional}
                valor={bloco.aplicavel}
                onChange={onAplicavel}
              />
            )}

            {mostrarConteudo && (
              <>
                {bloco.campos && bloco.campos.length > 0 && (
                  <CamposBloco campos={bloco.campos} dados={bloco.dados || {}} onCampo={onCampo} />
                )}

                {bloco.lista === 'dependentes' && (
                  <EditorDependentes
                    dependentes={bloco.dependentes || []}
                    onAdd={onAddDependente}
                    onChange={onDependente}
                    onRemove={onRemoverDependente}
                  />
                )}

                {bloco.lista === 'certificados' && (
                  <EditorCertificados
                    certificados={bloco.certificados || []}
                    onAdd={onAddCertificado}
                    onChange={onCertificado}
                    onArquivo={onArquivoCertificado}
                    onRemove={onRemoverCertificado}
                  />
                )}

                {bloco.pedeAnexo && (
                  <>
                    {bloco.anexos.length > 0 && (
                      <ul className="space-y-2">
                        {bloco.anexos.map(anexo => (
                          <li
                            key={anexo.id}
                            className="flex items-center gap-3 rounded-[8px] bg-gray-50 px-3 py-2"
                          >
                            <Paperclip size={14} className="text-gray-400 shrink-0" />
                            <span className="flex-1 min-w-0 text-[13px] font-bold text-gray-700 truncate">
                              {anexo.nome}
                            </span>
                            <Badge variant="gray" size="sm">{anexo.origem}</Badge>
                            <button
                              type="button"
                              onClick={() => onRemover(anexo.id)}
                              aria-label={`Remover ${anexo.nome}`}
                              className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1 min-h-[44px]"
                        leftIcon={<Camera size={16} />}
                        onClick={onTirarFoto}
                      >
                        Tirar foto
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 min-h-[44px]"
                        leftIcon={<Upload size={16} />}
                        onClick={onImportar}
                      >
                        Importar arquivo
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {podeConfirmar && (
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button leftIcon={<Check size={16} />} onClick={onConfirmar}>
                  Confirmar etapa
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ExpandableRow>
  );
}
