import {
  AuditLog,
  Benefit,
  Dependent,
  Employee,
  EmployeeDocument,
  EmployeeMovement,
  EmployeeTraining,
  OccupationalExam,
  VacationRecord
} from '../types';

// FICHA DO COLABORADOR (demonstração)
//
// O Perfil 360 tem uma aba por conjunto de dados — documentos, exames, férias,
// benefícios, movimentações — e o seed só preenchia dependentes e férias de UM
// colaborador. O resto abria com tabela vazia, o que na demonstração parecia
// tela quebrada.
//
// Este módulo deriva a ficha inteira dos dados que o colaborador já tem
// (admissão, salário, cargo, matrícula, CPF). Duas regras que valem para tudo
// aqui:
//
// 1. É DERIVADO, não sorteado: nada de Math.random. O mesmo colaborador produz
//    sempre a mesma ficha, então a demonstração não muda de números entre uma
//    apresentação e outra (a auditoria de UX já cobrou isso no item V02).
// 2. É COERENTE com a linha do tempo: exame admissional na data de admissão,
//    período aquisitivo contado a partir dela, promoção só para quem tem tempo
//    de casa. Colaborador recém-admitido fica legitimamente sem histórico — e aí
//    quem explica é o estado vazio da aba, não uma tabela em branco.

const DIA = 86400000;

const iso = (date: Date) => date.toISOString().slice(0, 10);

const somarAnos = (base: Date, anos: number) => {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + anos);
  return d;
};

const somarDias = (base: Date, dias: number) => new Date(base.getTime() + dias * DIA);

/** Anos completos entre a data e hoje. */
const anosDeCasa = (admissao: Date, hoje: Date) => {
  let anos = hoje.getFullYear() - admissao.getFullYear();
  const antes =
    hoje.getMonth() < admissao.getMonth() ||
    (hoje.getMonth() === admissao.getMonth() && hoje.getDate() < admissao.getDate());
  if (antes) anos -= 1;
  return Math.max(0, anos);
};

/**
 * Número estável a partir de um texto — usado para variar clínica, cursos e
 * dependentes entre colaboradores sem sortear nada.
 */
const semente = (texto: string) => {
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma = (soma * 31 + texto.charCodeAt(i)) % 100000;
  return soma;
};

const CLINICAS = [
  'MedWork Saúde Ocupacional',
  'Clínica Vida & Trabalho',
  'CEMESO Medicina do Trabalho',
  'Instituto Bem Estar Ocupacional'
];

const CURSOS_POR_AREA: Record<string, string[]> = {
  Tecnologia: ['Segurança da Informação (LGPD)', 'Arquitetura de Sistemas', 'Cloud Fundamentals'],
  Desenvolvimento: ['Clean Code na Prática', 'Testes Automatizados', 'Segurança da Informação (LGPD)'],
  Infraestrutura: ['Redes e Firewall', 'Segurança da Informação (LGPD)'],
  'Recursos Humanos': ['Legislação Trabalhista Aplicada', 'Entrevista por Competências'],
  'Departamento Pessoal': ['eSocial na Prática', 'Rotinas de Fechamento de Folha'],
  Comercial: ['Negociação Consultiva', 'Gestão de Carteira'],
  Vendas: ['Negociação Consultiva', 'Técnicas de Prospecção'],
  Financeiro: ['Análise de Custos', 'Fechamento Contábil'],
  Diretoria: ['Liderança Estratégica', 'Governança Corporativa']
};

const CURSOS_PADRAO = ['Integração RH360', 'Segurança da Informação (LGPD)'];

