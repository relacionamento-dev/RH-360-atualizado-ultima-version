import { ProcessDefinition, TargetMode } from './types';

const ROLES = ['Analista de RH', 'Desenvolvedor', 'Gerente Comercial', 'Analista Financeiro', 'Coordenador Operacional'];

// Requisição de Vaga: o tipo escolhido define quais seções aparecem.
// Reposição e Substituição compartilham a mesma seção ("Dados da Reposição").
const isAumentoQuadro = (data: any) => data.tipoRequisicao === 'aumento_quadro';
const isReposicao = (data: any) => data.tipoRequisicao === 'reposicao' || data.tipoRequisicao === 'substituicao';
const isTransformacao = (data: any) => data.tipoRequisicao === 'transformacao';

// Desligamento: campos e anexos obrigatórios mudam conforme o tipo.
const isPedidoDemissao = (data: any) => data.tipoDesligamento === 'pedido_demissao';
const isSemJustaCausa = (data: any) => data.tipoDesligamento === 'sem_justa_causa';
const isJustaCausa = (data: any) => data.tipoDesligamento === 'justa_causa';
const isFimContrato = (data: any) => data.tipoDesligamento === 'fim_contrato';
const isAcordo = (data: any) => data.tipoDesligamento === 'acordo';
const hasTipo = (data: any) => !!data.tipoDesligamento;
// Pedido, Sem Justa Causa e Acordo têm aviso prévio; Justa Causa e Fim de Contrato não.
const hasAvisoPrevio = (data: any) => ['pedido_demissao', 'sem_justa_causa', 'acordo'].includes(data.tipoDesligamento);
const hasColaboradorAlvo = (data: any) => !!data.colaboradorId;

