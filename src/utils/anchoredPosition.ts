// Posicionamento compartilhado para popovers/dropdowns renderizados em portal
// (position: fixed). Usado pelo date picker e pelos dropdowns de busca (zooms).
// Calcula coordenadas de viewport a partir do getBoundingClientRect() do campo,
// com flip automático para cima quando não cabe embaixo e clamp para nunca sair
// da tela.

export interface AnchoredPositionOptions {
  gap?: number;       // espaço entre o campo e o popover
  margin?: number;    // margem mínima até a borda da viewport
  width?: number;     // largura fixa; se omitido, acompanha a largura do campo
  maxWidth?: number;  // teto de largura
}

export interface AnchoredPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

export function computeAnchoredPosition(
  anchor: HTMLElement,
  height: number,
  options: AnchoredPositionOptions = {}
): AnchoredPosition {
  const gap = options.gap ?? 8;
  const margin = options.margin ?? 8;

  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Largura: fixa (ex.: calendário 320px) ou acompanhando o campo (dropdowns).
  const desiredWidth = options.width ?? rect.width;
  const width = Math.min(desiredWidth, options.maxWidth ?? Infinity, viewportWidth - margin * 2);

  const spaceBelow = viewportHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;

  // Só inverte se não couber embaixo E houver mais espaço em cima.
  const openUpward = spaceBelow < height && spaceAbove > spaceBelow;
  const rawTop = openUpward ? rect.top - gap - height : rect.bottom + gap;

  const maxTop = viewportHeight - height - margin;
  const top = maxTop < margin ? margin : Math.min(Math.max(rawTop, margin), maxTop);
  const left = Math.min(Math.max(rect.left, margin), viewportWidth - width - margin);

  return { top, left, width, openUpward };
}
