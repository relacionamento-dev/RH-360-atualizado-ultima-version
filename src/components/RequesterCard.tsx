import React from 'react';
import { Mail, Landmark, Building2, MapPin, Clock } from 'lucide-react';
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

export default function RequesterCard({ data }: RequesterCardProps) {
  const formattedDate = data.requestedAt 
    ? new Date(data.requestedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="relative shrink-0">
          <Avatar src={data.avatar} name={data.name} size="lg" className="ring-4 ring-gray-50 rounded-2xl" />
          <div className="absolute -bottom-2 -right-2 bg-green-500 border-2 border-white w-5 h-5 rounded-full" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{data.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Matrícula {data.registration}</span>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] font-bold text-gray-400 lowercase tracking-wide">{data.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock size={12} className="text-orange-500" />
              <span>Aberto em {formattedDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-50">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Cargo</span>
              <p className="text-[12px] font-bold text-gray-700">{data.role}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Setor</span>
              <p className="text-[12px] font-bold text-gray-700">{data.department}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Centro de Custo</span>
              <p className="text-[12px] font-bold text-gray-700">{data.costCenter}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Filial</span>
              <p className="text-[12px] font-bold text-gray-700">{data.branch}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