/** Documentos pessoais: o que o DP arquiva de qualquer CLT. */
function documentosDe(emp: Employee, admissao: Date, hoje: Date): EmployeeDocument[] {
  const s = semente(emp.id);
  const nascimento = emp.birthDate ? new Date(emp.birthDate) : somarAnos(admissao, -30);
  // RG emitido na maioridade; CTPS e comprovante, na contratação.
  const emissaoRg = somarAnos(nascimento, 18);
  const validadeCnh = somarAnos(hoje, 2);

  const docs: EmployeeDocument[] = [
    {
      id: `doc-${emp.id}-rg`,
      type: 'RG',
      number: `${String(10 + (s % 40))}.${String(100 + (s % 900))}.${String(100 + ((s * 7) % 900))}-${s % 10}`,
      issueDate: iso(emissaoRg),
      status: 'Válido',
      attachmentUrl: 'rg.pdf',
      origin: 'Upload'
    },
    {
      id: `doc-${emp.id}-cpf`,
      type: 'CPF',
      number: emp.cpf,
      issueDate: iso(emissaoRg),
      status: 'Válido',
      attachmentUrl: 'cpf.pdf',
      origin: 'Sistema'
    },
    {
      id: `doc-${emp.id}-ctps`,
      type: 'CTPS',
      number: `${String(4000000 + (s % 900000))} / série ${String(100 + (s % 800))}-SP`,
      issueDate: iso(somarDias(admissao, -20)),
      status: 'Válido',
      attachmentUrl: 'ctps-digital.pdf',
      origin: 'Sistema'
    },
    {
      id: `doc-${emp.id}-residencia`,
      type: 'Comprovante de Residência',
      number: `Conta de energia • ${iso(somarDias(admissao, -10)).slice(0, 7)}`,
      issueDate: iso(somarDias(admissao, -10)),
      // Comprovante tem validade curta: no seed ele já está vencido de propósito,
      // para a aba mostrar os três status possíveis e não só "Válido".
      expiryDate: iso(somarDias(admissao, 80)),
      status: 'Vencido',
      attachmentUrl: 'comprovante-residencia.pdf',
      origin: 'Upload'
    },
    {
      id: `doc-${emp.id}-titulo`,
      type: 'Título de Eleitor',
      number: `${String(1000 + (s % 9000))} ${String(1000 + ((s * 3) % 9000))} ${String(1000 + ((s * 11) % 9000))}`,
      issueDate: iso(somarAnos(nascimento, 16)),
      status: 'Válido',
      attachmentUrl: 'titulo-eleitor.pdf',
      origin: 'Upload'
    }
  ];

  // CNH só para parte do quadro — é o documento que tem validade "viva" e
  // aparece como "Próximo do vencimento" na aba.
  if (s % 3 === 0) {
    docs.push({
      id: `doc-${emp.id}-cnh`,
      type: 'CNH',
      number: `${String(10000000000 + (s % 8999999999))}`,
      issueDate: iso(somarAnos(validadeCnh, -5)),
      expiryDate: iso(validadeCnh),
      status: 'Próximo do vencimento',
      attachmentUrl: 'cnh.pdf',
      origin: 'Upload'
    });
  }

  return docs;
}

/** ASO: admissional na contratação + periódicos anuais. */
function examesDe(emp: Employee, admissao: Date, hoje: Date): OccupationalExam[] {
  const clinica = CLINICAS[semente(emp.id) % CLINICAS.length];
  const exames: OccupationalExam[] = [
    {
      id: `aso-${emp.id}-adm`,
      type: 'Admissional',
      date: iso(somarDias(admissao, -3)),
      expiryDate: iso(somarAnos(admissao, 1)),
      clinic: clinica,
      status: 'Vencido',
      attachmentUrl: 'aso-admissional.pdf'
    }
  ];

  // Periódicos: um por ano completo de casa, no aniversário de admissão.
  const anos = anosDeCasa(admissao, hoje);
  for (let ano = 1; ano <= anos; ano++) {
    const data = somarAnos(admissao, ano);
    const validade = somarAnos(data, 1);
    const vigente = validade > hoje;
    const proximo = vigente && validade.getTime() - hoje.getTime() < 90 * DIA;
    exames.push({
      id: `aso-${emp.id}-per-${ano}`,
      type: 'Periódico',
      date: iso(data),
      expiryDate: iso(validade),
      clinic: clinica,
      status: vigente ? (proximo ? 'A vencer' : 'Válido') : 'Vencido',
      attachmentUrl: `aso-periodico-${data.getFullYear()}.pdf`
    });
  }

  // Mais recente primeiro: é o que o Resumo e o cartão "ASO Atual" leem.
  return exames.reverse();
}

/** Benefícios do pacote padrão; seguro de vida entra nos cargos de liderança. */
function beneficiosDe(emp: Employee, admissao: Date, dependentes: Dependent[]): Benefit[] {
  const adesao = iso(somarDias(admissao, 30));
  const idsDependentes = dependentes.map(d => d.id);

  const beneficios: Benefit[] = [
    {
      id: `ben-${emp.id}-saude`,
      name: 'Plano de Saúde',
      status: 'Ativo',
      enrollmentDate: adesao,
      linkedDependents: idsDependentes
    },
    {
      id: `ben-${emp.id}-odonto`,
      name: 'Plano Odontológico',
      status: 'Ativo',
      enrollmentDate: adesao,
      linkedDependents: idsDependentes
    },
    { id: `ben-${emp.id}-vr`, name: 'Vale Refeição', status: 'Ativo', enrollmentDate: iso(admissao) },
    { id: `ben-${emp.id}-vt`, name: 'Vale Transporte', status: 'Ativo', enrollmentDate: iso(admissao) }
  ];

  if (emp.salary >= 10000) {
    beneficios.push({
      id: `ben-${emp.id}-vida`,
      name: 'Seguro de Vida',
      status: 'Ativo',
      enrollmentDate: adesao
    });
  }

  return beneficios;
}

