import { FatiaMensal } from '../../utils/visaoGeral';

/**
 * Volume mensal em barras, para os painéis compactos da tela de login.
 *
 * Substitui o `path` fixo que os dois painéis desenhavam (com o rótulo do mês
 * escrito dentro do SVG). Barra aguenta o formato real do seed — em que boa
 * parte da janela não tem abertura nenhuma —, coisa que uma linha suavizada
 * transformava em curva inventada.
 */
export function MiniBarrasMensais({
  meses,
  pico,
  alturaTrilha = 'h-16'
}: {
  meses: FatiaMensal[];
  /** Maior valor da série: é ele que define a escala e a barra destacada. */
  pico: number;
  alturaTrilha?: string;
}) {
  return (
    <div className="flex items-end gap-1.5">
      {meses.map(mes => {
        const altura = pico > 0 ? Math.round((mes.total / pico) * 100) : 0;
        const ehPico = pico > 0 && mes.total === pico;
        return (
          <div key={mes.labelCompleto} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-black text-gray-400 tabular-nums">{mes.total || ''}</span>
            <div className={`w-full ${alturaTrilha} flex items-end`} title={`${mes.total} em ${mes.labelCompleto}`}>
              <div
                className={`w-full rounded-t-[3px] ${mes.total === 0 ? 'bg-gray-200' : ehPico ? 'bg-[#F26522]' : 'bg-orange-200'}`}
                // Mês sem abertura vira um traço na linha de base: sem isso a
                // coluna some e o eixo fica com buraco.
                style={{ height: mes.total === 0 ? '2px' : `${Math.max(altura, 6)}%` }}
              />
            </div>
            <span className="text-[8px] font-bold text-gray-300">{mes.label}</span>
          </div>
        );
      })}
    </div>
  );
}
