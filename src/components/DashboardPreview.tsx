import { Users, DollarSign, FileText, PieChart, Phone, Mail, FileCheck, ChevronDown, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardPreview() {
  return (
    <div className="w-full max-w-[800px] bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 p-6 pointer-events-none select-none">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Visão geral da operação</h3>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600">
          Este mês <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<Users className="w-5 h-5 text-orange-500" />} 
          iconBg="bg-orange-50"
          title="Headcount Ativo" 
          value="184" 
          subValue="+3 no mês" 
          subLabel="Total colaboradores" 
        />
        <StatCard 
          icon={<FileText className="w-5 h-5 text-blue-500" />} 
          iconBg="bg-blue-50"
          title="Solicitações" 
          value="14" 
          subValue="14 processos" 
          subLabel="Em andamento" 
        />
        <StatCard 
          icon={<AlertCircle className="w-5 h-5 text-red-500" />} 
          iconBg="bg-red-50"
          title="SLA Estourado" 
          value="2" 
          subValue="Processos" 
          subLabel="Atrasados" 
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />} 
          iconBg="bg-purple-50"
          title="Turnover" 
          value="2,4%" 
          subValue="Meta: 2,0%" 
          subLabel="Mês atual" 
        />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-800 mb-4">Solicitações por mês</div>
          {/* Simple Chart Mock */}
          <div className="h-32 relative flex items-end justify-between px-2">
             {/* Lines */}
             <div className="absolute inset-0 flex flex-col justify-between">
                <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-100 w-full h-0"></div>
             </div>
             {/* Chart Line Mock */}
             <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* Meta Dash */}
                <path d="M0,85 C20,80 40,70 60,55 C80,40 100,20 100,20" fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                
                <path d="M0,78 L15,65 L30,52 L45,42 L60,48 L75,55 L90,48 L100,52" fill="none" stroke="#F26522" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0,78 L15,65 L30,52 L45,42 L60,48 L75,55 L90,48 L100,52 L100,100 L0,100 Z" fill="url(#grad)" opacity="0.1" />
                <defs>
                   <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F26522" stopOpacity="1" />
                      <stop offset="100%" stopColor="#F26522" stopOpacity="0" />
                   </linearGradient>
                </defs>
                {/* Dots */}
                <circle cx="0" cy="78" r="2.5" fill="white" stroke="#F26522" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                <circle cx="15" cy="65" r="2.5" fill="white" stroke="#F26522" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                <circle cx="30" cy="52" r="2.5" fill="white" stroke="#F26522" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                <circle cx="45" cy="42" r="2.5" fill="white" stroke="#F26522" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                <circle cx="60" cy="48" r="3" fill="white" stroke="#F26522" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
             </svg>
             {/* Tooltip mockup on the peak */}
             <div className="absolute top-[35%] left-[60%] -translate-x-1/2 -translate-y-full bg-white shadow-lg rounded px-2 py-1 border border-gray-100 text-[8px] whitespace-nowrap z-10">
                <div className="font-bold text-gray-400 uppercase tracking-tighter">Jul/2026</div>
                <div className="text-[#F26522] font-black">42 sol.</div>
             </div>
             {/* X-axis labels */}
             <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[8px] text-gray-400 px-2 font-bold uppercase tracking-tight">
               <span>Jan</span>
               <span>Fev</span>
               <span>Mar</span>
               <span>Abr</span>
               <span>Mai</span>
               <span>Jun</span>
               <span>Jul</span>
               <span>Ago</span>
             </div>
          </div>
        </div>

        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-semibold text-gray-800">Pendências por processo</div>
            <div className="text-[#F26522] text-[10px] font-medium">Ver todas</div>
          </div>
          <div className="space-y-4">
            <ActivityItem icon={<Users className="w-3.5 h-3.5 text-orange-500" />} title="Admissão" date="Hoje" active />
            <ActivityItem icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />} title="Férias" date="Hoje" active />
            <ActivityItem icon={<DollarSign className="w-3.5 h-3.5 text-green-500" />} title="Reembolso" date="Amanhã" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, title, value, subValue, subLabel }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col justify-between">
      <div className="flex items-start gap-2 mb-2">
        <div className={`p-1.5 rounded-full ${iconBg}`}>
          {icon}
        </div>
        <div className="leading-tight pt-0.5">
          <div className="text-[10px] font-medium text-gray-500 mb-0.5 max-w-[80px] leading-[1.1]">{title}</div>
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900 mb-1 leading-none">{value}</div>
        <div className="text-[10px] font-semibold text-gray-800">{subValue}</div>
        <div className="text-[9px] text-gray-400">{subLabel}</div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, date, active }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-800 truncate">{title}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">{date}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-red-500' : 'bg-amber-400'}`}></div>
      </div>
    </div>
  );
}
