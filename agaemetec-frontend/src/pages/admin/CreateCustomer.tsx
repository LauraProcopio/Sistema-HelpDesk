import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { ArrowLeft, UserPlus, Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function CreateCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company_id: '',
    role: 'Client', // Ajustado de 'Cliente' para 'Client'
    department: ''
  });

  // Busca as empresas através da API local do Postgres
  async function loadCompanies() {
    try {
      const response = await fetch('http://localhost:3001/api/companies');
      if (!response.ok) throw new Error('Falha ao obter lista de unidades.');
      const data = await response.json();
      setAvailableCompanies(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar unidades", { description: error.message });
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.company_id) {
      return toast.error("Seleção obrigatória", { 
        description: "Por favor, escolha uma empresa para vincular o utilizador." 
      });
    }
    
    setLoading(true);

    try {
      // Envia os dados estruturados para o Back-end salvar de forma transacional no Postgres
      const response = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          company_id: formData.company_id,
          department: formData.department
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar o cadastro no servidor.");
      }

      toast.success("Acesso Criado!", { 
        description: `${formData.name} já pode acessar o sistema Agaemetec.` 
      });
      navigate('/admin/customers');
    } catch (error: any) {
      toast.error("Erro no cadastro", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto overflow-y-auto h-full scrollbar-hide">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <nav className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mb-2 flex items-center gap-2">
              Administração <span className="opacity-30">›</span> <span className="text-brand-primary">Acessos</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Novo Utilizador</h1>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-all shadow-sm tracking-widest">
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          {/* IDENTIFICAÇÃO */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg flex items-center gap-2 italic">
              <UserPlus size={20} className="text-brand-primary" /> Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Nome Completo *</label>
                <input required className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-brand-dark outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="Ex: Elton Heitor" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">E-mail de Acesso *</label>
                <input required type="email" placeholder="nome@empresa.com.br" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-brand-dark outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Senha Provisória *</label>
                <input required type="text" placeholder="Defina uma senha" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-brand-dark outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
          </div>

          {/* VÍNCULO EMPRESARIAL */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg flex items-center gap-2 italic">
              <Shield size={20} className="text-brand-primary" /> Atribuição de Unidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Empresa Primária *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                  <select 
                    required 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-brand-dark appearance-none outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
                    value={formData.company_id}
                    onChange={e => setFormData({...formData, company_id: e.target.value})}
                  >
                    <option value="">Selecione uma empresa...</option>
                    {availableCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Tipo de Perfil</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-[10px] font-black text-brand-dark uppercase outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Client">👤 Cliente</option>
                  <option value="Admin">🛠️ Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Departamento</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-brand-dark outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="Ex: Financeiro" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pb-12">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto bg-brand-primary text-white px-16 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-[10px]"
            >
              {loading ? 'Processando Registro...' : 'Efetivar Cadastro'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}