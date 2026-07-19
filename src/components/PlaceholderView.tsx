import React from 'react';
import { Construction, ArrowRight, Layout } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  subtitle: string;
  description?: string;
}

export default function PlaceholderView({ title, subtitle, description }: PlaceholderViewProps) {
  return (
    <div className="p-8 max-w-[1500px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-[32px] p-12 shadow-[0_8px_40px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 border border-orange-100">
          <Construction className="w-10 h-10 text-[#F26522]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Módulo em construção</h2>
        <p className="text-gray-500 max-w-md mb-10">
          {description || "Estamos trabalhando para trazer a melhor experiência de gestão para este módulo. Em breve você terá acesso a todas as funcionalidades aqui."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <ExampleCard 
            title="Dados Mockados" 
            desc="Visualize como os dados serão estruturados neste módulo."
          />
          <ExampleCard 
            title="Integração IA" 
            desc="Processamento inteligente de dados para este setor."
          />
          <ExampleCard 
            title="Relatórios" 
            desc="Geração de insights automáticos baseados no fluxo."
          />
        </div>
      </div>
    </div>
  );
}

function ExampleCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left group hover:bg-white hover:border-orange-200 transition-all cursor-default">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-orange-50 transition-colors">
        <Layout className="w-5 h-5 text-gray-400 group-hover:text-[#F26522]" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>
      <div className="flex items-center gap-2 text-[10px] font-bold text-[#F26522] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Saiba mais
        <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
