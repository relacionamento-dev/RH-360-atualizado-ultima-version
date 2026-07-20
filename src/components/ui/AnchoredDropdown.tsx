import { useEffect, useLayoutEffect, useRef, useState, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { computeAnchoredPosition, AnchoredPosition } from '../../utils/anchoredPosition';

interface AnchoredDropdownProps {
  /** Campo âncora — a lista acompanha sua posição e largura. */
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: number;
  className?: string;
}

/**
 * Lista/painel ancorado a um campo, renderizado via portal em document.body com
 * position: fixed — não é clipado pelo overflow do formulário e fica acima de
 * modais. Faz flip automático quando não há espaço abaixo, reposiciona em
 * scroll/resize e fecha ao clicar fora. A largura acompanha a do campo.
 */
export function AnchoredDropdown({
  anchorRef,
  open,
  onClose,
  children,
  maxHeight = 240,
  className = '',
}: AnchoredDropdownProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<AnchoredPosition | null>(null);

  // Mede a altura real do popover antes do paint e posiciona (com flip/clamp).
  // Reroda quando o conteúdo muda (resultados de busca alteram a altura).
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const anchor = anchorRef.current;
    const box = boxRef.current;
    if (!anchor || !box) return;
    const next = computeAnchoredPosition(anchor, box.offsetHeight, { gap: 8, margin: 8 });
    setPos(prev =>
      prev && prev.top === next.top && prev.left === next.left && prev.width === next.width ? prev : next
    );
  }, [open, children, anchorRef]);

  // Acompanha scroll (inclusive de containers internos, via capture) e resize;
  // fecha se o campo sair da viewport.
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return onClose();
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return onClose();
      setPos(computeAnchoredPosition(anchor, boxRef.current?.offsetHeight ?? maxHeight, { gap: 8, margin: 8 }));
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, anchorRef, onClose, maxHeight]);

  // Fecha ao clicar fora (ignora o próprio campo, para o foco/toggle funcionar).
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (boxRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={boxRef}
      style={{
        position: 'fixed',
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : 0,
        width: pos ? pos.width : undefined,
        maxHeight,
        overflowY: 'auto',
        visibility: pos ? 'visible' : 'hidden',
      }}
      className={`z-[1000] bg-white border border-gray-100 rounded-[16px] shadow-2xl custom-scrollbar p-1 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}
