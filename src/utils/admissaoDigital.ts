import { AdmissaoBloco, AdmissaoDigital, Employee } from '../types';

// Opções espelhadas do processo "Gestão de Dependentes" (processDefinitions '6')
// para o colaborador ver os mesmos rótulos que o RH usa lá.
export const PARENTESCO_OPCOES = ['Filho(a)', 'Cônjuge', 'Pai/Mãe', 'Enteado(a)'];

export const ESTADO_CIVIL_OPCOES = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'];

export const SEXO_OPCOES = ['Feminino', 'Masculino', 'Prefiro não informar'];

export const UF_OPCOES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

/**
 * Blocos pedidos ao colaborador no portal, na ordem em que ele os percorre.
 *
 * Três formatos convivem: bloco de anexo (RG, Título, Certidão...), bloco de
 * formulário (Dados Pessoais, Endereço) e bloco de lista (Dependentes,
 * Certificados). Os condicionais começam com uma pergunta Sim/Não — respondido
 * "Não", o bloco fecha verde sem pedir mais nada.
 *
 * A CTPS fica opcional de propósito: mostra na demo que o "Concluir e enviar"
 * só depende dos obrigatórios.
 */
export const BLOCOS_ADMISSAO_PADRAO: Omit<AdmissaoBloco, 'anexos' | 'statusRevisao' | 'motivoRevisao'>[] = [
  {
    id: 'foto-perfil',
    titulo: 'Foto de Perfil',
    descricao: 'Foto em ambiente iluminado, com fundo neutro e sem acessórios.',
    obrigatorio: true,
    pedeAnexo: true
  },
  {
    id: 'dados-pessoais',
    titulo: 'Dados Pessoais',
    descricao: 'Confira o que veio da proposta e complete o que falta.',
    obrigatorio: true,
    campos: [
      // Vêm do disparo: aparecem só para conferência (ver `prepararBlocos`).
      { id: 'nome', label: 'Nome completo', tipo: 'text', somenteLeitura: true, largura: 2 },
      { id: 'cpf', label: 'CPF', tipo: 'text', somenteLeitura: true },
      { id: 'dataNascimento', label: 'Data de nascimento', tipo: 'date', obrigatorio: true },
      { id: 'estadoCivil', label: 'Estado civil', tipo: 'select', opcoes: ESTADO_CIVIL_OPCOES, obrigatorio: true },
      { id: 'sexo', label: 'Sexo', tipo: 'select', opcoes: SEXO_OPCOES, obrigatorio: true },
      { id: 'nomeMae', label: 'Nome da mãe', tipo: 'text', obrigatorio: true, largura: 2 }
    ]
  },
  {
    id: 'rg',
    titulo: 'RG (frente e verso)',
    descricao: 'Duas imagens legíveis, sem reflexo e com as bordas visíveis.',
    obrigatorio: true,
    pedeAnexo: true
  },
  {
    id: 'titulo-eleitor',
    titulo: 'Título de Eleitor',
    descricao: 'Número do título e a imagem do documento.',
    obrigatorio: true,
    pedeAnexo: true,
    campos: [{ id: 'numero', label: 'Número do título', tipo: 'text', obrigatorio: true, largura: 2 }]
  },
  {
    // O título vira "Certidão de Casamento" quando o estado civil informado em
    // Dados Pessoais é Casado(a) — ver `tituloBloco`.
    id: 'certidao',
    titulo: 'Certidão de Nascimento',
    descricao: 'Imagem ou PDF da certidão.',
    obrigatorio: true,
    pedeAnexo: true
  },
  {
    id: 'ctps',
    titulo: 'CTPS Digital',
    descricao: 'PDF da carteira de trabalho digital (opcional nesta etapa).',
    obrigatorio: false,
    pedeAnexo: true
  },
  {
    id: 'cnh',
    titulo: 'CNH',
    descricao: 'Carteira nacional de habilitação, se você tiver.',
    obrigatorio: true,
    pedeAnexo: true,
    perguntaCondicional: 'Possui CNH?',
    campos: [{ id: 'numero', label: 'Número da CNH', tipo: 'text', obrigatorio: true, largura: 2 }]
  },
  {
    id: 'reservista',
    titulo: 'Reservista',
    descricao: 'Certificado de alistamento ou dispensa, se você tiver.',
    obrigatorio: true,
    pedeAnexo: true,
    perguntaCondicional: 'Possui certificado de reservista?',
    campos: [{ id: 'numero', label: 'Número do certificado', tipo: 'text', obrigatorio: true, largura: 2 }]
  },
  {
    id: 'endereco',
    titulo: 'Endereço',
    descricao: 'Onde você mora hoje.',
    obrigatorio: true,
    campos: [
      { id: 'cep', label: 'CEP', tipo: 'text', obrigatorio: true, placeholder: '00000-000' },
      { id: 'logradouro', label: 'Logradouro', tipo: 'text', obrigatorio: true, largura: 2 },
      { id: 'numero', label: 'Número', tipo: 'text', obrigatorio: true },
      { id: 'complemento', label: 'Complemento', tipo: 'text', placeholder: 'Apto, bloco...' },
      { id: 'bairro', label: 'Bairro', tipo: 'text', obrigatorio: true },
      { id: 'cidade', label: 'Cidade', tipo: 'text', obrigatorio: true },
      { id: 'uf', label: 'UF', tipo: 'select', opcoes: UF_OPCOES, obrigatorio: true }
    ]
  },
  {
    id: 'dependentes',
    titulo: 'Dependentes',
    descricao: 'Filhos, cônjuge ou outros dependentes para benefícios e IR.',
    obrigatorio: true,
    perguntaCondicional: 'Possui dependentes?',
    lista: 'dependentes'
  },
  {
    id: 'certificados',
    titulo: 'Certificados / Diplomas',
    descricao: 'Formações e cursos que você queira registrar na ficha.',
    obrigatorio: true,
    perguntaCondicional: 'Possui certificações a anexar?',
    lista: 'certificados'
  }
];

