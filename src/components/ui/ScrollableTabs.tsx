import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ABAS COM ROLAGEM HORIZONTAL
//
// Quando as abas não cabem na largura, a barra de rolagem nativa aparecia como
// um traço cinza grosso atravessando a tela — feio e, no Windows, com setinhas
// de sistema que destoam de tudo.
//
// Aqui a barra é escondida (`.scrollbar-hide`) mas a rolagem continua inteira:
// swipe no touch, shift+scroll no trackpad, arrastar. O que aparece é um par de
// setas próprias, e SÓ do lado em que ainda há aba escondida — quando tudo cabe
// na tela, nenhuma das duas aparece e o componente fica idêntico a uma lista
// simples. O degradê na borda avisa que a lista continua.
//
// A aba ativa é trazida para a área visível sempre que muda, inclusive quando
// quem mudou foi outra parte da tela.

export interface ScrollableTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export function ScrollableTabs({
  tabs,
  activeTab,
  onChange,
  className = ''
}: {
  tabs: ScrollableTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const abaAtivaRef = useRef<HTMLButtonElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const medir = useCallback(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    // 1px de folga: navegadores devolvem frações (scrollLeft 0.5) e sem a
    // tolerância a seta piscaria no fim da rolagem.
    const fim = trilho.scrollWidth - trilho.clientWidth - trilho.scrollLeft;
    setPodeVoltar(trilho.scrollLeft > 1);
    setPodeAvancar(fim > 1);
  }, []);

  useLayoutEffect(() => {
    medir();
    const trilho = trilhoRef.current;
    if (!trilho || typeof ResizeObserver === 'undefined') return;
    // Redimensionar a janela (ou abrir/fechar o menu lateral) muda o que cabe.
    const observer = new ResizeObserver(medir);
    observer.observe(trilho);
    return () => observer.disconnect();
  }, [medir, tabs.length]);

  // Trocar de aba pelo teclado, ou por outra tela, traz a aba para o campo de visão.
  useEffect(() => {
    abaAtivaRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  const rolar = (direcao: -1 | 1) => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    // 80% da largura visível: sobra uma aba de referência entre um clique e outro.
    trilho.scrollBy({ left: direcao * trilho.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      {podeVoltar && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
          <button
            type="button"
            aria-label="Ver abas anteriores"
            onClick={() => rolar(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-gray-200 subtle-shadow flex items-center justify-center text-gray-500 hover:text-[var(--color-brand-primary)] hover:border-gray-300 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </>
      )}

      <div
        ref={trilhoRef}
        onScroll={medir}
        role="tablist"
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {tabs.map(tab => {
          const ativa = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={ativa ? abaAtivaRef : undefined}
              role="tab"
              aria-selected={ativa}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
                ativa
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary-text)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {podeAvancar && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
          <button
            type="button"
            aria-label="Ver próximas abas"
            onClick={() => rolar(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-gray-200 subtle-shadow flex items-center justify-center text-gray-500 hover:text-[var(--color-brand-primary)] hover:border-gray-300 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
