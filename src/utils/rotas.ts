// QUAL ITEM DO MENU UMA ROTA ACENDE
//
// O realce do menu era uma comparação direta `item.view === activeView`. Isso
// funciona enquanto cada tela é uma rota, mas a Central Adm tem dez sub-telas
// dentro de UMA rota — e o realce ficava preso na rota de entrada: quem chegava
// por "Integrações" e trocava para "Perfis de Acesso" continuava vendo
// Integrações aceso, porque `activeView` nunca mudava.
//
// Agora cada aba tem rota própria (`admin-perfis`, `admin-org`…) e é este mapa
// que diz qual item do menu ela acende. Mesma ideia das rotas canônicas de
// App.tsx ('solicitacoes' → 'requests'), só que no sentido inverso: da rota
// para o item.

/** Prefixo das rotas de sub-tela da Central Adm. */
export const PREFIXO_ADMIN = 'admin-';

/**
 * O id do item de menu que esta rota deve acender.
 *
 * Para a maioria das telas a rota É o id do item, e a função devolve a própria
 * rota. As exceções são as telas que vivem dentro de outra:
 *
 * - `admin`, `configuracoes` e qualquer `admin-*` acendem **Central Adm**,
 *   inclusive `admin-integrations` — estar na aba Integrações DENTRO da Central
 *   Adm é estar na Central Adm;
 * - `integrations` (item de menu próprio, que abre a Central Adm já naquela
 *   aba) acende **Integrações**.
 *
 * Telas de EDIÇÃO seguem o mesmo prefixo — `admin-perfis-editar` acende
 * Central Adm como qualquer outra sub-tela, e é isso que mantém o menu coerente
 * enquanto se edita um perfil.
 */
export function menuDaView(view: string): string {
  if (view === 'integrations') return 'integrations';
  if (view === 'admin' || view === 'configuracoes' || view.startsWith(PREFIXO_ADMIN)) return 'admin';
  return view;
}

/** A rota é uma sub-tela da Central Adm? */
export const ehRotaDaCentralAdm = (view: string): boolean =>
  view === 'admin' || view === 'configuracoes' || view === 'integrations' || view.startsWith(PREFIXO_ADMIN);
