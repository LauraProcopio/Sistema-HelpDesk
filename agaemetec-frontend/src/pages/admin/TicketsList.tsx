import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Search, Plus, Building2, Clock, LayoutGrid, Trash2, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function TicketsList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | 'all'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      
      // 1. Resgata os dados de controlo reais guardados no login corporativo
      const cachedRole = localStorage.getItem('@Agametec:role') || 'Client';
      const userJson = localStorage.getItem('@Agametec:user');
      const userId = userJson ? JSON.parse(userJson).id : 'all';
      
      // 2. CORREÇÃO DE SEGURANÇA: Injeta os parâmetros na busca de empresas
      const compResponse = await fetch(`http://localhost:3001/api/companies?role=${cachedRole}&userId=${userId}`);
      if (!compResponse.ok) throw new Error('Falha ao carregar empresas autorizadas');
      const compData = await compResponse.json();
      setCompanies(compData || []);

      // 3. Busca os chamados injetando o userId e a role dinâmicos para produção
      const ticketsResponse = await fetch(`http://localhost:3001/api/tickets?role=${cachedRole}&userId=${userId}`);
      if (!ticketsResponse.ok) throw new Error('Falha ao carregar chamados');
      const tickData = await ticketsResponse.json();
      
      // Mapeamento de compatibilidade flat do Postgres para manter o JSX intacto
      const formattedTickets = (tickData.tickets || []).map((t: any) => ({
        ...t,
        companies: { name: t.company_name }
      }));
      
      setTickets(formattedTickets);

    } catch (error: any) {
      toast.error('Erro de Sincronização', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    
    toast.warning("Excluir chamado?", {
      description: "Esta ação não pode ser revertida na Agametec.",
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/tickets/${id}`, {
              method: 'DELETE'
            });

            if (!response.ok) throw new Error("Erro na exclusão");

            setTickets(prev => prev.filter(t => t.id !== id));
            toast.success("Chamado removido com sucesso!");
          } catch (error: any) {
            toast.error("Erro ao deletar", { description: error.message });
          }
        },
      },
    });
  }

  useEffect(() => { loadData(); }, []);

  const filteredTickets = tickets.filter(t => {
    const matchesCompany = selectedCompanyId === 'all' || t.company_id === selectedCompanyId;
    const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  const getCount = (id: string | 'all') => {
    if (id === 'all') return tickets.length;
    return tickets.filter(t => t.company_id === id).length;
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-left flex-col md:flex-row text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* BOTÃO FILTRO MOBILE */}
        <button 
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden absolute bottom-6 right-6 z-50 bg-brand-dark text-white p-4 rounded-full shadow-2xl"
        >
          <Menu size={24} />
        </button>

        {/* SUB-SIDEBAR RESPONSIVO */}
        <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-72 bg-white border-r border-gray-100 flex-col p-6 overflow-y-auto absolute md:relative z-40 h-full transition-all`}>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Unidades</h3>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 font-bold text-[10px]">FECHAR</button>
            </div>
            
            <nav className="space-y-2">
              <button 
                type="button"
                onClick={() => { setSelectedCompanyId('all'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedCompanyId === 'all' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid size={18} />
                  <span className="text-xs font-black uppercase tracking-tight">Todas</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedCompanyId === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}>{getCount('all')}</span>
              </button>

              {companies.map(company => (
                <button 
                  type="button"
                  key={company.id}
                  onClick={() => { setSelectedCompanyId(company.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedCompanyId === company.id ? 'bg-brand-dark text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} />
                    <span className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{company.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedCompanyId === company.id ? 'bg-white/10' : 'bg-gray-100'}`}>{getCount(company.id)}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-hide">
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Chamados</h1>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[3px] mt-2 italic truncate max-w-xs md:max-w-none">
                {selectedCompanyId === 'all' ? 'Gestão Consolidada' : `Unidade: ${companies.find(c => c.id === selectedCompanyId)?.name}`}
              </p>
            </div>
            <button type="button" onClick={() => navigate(localStorage.getItem('@Agametec:role') === 'Admin' ? '/admin/tickets/new' : '/client/tickets/new')} className="w-full sm:w-auto bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Plus size={16} /> Novo Ticket
            </button>
          </header>

          <div className="mb-6 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-semibold shadow-sm outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-brand-dark"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black border-b border-gray-100">
                    <th className="px-6 md:px-8 py-6">Ticket</th>
                    <th className="px-4 py-6 text-center">Status</th>
                    <th className="hidden md:table-cell px-8 py-6 text-center">Urgência</th>
                    <th className="px-6 md:px-8 py-6">Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center animate-pulse font-black text-[10px] text-gray-300 uppercase tracking-[4px]">Sincronizando...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center font-bold text-sm text-gray-400 italic">Nenhum chamado registado.</td></tr>
                  ) : filteredTickets.map((t) => (
                    <tr key={t.id} onClick={() => navigate(localStorage.getItem('@Agametec:role') === 'Admin' ? `/admin/tickets/${t.id}` : `/client/tickets/${t.id}`)} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                      <td className="px-6 md:px-8 py-6">
                        <p className="font-black text-sm mb-1 truncate max-w-[150px] md:max-w-none">{t.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase bg-brand-primary/5 px-2 py-0.5 rounded-md">{t.companies?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <span className={`text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-lg uppercase ${
                          t.status === 'Aberto' 
                            ? 'bg-blue-100 text-blue-600' 
                            : t.status === 'Em_Andamento' || t.status === 'Em Andamento'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-8 py-6 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${t.priority === 'Critica' ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-100 text-gray-400'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold">
                            <Clock size={12} className="hidden sm:block" /> {new Date(t.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => handleDelete(e, t.id)}
                            className="p-2 text-gray-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}