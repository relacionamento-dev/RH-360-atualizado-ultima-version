import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, Building2, ShieldCheck, 
  Users, ClipboardList, AlertCircle, TrendingDown,
  ArrowRight, CheckCircle2, Database, Shield,
  Search, ChevronDown, Plus
} from 'lucide-react';
import { Button } from './ui/Button';

interface LoginProps {
  onLogin: (email: string, password: string) => { success: boolean; message?: string };
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberAccess, setRememberAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      const result = onLogin(email, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message || 'Não foi possível efetuar login.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-gray-900 flex flex-col">
      {/* Top Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoIcon />
          <span className="font-bold text-2xl tracking-tight text-black">RH<span className="text-[#F26522]">360</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
          <Building2 size={16} className="text-gray-400" />
          <span className="text-[13px] font-bold text-gray-600">Empresa: <span className="text-gray-900">RH360 Corporate</span></span>
          <ChevronDown size={14} className="text-gray-400 ml-1" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 pb-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Column - Hero & Dashboard Preview */}
        <div className="w-full lg:w-[55%] space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Gerencie o RH da sua empresa de <span className="text-[#F26522]">ponta a ponta</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-lg">
              Processos, aprovações e indicadores em um só lugar.
            </p>
          </div>

          {/* KPI Dashboard Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Visão geral da operação</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-[12px] font-bold text-gray-500">
                Este mês <ChevronDown size={14} />
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard 
                icon={<Users className="text-blue-500" />}
                label="Headcount Ativo"
                value="184"
                subline="+3 no mês / Total colaboradores"
              />
              <KPICard 
                icon={<ClipboardList className="text-orange-500" />}
                label="Solicitações"
                value="14"
                subline="14 processos / Em andamento"
              />
              <KPICard 
                icon={<AlertCircle className="text-red-500" />}
                label="SLA Estourado"
                value="2"
                valueColor="text-red-500"
                subline="Processos / Atrasados"
              />
              <KPICard 
                icon={<TrendingDown className="text-green-500" />}
                label="Turnover"
                value="2,4%"
                subline="Meta: 2,0% / Mês atual"
              />
            </div>

            {/* Bottom Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Mini Chart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Solicitações por mês</h4>
                </div>
                <div className="h-24 w-full relative flex items-end gap-1">
                  {/* Simple Mock Chart */}
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gray-100"></div>
                  <svg className="w-full h-full" viewBox="0 0 200 60">
                    <path 
                      d="M0 50 Q25 45 50 30 T100 40 T150 20 T200 35" 
                      fill="none" 
                      stroke="#F26522" 
                      strokeWidth="2"
                    />
                    <circle cx="150" cy="20" r="3" fill="#F26522" />
                    <rect x="140" y="5" width="20" height="10" rx="2" fill="#F26522" opacity="0.1" />
                    <text x="142" y="13" fontSize="6" fontWeight="bold" fill="#F26522">MAIO/25</text>
                  </svg>
                  <div className="flex justify-between w-full mt-2 text-[8px] font-bold text-gray-300">
                    <span>JAN</span><span>FEV</span><span>MAR</span><span>ABR</span><span>MAI</span><span>JUN</span><span>JUL</span><span>AGO</span>
                  </div>
                </div>
              </div>

              {/* Pending List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Pendências por processo</h4>
                  <button className="text-[10px] font-bold text-orange-500 uppercase">Ver todas</button>
                </div>
                <div className="space-y-3">
                  <PendingItem label="Admissão" date="Hoje" dotColor="bg-red-500" />
                  <PendingItem label="Férias" date="Hoje" dotColor="bg-red-500" />
                  <PendingItem label="Reembolso" date="Amanhã" dotColor="bg-amber-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Seals */}
          <div className="flex flex-wrap items-center gap-4">
            <TrustSeal icon={<ShieldCheck size={18} />} title="Ambiente seguro" desc="Seus dados protegidos" />
            <TrustSeal icon={<Database size={18} />} title="Backup diário" desc="Alta disponibilidade" />
            <TrustSeal icon={<CheckCircle2 size={18} />} title="Conformidade" desc="LGPD e Boas Práticas" />
          </div>
        </div>

        {/* Right Column - Login Card */}
        <div className="w-full lg:w-[45%] max-w-[480px]">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 md:p-12 space-y-8">
            {/* Security Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
              <Lock size={14} className="text-orange-500" />
              <div className="text-[10px] flex flex-col">
                <span className="font-bold text-orange-700 leading-none">Ambiente seguro</span>
                <span className="text-orange-500 leading-none mt-0.5">Conexão criptografada</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Entrar no sistema</h2>
              <p className="text-gray-500 font-medium">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F26522] transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-[#F26522] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F26522] transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-[#F26522] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={rememberAccess}
                      onChange={(e) => setRememberAccess(e.target.checked)}
                      className="peer sr-only" 
                    />
                    <div className="w-5 h-5 bg-gray-100 border border-gray-300 rounded peer-checked:bg-[#F26522] peer-checked:border-[#F26522] transition-all flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-gray-500 group-hover:text-gray-700 transition-colors">Lembrar acesso</span>
                </label>
                <button type="button" className="text-[14px] font-bold text-[#F26522] hover:underline">Esqueci minha senha</button>
              </div>

              {errorMessage && (
                <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                isLoading={isLoading}
              >
                Entrar <ArrowRight size={20} />
              </Button>
            </form>

            <p className="text-center text-[13px] font-medium text-gray-500">
              Ainda não tem acesso? <button className="text-[#F26522] font-bold hover:underline">Fale com o administrador.</button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-gray-100 flex items-center justify-center">
        <p className="text-[12px] font-bold text-gray-400">© 2025 RH360. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function KPICard({ icon, label, value, subline, valueColor = "text-gray-900" }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  subline: string,
  valueColor?: string
}) {
  return (
    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-black ${valueColor} leading-tight`}>{value}</p>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter border-t border-gray-200 pt-1 mt-1">{subline}</p>
    </div>
  );
}

function PendingItem({ label, date, dotColor }: { label: string, date: string, dotColor: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          <Search size={14} className="text-gray-400" />
        </div>
        <span className="text-[13px] font-bold text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-gray-400">{date}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
      </div>
    </div>
  );
}

function TrustSeal({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
      <div className="text-gray-400">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-gray-900 leading-none">{title}</span>
        <span className="text-[10px] font-medium text-gray-500 leading-none mt-1">{desc}</span>
      </div>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M16 2L16 9" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 23L16 30" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 16L30 16" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M2 16L9 16" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 8L19.5 12.5" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12.5 19.5L8 24" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 24L19.5 19.5" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12.5 12.5L8 8" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

