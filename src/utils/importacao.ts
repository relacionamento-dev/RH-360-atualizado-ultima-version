import * as XLSX from 'xlsx';

import { CostCenter, Employee, Sector } from '../types';
import { localDateFromParts } from './dateLocal';
import { matriculaDoCadastro } from './identidade';

// IMPORTAÇÃO DE PLANILHA — carga inicial de um cliente novo
//
// Aceita .xlsx, .xls e .csv. O cliente manda o arquivo que sai do ERP, e isso é
// XLSX — pedir "salve como CSV" empurra para ele um passo manual em que se
// perde acento, separador e formato de data.
//
// A divisão é proposital e é o que sustenta o requisito de não duplicar regra:
//
//   LEITOR   `linhasDoCSV` / `abrirPlanilha` — abrem o arquivo e devolvem uma
//            matriz de texto. Não validam nada.
//   NÚCLEO   `importarLinhas` — sinônimos de coluna, validação, relatório de
//            recusa e vínculo de gestor por id. É o mesmo para os dois
//            formatos, então o relatório sai igual byte a byte.
//
// O que importa aqui não é ler qualquer planilha do mundo, e sim RECUSAR com
// precisão a linha ruim: quem está implantando precisa saber qual linha, qual
// coluna e por quê.

export interface ErroDeImportacao {
  linha: number;
  coluna?: string;
  mensagem: string;
}

export interface ResultadoImportacao {
  colaboradores: Employee[];
  setores: Sector[];
  centrosDeCusto: CostCenter[];
  cargos: string[];
  filiais: string[];
  erros: ErroDeImportacao[];
  /** Linhas lidas, incluindo as recusadas. */
  totalLinhas: number;
}

/** Colunas aceitas, com os sinônimos que uma planilha real costuma trazer. */
const COLUNAS: Record<string, string[]> = {
  nome: ['nome', 'colaborador', 'name'],
  email: ['email', 'e-mail'],
  cpf: ['cpf'],
  cargo: ['cargo', 'funcao', 'função', 'role'],
  setor: ['setor', 'departamento', 'department', 'area', 'área'],
  centroCusto: ['centro de custo', 'centrocusto', 'cc', 'centro_custo'],
  filial: ['filial', 'unidade', 'branch'],
  gestor: ['gestor', 'gestor direto', 'manager', 'lider', 'líder'],
  admissao: ['admissao', 'admissão', 'data de admissao', 'data de admissão', 'admission'],
  salario: ['salario', 'salário', 'remuneracao', 'remuneração', 'salary']
};

const normalizar = (v: string) =>
  v.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Separador: vírgula ou ponto e vírgula, decidido pela primeira linha. */
const detectarSeparador = (cabecalho: string) =>
  (cabecalho.match(/;/g) || []).length > (cabecalho.match(/,/g) || []).length ? ';' : ',';

/** Divide respeitando aspas — nome com vírgula dentro é comum. */
function dividirLinha(linha: string, sep: string): string[] {
  const celulas: string[] = [];
  let atual = '';
  let entreAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (entreAspas && linha[i + 1] === '"') { atual += '"'; i++; }
      else entreAspas = !entreAspas;
    } else if (c === sep && !entreAspas) {
      celulas.push(atual); atual = '';
    } else {
      atual += c;
    }
  }
  celulas.push(atual);
  return celulas.map(c => c.trim());
}

/** `dd/mm/aaaa` ou `aaaa-mm-dd` → ISO curto. Devolve vazio se não reconhecer. */
function normalizarData(valor: string): string {
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const br = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  return '';
}

const paraNumero = (v: string): number => {
  const limpo = v.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Atalho para importar um CSV em texto. Mantido com a assinatura de sempre —
 * o parser de texto não mudou.
 */
export function importarPlanilhaDeColaboradores(
  csv: string,
  empresaNome: string,
  prefixoId = 'IMP'
): ResultadoImportacao {
  return importarLinhas(linhasDoCSV(csv), empresaNome, prefixoId);
}

/** Texto CSV → matriz de células. Separador e aspas como sempre foram. */
export function linhasDoCSV(csv: string): string[][] {
  const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== '');
  if (linhas.length === 0) return [];
  const sep = detectarSeparador(linhas[0]);
  return linhas.map(l => dividirLinha(l, sep));
}

