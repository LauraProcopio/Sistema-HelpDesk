import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Search, Plus, Mail, Building2, Edit3, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Busca todos os utilizadores através da API do Back-end conectado ao Postgres local
  async function loadCustomers() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/customers');
      if (!response.ok) throw new Error('Falha ao carregar utilizadores.');
      const data = await response.json();
      setCustomers(data || []);
    } catch (error: any) {
      toast.error('Erro de Sincronização', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  // Altera o estado ativo/suspenso batendo na API local do Postgres
  async function handleToggleStatus(id: string, name: string, is_active: boolean) {
    toast.warning(is_active ? "Bloquear Utilizador?" : "Reativar Utilizador?", {
      description: `Tem certeza que deseja alterar o acesso de ${name}?`,
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/customers/${id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_active: !is_active })
            });

            if (!response.ok) throw new Error('Erro ao atualizar status no servidor.');

            toast.success("Status atualizado com sucesso!");
            loadCustomers();
          } catch (error: any) {
            toast.error("Erro ao alterar status", { description: error.message });
          }
        }
      }
    });
  }

  const filteredCustomers = customers.filter(customer =>
    (customer.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (customer.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto scrollbar-hide">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Acessos</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[3px] mt-2">Gestão de Utilizadores Agaemetec</p>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/admin/customers/new')} 
            className="w-full sm:w-auto bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Novo Registo
          </button>
        </header>

        <div className="mb-6 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text"
            placeholder="Pesquisar por nome ou e-mail..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-semibold shadow-sm outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-brand-dark"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
          {loading ? (
            <div className="col-span-full py-20 text-center">
               <p className="text-[10px] font-black uppercase text-gray-300 animate-pulse tracking-[4px]">Sincronizando Base de Acessos...</p>
            </div>
          ) : filteredCustomers.map((customer) => {
            const linkedCompanies = customer.user_companies?.map((link: any) => link.companies?.name) || [];

            return (
              <div key={customer.id} className={`bg-white p-5 md:p-6 rounded-[40px] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all gap-4 ${!customer.is_active && 'bg-gray-50/50 grayscale-[0.5] opacity-70'}`}>
                
                <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[22px] flex items-center justify-center font-black text-sm ${customer.is_active ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
                      {customer.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full border-[3px] md:border-4 border-white ${customer.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-brand-dark text-base md:text-lg leading-tight truncate max-w-[150px] sm:max-w-none">{customer.name || 'Utilizador'}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase shrink-0 ${customer.role?.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {customer.role || 'Cliente'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {linkedCompanies.length > 0 ? (
                        linkedCompanies.map((cName: string, idx: number) => (
                          <span key={idx} className="flex items-center gap-1 bg-gray-50 text-gray-500 text-[8px] md:text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-gray-100">
                            <Building2 size={10} className="text-brand-primary" /> {cName}
                          </span>
                        ))
                      ) : (
                        <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter italic">Sem vínculos ativos</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 font-medium text-[10px] md:text-xs mt-2 lowercase truncate">
                      <Mail size={12} className="shrink-0" /> {customer.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-none pt-4 sm:pt-0 justify-end">
                  <button 
                    type="button"
                    onClick={() => navigate(`/admin/customers/edit/${customer.id}`)}
                    className="flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 rounded-2xl bg-gray-50 text-gray-400 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center shadow-sm border border-transparent hover:border-brand-primary/10"
                    title="Editar Perfil"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleToggleStatus(customer.id, customer.name, customer.is_active)}
                    className={`flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                      customer.is_active 
                      ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    {customer.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}