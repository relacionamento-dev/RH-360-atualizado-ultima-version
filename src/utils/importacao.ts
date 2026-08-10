import { CostCenter, Employee, Sector } from '../types';
import { matriculaDoCadastro } from './identidade';

// IMPORTAÇÃO DE PLANILHA — carga inicial de um cliente novo
//
// Entrada em CSV (o "Salvar como CSV" de qualquer XLSX). O parse é próprio, sem
// dependência nova: o formato é conhecido e o que importa aqui não é ler
// qualquer planilha do mundo, e sim RECUSAR com precisão a linha ruim — quem
// está implantando precisa saber qual linha, qual coluna e por quê.

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
 * Lê a planilha e devolve o que dá para importar MAIS a lista de erros. Não é
 * tudo-ou-nada de propósito: numa carga de centenas de linhas, three linhas
 * ruins não podem bloquear as outras — mas precisam aparecer nomeadas.
 */
export function importarPlanilhaDeColaboradores(
  csv: string,
  empresaNome: string,
  prefixoId = 'IMP'
): ResultadoImportacao {
  const erros: ErroDeImportacao[] = [];
  const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== '');

  if (linhas.length < 2) {
    return {
      colaboradores: [], setores: [], centrosDeCusto: [], cargos: [], filiais: [],
      erros: [{ linha: 1, mensagem: 'A planilha precisa de um cabeçalho e ao menos uma linha de dados.' }],
      totalLinhas: 0
    };
  }

  const sep = detectarSeparador(linhas[0]);
  const cabecalho = dividirLinha(linhas[0], sep).map(normalizar);

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

  linhas.slice(1).forEach((linha, i) => {
    const numeroDaLinha = i + 2; // 1 = cabeçalho
    const cols = dividirLinha(linha, sep);
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

/** Modelo de planilha para o cliente preencher. */
export const MODELO_CSV = [
  'nome;email;cpf;cargo;setor;centro de custo;filial;gestor;admissao;salario',
  'Vitor Andrade;vitor@cliente.com;901.111.111-01;CTO;Engenharia;ENG-100;Sede;;01/02/2021;34000',
  'Beatriz Coelho;beatriz@cliente.com;901.111.111-05;Engenheira de Software;Engenharia;ENG-100;Sede;Vitor Andrade;08/01/2024;13500'
].join('\n');
