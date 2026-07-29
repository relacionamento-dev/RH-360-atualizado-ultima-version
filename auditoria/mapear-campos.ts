/**
 * MAPA DE CAMPOS × USO NO CÓDIGO — auditoria de campo órfão e duplicado
 * ======================================================================
 *
 * Rodar:  npx tsx auditoria/mapear-campos.ts
 *         npx tsx auditoria/mapear-campos.ts --orfaos   (só os órfãos)
 *
 * Para cada campo declarado em PROCESS_DEFINITIONS, procura no código-fonte
 * alguma leitura daquela chave fora do próprio processDefinitions.ts —
 * `data.campo`, `data['campo']`, `req.data.campo`, `formData.campo`,
 * `'campo'` em condições de aprovação, etc.
 *
 * Um campo sem nenhuma leitura é ÓRFÃO: é pedido ao usuário, é gravado em
 * `request.data` e nunca mais é usado por nenhuma tela, handoff ou integração.
 * Isso não é necessariamente um defeito (o RequestDetail renderiza a definição
 * inteira genericamente, então todo campo ao menos aparece na consulta), mas
 * marca o campo que não alimenta nenhuma regra — o candidato natural a sair.
 *
 * DUPLICADO: dois campos do mesmo processo gravando na MESMA chave
 * (`id || name`). Se as condições deles se sobrepuserem, um sobrescreve o
 * outro; se forem exclusivas, é o padrão intencional de campo variante por tipo
 * (ver processo 15).
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { PROCESS_DEFINITIONS } from '../src/processDefinitions';
import { INITIAL_RH_PROCESSES } from '../src/data';
import { FormField } from '../src/types';

const RAIZ = process.cwd();
const SRC = join(RAIZ, 'src');
const IGNORAR = new Set(['processDefinitions.ts']);

/** Chave usada no `data` da solicitação — mesma regra do FormRenderer (:194). */
const chaveDoCampo = (f: FormField) => ((f as any).id || (f as any).name) as string | undefined;

function listarArquivos(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) out.push(...listarArquivos(caminho));
    else if (/\.tsx?$/.test(nome) && !IGNORAR.has(nome)) out.push(caminho);
  }
  return out;
}

const ARQUIVOS = listarArquivos(SRC).map(caminho => ({
  caminho: relative(RAIZ, caminho).replace(/\\/g, '/'),
  linhas: readFileSync(caminho, 'utf8').split('\n')
}));

/** Procura leituras da chave no código. Retorna "arquivo:linha" das ocorrências. */
function ocorrencias(chave: string): string[] {
  // .chave  |  ['chave']  |  ["chave"]  |  'chave'  |  "chave"
  const padrao = new RegExp(
    `(?:\\.${chave}\\b)|(?:\\[['"\`]${chave}['"\`]\\])|(?:['"\`]${chave}['"\`])`
  );
  const hits: string[] = [];
  for (const arq of ARQUIVOS) {
    arq.linhas.forEach((linha, i) => {
      if (padrao.test(linha)) hits.push(`${arq.caminho}:${i + 1}`);
    });
  }
  return hits;
}

const nomeDoProcesso = (id: string) => INITIAL_RH_PROCESSES.find(p => p.id === id)?.name || id;
const soOrfaos = process.argv.includes('--orfaos');

let totalCampos = 0;
let totalOrfaos = 0;
let totalDuplicados = 0;

for (const [processId, def] of Object.entries(PROCESS_DEFINITIONS)) {
  const fields = def.steps?.[0]?.fields || [];
  const porChave = new Map<string, FormField[]>();

  for (const f of fields) {
    const chave = chaveDoCampo(f);
    if (!chave || f.type === 'info') continue; // 'info' não grava valor
    porChave.set(chave, [...(porChave.get(chave) || []), f]);
  }

  const linhas: string[] = [];

  for (const [chave, campos] of porChave) {
    totalCampos++;
    const hits = ocorrencias(chave);
    const orfao = hits.length === 0;
    const duplicado = campos.length > 1;
    if (orfao) totalOrfaos++;
    if (duplicado) totalDuplicados++;

    if (soOrfaos && !orfao) continue;

    const tipos = campos.map(c => `${c.type}/${c.origin || '-'}`).join(' + ');
    const marca = orfao ? 'ORFAO ' : duplicado ? 'DUPLIC' : '  ok  ';
    linhas.push(
      `  [${marca}] ${chave.padEnd(28)} ${tipos.padEnd(22)} ${
        duplicado ? `${campos.length} declarações (${campos.map(c => (c as any).name).join(', ')}) · ` : ''
      }${orfao ? 'nenhuma leitura fora do processDefinitions' : `${hits.length} leitura(s): ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ' …' : ''}`}`
    );
  }

  if (linhas.length) {
    console.log(`\nPROCESSO ${processId} — ${nomeDoProcesso(processId)}`);
    console.log(linhas.join('\n'));
  }
}

console.log(
  `\n${'='.repeat(78)}\nRESUMO: ${totalCampos} chaves de campo · ${totalOrfaos} órfãs · ${totalDuplicados} com declaração múltipla\n${'='.repeat(78)}`
);
