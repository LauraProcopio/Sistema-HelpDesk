import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { ArrowLeft, UserPlus, Building2, Save, Power, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function EditCustomer() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Client', // Ajustado de 'Cliente' para 'Client'
    department: '',
    is_active: true
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Carrega as empresas disponíveis via API local do Postgres
        const compResponse = await fetch('http://localhost:3001/api/companies');
        if (!compResponse.ok) throw new Error('Falha ao obter lista de unidades.');
        const companiesData = await compResponse.json();
        setAvailableCompanies(companiesData || []);

        // 2. Carrega os dados específicos do utilizador via API local
        const userResponse = await fetch(`http://localhost:3001/api/customers/${id}`);
        if (!userResponse.ok) throw new Error('Falha ao obter dados do perfil.');
        const profileData = await userResponse.json();

        if (profileData) {
          setFormData({
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            role: profileData.role || 'Client', // Ajustado para ler 'Client' do Postgres
            department: profileData.department || '',
            is_active: profileData.is_active ?? true
          });
          
          // Mapeia os vínculos de empresas já salvos vindo da agregação JSON do back-end
          if (profileData.user_companies) {
            setSelectedCompanies(profileData.user_companies.map((l: any) => l.company_id));
          }
        }

      } catch (error: any) {
        toast.error("Erro de sincronização", { description: error.message });
        navigate('/admin/customers');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  function toggleCompany(companyId: string) {
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter(cid => cid !== companyId));
    } else {
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Envia os dados atualizados e o array de vínculos para a transação do Postgres no Back-end
      const response = await fetch(`http://localhost:3001/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          is_active: formData.is_active,
          companies: selectedCompanies // Array de UUIDs que o Postgres vai sincronizar na user_companies
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar modificações no servidor.');

      toast.success("Perfil Atualizado", { description: "Dados e vínculos salvos na Agametec." });
      navigate('/admin/customers');
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-20 text-center font-black text-brand-primary animate-pulse text-[10px] uppercase tracking-[4px]">Sincronizando Base Agametec...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto scrollbar-hide relative">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <nav className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mb-2">Administração › Gestão de Acessos</nav>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Editar Perfil</h1>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="w-full sm:w-auto bg-white border border-gray-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-brand-primary transition-all shadow-sm flex items-center justify-center gap-2 tracking-widest">
            <ArrowLeft size={16} /> Voltar
          </button>
        </header>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-20">
          
          {/* BANNER DE STATUS OPERACIONAL */}
          <div className={`p-6 rounded-[40px] border transition-all flex flex-col sm:flex-row items-center justify-between gap-6 ${formData.is_active ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg ${formData.is_active ? 'bg-green-500 text-white shadow-green-200' : 'bg-red-500 text-white shadow-red-200'}`}>
                <Power size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">Estado da Conta</p>
                <p className={`text-lg md:text-xl font-black italic ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.is_active ? 'Utilizador Operacional' : 'Acesso Suspenso'}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({...formData, is_active: !formData.is_active})}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-white shadow-sm border hover:scale-105 active:scale-95 ${formData.is_active ? 'text-red-500 border-red-100 hover:bg-red-50' : 'text-green-600 border-green-100 hover:bg-green-50'}`}
            >
              {formData.is_active ? 'Bloquear Acesso' : 'Reativar Conta'}
            </button>
          </div>

          {/* SEÇÃO 1: IDENTIFICAÇÃO */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg flex items-center gap-3 italic">
              <div className="p-2 bg-brand-primary/10 rounded-xl"><UserPlus size={20} className="text-brand-primary" /></div>
              Identificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Nome Completo *</label>
                <input required className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all text-brand-dark" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">E-mail (Login)</label>
                <input required type="email" className="w-full border-none bg-gray-100/50 rounded-2xl p-5 text-sm font-bold text-gray-400 outline-none cursor-not-allowed" value={formData.email} disabled />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">WhatsApp</label>
                <input className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all text-brand-dark" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: SELEÇÃO DE VÍNCULOS N:N */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg flex items-center gap-3 italic">
              <div className="p-2 bg-brand-primary/10 rounded-xl"><Building2 size={18} className="text-brand-primary" /></div>
              Unidades Autorizadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableCompanies.map(company => {
                const isSelected = selectedCompanies.includes(company.id);
                return (
                  <div 
                    key={company.id}
                    onClick={() => toggleCompany(company.id)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white text-gray-300'}`}>
                        <Building2 size={18} />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-brand-dark' : 'text-gray-400'}`}>{company.name}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-gray-200 bg-white'}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: PERFIL E DEPARTAMENTO */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg flex items-center gap-3 italic">
              <div className="p-2 bg-brand-primary/10 rounded-xl"><Shield size={20} className="text-brand-primary" /></div>
              Configuração de Acesso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Perfil de Acesso</label>
                <select className="w-full border-none bg-gray-50 rounded-2xl p-5 text-[10px] font-black uppercase outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-brand-primary text-brand-dark" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Client">👤 Cliente Agametec</option> {/* value corrigido para 'Client' */}
                  <option value="Admin">⚡ Administrador Pleno</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Departamento</label>
                <input className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all text-brand-dark" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-12">
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full sm:w-auto bg-brand-primary text-white px-16 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px]"
            >
              {saving ? 'Sincronizando...' : <><Save size={18} /> Confirmar Alterações</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}