export function criarBlocosAdmissao(): AdmissaoBloco[] {
  return BLOCOS_ADMISSAO_PADRAO.map(bloco => ({
    ...bloco,
    // Cópia por bloco: `campos` é compartilhado com a constante e não pode ser
    // mutado por um colaborador.
    campos: bloco.campos ? bloco.campos.map(c => ({ ...c })) : undefined,
    dados: bloco.campos ? {} : undefined,
    dependentes: bloco.lista === 'dependentes' ? [] : undefined,
    certificados: bloco.lista === 'certificados' ? [] : undefined,
    anexos: [],
    statusRevisao: 'PENDENTE' as const
  }));
}

/**
 * Preenche os campos que já vieram do disparo (nome e CPF) para o colaborador
 * apenas conferir, em vez de digitar de novo.
 */
export function blocosComDadosDoDisparo(
  blocos: AdmissaoBloco[],
  disparo: { nome: string; cpf: string }
): AdmissaoBloco[] {
  return blocos.map(bloco =>
    bloco.id === 'dados-pessoais'
      ? { ...bloco, dados: { ...bloco.dados, nome: disparo.nome, cpf: disparo.cpf } }
      : bloco
  );
}

export function blocoPreenchido(bloco: AdmissaoBloco): boolean {
  return bloco.anexos.length > 0;
}

/**
 * Bloco condicional respondido "Não" sai de cena: fecha verde e não conta como
 * pendência na barra de progresso. Enquanto a pergunta não é respondida
 * (`aplicavel === undefined`), o bloco segue valendo como pendente.
 */
export function blocoAplicavel(bloco: AdmissaoBloco): boolean {
  return bloco.perguntaCondicional ? bloco.aplicavel !== false : true;
}

/** Título do bloco pode depender de outra resposta (Certidão × estado civil). */
export function tituloBloco(admissao: AdmissaoDigital, bloco: AdmissaoBloco): string {
  if (bloco.id !== 'certidao') return bloco.titulo;
  const estadoCivil = admissao.blocos.find(b => b.id === 'dados-pessoais')?.dados?.estadoCivil;
  return estadoCivil === 'Casado(a)' ? 'Certidão de Casamento' : 'Certidão de Nascimento';
}

/** Campo do bloco realmente preenchido pelo colaborador. */
function campoPreenchido(bloco: AdmissaoBloco, campoId: string): boolean {
  return String(bloco.dados?.[campoId] ?? '').trim().length > 0;
}

/** Dependente só conta quando tem os quatro dados de identificação. */
export function dependenteCompleto(dep: { name?: string; relationship?: string; birthDate?: string; cpf?: string }): boolean {
  return [dep.name, dep.relationship, dep.birthDate, dep.cpf].every(v => String(v ?? '').trim().length > 0);
}

/** Certificado só conta com nome do curso e arquivo anexado. */
export function certificadoCompleto(cert: { nome?: string; arquivo?: string }): boolean {
  return String(cert.nome ?? '').trim().length > 0 && String(cert.arquivo ?? '').trim().length > 0;
}

/**
 * Se o botão "Confirmar etapa" pode ser oferecido. Regra por formato:
 *  - condicional sem resposta: não;
 *  - condicional em "Não": sim, fecha sem exigir nada;
 *  - bloco devolvido pelo RH: exige anexo novo, mesmo se for opcional;
 *  - bloco opcional: pode ser confirmado vazio;
 *  - demais: campos obrigatórios preenchidos, anexo (quando pede) e lista com
 *    pelo menos um item completo.
 */
