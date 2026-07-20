import { Avatar } from './ui/Misc';

interface RequesterCardProps {
  data: {
    avatar?: string;
    name: string;
    registration: string;
    email: string;
    role: string;
    department: string;
    costCenter: string;
    branch: string;
    requestedAt?: string;
  };
}

// Linha horizontal compacta: foto + campos com rótulo acima do valor.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 min-w-0">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{label}</span>
      <p className="text-[13px] font-bold text-gray-900 truncate" title={value}>{value || '—'}</p>
    </div>
  );
}

export default function RequesterCard({ data }: RequesterCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <Avatar src={data.avatar} name={data.name} size="md" className="ring-4 ring-gray-50 rounded-2xl" />
          <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 border-2 border-white w-4 h-4 rounded-full" />
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-3 items-center">
          <Field label="Nome" value={data.name} />
          <Field label="Matrícula" value={data.registration} />
          <Field label="Cargo" value={data.role} />
          <Field label="Setor" value={data.department} />
          <Field label="Centro de custo" value={data.costCenter} />
          <Field label="Filial" value={data.branch} />
        </div>
      </div>
    </div>
  );
}
