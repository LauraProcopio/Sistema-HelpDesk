import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Building2, Plus, FileText, Edit2, Power, PowerOff, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  document_number: string; // Atualizado para bater com o Postgres
  is_active: boolean;
}

export function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({ name: '', document_number: '' });

  // 1. Carrega todas as empresas via API unificada do Postgres
  async function loadCompanies() {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/companies`);
      if (!response.ok) throw new Error('Falha ao carregar a lista de empresas.');
      const data = await response.json();
      setCompanies(data || []);
    } catch (error: any) {
      toast.error('Falha na sincronização', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  // 2. Altera o status operacional da unidade via PATCH
  async function toggleCompanyStatus(company: Company) {
    const newStatus = !company.is_active;
    
    toast.warning(newStatus ? "Reativar Unidade?" : "Desativar Unidade?", {
      description: newStatus 
        ? `A empresa ${company.name} voltará a operar no sistema.`
        : `A empresa ${company.name} não poderá mais abrir novos chamados.`,
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/companies/${company.id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_active: newStatus })
            });

            if (!response.ok) throw new Error('Erro ao atualizar status no servidor.');

            toast.success(`Status de ${company.name} atualizado!`);
            loadCompanies();
          } catch (error: any) {
            toast.error('Erro ao alterar status', { description: error.message });
          }
        }
      }
    });
  }

  function openModal(company?: Company) {
    if (company) {
      setEditingCompany(company);
      setFormData({ 
        name: company.name, 
        document_number: company.document_number || ''
      });
    } else {
      setEditingCompany(null);
      setFormData({ name: '', document_number: '' });
    }
    setIsModalOpen(true);
  }

  // 3. Cadastra ou Atualiza a Unidade via POST / PUT
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { 
        name: formData.name, 
        document_number: formData.document_number
      };

      const url = editingCompany 
        ? `${import.meta.env.VITE_API_URL}1/api/companies/${editingCompany.id}`
        : `${import.meta.env.VITE_API_URL}/api/companies`;

      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao processar requisição de salvar no servidor.');

      toast.success(editingCompany ? "Empresa atualizada com sucesso!" : "Nova unidade registrada na Agametec!");
      setIsModalOpen(false);
      loadCompanies();
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] overflow-hidden font-sans text-left flex-col md:flex-row text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto scrollbar-hide">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <nav className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mb-2">Administração › Unidades</nav>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Empresas Clientes</h1>
          </div>

          <button 
            type="button"
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-brand-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px]"
          >
            <Plus size={18} /> Nova Empresa
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
          {loading ? (
            <div className="col-span-full py-20 text-center">
               <p className="text-[10px] font-black uppercase text-gray-300 animate-pulse tracking-[4px]">Sincronizando Unidades...</p>
            </div>
          ) : (
            companies.map(company => (
              <div key={company.id} className={`bg-white p-6 rounded-[40px] border transition-all group relative flex flex-col ${!company.is_active ? 'opacity-60 grayscale bg-gray-50/50' : 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5'}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${company.is_active ? 'bg-brand-primary/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white shadow-inner' : 'bg-gray-100 text-gray-400'}`}>
                    <Building2 size={28} />
                  </div>
                  
                  <div className="flex gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                    <button 
                      type="button"
                      onClick={() => openModal(company)}
                      className="p-2.5 text-gray-400 hover:text-brand-primary hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => toggleCompanyStatus(company)}
                      className={`p-2.5 rounded-xl transition-all shadow-sm border border-transparent ${company.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-white hover:border-red-100' : 'text-green-500 hover:bg-white hover:border-green-100'}`}
                    >
                      {company.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-black truncate pr-4 leading-tight italic mb-3">{company.name}</h3>
                
                <div className="flex items-center gap-2 text-gray-400 mb-6">
                  <FileText size={14} className="opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{company.document_number || 'Sem registro'}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                   <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[1px] ${company.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    {company.is_active ? '• Operacional' : '• Inativa'}
                  </span>
                  <LayoutGrid size={14} className="text-gray-100" />
                </div>
              </div>
            ))
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[56px] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <h2 className="text-2xl md:text-3xl font-black mb-8 italic tracking-tighter">
                {editingCompany ? 'Ajustar Empresa' : 'Nova Unidade'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Nome Fantasia</label>
                  <input 
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-dark" 
                    placeholder="Ex: Unidade Alpha"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Documento (CNPJ/CPF)</label>
                  <input 
                    className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-dark" 
                    placeholder="00.000.000/0001-00"
                    value={formData.document_number}
                    onChange={e => setFormData({...formData, document_number: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-6 flex-col sm:flex-row">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors order-2 sm:order-1"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-brand-primary py-5 text-[10px] font-black uppercase tracking-widest text-white rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all order-1 sm:order-2"
                  >
                    {editingCompany ? 'Salvar Alterações' : 'Efetivar Cadastro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}