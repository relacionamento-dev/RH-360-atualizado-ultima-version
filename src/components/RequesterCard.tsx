import { Avatar } from './ui/Misc';
import { ReadOnlyField } from './ui/ReadOnlyField';

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

// Linha horizontal compacta: foto + campos com rótulo acima do valor. Nenhum
// deles é digitado — vêm da ficha de quem abriu —, então todos usam a caixa
// cinza de leitura (ui/ReadOnlyField).
export default function RequesterCard({ data }: RequesterCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <Avatar src={data.avatar} name={data.name} size="md" className="ring-4 ring-gray-50 rounded-2xl" />
          <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 border-2 border-white w-4 h-4 rounded-full" />
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-3 items-start">
          <ReadOnlyField size="sm" label="Nome" value={data.name} />
          <ReadOnlyField size="sm" label="Matrícula" value={data.registration} />
          <ReadOnlyField size="sm" label="Cargo" value={data.role} />
          <ReadOnlyField size="sm" label="Setor" value={data.department} />
          <ReadOnlyField size="sm" label="Centro de custo" value={data.costCenter} />
          <ReadOnlyField size="sm" label="Filial" value={data.branch} />
        </div>
      </div>
    </div>
  );
}
