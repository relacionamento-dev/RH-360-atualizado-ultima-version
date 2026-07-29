import { Paperclip, Ban } from 'lucide-react';
import { AdmissaoBloco, AdmissaoDigital } from '../../types';
import { Badge } from '../ui/Badge';
import { blocoAplicavel } from '../../utils/admissaoDigital';

/** Data guardada em ISO (input nativo) exibida em pt-BR. */
export function formatarDataBR(valor?: string): string {
  const str = String(valor ?? '').trim();
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : str;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide shrink-0">{rotulo}</span>
      <span className="text-[13px] font-bold text-gray-800 truncate">{valor}</span>
    </div>
  );
}

/**
 * Conteúdo de um bloco em modo leitura: usado tanto na fila de revisão do RH
 * quanto no portal, quando o colaborador reabre um bloco que o RH já aprovou.
 * Um só lugar entende os três formatos de bloco (campos, listas e anexos).
 */
export function BlocoResumo({ admissao, bloco }: { admissao: AdmissaoDigital; bloco: AdmissaoBloco }) {
  if (!blocoAplicavel(bloco)) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
        <Ban size={14} className="text-gray-400 shrink-0" />
        Não se aplica — o colaborador respondeu "Não" para "{bloco.perguntaCondicional}"
      </p>
    );
  }

  const campos = (bloco.campos || []).filter(c => String(bloco.dados?.[c.id] ?? '').trim().length > 0);
  const dependentes = bloco.dependentes || [];
  const certificados = bloco.certificados || [];
  const vazio =
    campos.length === 0 && dependentes.length === 0 && certificados.length === 0 && bloco.anexos.length === 0;

  if (vazio) {
    return <p className="text-[13px] text-gray-400 font-medium">Nada preenchido neste bloco.</p>;
  }

  return (
    <div className="space-y-3">
      {campos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {campos.map(campo => (
            <Linha
              key={campo.id}
              rotulo={campo.label}
              valor={campo.tipo === 'date' ? formatarDataBR(bloco.dados?.[campo.id]) : String(bloco.dados?.[campo.id])}
            />
          ))}
        </div>
      )}

      {dependentes.length > 0 && (
        <ul className="space-y-1.5">
          {dependentes.map(dep => (
            <li key={dep.id} className="rounded-[8px] bg-gray-50 px-3 py-2">
              <p className="text-[13px] font-bold text-gray-800">{dep.name}</p>
              <p className="text-[12px] text-gray-500 font-medium">
                {[dep.relationship, formatarDataBR(dep.birthDate), dep.cpf].filter(Boolean).join(' · ')}
                {dep.benefits?.length ? ` · ${dep.benefits.join(', ')}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {certificados.length > 0 && (
        <ul className="space-y-1.5">
          {certificados.map(cert => (
            <li key={cert.id} className="flex items-center gap-2 rounded-[8px] bg-gray-50 px-3 py-2 min-w-0">
              <Paperclip size={13} className="text-gray-400 shrink-0" />
              <span className="text-[13px] font-bold text-gray-800 truncate">{cert.nome}</span>
              <span className="text-[12px] text-gray-500 font-medium truncate">{cert.arquivo}</span>
            </li>
          ))}
        </ul>
      )}

      {bloco.anexos.length > 0 && (
        <ul className="space-y-1.5">
          {bloco.anexos.map(anexo => (
            <li key={anexo.id} className="flex items-center gap-2 text-[13px] text-gray-600 font-medium min-w-0">
              <Paperclip size={13} className="text-gray-400 shrink-0" />
              <span className="truncate">{anexo.nome}</span>
              <Badge variant="gray" size="sm">{anexo.origem}</Badge>
              <span className="text-[11px] text-gray-400 shrink-0">
                {new Date(anexo.enviadoEm).toLocaleDateString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
