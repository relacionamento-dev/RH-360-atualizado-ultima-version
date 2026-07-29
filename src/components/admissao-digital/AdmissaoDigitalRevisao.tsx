import { useState } from 'react';
import { CheckCircle2, CornerUpLeft, FileSearch } from 'lucide-react';
import { Employee } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar, EmptyState } from '../ui/Misc';
import { ADMIN_FIELD_CLASS, ExpandableRow, Field, SectionHeader, InfoNote } from '../admin/AdminUI';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { BlocoResumo } from './BlocoResumo';
import { blocoAplicavel, blocoConcluido, tituloBloco } from '../../utils/admissaoDigital';

/**
 * Fila de revisão do RH: quem enviou os documentos e está EM_ANALISE.
 * Abrir a linha mostra os blocos com os anexos; daí sai a aprovação (vira
 * Ativo) ou a devolução com pendência (volta ao portal só com os blocos
 * marcados).
 */
export default function AdmissaoDigitalRevisao() {
  const { config } = useAppConfig();
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const emAnalise = config.colaboradores.filter(e => e.admissaoDigital?.estado === 'EM_ANALISE');

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Admissão digital — para revisar"
        description="Documentos enviados pelo colaborador pelo link. Aprove ou devolva o que precisa ser refeito."
      />

      {emAnalise.length === 0 ? (
        <EmptyState
          icon={<FileSearch size={40} />}
          title="Nada para revisar agora"
          description="Assim que alguém concluir o envio pelo portal, a admissão aparece aqui."
        />
      ) : (
        <div className="space-y-2">
          {emAnalise.map(emp => (
            <LinhaRevisao
              key={emp.id}
              employee={emp}
              open={abertoId === emp.id}
              onToggle={() => setAbertoId(abertoId === emp.id ? null : emp.id)}
              onFinish={() => setAbertoId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaRevisao({
  employee,
  open,
  onToggle,
  onFinish
}: {
  employee: Employee;
  open: boolean;
  onToggle: () => void;
  onFinish: () => void;
}) {
  const { aprovarAdmissaoDigital, devolverAdmissaoDigital } = useAppConfig();
  const { addToast } = useToast();
  const [devolvendo, setDevolvendo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [blocosSelecionados, setBlocosSelecionados] = useState<string[]>([]);

  const admissao = employee.admissaoDigital!;
  // Os certificados guardam o arquivo na própria linha, fora de `anexos`.
  const totalAnexos = admissao.blocos.reduce(
    (soma, b) => soma + b.anexos.length + (b.certificados || []).filter(c => c.arquivo).length,
    0
  );

  const alternarBloco = (blocoId: string) => {
    setBlocosSelecionados(prev =>
      prev.includes(blocoId) ? prev.filter(id => id !== blocoId) : [...prev, blocoId]
    );
  };

  const aprovar = () => {
    aprovarAdmissaoDigital(employee.id);
    addToast(`${employee.name} foi aprovado e já consta como Ativo.`, 'success');
    onFinish();
  };

  const devolver = () => {
    devolverAdmissaoDigital(employee.id, blocosSelecionados, motivo.trim());
    addToast(`Admissão devolvida para ${employee.name} corrigir.`, 'info');
    setDevolvendo(false);
    setMotivo('');
    setBlocosSelecionados([]);
    onFinish();
  };

  const podeDevolver = blocosSelecionados.length > 0 && motivo.trim().length >= 10;

  return (
    <ExpandableRow
      open={open}
      onToggle={onToggle}
      leading={<Avatar name={employee.name} src={employee.avatar} size="sm" />}
      title={employee.name}
      subtitle={employee.email}
      meta={`${totalAnexos} anexo(s)`}
      badge={<Badge variant="amber">Em análise</Badge>}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {admissao.blocos.map(bloco => {
            const naoSeAplica = !blocoAplicavel(bloco);
            return (
              <div key={bloco.id} className="rounded-[12px] border border-gray-100 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-bold text-gray-900">{tituloBloco(admissao, bloco)}</span>
                  {!bloco.obrigatorio && <Badge variant="gray" size="sm">Opcional</Badge>}
                  {naoSeAplica ? (
                    <Badge variant="gray" size="sm">Não se aplica</Badge>
                  ) : blocoConcluido(bloco) ? (
                    <Badge variant="green" size="sm">Concluído</Badge>
                  ) : (
                    <Badge variant="gray" size="sm">Pendente</Badge>
                  )}
                </div>

                <BlocoResumo admissao={admissao} bloco={bloco} />

                {/* Bloco que não se aplica não pode ser devolvido: não há o que corrigir. */}
                {devolvendo && !naoSeAplica && (
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blocosSelecionados.includes(bloco.id)}
                      onChange={() => alternarBloco(bloco.id)}
                      className="w-4 h-4 accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                    <span className="text-[12px] font-bold text-gray-600">Pedir correção deste bloco</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {devolvendo ? (
          <div className="space-y-4 rounded-[12px] bg-gray-50 p-4">
            <InfoNote>
              O colaborador vai ver só os documentos marcados acima, junto com o motivo escrito aqui.
            </InfoNote>
            <Field label="Motivo da revisão" hint="Explique em linguagem simples o que precisa ser refeito (mínimo 10 caracteres).">
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ex.: A foto do RG está ilegível. Reenvie frente e verso em local bem iluminado."
                className={`${ADMIN_FIELD_CLASS} w-full resize-none`}
              />
            </Field>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="ghost" onClick={() => setDevolvendo(false)}>Cancelar</Button>
              <Button variant="danger" disabled={!podeDevolver} onClick={devolver}>
                Confirmar devolução
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              leftIcon={<CornerUpLeft size={16} />}
              onClick={() => setDevolvendo(true)}
            >
              Devolver com pendência
            </Button>
            <Button leftIcon={<CheckCircle2 size={16} />} onClick={aprovar}>
              Aprovar
            </Button>
          </div>
        )}
      </div>
    </ExpandableRow>
  );
}