export const PROCESS_DEFINITIONS: Record<string, ProcessDefinition> = {
  '1': {
    processId: '1',
    targetMode: TargetMode.OBJECT,
    steps: [
      {
        name: 'Requisição de Vaga',
        fields: [
          { 
            name: 'tipoRequisicao', 
            label: 'Tipo da Requisição', 
            type: 'select', 
            origin: 'C', 
            options: [
              { label: 'Aumento de Quadro', value: 'aumento_quadro' },
              { label: 'Reposição de Vaga', value: 'reposicao' },
              { label: 'Substituição', value: 'substituicao' },
              { label: 'Transformação de Cargo', value: 'transformacao' }
            ], 
            required: true, 
            section: 'Dados da Vaga' 
          },
          { name: 'empresa', label: 'Empresa Contratante', type: 'select', origin: 'C', options: ['RH360 Holding', 'RH360 Filial SP', 'RH360 Filial RJ'], required: true, section: 'Dados da Vaga' },
          { name: 'filial', label: 'Unidade / Filial', type: 'select', origin: 'C', options: ['Matriz', 'Centro de Distribuição', 'Escritório'], required: true, section: 'Dados da Vaga' },
          
          { name: 'setor', label: 'Departamento / Setor', type: 'select', origin: 'C', options: ['TI', 'RH', 'Financeiro', 'Vendas', 'Operações'], required: true, section: 'Dados da Vaga', condition: isAumentoQuadro },
          { name: 'centroCusto', label: 'Centro de Custo', type: 'select', origin: 'C', options: ['1010 - ADM', '2020 - TI', '3030 - COM'], required: true, section: 'Dados da Vaga', condition: isAumentoQuadro },
          { name: 'cargo', label: 'Cargo Pretendido', type: 'select', origin: 'C', options: ROLES, required: true, section: 'Dados da Vaga', condition: isAumentoQuadro },
          
          { name: 'quantidadeVagas', label: 'Quantidade de Vagas', type: 'number', origin: 'C', defaultValue: 1, required: true, section: 'Dados da Vaga' },
          { name: 'dataDesejada', label: 'Previsão de Início', type: 'date', origin: 'C', required: true, section: 'Dados da Vaga' },
          
          { name: 'colaboradorSubstituido', label: 'Colaborador a Substituir', type: 'zoom', origin: 'C', condition: isReposicao, required: true, section: 'Dados da Reposição', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'setorRep', id: 'setor', label: 'Setor da Vaga', type: 'text', origin: 'F', condition: isReposicao, section: 'Dados da Reposição' },
          { name: 'ccRep', id: 'centroCusto', label: 'Centro de Custo', type: 'text', origin: 'F', condition: isReposicao, section: 'Dados da Reposição' },
          { name: 'cargoRep', id: 'cargo', label: 'Cargo da Vaga', type: 'text', origin: 'F', condition: isReposicao, section: 'Dados da Reposição' },

          { name: 'colaboradorTransformacao', label: 'Colaborador Impactado', type: 'zoom', origin: 'C', condition: isTransformacao, required: true, section: 'Dados da Transformação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'cargoAtual', label: 'Cargo Atual', type: 'text', origin: 'F', condition: isTransformacao, section: 'Dados da Transformação' },
          { name: 'cargoNovo', id: 'cargo', label: 'Novo Cargo Proposto', type: 'select', origin: 'C', options: ROLES, condition: isTransformacao, section: 'Dados da Transformação', required: true },
          { name: 'ccAtual', label: 'Centro de Custo Atual', type: 'text', origin: 'F', condition: isTransformacao, section: 'Dados da Transformação' },
          { name: 'ccNovo', id: 'centroCusto', label: 'Novo Centro de Custo', type: 'select', origin: 'C', options: ['1010 - ADM', '2020 - TI', '3030 - COM'], condition: isTransformacao, section: 'Dados da Transformação', required: true },

          { name: 'tipoContrato', label: 'Regime de Contratação', type: 'select', origin: 'C', options: ['CLT', 'PJ', 'Temporário', 'Estágio'], required: true, section: 'Condições da Contratação' },
          { name: 'modalidade', label: 'Modalidade de Trabalho', type: 'select', origin: 'C', options: ['Presencial', 'Híbrido', 'Remoto'], required: true, section: 'Condições da Contratação' },
          { name: 'salarioSugerido', label: 'Remuneração Sugerida', type: 'currency', origin: 'C', required: false, section: 'Condições da Contratação' },
          { name: 'prioridade', label: 'Nível de Prioridade', type: 'select', origin: 'C', options: ['Baixa', 'Média', 'Alta', 'Urgente'], required: true, section: 'Condições da Contratação' },
          { name: 'anexo', label: 'Perfil da Vaga / JD', type: 'file', origin: 'C', required: false, section: 'Condições da Contratação' },

          { name: 'justificativa', label: 'Justificativa da Requisição', type: 'textarea', origin: 'C', required: true, section: 'Justificativa', gridCols: 3 }
        ]
      }
    ]
  },
  '2': {
    processId: '2',
    targetMode: TargetMode.OBJECT,
    steps: [
      {
        name: 'Recrutamento e Seleção',
        fields: [
          { name: 'vagaId', label: 'Requisição de Vaga Vinculada', type: 'zoom', origin: 'C', required: true, section: 'Dados da Vaga', zoomConfig: { entity: 'approved-vacancy', fields: ['code', 'title', 'company', 'branch', 'department', 'quantity', 'costCenter'] } },
          { name: 'cargo', label: 'Cargo da Vaga', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          { name: 'empresa', label: 'Empresa', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          { name: 'filial', label: 'Filial', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          { name: 'setor', label: 'Setor', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          { name: 'centroCusto', label: 'Centro de Custo', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          
          { name: 'nomeCandidato', label: 'Nome Completo do Candidato', type: 'text', origin: 'C', required: true, section: 'Identificação do Candidato' },
          { name: 'email', label: 'E-mail de Contato', type: 'text', origin: 'C', section: 'Identificação do Candidato' },
          { name: 'telefone', label: 'Telefone Celular', type: 'text', origin: 'C', section: 'Identificação do Candidato' },
          { 
            name: 'origem', 
            label: 'Canal de Origem', 
            type: 'select', 
            origin: 'C', 
            section: 'Identificação do Candidato',
            options: [
              { label: 'LinkedIn', value: 'LinkedIn' },
              { label: 'Indicação Interna', value: 'Indicação' },
              { label: 'Portal Gupy', value: 'Gupy' },
              { label: 'Trabalhe Conosco', value: 'Site' }
            ] 
          },
          { name: 'nota_informativa', label: 'Informação: Em produção, estes dados são preenchidos pelo próprio candidato no portal público.', type: 'info', section: 'Identificação do Candidato' },
          
          { name: 'etapa', label: 'Etapa do Processo Seletivo', type: 'select', origin: 'C', options: ['Triagem', 'Entrevista RH', 'Entrevista Gestor', 'Teste Técnico'], required: true, section: 'Avaliação Técnica' },
          { name: 'nota', label: 'Avaliação (0-10)', type: 'number', origin: 'C', section: 'Avaliação Técnica' },
          { name: 'parecer', label: 'Parecer do Entrevistador', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Avaliação Técnica' },
          { name: 'decisao', label: 'Decisão Final', type: 'select', origin: 'C', options: ['Aprovado', 'Reprovado', 'Em Análise'], required: true, section: 'Avaliação Técnica' },
          { name: 'curriculo', label: 'Currículo Anexo', type: 'file', origin: 'F', section: 'Avaliação Técnica' }
        ]
      }
    ]
  },
  '3': {
    processId: '3',
    targetMode: TargetMode.OBJECT,
    steps: [
      {
        name: 'Contratação e Admissão',
        fields: [
          { name: 'vagaId', label: 'Vaga Autorizada', type: 'zoom', origin: 'C', required: true, section: 'Dados da Vaga', zoomConfig: { entity: 'approved-vacancy', fields: ['code', 'title', 'company', 'branch', 'department'] } },
          { name: 'cargo', label: 'Cargo', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          { name: 'empresa', label: 'Empresa', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          { name: 'filial', label: 'Filial', type: 'text', origin: 'F', section: 'Dados da Vaga' },
          
          { name: 'nomeCandidato', label: 'Nome do Futuro Colaborador', type: 'text', origin: 'C', required: true, section: 'Dados do Colaborador' },
          { name: 'email', label: 'E-mail Pessoal', type: 'text', origin: 'C', section: 'Dados do Colaborador' },
          { name: 'telefone', label: 'Telefone Celular', type: 'text', origin: 'C', section: 'Dados do Colaborador' },
          { name: 'nota_informativa', label: 'Informação: Dados cadastrais completos são preenchidos pelo colaborador no Portal de Admissão.', type: 'info', section: 'Dados do Colaborador' },
          
          { name: 'salario', label: 'Salário Nominal (R$)', type: 'currency', origin: 'C', required: true, section: 'Condições Contratuais' },
          { name: 'dataAdmissao', label: 'Data Prevista de Início', type: 'date', origin: 'C', required: true, section: 'Condições Contratuais' },
          { name: 'tipoContrato', label: 'Regime Jurídico', type: 'select', origin: 'C', options: ['CLT', 'PJ', 'Estágio', 'Temporário'], required: true, section: 'Condições Contratuais' }
          // A seção "Status da Admissão" (validação de documentos, ASO e upload
          // manual do contrato) saiu: documentação vem do Portal do Colaborador e
          // é tratada na tela de Revisão da Admissão Digital.
        ]
      }
    ]
  },
  '4': {
    processId: '4',
    targetMode: TargetMode.OBJECT,
    steps: [
      {
        name: 'Onboarding',
        fields: [
          { name: 'colaboradorId', label: 'Colaborador Selecionado', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee-admitted', fields: ['name', 'registration', 'role'] } },
          { name: 'cargo', label: 'Cargo', type: 'text', origin: 'F', section: 'Identificação' },
          { name: 'gestor', label: 'Gestor Direto', type: 'text', origin: 'F', section: 'Identificação' },
          { name: 'empresaFilial', label: 'Unidade de Lotação', type: 'text', origin: 'F', section: 'Identificação' },
          { name: 'dataAdmissao', label: 'Data de Admissão', type: 'date', origin: 'F', section: 'Identificação' },
          
          { name: 'template', label: 'Trilha de Integração', type: 'select', origin: 'C', options: ['Padrão Administrativo', 'Técnico TI', 'Operacional', 'Liderança'], required: true, section: 'Configuração do Onboarding' },
          { name: 'dataInicial', label: 'Início da Integração', type: 'date', origin: 'C', required: true, section: 'Configuração do Onboarding' },
          { name: 'prazo', label: 'Ciclo de Acompanhamento (Dias)', type: 'number', origin: 'C', defaultValue: 30, required: true, section: 'Configuração do Onboarding' },
          { name: 'observacao', label: 'Instruções Adicionais', type: 'textarea', origin: 'C', gridCols: 3, section: 'Configuração do Onboarding' }
        ]
      }
    ]
  },
  // Protocolo de recebimento: quem credita é o RH. O colaborador não informa
  // valor nem status — apenas confere os dados do crédito (origin 'F', somente
  // leitura) e assina o aceite. Por isso o processo não tem aprovação: ao
  // assinar, já nasce como "Recebimento Confirmado".
  '5': {
    processId: '5',
    targetMode: TargetMode.CURRENT_USER,
    acknowledgement: {
      status: 'Recebimento Confirmado',
      etapa: 'Recebimento Confirmado',
      trail: ['Crédito Lançado', 'Confirmação do Colaborador', 'Recebimento Registrado'],
      comment: 'Recebimento confirmado e assinado pelo colaborador.'
    },
    steps: [
      {
        name: 'Confirmação de Recebimento de VR/VA',
        fields: [
          { name: 'competencia', label: 'Mês de Referência', type: 'text', origin: 'F', section: 'Dados do Benefício' },
          { name: 'beneficio', label: 'Tipo de Benefício', type: 'text', origin: 'F', section: 'Dados do Benefício' },
          { name: 'valorCreditado', label: 'Valor Creditado (R$)', type: 'currency', origin: 'F', section: 'Dados do Benefício' },
          { name: 'dataCredito', label: 'Data do Crédito', type: 'date', origin: 'F', section: 'Dados do Benefício' },
          { name: 'nota_credito', label: 'Informação: valores lançados pelo RH. Em caso de divergência, confirme apenas se realmente recebeu e descreva o ocorrido no campo de observação.', type: 'info', section: 'Dados do Benefício' },

          { name: 'declaracao', label: 'Confirmo que recebi o benefício acima referente ao mês indicado.', type: 'info', highlight: true, section: 'Confirmação de Recebimento' },
          { name: 'confirmacaoRecebimento', label: 'Confirmo o recebimento do benefício nas condições acima.', type: 'checkbox', origin: 'C', required: true, section: 'Confirmação de Recebimento' },
          { name: 'assinatura', label: 'Assinatura do Colaborador', type: 'signature', origin: 'C', required: true, section: 'Confirmação de Recebimento' },
          { name: 'observacao', label: 'Observação (opcional)', type: 'textarea', origin: 'C', gridCols: 3, placeholder: 'Use este campo caso queira relatar alguma divergência no crédito.', section: 'Confirmação de Recebimento' },
          { name: 'anexo', label: 'Comprovante de Saldo (Opcional)', type: 'file', origin: 'C', section: 'Confirmação de Recebimento' }
        ]
      }
    ]
  },
  '6': {
    processId: '6',
    targetMode: TargetMode.CURRENT_USER,
    steps: [
      {
        name: 'Gestão de Dependentes',
        fields: [
          { name: 'operacao', label: 'Tipo de Movimentação', type: 'select', origin: 'C', options: ['Inclusão', 'Alteração', 'Exclusão'], required: true, section: 'Dados da Operação' },
          { name: 'nomeDependente', label: 'Nome Completo do Dependente', type: 'text', origin: 'C', required: true, section: 'Dados do Dependente', condition: (data: any) => data.operacao === 'Inclusão' },
          { name: 'dependenteId', label: 'Dependente Cadastrado', type: 'zoom', origin: 'C', required: true, section: 'Dados do Dependente', condition: (data: any) => data.operacao !== 'Inclusão', zoomConfig: { entity: 'dependent', fields: ['name', 'relationship'] } },
          { name: 'parentesco', label: 'Grau de Parentesco', type: 'select', origin: 'C', options: ['Filho(a)', 'Cônjuge', 'Pai/Mãe', 'Enteado(a)'], required: true, section: 'Dados do Dependente', condition: (data: any) => data.operacao !== 'Exclusão' },
          { name: 'parentesco_fonte', id: 'parentesco', label: 'Parentesco Atual', type: 'text', origin: 'F', section: 'Dados Atuais', condition: (data: any) => data.operacao === 'Alteração' },
          { name: 'cpf', label: 'CPF do Dependente', type: 'text', origin: 'C', required: true, section: 'Dados do Dependente', condition: (data: any) => data.operacao !== 'Exclusão' },
          { name: 'cpf_fonte', id: 'cpf', label: 'CPF Atual', type: 'text', origin: 'F', section: 'Dados Atuais', condition: (data: any) => data.operacao === 'Alteração' },
          { name: 'dataNascimento', label: 'Data de Nascimento', type: 'date', origin: 'C', required: true, section: 'Dados do Dependente', condition: (data: any) => data.operacao !== 'Exclusão' },
          { name: 'dataNascimento_fonte', id: 'dataNascimento', label: 'Data de Nascimento Atual', type: 'text', origin: 'F', section: 'Dados Atuais', condition: (data: any) => data.operacao === 'Alteração' },
          { name: 'beneficioRelacionado', label: 'Vincular a Benefício', type: 'select', origin: 'C', options: ['Plano de Saúde', 'Plano Odontológico', 'Seguro de Vida'], section: 'Dados do Benefício', condition: (data: any) => data.operacao !== 'Exclusão' },
          { name: 'documento', label: 'Documento Comprobatório (RG/Certidão)', type: 'file', origin: 'C', required: true, section: 'Anexos', condition: (data: any) => data.operacao !== 'Exclusão' },
          { name: 'observacao', label: 'Observações Gerais', type: 'textarea', origin: 'C', gridCols: 3, section: 'Anexos' }
        ]
      }
    ]
  },
  '7': {
    processId: '7',
    targetMode: TargetMode.EMPLOYEE_ZOOM,
    steps: [
      {
        name: 'Alteração de Cargos e Salários',
        fields: [
          { name: 'colaboradorId', label: 'Selecionar Colaborador', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'cargoAtual', label: 'Cargo Atual', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'salarioAtual', label: 'Salário Atual', type: 'currency', origin: 'F', section: 'Situação Atual' },
          { name: 'setor', label: 'Setor / Departamento', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'centroCusto', label: 'Centro de Custo', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'gestor', label: 'Gestor Direto', type: 'text', origin: 'F', section: 'Situação Atual' },
          
          { name: 'tipoAlteracao', label: 'Motivo da Alteração', type: 'select', origin: 'C', options: ['Promoção', 'Mérito', 'Enquadramento'], required: true, section: 'Nova Proposta' },
          { name: 'novoCargo', label: 'Novo Cargo Proposto', type: 'select', origin: 'C', options: ROLES, required: true, section: 'Nova Proposta' },
          { name: 'novoSalario', label: 'Novo Salário Nominal', type: 'currency', origin: 'C', required: true, section: 'Nova Proposta' },
          { 
            name: 'percentual', 
            label: 'Percentual de Aumento', 
            type: 'calc', 
            origin: 'K',
            section: 'Nova Proposta',
            calculate: (data: any) => {
              if (data.salarioAtual && data.novoSalario) {
                const p = (((data.novoSalario / data.salarioAtual) - 1) * 100);
                return p.toFixed(2) + '%';
              }
              return '0.00%';
            }
          },
          { name: 'vigencia', label: 'Data de Vigência', type: 'date', origin: 'C', required: true, section: 'Nova Proposta' },
          { name: 'justificativa', label: 'Justificativa da Alteração', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Nova Proposta' },
          { name: 'anexo', label: 'Avaliação de Desempenho / Documento', type: 'file', origin: 'C', section: 'Nova Proposta' }
        ]
      }
    ]
  },
  '8': {
    processId: '8',
    targetMode: TargetMode.CURRENT_USER,
    steps: [
      {
        name: 'Reembolso de Despesas',
        fields: [
          { name: 'competencia', label: 'Mês de Referência', type: 'select', origin: 'C', options: ['Janeiro/2026', 'Fevereiro/2026', 'Março/2026'], required: true, section: 'Dados Gerais' },
          { name: 'tipoDespesa', label: 'Categoria da Despesa', type: 'select', origin: 'C', options: ['Alimentação', 'Transporte', 'Hospedagem', 'KM', 'Pedágio', 'Outros'], required: true, section: 'Dados da Despesa' },
          { name: 'fornecedor', label: 'Estabelecimento / Fornecedor', type: 'text', origin: 'C', required: true, section: 'Dados da Despesa' },
          { name: 'data', label: 'Data do Comprovante', type: 'date', origin: 'C', required: true, section: 'Dados da Despesa' },
          { name: 'valor', label: 'Valor da Despesa (R$)', type: 'currency', origin: 'C', required: true, section: 'Dados da Despesa' },
          { name: 'comprovante', label: 'Anexar Nota Fiscal / Cupom', type: 'file', origin: 'C', required: true, section: 'Dados da Despesa' },
          { name: 'justificativa', label: 'Motivo / Justificativa da Despesa', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Dados da Despesa' }
        ]
      }
    ]
  },
  '9': {
    processId: '9',
    targetMode: TargetMode.CURRENT_USER,
    steps: [
      {
        name: 'Marcação de Férias',
        fields: [
          { name: 'periodoAquisitivo', label: 'Período Aquisitivo', type: 'select', origin: 'C', options: ['2024/2025 (30 dias)', '2023/2024 (15 dias)'], required: true, section: 'Período Aquisitivo e Saldo' },
          { name: 'diasDireito', label: 'Dias de Direito', type: 'calc', origin: 'K', section: 'Período Aquisitivo e Saldo', calculate: (data: any) => {
            if (String(data.periodoAquisitivo).includes('30')) return 30;
            if (String(data.periodoAquisitivo).includes('15')) return 15;
            return '—';
          } },
          // Reflete SOMENTE o histórico já usufruído no período aquisitivo
          // (prefill `diasGozadosHist`), nunca a solicitação em digitação.
          { name: 'diasGozados', label: 'Dias Já Gozados', type: 'calc', origin: 'K', section: 'Período Aquisitivo e Saldo', calculate: (data: any) => Number(data.diasGozadosHist || 0) },
          // Saldo = Dias de Direito − histórico já gozado. Os dias solicitados
          // NÃO entram aqui — são apenas validados contra este saldo.
          { name: 'saldoDisponivel', label: 'Saldo Disponível', type: 'calc', origin: 'K', section: 'Período Aquisitivo e Saldo', calculate: (data: any) => {
            const direito = String(data.periodoAquisitivo).includes('30') ? 30 : String(data.periodoAquisitivo).includes('15') ? 15 : 0;
            return Math.max(0, direito - Number(data.diasGozadosHist || 0));
          } },
          { name: 'ultimaFerias', label: 'Último Período de Férias', type: 'text', origin: 'F', section: 'Período Aquisitivo e Saldo' },

          { name: 'dataInicio', label: 'Data de Início do Período Solicitado', type: 'date', origin: 'C', required: true, section: 'Período Solicitado' },
          { name: 'diasGozo', label: 'Dias Solicitados', type: 'number', origin: 'C', defaultValue: 30, required: true, section: 'Período Solicitado',
            validation: (value: any, data: any) => {
              const dias = Number(value || 0);
              if (dias <= 0) return undefined; // vazio/zero tratado por `required`
              const direito = String(data.periodoAquisitivo).includes('30') ? 30 : String(data.periodoAquisitivo).includes('15') ? 15 : 0;
              const saldo = Math.max(0, direito - Number(data.diasGozadosHist || 0));
              if (dias > saldo) return `Excede o saldo disponível (${saldo} dias).`;
              return undefined;
            } },
          { name: 'abonoPecuniario', label: 'Abono Pecuniário', type: 'boolean', origin: 'C', section: 'Período Solicitado' },
          { name: 'adianta13', label: 'Adiantar 13º', type: 'boolean', origin: 'C', section: 'Período Solicitado' },
          // Retorno = data de início + dias solicitados. A data de início é
          // interpretada como data LOCAL (sem parse ISO como UTC, que subtraía
          // um dia em fusos negativos).
          { name: 'dataRetorno', label: 'Data Prevista de Retorno', type: 'calc', origin: 'K', section: 'Período Solicitado', calculate: (data: any) => {
            const dias = Number(data.diasGozo || 0);
            if (!data.dataInicio || !dias) return '—';
            const str = String(data.dataInicio).trim();
            const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            let year: number, month: number, day: number;
            if (br) { day = Number(br[1]); month = Number(br[2]); year = Number(br[3]); }
            else if (iso) { year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]); }
            else return '—';
            const retorno = new Date(year, month - 1, day);
            if (Number.isNaN(retorno.getTime())) return '—';
            retorno.setDate(retorno.getDate() + dias);
            return retorno.toLocaleDateString('pt-BR');
          } },

          { name: 'justificativa', label: 'Observações', type: 'textarea', origin: 'C', required: false, gridCols: 3, section: 'Observações' }
        ]
      }
    ]
  },
  '10': {
    processId: '10',
    targetMode: TargetMode.EMPLOYEE_ZOOM,
    steps: [
      {
        name: 'Medida Disciplinar',
        fields: [
          { name: 'colaboradorId', label: 'Colaborador', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'cargo', label: 'Cargo', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'gestor', label: 'Gestor Direto', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'dataAdmissao', label: 'Data de Admissão', type: 'date', origin: 'F', section: 'Situação Atual' },

          { name: 'tipoMedida', label: 'Tipo de Medida', type: 'select', origin: 'C', options: ['Advertência Verbal', 'Advertência Escrita', 'Suspensão'], required: true, section: 'Dados da Medida' },
          { name: 'dataOcorrido', label: 'Data do Ocorrido', type: 'date', origin: 'C', required: true, section: 'Dados da Medida' },
          { name: 'motivo', label: 'Motivo', type: 'textarea', origin: 'C', required: true, maxLength: 500, gridCols: 3, section: 'Dados da Medida' },

          { name: 'testemunhas', label: 'Testemunha(s)', type: 'text', origin: 'C', required: false, placeholder: 'Nomes separados por vírgula', section: 'Registro da Ocorrência' },
          { name: 'anexo', label: 'Documento / Registro da Ocorrência', type: 'file', origin: 'C', required: false, section: 'Registro da Ocorrência' }
        ]
      }
    ]
  },
  '11': {
    processId: '11',
    targetMode: TargetMode.EMPLOYEE_ZOOM,
    steps: [
      {
        name: 'Movimentação de Pessoal',
        fields: [
          { name: 'colaboradorId', label: 'Colaborador', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'empresaAtual', label: 'Empresa Atual', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'filialAtual', label: 'Filial Atual', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'setorAtual', label: 'Setor Atual', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'ccAtual', label: 'Centro de Custo Atual', type: 'text', origin: 'F', section: 'Situação Atual' },
          
          { name: 'tipoMovimentacao', label: 'Tipo da Movimentação', type: 'select', origin: 'C', options: ['Transferência entre Filiais', 'Troca de Setor', 'Promoção Vertical'], required: true, section: 'Destino' },
          { name: 'filialDestino', label: 'Nova Filial', type: 'select', origin: 'C', options: ['Matriz', 'CD SP', 'Escritório RJ'], required: true, section: 'Destino' },
          { name: 'setorDestino', label: 'Novo Setor', type: 'select', origin: 'C', options: ['TI', 'RH', 'Comercial', 'Financeiro'], required: true, section: 'Destino' },
          { name: 'ccDestino', label: 'Novo Centro de Custo', type: 'select', origin: 'C', options: ['1010 - ADM', '2020 - TI', '3030 - COM'], required: true, section: 'Destino' },
          { name: 'vigencia', label: 'Data de Vigência', type: 'date', origin: 'C', required: true, section: 'Destino' },
          { name: 'justificativa', label: 'Justificativa da Movimentação', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Destino' }
        ]
      }
    ]
  },
  '12': {
    processId: '12',
    targetMode: TargetMode.CURRENT_USER,
    steps: [
      {
        name: 'Autorização de Horas Extras',
        fields: [
          { name: 'data', label: 'Data da Realização', type: 'date', origin: 'C', required: true, section: 'Período' },
          { name: 'horaInicio', label: 'Horário Inicial', type: 'text', origin: 'C', placeholder: '00:00', required: true, section: 'Período' },
          { name: 'horaFim', label: 'Horário Final', type: 'text', origin: 'C', placeholder: '00:00', required: true, section: 'Período' },
          { name: 'motivo', label: 'Motivo / Justificativa', type: 'select', origin: 'C', options: ['Fechamento Mensal', 'Projeto Urgente', 'Substituição de Faltante'], required: true, section: 'Dados da Atividade' },
          { name: 'destino', label: 'Destinação das Horas', type: 'select', origin: 'C', options: ['Banco de Horas', 'Pagamento 50%', 'Pagamento 100%'], required: true, section: 'Dados da Atividade' },
          { name: 'observacao', label: 'Descrição das Atividades', type: 'textarea', origin: 'C', gridCols: 3, section: 'Dados da Atividade' }
        ]
      }
    ]
  },
  '13': {
    processId: '13',
    targetMode: TargetMode.OBJECT,
    steps: [
      {
        name: 'Gestão de Hierarquia',
        fields: [
          { name: 'colaboradorId', label: 'Colaborador Impactado', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'gestorAtual', label: 'Gestor Direto Atual', type: 'text', origin: 'F', section: 'Estrutura Atual' },
          { name: 'setor', label: 'Setor Atual', type: 'text', origin: 'F', section: 'Estrutura Atual' },
          { name: 'novoGestorId', label: 'Novo Gestor Imediato', type: 'zoom', origin: 'C', required: true, section: 'Nova Estrutura', zoomConfig: { entity: 'manager', fields: ['name', 'registration'] } },
          { name: 'vigencia', label: 'Data da Mudança', type: 'date', origin: 'C', required: true, section: 'Nova Estrutura' },
          { name: 'justificativa', label: 'Motivo da Alteração Hierárquica', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Nova Estrutura' }
        ]
      }
    ]
  },
  '14': {
    processId: '14',
    targetMode: TargetMode.CURRENT_USER,
    steps: [
      {
        name: 'Solicitação de Treinamento',
        fields: [
          { name: 'curso', label: 'Nome do Treinamento / Curso', type: 'text', origin: 'C', required: true, section: 'Dados do Curso' },
          { name: 'instituicao', label: 'Entidade / Instituição', type: 'text', origin: 'C', required: true, section: 'Dados do Curso' },
          { name: 'modalidade', label: 'Modalidade de Ensino', type: 'select', origin: 'C', options: ['EAD', 'Presencial', 'Híbrido', 'In-company'], required: true, section: 'Dados do Curso' },
          { name: 'dataInicial', label: 'Data de Início', type: 'date', origin: 'C', required: true, section: 'Cronograma' },
          { name: 'dataFinal', label: 'Data de Término', type: 'date', origin: 'C', required: true, section: 'Cronograma' },
          { name: 'cargaHoraria', label: 'Carga Horária Total (h)', type: 'number', origin: 'C', required: true, section: 'Cronograma' },
          { name: 'custo', label: 'Investimento Estimado (R$)', type: 'currency', origin: 'C', section: 'Investimento' },
          { name: 'justificativa', label: 'Objetivos e Justificativa', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Investimento' },
          { name: 'anexo', label: 'Folder / Ementa do Curso', type: 'file', origin: 'C', section: 'Investimento' }
        ]
      }
    ]
  },
  '15': {
    processId: '15',
    targetMode: TargetMode.EMPLOYEE_ZOOM,
    steps: [
      {
        name: 'Solicitação de Desligamento',
        fields: [
          // --- Colaborador: campo de busca único ---
          { name: 'colaboradorId', label: 'Chapa do colaborador', type: 'zoom', origin: 'C', required: true, placeholder: 'Digite a chapa ou busque o colaborador', section: 'Colaborador', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },

          // --- Dados carregados automaticamente (origin F, aparecem após seleção).
          //     Empresa e Filial ficam na linha do colaborador (EmployeeZoom), não aqui. ---
          { name: 'cargo', label: 'Cargo', type: 'text', origin: 'F', section: 'Dados carregados automaticamente', condition: hasColaboradorAlvo },
          { name: 'setor', label: 'Setor', type: 'text', origin: 'F', section: 'Dados carregados automaticamente', condition: hasColaboradorAlvo },
          { name: 'centroCusto', label: 'Centro de custo', type: 'text', origin: 'F', section: 'Dados carregados automaticamente', condition: hasColaboradorAlvo },
          { name: 'admissao', label: 'Data de admissão', type: 'date', origin: 'F', section: 'Dados carregados automaticamente', condition: hasColaboradorAlvo },
          { name: 'gestor', label: 'Gestor direto', type: 'text', origin: 'F', section: 'Dados carregados automaticamente', condition: hasColaboradorAlvo },

          // --- Tipo e motivo (motivo condicional ao tipo) ---
          { name: 'tipoDesligamento', label: 'Tipo de desligamento', type: 'select', origin: 'C', required: true, section: 'Dados do Desligamento', options: [
            { label: 'Pedido de Demissão', value: 'pedido_demissao' },
            { label: 'Sem Justa Causa', value: 'sem_justa_causa' },
            { label: 'Justa Causa', value: 'justa_causa' },
            { label: 'Fim de Contrato', value: 'fim_contrato' },
            { label: 'Acordo (art. 484-A)', value: 'acordo' }
          ] },
          { name: 'tipoDesligamentoInfo', label: 'Os campos e anexos obrigatórios são ajustados automaticamente conforme o tipo selecionado.', type: 'info', section: 'Dados do Desligamento' },

          // Pedido de Demissão → motivo opcional
          { name: 'motivoDemissao', id: 'motivo', label: 'Motivo', type: 'textarea', origin: 'C', required: false, maxLength: 500, gridCols: 3, section: 'Dados do Desligamento', condition: isPedidoDemissao },
          // Sem Justa Causa → motivo (select) obrigatório + complementar
          { name: 'motivoSemJusta', id: 'motivo', label: 'Motivo', type: 'select', origin: 'C', required: true, section: 'Dados do Desligamento', options: ['Desempenho', 'Reestruturação', 'Redução de quadro', 'Fim de projeto', 'Outro'], condition: isSemJustaCausa },
          { name: 'motivoComplementar', label: 'Motivo complementar', type: 'textarea', origin: 'C', required: false, maxLength: 500, gridCols: 3, section: 'Dados do Desligamento', condition: isSemJustaCausa },
          // Justa Causa → motivo detalhado obrigatório
          { name: 'motivoJustaCausa', id: 'motivo', label: 'Motivo detalhado', type: 'textarea', origin: 'C', required: true, maxLength: 500, gridCols: 3, section: 'Dados do Desligamento', condition: isJustaCausa },
          // Acordo → motivo obrigatório
          { name: 'motivoAcordo', id: 'motivo', label: 'Motivo', type: 'textarea', origin: 'C', required: true, maxLength: 500, gridCols: 3, section: 'Dados do Desligamento', condition: isAcordo },

          // --- Aviso prévio (varia por tipo) ---
          { name: 'avisoPrevioDemissao', id: 'avisoPrevio', label: 'Aviso prévio', type: 'radio', origin: 'C', required: true, section: 'Aviso Prévio e Datas', options: ['Cumprido', 'Dispensado'], condition: isPedidoDemissao },
          { name: 'avisoPrevioSemJusta', id: 'avisoPrevio', label: 'Aviso prévio', type: 'radio', origin: 'C', required: true, section: 'Aviso Prévio e Datas', options: ['Trabalhado', 'Indenizado', 'Dispensado'], condition: isSemJustaCausa },
          { name: 'avisoPrevioAcordoInfo', label: 'Aviso prévio indenizado pela metade (art. 484-A).', type: 'info', section: 'Aviso Prévio e Datas', condition: isAcordo },

          // --- Datas: três campos com efeitos distintos ---
          { name: 'dataAvisoPrevio', label: 'Data do aviso prévio', type: 'date', origin: 'C', required: true, section: 'Aviso Prévio e Datas', condition: hasAvisoPrevio },
          { name: 'dataTerminoContrato', label: 'Data de término do contrato', type: 'date', origin: 'C', required: true, section: 'Aviso Prévio e Datas', condition: isFimContrato },
          { name: 'ultimoDiaTrabalhado', label: 'Último dia trabalhado', type: 'date', origin: 'C', required: true, section: 'Aviso Prévio e Datas', condition: hasTipo },
          { name: 'dataPrevistaDesligamento', label: 'Data prevista do desligamento', type: 'date', origin: 'C', required: true, section: 'Aviso Prévio e Datas', condition: hasTipo },

          // --- Reposição: obrigatória só em Sem Justa Causa ---
          { name: 'reposicaoObrig', id: 'reposicao', label: 'Necessário reposição?', type: 'radio', origin: 'C', required: true, section: 'Reposição', options: ['Sim', 'Não'], condition: isSemJustaCausa },
          { name: 'reposicaoOpc', id: 'reposicao', label: 'Necessário reposição?', type: 'radio', origin: 'C', required: false, section: 'Reposição', options: ['Sim', 'Não'], condition: (data: any) => hasTipo(data) && !isSemJustaCausa(data) },

          // --- Verbas e observações ---
          { name: 'verbasSemJusta', id: 'verbas', label: 'Verbas e observações', type: 'textarea', origin: 'C', required: false, maxLength: 300, gridCols: 3, section: 'Verbas e Observações', condition: isSemJustaCausa },
          { name: 'verbasAcordo', id: 'verbas', label: 'Verbas reduzidas (art. 484-A)', type: 'textarea', origin: 'C', required: false, maxLength: 300, gridCols: 3, section: 'Verbas e Observações', condition: isAcordo },
          { name: 'observacao', label: 'Observações gerais', type: 'textarea', origin: 'C', required: false, maxLength: 300, gridCols: 3, section: 'Verbas e Observações', condition: hasTipo },

          // --- Exame demissional (ASO): obrigatório na conclusão ---
          { name: 'asoData', label: 'Agendamento do exame demissional (ASO)', type: 'date', origin: 'C', required: false, section: 'Exame Demissional (ASO)', condition: hasTipo },
          { name: 'asoAnexo', label: 'ASO — Exame Demissional (obrigatório na conclusão)', type: 'file', origin: 'C', required: false, section: 'Exame Demissional (ASO)', condition: hasTipo },

          // --- Anexos condicionais ao tipo ---
          { name: 'cartaDemissao', label: 'Carta de demissão', type: 'file', origin: 'C', required: true, section: 'Anexos', condition: isPedidoDemissao },
          { name: 'documentosComprobatorios', label: 'Documentos comprobatórios', type: 'file', origin: 'C', required: true, section: 'Anexos', condition: isJustaCausa },
          { name: 'anexoGeral', label: 'Anexos (opcional)', type: 'file', origin: 'C', required: false, section: 'Anexos', condition: hasTipo }
        ]
      }
    ]
  }
};