/**
 * O NÚCLEO DA IMPORTAÇÃO — validação, sinônimos de coluna, relatório de recusa
 * e vínculo de gestor por id.
 *
 * Recebe a planilha já normalizada em linhas de texto, venha ela de CSV ou de
 * XLSX. É o que garante que o relatório saia idêntico nos dois formatos: não é
 * uma regra parecida, é o mesmo código. O leitor de arquivo (`linhasDoCSV`,
 * `linhasDaAba`) só entrega as células; quem decide o que é válido é aqui.
 */
export function importarLinhas(
  linhas: string[][],
  empresaNome: string,
  prefixoId = 'IMP'
): ResultadoImportacao {
  const erros: ErroDeImportacao[] = [];

  if (linhas.length < 2) {
    return {
      colaboradores: [], setores: [], centrosDeCusto: [], cargos: [], filiais: [],
      erros: [{ linha: 1, mensagem: 'A planilha precisa de um cabeçalho e ao menos uma linha de dados.' }],
      totalLinhas: 0
    };
  }

  const cabecalho = linhas[0].map(normalizar);

  // Mapeia cada campo conhecido para o índice da coluna correspondente.
  const indice: Record<string, number> = {};
  for (const [campo, sinonimos] of Object.entries(COLUNAS)) {
    const i = cabecalho.findIndex(c => sinonimos.includes(c));
    if (i >= 0) indice[campo] = i;
  }

  const obrigatorias = ['nome', 'cargo', 'setor'];
  const faltando = obrigatorias.filter(c => indice[c] === undefined);
  if (faltando.length) {
    return {
      colaboradores: [], setores: [], centrosDeCusto: [], cargos: [], filiais: [],
      erros: [{
        linha: 1,
        coluna: faltando.join(', '),
        mensagem: `Coluna obrigatória ausente: ${faltando.join(', ')}. Colunas lidas: ${cabecalho.join(', ')}.`
      }],
      totalLinhas: linhas.length - 1
    };
  }

  const colaboradores: Employee[] = [];
  const nomesVistos = new Set<string>();
  const cargos = new Set<string>();
  const filiais = new Set<string>();
  const setoresPorNome = new Map<string, string>();   // setor → nome do gestor
  const ccsPorCodigo = new Set<string>();

  const celula = (cols: string[], campo: string) =>
    indice[campo] !== undefined ? (cols[indice[campo]] || '').trim() : '';

  linhas.slice(1).forEach((cols, i) => {
    const numeroDaLinha = i + 2; // 1 = cabeçalho
    const nome = celula(cols, 'nome');
    const cargo = celula(cols, 'cargo');
    const setor = celula(cols, 'setor');

    if (!nome) return erros.push({ linha: numeroDaLinha, coluna: 'nome', mensagem: 'Nome vazio.' });
    if (!cargo) return erros.push({ linha: numeroDaLinha, coluna: 'cargo', mensagem: `"${nome}": cargo vazio.` });
    if (!setor) return erros.push({ linha: numeroDaLinha, coluna: 'setor', mensagem: `"${nome}": setor vazio.` });
    if (nomesVistos.has(normalizar(nome))) {
      return erros.push({ linha: numeroDaLinha, coluna: 'nome', mensagem: `"${nome}" aparece mais de uma vez na planilha.` });
    }

    const admissaoBruta = celula(cols, 'admissao');
    const admissao = admissaoBruta ? normalizarData(admissaoBruta) : '';
    if (admissaoBruta && !admissao) {
      erros.push({
        linha: numeroDaLinha, coluna: 'admissão',
        mensagem: `"${nome}": data "${admissaoBruta}" não reconhecida (use dd/mm/aaaa ou aaaa-mm-dd).`
      });
      return;
    }

    const email = celula(cols, 'email');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      erros.push({ linha: numeroDaLinha, coluna: 'email', mensagem: `"${nome}": e-mail "${email}" inválido.` });
      return;
    }

    nomesVistos.add(normalizar(nome));
    const id = `${prefixoId}-EMP-${String(colaboradores.length + 1).padStart(3, '0')}`;
    const filial = celula(cols, 'filial') || 'Matriz';
    const cc = celula(cols, 'centroCusto') || 'GERAL';
    const gestor = celula(cols, 'gestor');

    cargos.add(cargo);
    filiais.add(filial);
    ccsPorCodigo.add(cc);
    if (!setoresPorNome.has(setor) || (gestor && !setoresPorNome.get(setor))) {
      setoresPorNome.set(setor, gestor);
    }

    colaboradores.push({
      id,
      registration: matriculaDoCadastro(id),
      name: nome,
      email: email || `${normalizar(nome).replace(/\s+/g, '.')}@${normalizar(empresaNome).replace(/\s+/g, '')}.demo`,
      phone: '', address: '', city: '', state: '',
      department: setor,
      role: cargo,
      branch: filial,
      company: empresaNome,
      status: 'Ativo',
      admissionDate: admissao || new Date().toISOString().slice(0, 10),
      birthDate: '',
      salary: paraNumero(celula(cols, 'salario')),
      manager: gestor || 'A definir',
      costCenter: cc,
      cpf: celula(cols, 'cpf')
    });
  });

  // Vínculo de gestor por ID, resolvido DEPOIS de ler todas as linhas — o
  // gestor costuma aparecer na planilha abaixo do subordinado.
  const idPorNome = new Map(colaboradores.map(e => [normalizar(e.name), e.id]));
  colaboradores.forEach(e => {
    const idDoGestor = idPorNome.get(normalizar(e.manager));
    if (idDoGestor && idDoGestor !== e.id) e.managerId = idDoGestor;
  });

  const setores: Sector[] = [...setoresPorNome.entries()].map(([nome, gestor], i) => ({
    id: `${prefixoId}-S-${i + 1}`,
    name: nome,
    manager: gestor || 'A definir',
    managerId: idPorNome.get(normalizar(gestor || '')),
    branch: colaboradores.find(e => e.department === nome)?.branch || 'Matriz'
  }));

  const centrosDeCusto: CostCenter[] = [...ccsPorCodigo].map((codigo, i) => ({
    id: `${prefixoId}-CC-${i + 1}`,
    name: codigo,
    code: codigo
  }));

  return {
    colaboradores,
    setores,
    centrosDeCusto,
    cargos: [...cargos],
    filiais: [...filiais],
    erros,
    totalLinhas: linhas.length - 1
  };
}

