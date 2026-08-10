import React from 'react';
import { Plus, Shield, Power, Trash2, Pencil, Lock } from 'lucide-react';

import { useAppConfig } from '../../contexts/AppConfigContext';
import { useToast } from '../ToastContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/Misc';
import { AccessProfile } from '../../types';
import { ROTULO_DO_ESCOPO } from '../../utils/escopo';
import { ROTA_PERFIL_EDITAR } from './perfilForm';

/**
 * PERFIS DE ACESSO — a matriz que era union type em `types.ts`.
 *
 * Enquanto os seis perfis eram um tipo, criar "Analista de DP com acesso
 * parcial" exigia editar código e recompilar. Aqui cada perfil é um registro:
 * escopo de dados, telas, ações de tela e permissões por processo. Um perfil
 * criado nesta tela aparece no menu, no "Visualizar como" e nos botões sem
 * passar por nenhuma lista escrita à mão.
 */

export default function AdminPerfis() {
  const { config, alternarPerfilAtivo, excluirPerfil, updateConfig } = useAppConfig();
  const { addToast } = useToast();

  const usuariosDoPerfil = (nome: string) => config.usuariosDemo.filter(u => u.profile === nome).length;

  /**
   * A edição é TELA, não diálogo: o formulário (14 telas, 4 ações, dado
   * sensível e 15x7 permissões) não cabe num modal. Abrir é navegar.
   */
  const abrirEditor = (perfilId: string | null) =>
    updateConfig({ activeView: ROTA_PERFIL_EDITAR, perfilEmEdicaoId: perfilId });

  const remover = (perfil: AccessProfile) => {
    const r = excluirPerfil(perfil.id);
    addToast(r.ok ? `Perfil "${perfil.nome}" excluído.` : r.motivo || 'Não foi possível excluir.', r.ok ? 'success' : 'error');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Perfis de Acesso</h2>
          <p className="text-[13px] text-gray-500 font-medium max-w-2xl mt-1">
            Cada perfil define até onde a visão alcança (escopo), quais telas aparecem e o que pode
            ser feito em cada processo. Perfis criados aqui valem imediatamente, sem alteração de código.
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => abrirEditor(null)}>Novo Perfil</Button>
      </div>

      {config.perfis.length === 0 ? (
        <EmptyState icon={<Shield size={40} />} title="Nenhum perfil cadastrado" description="Crie o primeiro perfil de acesso." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.perfis.map(perfil => (
            <Card key={perfil.id} className={`p-5 space-y-4 ${perfil.ativo ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-black text-gray-900 truncate">{perfil.nome}</h3>
                    {perfil.sistema && (
                      <span title="Perfil que acompanha o produto"><Lock size={12} className="text-gray-400" /></span>
                    )}
                    <Badge variant={perfil.ativo ? 'green' : 'gray'} size="sm">
                      {perfil.ativo ? 'ATIVO' : 'INATIVO'}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">{perfil.descricao || '—'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" title="Editar" aria-label={`Editar ${perfil.nome}`} onClick={() => abrirEditor(perfil.id)}>
                    <Pencil size={16} className="text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    title={perfil.ativo ? 'Desativar' : 'Ativar'}
                    aria-label={`${perfil.ativo ? 'Desativar' : 'Ativar'} ${perfil.nome}`}
                    onClick={() => alternarPerfilAtivo(perfil.id)}
                  >
                    <Power size={16} className={perfil.ativo ? 'text-green-600' : 'text-gray-400'} />
                  </Button>
                  {!perfil.sistema && (
                    <Button variant="ghost" size="icon" title="Excluir" aria-label={`Excluir ${perfil.nome}`} onClick={() => remover(perfil)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[10px] bg-gray-50 border border-gray-100 py-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Escopo</p>
                  <p className="text-[12px] font-bold text-gray-700 truncate" title={ROTULO_DO_ESCOPO[perfil.escopo]}>
                    {perfil.escopo}
                  </p>
                </div>
                <div className="rounded-[10px] bg-gray-50 border border-gray-100 py-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Telas</p>
                  <p className="text-[12px] font-bold text-gray-700 tabular-nums">{perfil.telas.length}</p>
                </div>
                <div className="rounded-[10px] bg-gray-50 border border-gray-100 py-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Usuários</p>
                  <p className="text-[12px] font-bold text-gray-700 tabular-nums">{usuariosDoPerfil(perfil.nome)}</p>
                </div>
              </div>

              {perfil.dadosSensiveis.visualizarSalario && (
                <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-[8px] px-3 py-2">
                  Vê remuneração e faixa salarial
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