/** Férias: um período aquisitivo por ano de casa, o mais recente em aberto. */
function feriasDe(emp: Employee, admissao: Date, hoje: Date): VacationRecord[] {
  const anos = anosDeCasa(admissao, hoje);
  if (anos < 1) return [];

  const historico: { period: string; days: number; status: string }[] = [];
  // Períodos já encerrados: gozados na íntegra, do mais antigo ao penúltimo.
  for (let ano = 0; ano < anos - 1; ano++) {
    const inicio = somarAnos(admissao, ano);
    const fim = somarAnos(admissao, ano + 1);
    historico.push({
      period: `${inicio.getFullYear()}/${fim.getFullYear()}`,
      days: 30,
      status: 'Gozado'
    });
  }

  const inicioAtual = somarAnos(admissao, anos - 1);
  const fimAtual = somarAnos(admissao, anos);
  // O período corrente fica parcialmente gozado, para o saldo não ser sempre 30.
  const gozados = semente(emp.id) % 2 === 0 ? 0 : 10;

  return [
    {
      id: `fer-${emp.id}`,
      acquisitivePeriod: `${inicioAtual.getFullYear()}/${fimAtual.getFullYear()}`,
      daysEntitled: 30,
      daysTaken: gozados,
      balance: 30 - gozados,
      scheduledVacation:
        semente(emp.id) % 3 === 0
          ? `${iso(somarDias(hoje, 45))} a ${iso(somarDias(hoje, 74))}`
          : undefined,
      history: historico.reverse()
    }
  ];
}

/** Movimentações: promoção por tempo de casa; mérito anual depois dela. */
function movimentacoesDe(emp: Employee, admissao: Date, hoje: Date): EmployeeMovement[] {
  const anos = anosDeCasa(admissao, hoje);
  if (anos < 2) return [];

  const movimentos: EmployeeMovement[] = [];
  const cargoAnterior = `${emp.role} Jr.`;

  // Promoção no 2º aniversário: sai de Jr. para o cargo atual, com 12% de ganho.
  const promocao = somarAnos(admissao, 2);
  const salarioAntesDaPromocao = Math.round((emp.salary / 1.12) / 50) * 50;
  movimentos.push({
    id: `mov-${emp.id}-prom`,
    date: iso(promocao),
    type: 'Promoção',
    from: emp.department,
    to: emp.department,
    previousRole: cargoAnterior,
    newRole: emp.role,
    previousSalary: salarioAntesDaPromocao,
    newSalary: emp.salary,
    requestId: `RH-${promocao.getFullYear()}-PROM-${emp.registration}`
  });

  // Transferência de área para quem já passou de 4 anos.
  if (anos >= 4) {
    const transferencia = somarAnos(admissao, 4);
    movimentos.push({
      id: `mov-${emp.id}-transf`,
      date: iso(transferencia),
      type: 'Transferência',
      from: 'Matriz SP',
      to: emp.branch,
      previousRole: emp.role,
      newRole: emp.role,
      previousSalary: emp.salary,
      newSalary: emp.salary,
      requestId: `RH-${transferencia.getFullYear()}-MOV-${emp.registration}`
    });
  }

  // Mais recente primeiro.
  return movimentos.reverse();
}

function treinamentosDe(emp: Employee, admissao: Date, hoje: Date): EmployeeTraining[] {
  const cursos = CURSOS_POR_AREA[emp.department] || CURSOS_PADRAO;
  const anos = anosDeCasa(admissao, hoje);

  return cursos.slice(0, anos >= 1 ? 2 : 1).map((curso, i) => {
    const data = somarDias(admissao, 45 + i * 210);
    const concluido = data < hoje;
    return {
      id: `trn-${emp.id}-${i}`,
      course: curso,
      hours: `${8 + i * 8}h`,
      date: iso(data),
      certificateUrl: concluido ? `certificado-${i + 1}.pdf` : undefined,
      status: concluido ? ('Concluído' as const) : ('Em Andamento' as const)
    };
  });
}

