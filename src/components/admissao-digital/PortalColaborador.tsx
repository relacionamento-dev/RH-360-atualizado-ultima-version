import { useRef, useState } from 'react';
import {
  Camera, Upload, CheckCircle2, AlertTriangle, X, Paperclip,
  CornerUpLeft, ShieldCheck, Clock, Send, FileText
} from 'lucide-react';
import { AdmissaoBloco, Employee } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { InfoNote } from '../admin/AdminUI';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import {
  blocoPreenchido,
  blocosVisiveis,
  podeEnviarAdmissao,
  prazoFinal,
  progressoAdmissao
} from '../../utils/admissaoDigital';

/**
 * Visão que o colaborador acessa pelo link da admissão digital.
 *
 * Mobile-first: coluna única com alvos de toque grandes; no desktop fica
 * centralizada e estreita, porque é assim que ela é usada de verdade.
 *
 * Dois modos, definidos pelo `estado`:
 *  - AGUARDANDO_PREENCHIMENTO: termo LGPD → todos os blocos → "Concluir e enviar";
 *  - EM_CORRECAO: banner de pendência + só os blocos devolvidos pelo RH, cada um
 *    com o motivo escrito pelo RH → "Corrigir e reenviar".
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
  const [blocoAlvo, setBlocoAlvo] = useState<string | null>(null);

  const admissao = employee.admissaoDigital;
  if (!admissao) return null;

  const emCorrecao = admissao.estado === 'EM_CORRECAO';
  const enviado = admissao.estado === 'EM_ANALISE';
  const visiveis = blocosVisiveis(admissao);
  const progresso = progressoAdmissao(admissao);
  const podeEnviar = podeEnviarAdmissao(admissao);
  const prazo = prazoFinal(admissao);

  const salvarBlocos = (blocos: AdmissaoBloco[]) => {
    atualizarAdmissaoDigital(employee.id, { blocos });
  };

  const adicionarAnexo = (blocoId: string, nome: string, origem: 'Foto' | 'Arquivo') => {
    salvarBlocos(
      admissao.blocos.map(bloco =>
        bloco.id === blocoId
          ? {
              ...bloco,
              anexos: [
                ...bloco.anexos,
                { id: `anx-${Date.now()}`, nome, origem, enviadoEm: new Date().toISOString() }
              ]
            }
          : bloco
      )
    );
    addToast(origem === 'Foto' ? 'Foto anexada.' : `Arquivo "${nome}" anexado.`, 'success');
  };

  const removerAnexo = (blocoId: string, anexoId: string) => {
    salvarBlocos(
      admissao.blocos.map(bloco =>
        bloco.id === blocoId ? { ...bloco, anexos: bloco.anexos.filter(a => a.id !== anexoId) } : bloco
      )
    );
  };

  // Na demo a câmera é simulada para funcionar em qualquer navegador; o
  // "Importar arquivo" abre o seletor real e usa o nome do arquivo escolhido.
  const tirarFoto = (bloco: AdmissaoBloco) => {
    const numero = bloco.anexos.filter(a => a.origem === 'Foto').length + 1;
    adicionarAnexo(bloco.id, `${bloco.id}-foto-${numero}.jpg`, 'Foto');
  };

  const importarArquivo = (blocoId: string) => {
    setBlocoAlvo(blocoId);
    fileInputRef.current?.click();
  };

  const handleArquivoSelecionado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (arquivo && blocoAlvo) adicionarAnexo(blocoAlvo, arquivo.name, 'Arquivo');
    event.target.value = '';
    setBlocoAlvo(null);
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
            <span className="label-caps">Documentos enviados</span>
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

          {/* Termo LGPD */}
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

          {/* Blocos de documento */}
          {bloqueado ? (
            <div className="rounded-[12px] border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
              <FileText size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-[13px] font-bold text-gray-500">
                Aceite o termo acima para liberar o envio dos documentos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visiveis.map(bloco => (
                <BlocoDocumento
                  key={bloco.id}
                  bloco={bloco}
                  onTirarFoto={() => tirarFoto(bloco)}
                  onImportar={() => importarArquivo(bloco.id)}
                  onRemover={anexoId => removerAnexo(bloco.id, anexoId)}
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
                  : 'Envie os documentos obrigatórios para liberar o botão.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BlocoDocumento({
  bloco,
  onTirarFoto,
  onImportar,
  onRemover
}: {
  bloco: AdmissaoBloco;
  onTirarFoto: () => void;
  onImportar: () => void;
  onRemover: (anexoId: string) => void;
}) {
  const preenchido = blocoPreenchido(bloco);
  const emCorrecao = bloco.statusRevisao === 'AGUARDANDO_CORRECAO';

  return (
    <div
      className={`bg-white rounded-[12px] border subtle-shadow overflow-hidden ${
        emCorrecao ? 'border-red-200' : 'border-[var(--color-brand-border)]'
      }`}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-black text-gray-900 tracking-tight">{bloco.titulo}</h3>
              {!bloco.obrigatorio && <Badge variant="gray" size="sm">Opcional</Badge>}
            </div>
            {bloco.descricao && (
              <p className="text-[12px] text-gray-500 font-medium mt-1 leading-relaxed">{bloco.descricao}</p>
            )}
          </div>
          {preenchido && <CheckCircle2 size={20} className="text-green-500 shrink-0" />}
        </div>

        {/* Box do motivo escrito pelo RH */}
        {emCorrecao && bloco.motivoRevisao && (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
              Motivo da revisão (RH)
            </p>
            <p className="text-[13px] font-medium text-red-900 leading-relaxed">{bloco.motivoRevisao}</p>
          </div>
        )}

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
      </div>
    </div>
  );
}
