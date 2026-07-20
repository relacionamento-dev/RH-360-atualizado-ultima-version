import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, CreditCard, CheckCircle2, AlertTriangle, 
  FileSignature, ListFilter, Download, Clock
} from 'lucide-react';
import { RHProcess, RHRequest } from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';

export default function BenefitReceiptManager({ process, onNewRequest }: { process: RHProcess, onNewRequest: () => void }) {
  const { config, updateConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [loteFilter, setLoteFilter] = useState('all');

  const receipts = config.solicitacoes.filter(r => r.processId === process.id);
  
  const filtered = receipts.filter(r => 
    r.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.alvo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    lotes: 4,
    aguardando: 124,
    confirmado: 856,
    divergente: 12,
    assinatura: 45
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestão de VR / VA</h2>
           <p className="text-gray-500 font-medium text-[14px]">Controle mensal de recebimento e confirmação de benefícios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download size={18} />}>
            Exportar Lote
          </Button>
          <Button leftIcon={<Plus size={18} />} onClick={onNewRequest}>
            Novo Lote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Competência</p>
          <p className="text-xl font-black text-blue-600 uppercase">JULHO/2026</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-green-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmados</p>
          <p className="text-2xl font-black text-green-600">{stats.confirmado}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando</p>
          <p className="text-2xl font-black text-amber-600">{stats.aguardando}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Divergentes</p>
          <p className="text-2xl font-black text-red-600">{stats.divergente}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-purple-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assinaturas</p>
          <p className="text-2xl font-black text-purple-600">{stats.assinatura}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar colaborador ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="flex gap-2">
            <Select
              ariaLabel="Filtrar por lote"
              className="min-w-[150px]"
              value={loteFilter}
              onChange={setLoteFilter}
              options={[
                { value: 'all', label: 'Lote: Todos' },
                { value: '001/26', label: 'Lote 001/26' },
                { value: '002/26', label: 'Lote 002/26' },
              ]}
            />
          </div>
        </div>

        <Table 
          columns={[
            { header: 'COLABORADOR', accessor: 'alvo', render: (val) => <span className="font-bold text-[14px] text-gray-900">{val}</span> },
            { header: 'EMPRESA / FILIAL', accessor: 'empresa', render: (val, row) => (
              <div>
                <p className="text-[12px] font-bold text-gray-600">{val}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{row.filial}</p>
              </div>
            )},
            { header: 'VALOR VR', accessor: 'id', render: () => <span className="text-[13px] font-bold text-gray-700">R$ 840,00</span> },
            { header: 'VALOR VA', accessor: 'id', render: () => <span className="text-[13px] font-bold text-gray-700">R$ 450,00</span> },
            { header: 'CONFIRMAÇÃO', accessor: 'status', render: (val) => {
              if (val === 'Concluída') return <Badge variant="green">CONFIRMADO</Badge>;
              if (val === 'Devolvida') return <Badge variant="red">DIVERGENTE</Badge>;
              return <Badge variant="amber">PENDENTE</Badge>;
            }},
            { header: 'DOCUMENTO', accessor: 'id', render: (id, row) => (
              <div className="flex items-center gap-2">
                {row.status === 'Concluída' ? <FileSignature size={16} className="text-green-500" /> : <Clock size={16} className="text-gray-300" />}
                <span className="text-[11px] font-bold text-gray-400 uppercase">{row.status === 'Concluída' ? 'Assinado' : 'Aguardando'}</span>
              </div>
            )},
            { header: '', accessor: 'id', render: (id) => (
              <Button variant="ghost" size="icon" title="Ver recibo" aria-label="Ver recibo" onClick={() => updateConfig({ currentRequestId: id })}>
                <Eye className="w-5 h-5 text-gray-500 hover:text-orange-500" />
              </Button>
            )}
          ]}
          data={filtered}
        />
      </Card>
    </div>
  );
}
