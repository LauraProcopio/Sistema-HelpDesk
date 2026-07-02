import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Ticket, CheckCircle2, Building2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Busca os chamados e as métricas direto da API do Back-end conectada ao Postgres local
  async function loadDashboardData() {
    try {
      setLoading(true);
      const cachedRole = localStorage.getItem('@Agametec:role') || 'Client';
      const userJson = localStorage.getItem('@Agametec:user');
      
      let userId = 'all';
      if (userJson) {
        userId = JSON.parse(userJson).id; // Puxa o UUID real do Postgres
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets?role=${cachedRole}&userId=${userId}`);
      if (!response.ok) throw new Error('Falha ao sincronizar o painel de inteligência.');
      const data = await response.json();

      setTickets(data.tickets || []);
      setStats(data.stats || { open: 0, inProgress: 0, resolved: 0 });
    } catch (error: any) {
      toast.error('Erro de sincronização', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 2. Cálculo de faturamento consolidado adaptado para o retorno do Postgres local
  const totalRevenue = tickets.reduce((acc, t) => {
    if (t.no_cost === true) return acc; // Avalia o booleano plano direto do banco
    return acc + (Number(t.estimated_hours || 0) * Number(t.hourly_rate || 0));
  }, 0);

  return (
    <div className="flex h-screen bg-[#0B0E14] overflow-hidden font-sans text-left flex-col md:flex-row text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-[#F8FAFC] md:rounded-tl-[60px] md:my-2 md:mr-2 shadow-2xl scrollbar-hide">
        
        {/* HEADER ADAPTÁVEL */}
        <header className="mb-10 md:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[4px] mb-2">Painel de Inteligência</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic">Olá, Laura.</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right border-r border-gray-200 pr-4 md:pr-6">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sincronização</p>
               <p className="text-[10px] md:text-xs font-bold text-green-500 flex items-center gap-2 justify-end">● Online</p>
            </div>
            <button 
              type="button"
              onClick={() => navigate('/admin/tickets/new')}
              className="bg-brand-dark text-white p-4 rounded-2xl hover:bg-brand-primary transition-all shadow-xl group"
              title="Novo Ticket"
            >
              <Ticket size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </header>

        {/* 1. GRID DE DESTAQUE ASSIMÉTRICO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          
          {/* CARD MASTER: RECEITA */}
          <div className="lg:col-span-8 bg-brand-dark rounded-[32px] md:rounded-[48px] p-8 md:p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-brand-dark/20 min-h-[250px] md:min-h-[300px]">
            <div className="relative z-10 flex justify-between items-start">
              <div className="max-w-[70%]">
                <span className="bg-brand-primary/20 text-brand-primary text-[9px] md:text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Projeção Financeira</span>
                <h3 className="text-4xl md:text-6xl font-black mt-6 tracking-tighter truncate">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
                <TrendingUp size={28} className="text-brand-primary" />
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-4 md:gap-6 mt-8">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-brand-dark bg-gray-700 flex items-center justify-center text-[7px] font-black">L{i}</div>
                ))}
              </div>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Monitorando {tickets.length} chamados ativos na rede</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none" />
          </div>

          {/* CARDS DE STATUS */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-brand-primary transition-all">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendentes</p>
                <ArrowUpRight size={18} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
              </div>
              <h4 className="text-3xl md:text-4xl font-black italic">{(stats?.open || 0) + (stats?.inProgress || 0)}</h4>
            </div>
            <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-green-500 transition-all">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolvidos</p>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <h4 className="text-3xl md:text-4xl font-black italic">{stats?.resolved || 0}</h4>
            </div>
          </div>
        </div>

        {/* 2. TABELA DE ALTO NÍVEL RESPONSIVA */}
        <section className="bg-white rounded-[32px] md:rounded-[50px] p-2 shadow-sm border border-gray-100 mb-10 overflow-hidden">
          <div className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-lg md:text-xl font-black italic flex items-center gap-3">
               <Building2 size={24} className="text-brand-primary" /> 
               Fluxo de Unidades
             </h2>
             <button type="button" onClick={() => navigate('/admin/tickets')} className="w-full sm:w-auto bg-gray-50 text-gray-400 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all text-center">
               Ver Lista Completa
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-6 md:px-10 py-6">Parceiro</th>
                  <th className="px-6 md:px-10 py-6">Chamado Recente</th>
                  <th className="px-6 md:px-10 py-6 text-center">Urgência</th>
                  <th className="px-6 md:px-10 py-6 text-right">Projeção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center animate-pulse text-[10px] font-black text-gray-300 uppercase">Sincronizando...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center font-bold text-sm text-gray-400 italic">Nenhum chamado pendente no radar.</td></tr>
                ) : tickets.slice(0, 5).map((t) => (
                  <tr key={t.id} className="group hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-brand-dark text-white rounded-xl flex items-center justify-center font-black text-[9px] italic shrink-0">
                          {t.companies?.name?.substring(0, 1) || 'A'}
                        </div>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter truncate max-w-[100px] md:max-w-[150px]">
                          {t.companies?.name || 'Agaemetec'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <p className="text-xs md:text-sm font-bold text-gray-700 leading-tight group-hover:text-brand-primary transition-colors truncate max-w-[150px] md:max-w-xs">{t.title}</p>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className={`w-8 md:w-10 h-1.5 rounded-full mx-auto ${t.priority === 'Critica' ? 'bg-red-500' : 'bg-gray-200'}`} />
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8 text-right">
                      <span className="text-[10px] md:text-xs font-black italic">
                        {t.no_cost ? (
                          <span className="text-brand-primary">CORTESIA</span>
                        ) : (
                          `R$ ${(Number(t.estimated_hours || 0) * Number(t.hourly_rate || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
