import { AccessProfile, ProcessPermission } from '../../types';

// O que a LISTA e o EDITOR de perfis compartilham.
//
// A edição virou tela própria (`AdminPerfilEditor`); estas peças ficam aqui
// para as duas telas não manterem cópias que divergem — foi assim que a
// matrícula e o contador da Intranet já erraram antes.

/** Rota da lista de perfis. */
export const ROTA_PERFIS = 'admin-perfis';

/** Rota da tela de edição — `utils/rotas` a mapeia para o item Central Adm. */
export const ROTA_PERFIL_EDITAR = 'admin-perfis-editar';

export const permissaoVazia = (): ProcessPermission => ({
  ver: false, solicitar: false, executar: false, aprovar: false,
  devolver: false, cancelar: false, reabrir: false, verHistorico: false, verSigiloso: false
});

/** Perfil em branco: nasce com o mínimo que todo mundo alcança. */
export const perfilNovo = (): AccessProfile => ({
  id: `perf-${Date.now()}`,
  nome: '',
  descricao: '',
  escopo: 'proprio',
  ativo: true,
  telas: ['intranet', 'requests'],
  permissoes: {},
  acoesDeTela: {},
  dadosSensiveis: {
    visualizarSalario: false, editarSalario: false, visualizarCPF: false,
    visualizarDocumentosPessoais: false, visualizarDadosBancarios: false, visualizarASO: false,
    visualizarMedidaDisciplinar: false, visualizarDesligamento: false, visualizarJuridico: false,
    visualizarAuditoria: false
  }
});