export function podeConfirmarBloco(bloco: AdmissaoBloco): boolean {
  if (bloco.perguntaCondicional) {
    if (bloco.aplicavel === undefined) return false;
    if (bloco.aplicavel === false) return true;
  }

  const aguardandoCorrecao = bloco.statusRevisao === 'AGUARDANDO_CORRECAO';
  if (aguardandoCorrecao && bloco.pedeAnexo && !blocoPreenchido(bloco)) return false;

  // Opcional e não devolvido: liberado mesmo vazio.
  if (!bloco.obrigatorio && !aguardandoCorrecao) return true;

  const camposOk = (bloco.campos || [])
    .filter(c => c.obrigatorio && !c.somenteLeitura)
    .every(c => campoPreenchido(bloco, c.id));
  if (!camposOk) return false;

  if (bloco.pedeAnexo && !blocoPreenchido(bloco)) return false;

  if (bloco.lista === 'dependentes') {
    const deps = bloco.dependentes || [];
    if (deps.length === 0 || !deps.every(dependenteCompleto)) return false;
  }
  if (bloco.lista === 'certificados') {
    const certs = bloco.certificados || [];
    if (certs.length === 0 || !certs.every(certificadoCompleto)) return false;
  }

  return true;
}

/**
 * Bloco fechado: bolinha verde no acordeão do portal. O que fecha é o botão
 * "Confirmar etapa" (`confirmado`); um bloco já aprovado pelo RH também conta,
 * o que cobre registros anteriores a esse campo existir (seed antigo) e mantém
 * os blocos aprovados verdes durante a correção.
 */
export function blocoConcluido(bloco: AdmissaoBloco): boolean {
  return bloco.statusRevisao === 'APROVADO' || !!bloco.confirmado;
}

/**
 * % concluído da barra do topo. O denominador são só os blocos aplicáveis —
 * condicional respondido "Não" sai da conta em vez de virar pendência eterna.
 */
export function progressoAdmissao(admissao: AdmissaoDigital): number {
  const contam = admissao.blocos.filter(blocoAplicavel);
  if (contam.length === 0) return 100;
  return Math.round((contam.filter(blocoConcluido).length / contam.length) * 100);
}

/**
 * Blocos que ainda pedem ação do colaborador: todos no preenchimento normal, só
 * os devolvidos no modo correção. O portal RENDERIZA todos os blocos — os
 * aprovados aparecem colapsados e verdes; esta lista é quem exige conclusão
 * para liberar o envio.
 */
export function blocosQueExigemAcao(admissao: AdmissaoDigital): AdmissaoBloco[] {
  if (admissao.estado !== 'EM_CORRECAO') return admissao.blocos;
  return admissao.blocos.filter(b => b.statusRevisao === 'AGUARDANDO_CORRECAO');
}

/**
 * Habilita "Concluir e enviar" / "Corrigir e reenviar": termo aceito e todos os
 * blocos obrigatórios que exigem ação com a etapa confirmada. No modo correção
 * todo bloco devolvido precisa ser refeito e confirmado, obrigatório ou não.
 */
export function podeEnviarAdmissao(admissao: AdmissaoDigital): boolean {
  if (!admissao.termoAceito) return false;
  const pendentes = blocosQueExigemAcao(admissao);
  if (pendentes.length === 0) return false;
  const emCorrecao = admissao.estado === 'EM_CORRECAO';
  return pendentes.every(b => (emCorrecao || b.obrigatorio ? blocoConcluido(b) : true));
}

/** Colaboradores do seed antigo não têm `situacao` — valem como ativos. */
export function situacaoDoColaborador(emp: Employee): 'PRE_ADMISSAO' | 'ATIVO' {
  return emp.situacao || 'ATIVO';
}

/** Quem aparece no menu Portal do Colaborador. */
export function aguardandoColaborador(emp: Employee): boolean {
  const estado = emp.admissaoDigital?.estado;
  return estado === 'AGUARDANDO_PREENCHIMENTO' || estado === 'EM_CORRECAO';
}

/** Quem aparece na fila de revisão do RH. */
export function aguardandoRevisaoRH(emp: Employee): boolean {
  return emp.admissaoDigital?.estado === 'EM_ANALISE';
}

export const ESTADO_ADMISSAO_LABEL: Record<AdmissaoDigital['estado'], string> = {
  AGUARDANDO_PREENCHIMENTO: 'Aguardando preenchimento',
  EM_ANALISE: 'Em análise do RH',
  EM_CORRECAO: 'Em correção'
};

export const ESTADO_ADMISSAO_BADGE: Record<AdmissaoDigital['estado'], 'blue' | 'amber' | 'red'> = {
  AGUARDANDO_PREENCHIMENTO: 'blue',
  EM_ANALISE: 'amber',
  EM_CORRECAO: 'red'
};

/**
 * Normaliza a data do formulário (dd/mm/aaaa, como o FormRenderer grava) para
 * ISO aaaa-mm-dd, que é o formato usado em `Employee.admissionDate`. Valor já
 * em ISO passa direto; qualquer outra coisa devolve ''.
 */
export function paraDataISO(valor: any): string {
  const str = String(valor ?? '').trim();
  const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : '';
}

/** Prazo final do link, calculado a partir do disparo. */
export function prazoFinal(admissao: AdmissaoDigital): Date {
  return new Date(new Date(admissao.disparo.enviadoEm).getTime() + admissao.disparo.prazoDias * 86400000);
}