/** Trilha de auditoria da ficha: o que mudou no cadastro e por quê. */
function auditoriaDe(emp: Employee, admissao: Date, movimentos: EmployeeMovement[]): AuditLog[] {
  const logs: AuditLog[] = [
    {
      id: `aud-${emp.id}-adm`,
      timestamp: `${iso(admissao)}T09:00:00.000Z`,
      user: 'Ana Paula Lima',
      userName: 'Ana Paula Lima',
      action: 'Cadastro criado',
      module: 'Colaboradores',
      targetId: emp.id,
      details: `Ficha de ${emp.name} criada na admissão.`,
      origin: 'Admissão Digital'
    }
  ];

  movimentos.forEach(mov => {
    if (mov.newSalary !== mov.previousSalary) {
      logs.push({
        id: `aud-${emp.id}-${mov.id}`,
        timestamp: `${mov.date}T14:30:00.000Z`,
        user: 'Ana Paula Lima',
        userName: 'Ana Paula Lima',
        action: mov.type,
        module: 'Colaboradores',
        targetId: emp.id,
        details: `${mov.previousRole} → ${mov.newRole}`,
        field: 'salary',
        oldValue: mov.previousSalary,
        newValue: mov.newSalary,
        origin: 'Solicitação',
        requestId: mov.requestId
      });
    } else {
      logs.push({
        id: `aud-${emp.id}-${mov.id}`,
        timestamp: `${mov.date}T14:30:00.000Z`,
        user: 'Ana Paula Lima',
        userName: 'Ana Paula Lima',
        action: mov.type,
        module: 'Colaboradores',
        targetId: emp.id,
        details: `${mov.from} → ${mov.to}`,
        field: 'branch',
        oldValue: mov.from,
        newValue: mov.to,
        origin: 'Solicitação',
        requestId: mov.requestId
      });
    }
  });

  // Mais recente primeiro.
  return logs.reverse();
}

/** Dependentes de parte do quadro — quem não tem cai no estado vazio da aba. */
function dependentesDe(emp: Employee, admissao: Date): Dependent[] {
  const s = semente(emp.id);
  if (s % 3 === 2) return [];

  const primeiroNome = emp.name.split(' ')[0];
  const sobrenome = emp.name.split(' ').slice(1).join(' ') || 'da Silva';
  const dependentes: Dependent[] = [
    {
      id: `dep-${emp.id}-1`,
      name: `${['Arthur', 'Helena', 'Miguel', 'Laura'][s % 4]} ${sobrenome}`,
      relationship: 'Filho(a)',
      birthDate: iso(somarAnos(admissao, -(2 + (s % 8)))),
      cpf: `${String(100 + (s % 800))}.${String(100 + ((s * 3) % 800))}.${String(100 + ((s * 7) % 800))}-0${s % 10}`,
      benefits: ['Plano de Saúde', 'Plano Odontológico'],
      status: 'Ativo'
    }
  ];

  if (s % 4 === 0) {
    dependentes.push({
      id: `dep-${emp.id}-2`,
      name: `${['Mariana', 'Rafael', 'Beatriz', 'Thiago'][s % 4]} ${sobrenome}`,
      relationship: 'Cônjuge',
      birthDate: iso(somarAnos(admissao, -32)),
      cpf: `${String(200 + (s % 700))}.${String(200 + ((s * 5) % 700))}.${String(200 + ((s * 9) % 700))}-1${s % 10}`,
      benefits: ['Plano de Saúde'],
      status: 'Ativo'
    });
    dependentes[0].name = `${primeiroNome} Filho`;
  }

  return dependentes;
}

/**
 * Preenche a ficha do colaborador SEM sobrescrever o que o seed já declarou à
 * mão — quem já tem dependentes ou férias definidos mantém os seus.
 *
 * Pré-admitido fica de fora: ainda não há vínculo, então exame periódico,
 * férias e movimentação não existem mesmo. As abas dele mostram o estado vazio,
 * que é a informação correta.
 */
export function comFichaCompleta(emp: Employee, hoje = new Date()): Employee {
  if (emp.situacao === 'PRE_ADMISSAO' || emp.status === 'Pré-admissão') return emp;

  const admissao = new Date(emp.admissionDate);
  if (Number.isNaN(admissao.getTime())) return emp;

  const dependentes = emp.dependents?.length ? emp.dependents : dependentesDe(emp, admissao);
  const movimentos = emp.movements?.length ? emp.movements : movimentacoesDe(emp, admissao, hoje);

  return {
    ...emp,
    dependents: dependentes,
    documents: emp.documents?.length ? emp.documents : documentosDe(emp, admissao, hoje),
    occupationalExams: emp.occupationalExams?.length ? emp.occupationalExams : examesDe(emp, admissao, hoje),
    benefits: emp.benefits?.length ? emp.benefits : beneficiosDe(emp, admissao, dependentes),
    vacationRecords: emp.vacationRecords?.length ? emp.vacationRecords : feriasDe(emp, admissao, hoje),
    movements: movimentos,
    trainings: emp.trainings?.length ? emp.trainings : treinamentosDe(emp, admissao, hoje),
    auditLogs: emp.auditLogs?.length ? emp.auditLogs : auditoriaDe(emp, admissao, movimentos)
  };
}
