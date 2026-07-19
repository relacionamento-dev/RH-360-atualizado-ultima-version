import React, { useState } from 'react';
import { 
  User, Phone, MapPin, Zap, MessageSquare, 
  Save, Plus, ArrowRight, CheckCircle2, ChevronDown,
  Building2, GraduationCap, Store, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickSignupProps {
  onNavigate: (view: string) => void;
}

export default function QuickSignup({ onNavigate }: QuickSignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'PF',
    city: '',
    source: '',
    vendedor: 'Mariana Souza',
    consumption: '',
    notes: ''
  });

  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.FormEvent, nextAction: 'new' | 'budget') => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      if (nextAction === 'budget') {
        onNavigate('budget');
      } else {
        setFormData({
          name: '',
          phone: '',
          type: 'PF',
          city: '',
          source: '',
          vendedor: 'Mariana Souza',
          consumption: '',
          notes: ''
        });
        setShowToast(false);
      }
    }, 2000);
  };

  return (
    <div className="flex-1 bg-[#F7F7F8] overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cadastro Rápido</h1>
          <p className="text-gray-500 text-sm mt-1">Formulário simplificado para entrada de novos leads no sistema.</p>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Nome Completo *
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex.: Felipe Albuquerque"
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Telefone *
                </label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all"
                  required
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Tipo de Cliente
                </label>
                <div className="flex bg-gray-50 rounded-2xl p-1">
                  {['PF', 'PJ'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t})}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                        formData.type === t ? 'bg-white text-[#F26522] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Cidade/UF */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Cidade / UF
                </label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="Ex.: Fortaleza / CE"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all"
                />
              </div>

              {/* Origem */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Origem *
                </label>
                <div className="relative">
                  <select 
                    value={formData.source}
                    onChange={e => setFormData({...formData, source: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all appearance-none"
                    required
                  >
                    <option value="">Selecionar Origem</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Site">Site</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Google">Google</option>
                    <option value="Feira">Feira</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Vendedor */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" /> Vendedor Responsável
                </label>
                <input 
                  type="text" 
                  value={formData.vendedor}
                  onChange={e => setFormData({...formData, vendedor: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all"
                />
              </div>

              {/* Consumo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Consumo Médio (kWh/mês)
                </label>
                <input 
                  type="number" 
                  value={formData.consumption}
                  onChange={e => setFormData({...formData, consumption: e.target.value})}
                  placeholder="Ex.: 450"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Observações
              </label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Detalhes adicionais sobre o lead..."
                rows={3}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#F26522] transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={(e) => handleSave(e, 'new')}
              className="flex-1 bg-white border-2 border-gray-100 py-4 rounded-2xl text-xs font-black text-gray-600 hover:border-[#F26522] hover:text-[#F26522] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> SALVAR E NOVO
            </button>
            <button
              onClick={(e) => handleSave(e, 'budget')}
              className="flex-[2] bg-[#F26522] py-4 rounded-2xl text-xs font-black text-white hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <ArrowRight className="w-4 h-4" /> SALVAR E CRIAR ORÇAMENTO
            </button>
          </div>
        </form>

        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 min-w-[400px]"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Cliente e Oportunidade criados!</p>
                <p className="text-[10px] text-gray-400 uppercase font-black">Status: Lead Ativo | Etapa: Novo Lead</p>
              </div>
              <button 
                onClick={() => onNavigate('sales-funnel')}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black transition-colors"
              >
                ABRIR NO FUNIL
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