// LEITURA DE .XLSX / .XLS
//
// O cliente manda o arquivo que sai do ERP, e isso é .xlsx — não CSV. O leitor
// abaixo só transforma a aba escolhida na MESMA matriz de texto que o CSV
// produz e entrega para `importarLinhas`. Nenhuma validação vive aqui: é o que
// faz o relatório de recusa sair idêntico nos dois formatos.

export interface PlanilhaAberta {
  /** Nomes das abas, na ordem do arquivo. */
  abas: string[];
  /** Linhas já normalizadas da aba pedida. */
  linhasDaAba: (aba: string) => string[][];
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Uma data em partes de calendário vira o `dd/mm/aaaa` que o parser valida. */
function partesParaDataBR(ano: number, mes: number, dia: number): string | null {
  // `localDateFromParts` (utils/dateLocal) recusa data inexistente — 31/02 e
  // afins, que o `Date` rolaria em silêncio para o mês seguinte.
  return localDateFromParts(ano, mes, dia) ? `${doisDigitos(dia)}/${doisDigitos(mes)}/${ano}` : null;
}

/**
 * Serial do Excel → `dd/mm/aaaa`.
 *
 * É AQUI que mora o off-by-one de fuso: somar o serial a um epoch e ler com
 * `getDate()` converte para o fuso local e, em America/Sao_Paulo (UTC-3), a
 * data volta um dia. A conta abaixo é UTC de ponta a ponta — `Date.UTC` para
 * entrar e `getUTC*` para sair —, então nenhum fuso entra na conversão.
 *
 * O `- 1` para serial > 59 é o bug de 1900 do Excel, que conta 29/02/1900: um
 * dia que não existiu. Ignorá-lo desloca toda data posterior a fevereiro/1900.
 */
export function serialDoExcelParaDataBR(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;

  // Exportador que converte a data pelo fuso grava 43890,99967 no lugar de
  // 43891 — 28 segundos antes da meia-noite, ou seja, o dia ANTERIOR. Truncar
  // aceitaria o erro do arquivo; a folga de um minuto recupera o dia que a
  // planilha quis dizer sem estragar um horário de verdade (18:00 = ,75, bem
  // longe da borda).
  const FOLGA = 1 / 1440; // um minuto
  const inteiro = Math.floor(serial);
  const diaCheio = serial - inteiro > 1 - FOLGA ? inteiro + 1 : inteiro;

  const dias = diaCheio > 59 ? diaCheio - 1 : diaCheio;
  const base = Date.UTC(1899, 11, 31);
  const d = new Date(base + dias * 86400000);
  return partesParaDataBR(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** O formato da célula é de data? (`dd/mm/yyyy`, `d-mmm-yy`, …) */
const formatoDeData = (z?: string | number) => {
  const f = String(z ?? '');
  // Descarta as aspas de literais ("R$" etc.) antes de procurar y/m/d.
  return /[ymd]/i.test(f.replace(/"[^"]*"/g, '')) && !/^[#0.,%\s]*$/.test(f);
};

/** Uma célula do Excel vira o texto que o parser já sabe validar. */
function celulaParaTexto(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v === undefined || cell.v === null) return '';

  // Data pode chegar de dois jeitos: como Date (leitura com `cellDates`) ou
  // como número cru com formato de data. Os dois terminam em partes de
  // calendário, nunca em um instante.
  if (cell.t === 'd' && cell.v instanceof Date) {
    const d = cell.v;
    // O SheetJS monta a data em MEIA-NOITE UTC do dia da célula. Ler com
    // getDate/getMonth converteria para o fuso local e, em America/Sao_Paulo,
    // devolveria o dia anterior — 01/03/2020 virava 29/02/2020. Os getters UTC
    // são o par correto dessa construção.
    const comoData = partesParaDataBR(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    if (comoData) return comoData;
  }
  if (cell.t === 'n' && typeof cell.v === 'number' && formatoDeData(cell.z)) {
    const comoData = serialDoExcelParaDataBR(cell.v);
    if (comoData) return comoData;
  }

  if (cell.t === 'b') return cell.v ? 'Sim' : 'Não';
  // `w` é o texto como o Excel exibe — respeita máscara de moeda e milhar, que
  // o `paraNumero` do parser já sabe limpar.
  return String(cell.w ?? cell.v).trim();
}

/**
 * Abre o arquivo e devolve as abas. Aceita .xlsx, .xls e também .csv — neste
 * caso a leitura volta para `linhasDoCSV`, que continua sendo o parser de
 * texto de sempre.
 */
export function abrirPlanilha(dados: ArrayBuffer, nomeArquivo = ''): PlanilhaAberta {
  if (/\.csv$/i.test(nomeArquivo)) {
    const texto = new TextDecoder('utf-8').decode(dados);
    return { abas: ['CSV'], linhasDaAba: () => linhasDoCSV(texto) };
  }

  // Sem `cellDates`: a data continua sendo o serial cru, e quem converte é
  // `serialDoExcelParaDataBR` — conta UTC de ponta a ponta, sob nosso controle.
  // Delegar a conversão à biblioteca é o que traz o off-by-one de volta,
  // porque ela devolve um instante e não um dia de calendário.
  // `cellNF` traz o formato da célula, que é como se sabe que aquele número é
  // uma data e não um valor qualquer.
  const workbook = XLSX.read(dados, { type: 'array', cellNF: true });

  return {
    abas: workbook.SheetNames,
    linhasDaAba: (aba: string) => {
      const sheet = workbook.Sheets[aba] || workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet || !sheet['!ref']) return [];
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const linhas: string[][] = [];

      for (let r = range.s.r; r <= range.e.r; r++) {
        const celulas: string[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          celulas.push(celulaParaTexto(sheet[XLSX.utils.encode_cell({ r, c })]));
        }
        // Linha totalmente vazia é ruído de planilha (formatação sobrando), não
        // um registro a recusar: some antes de chegar ao relatório de erros.
        if (celulas.some(v => v !== '')) linhas.push(celulas);
      }
      return linhas;
    }
  };
}

/** Extensões que o campo de upload aceita. */
export const EXTENSOES_ACEITAS = '.csv,.xlsx,.xls';

export const ehPlanilhaExcel = (nomeArquivo: string) => /\.xlsx?$/i.test(nomeArquivo);

/** Modelo de planilha para o cliente preencher. */
export const MODELO_CSV = [
  'nome;email;cpf;cargo;setor;centro de custo;filial;gestor;admissao;salario',
  'Vitor Andrade;vitor@cliente.com;901.111.111-01;CTO;Engenharia;ENG-100;Sede;;01/02/2021;34000',
  'Beatriz Coelho;beatriz@cliente.com;901.111.111-05;Engenheira de Software;Engenharia;ENG-100;Sede;Vitor Andrade;08/01/2024;13500'
].join('\n');
