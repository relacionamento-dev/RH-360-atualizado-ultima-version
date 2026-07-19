import { ProcessDefinition, TargetMode } from './types';

const ROLES = ['Analista de RH', 'Desenvolvedor', 'Gerente Comercial', 'Analista Financeiro', 'Coordenador Operacional'];

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
              { label: 'Transformação de Cargo', value: 'transformacao' }
            ], 
            required: true, 
            section: 'Dados da Vaga' 
          },
          { name: 'empresa', label: 'Empresa Contratante', type: 'select', origin: 'C', options: ['RH360 Holding', 'RH360 Filial SP', 'RH360 Filial RJ'], required: true, section: 'Dados da Vaga' },
          { name: 'filial', label: 'Unidade / Filial', type: 'select', origin: 'C', options: ['Matriz', 'Centro de Distribuição', 'Escritório'], required: true, section: 'Dados da Vaga' },
          
          { name: 'setor', label: 'Departamento / Setor', type: 'select', origin: 'C', options: ['TI', 'RH', 'Financeiro', 'Vendas', 'Operações'], required: true, section: 'Dados da Vaga', condition: (data: any) => data.tipoRequisicao === 'aumento_quadro' },
          { name: 'centroCusto', label: 'Centro de Custo', type: 'select', origin: 'C', options: ['1010 - ADM', '2020 - TI', '3030 - COM'], required: true, section: 'Dados da Vaga', condition: (data: any) => data.tipoRequisicao === 'aumento_quadro' },
          { name: 'cargo', label: 'Cargo Pretendido', type: 'select', origin: 'C', options: ROLES, required: true, section: 'Dados da Vaga', condition: (data: any) => data.tipoRequisicao === 'aumento_quadro' },
          
          { name: 'quantidadeVagas', label: 'Quantidade de Vagas', type: 'number', origin: 'C', defaultValue: 1, required: true, section: 'Dados da Vaga' },
          { name: 'dataDesejada', label: 'Previsão de Início', type: 'date', origin: 'C', required: true, section: 'Dados da Vaga' },
          
          { name: 'colaboradorSubstituido', label: 'Colaborador a Substituir', type: 'zoom', origin: 'C', condition: (data: any) => data.tipoRequisicao === 'reposicao', required: true, section: 'Dados da Reposição', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'setorRep', id: 'setor', label: 'Setor da Vaga', type: 'text', origin: 'F', condition: (data: any) => data.tipoRequisicao === 'reposicao', section: 'Dados da Reposição' },
          { name: 'ccRep', id: 'centroCusto', label: 'Centro de Custo', type: 'text', origin: 'F', condition: (data: any) => data.tipoRequisicao === 'reposicao', section: 'Dados da Reposição' },
          { name: 'cargoRep', id: 'cargo', label: 'Cargo da Vaga', type: 'text', origin: 'F', condition: (data: any) => data.tipoRequisicao === 'reposicao', section: 'Dados da Reposição' },

          { name: 'colaboradorTransformacao', label: 'Colaborador Impactado', type: 'zoom', origin: 'C', condition: (data: any) => data.tipoRequisicao === 'transformacao', required: true, section: 'Dados da Transformação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'cargoAtual', label: 'Cargo Atual', type: 'text', origin: 'F', condition: (data: any) => data.tipoRequisicao === 'transformacao', section: 'Dados da Transformação' },
          { name: 'cargoNovo', id: 'cargo', label: 'Novo Cargo Proposto', type: 'select', origin: 'C', options: ROLES, condition: (data: any) => data.tipoRequisicao === 'transformacao', section: 'Dados da Transformação', required: true },
          { name: 'ccAtual', label: 'Centro de Custo Atual', type: 'text', origin: 'F', condition: (data: any) => data.tipoRequisicao === 'transformacao', section: 'Dados da Transformação' },
          { name: 'ccNovo', id: 'centroCusto', label: 'Novo Centro de Custo', type: 'select', origin: 'C', options: ['1010 - ADM', '2020 - TI', '3030 - COM'], condition: (data: any) => data.tipoRequisicao === 'transformacao', section: 'Dados da Transformação', required: true },

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
          { name: 'tipoContrato', label: 'Regime Jurídico', type: 'select', origin: 'C', options: ['CLT', 'PJ', 'Estágio', 'Temporário'], required: true, section: 'Condições Contratuais' },
          { name: 'statusDocs', label: 'Validação de Documentos', type: 'select', origin: 'C', options: ['Pendente', 'Conferido'], required: true, section: 'Status da Admissão' },
          { name: 'statusASO', label: 'Exame Admissional (ASO)', type: 'select', origin: 'C', options: ['Pendente', 'Apto', 'Inapto'], required: true, section: 'Status da Admissão' },
          { name: 'anexo', label: 'Contrato Assinado / Proposta', type: 'file', origin: 'C', section: 'Status da Admissão' }
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
  '5': {
    processId: '5',
    targetMode: TargetMode.CURRENT_USER,
    steps: [
      {
        name: 'Conferência de VR/VA',
        fields: [
          { name: 'competencia', label: 'Mês de Referência', type: 'select', origin: 'C', options: ['Janeiro/2026', 'Fevereiro/2026', 'Março/2026'], required: true, section: 'Dados do Benefício' },
          { name: 'beneficio', label: 'Tipo de Cartão/Benefício', type: 'select', origin: 'C', options: ['Vale Refeição', 'Vale Alimentação'], required: true, section: 'Dados do Benefício' },
          { name: 'valorQuantidade', label: 'Valor Creditado (R$)', type: 'currency', origin: 'C', required: true, section: 'Dados do Benefício' },
          { name: 'dataRecebimento', label: 'Data do Crédito', type: 'date', origin: 'C', required: true, section: 'Dados do Benefício' },
          { name: 'situacao', label: 'Status do Recebimento', type: 'select', origin: 'C', options: ['Confirmado', 'Divergente - Valor Menor', 'Divergente - Não Recebi'], required: true, section: 'Validação' },
          { name: 'observacao', label: 'Justificativa / Comentário', type: 'textarea', origin: 'C', gridCols: 3, section: 'Validação' },
          { name: 'anexo', label: 'Comprovante de Saldo (Opcional)', type: 'file', origin: 'C', section: 'Validação' }
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
          { name: 'periodoAquisitivo', label: 'Período Aquisitivo Disponível', type: 'select', origin: 'C', options: ['2024/2025 (30 dias)', '2023/2024 (15 dias)'], required: true, section: 'Saldo de Férias' },
          { name: 'dataInicio', label: 'Data de Início do Gozo', type: 'date', origin: 'C', required: true, section: 'Programação' },
          { name: 'diasGozo', label: 'Quantidade de Dias', type: 'number', origin: 'C', defaultValue: 30, required: true, section: 'Programação' },
          { name: 'abonoPecuniario', label: 'Vender 10 dias (Abono)?', type: 'boolean', origin: 'C', section: 'Programação' },
          { name: 'adianta13', label: 'Adiantar 1ª Parcela 13º?', type: 'boolean', origin: 'C', section: 'Programação' },
          { name: 'dataRetorno', label: 'Data Prevista de Retorno', type: 'date', origin: 'F', section: 'Programação' },
          { name: 'justificativa', label: 'Justificativa (Se aplicável)', type: 'textarea', origin: 'C', gridCols: 3, section: 'Programação' }
        ]
      }
    ]
  },
  '10': {
    processId: '10',
    targetMode: TargetMode.EMPLOYEE_ZOOM,
    steps: [
      {
        name: 'Aviso de Desligamento',
        fields: [
          { name: 'colaboradorId', label: 'Colaborador', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'cargo', label: 'Cargo', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'gestor', label: 'Gestor Direto', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'dataAdmissao', label: 'Data de Admissão', type: 'text', origin: 'F', section: 'Situação Atual' },
          
          { name: 'tipoDesligamento', label: 'Motivo do Desligamento', type: 'select', origin: 'C', options: ['Pedido de Demissão', 'Sem Justa Causa', 'Com Justa Causa', 'Término de Contrato'], required: true, section: 'Dados da Rescisão' },
          { name: 'avisoPrevio', label: 'Tipo de Aviso Prévio', type: 'select', origin: 'C', options: ['Trabalhado', 'Indenizado', 'Dispensado'], required: true, section: 'Dados da Rescisão' },
          { name: 'ultimoDia', label: 'Último Dia Trabalhado', type: 'date', origin: 'C', required: true, section: 'Dados da Rescisão' },
          { name: 'justificativa', label: 'Parecer do Gestor / Justificativa', type: 'textarea', origin: 'C', required: true, gridCols: 3, section: 'Dados da Rescisão' },
          { name: 'substituto', label: 'Necessário Substituição?', type: 'boolean', origin: 'C', section: 'Planejamento' },
          { name: 'anexo', label: 'Carta de Demissão / Documento', type: 'file', origin: 'C', section: 'Dados da Rescisão' }
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
          { name: 'colaboradorId', label: 'Colaborador', type: 'zoom', origin: 'C', required: true, section: 'Identificação', zoomConfig: { entity: 'employee', fields: ['name', 'registration'] } },
          { name: 'cargo', label: 'Cargo', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'setor', label: 'Setor', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'centroCusto', label: 'Centro de Custo', type: 'text', origin: 'F', section: 'Situação Atual' },
          { name: 'admissao', label: 'Data de Admissão', type: 'date', origin: 'F', section: 'Situação Atual' },
          { name: 'tipoDesligamento', label: 'Motivo Principal', type: 'select', origin: 'C', options: ['Novo Desafio', 'Salário', 'Mudança de Cidade', 'Fim de Contrato', 'Desempenho'], required: true, section: 'Rescisão' },
          { name: 'tipoAviso', label: 'Cumprimento de Aviso', type: 'select', origin: 'C', options: ['Trabalhado', 'Indenizado', 'Dispensado'], required: true, section: 'Rescisão' },
          { name: 'ultimoDia', label: 'Último Dia de Trabalho', type: 'date', origin: 'C', required: true, section: 'Rescisão' },
          { name: 'reposicao', label: 'Necessário Reposição?', type: 'boolean', origin: 'C', section: 'Planejamento' },
          { name: 'observacao', label: 'Observações / Parecer', type: 'textarea', origin: 'C', gridCols: 3, section: 'Rescisão' },
          { name: 'anexo', label: 'Documentação de Suporte', type: 'file', origin: 'C', section: 'Rescisão' }
        ]
      }
    ]
  }
};
