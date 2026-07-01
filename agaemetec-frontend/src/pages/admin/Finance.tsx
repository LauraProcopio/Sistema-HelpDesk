import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { 
  Download, 
  Filter, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export function Finance() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Carrega o balanço financeiro consumindo a API unificada do Back-end (Postres local)
  async function loadFinanceData() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/finance/metrics');
      if (!response.ok) throw new Error('Falha ao sincronizar o balancete financeiro.');
      const data = await response.json();
      setTickets(data || []);
    } catch (error: any) {
      toast.error('Erro financeiro', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFinanceData(); }, []);

  const handleExport = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Gerando relatório PDF...',
      success: 'Relatório Agaemetec exportado com sucesso!',
      error: 'Erro ao exportar dados.',
    });
  };

  const filteredTickets = tickets.filter(t => 
    t.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtra o que está em aberto/andamento e calcula a previsão ativa
  const totalAfaturar = filteredTickets
    .filter(t => t.status !== 'Concluido' && t.status !== 'Concluído' && !t.no_cost)
    .reduce((acc, t) => acc + (Number(t.estimated_hours || 0) * Number(t.hourly_rate || 0)), 0);

  // Filtra o que está concluído/resolvido e calcula o montante faturável
  const totalRecebido = filteredTickets
    .filter(t => (t.status === 'Concluido' || t.status === 'Concluído' || t.status === 'Resolvido') && !t.no_cost)
    .reduce((acc, t) => acc + (Number(t.estimated_hours || 0) * Number(t.hourly_rate || 0)), 0);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full scrollbar-hide">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <nav className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mb-2 flex items-center gap-2">
              Controle <span className="opacity-30">›</span> <span className="text-brand-primary">Financeiro</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Faturamento de Horas</h1>
          </div>
          
          <button 
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto bg-brand-dark text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-dark/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Download size={16} /> Exportar Balanço
          </button>
        </header>

        {/* CARDS DE RESUMO RESPONSIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange-200 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Previsão Ativa</p>
              <h3 className="text-4xl font-black italic tracking-tighter">
                R$ {totalAfaturar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-orange-600 font-black mt-3 flex items-center gap-1 uppercase tracking-tighter">
                <AlertCircle size={14} /> Horas em execução técnica
              </p>
            </div>
            <TrendingUp size={80} className="absolute -right-4 -bottom-4 text-orange-500/5 group-hover:text-orange-500/10 transition-all rotate-12" />
          </div>
          
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group hover:border-green-200 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disponível p/ Recibo</p>
              <h3 className="text-4xl font-black italic tracking-tighter">
                R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-green-600 font-black mt-3 flex items-center gap-1 uppercase tracking-tighter">
                <CheckCircle2 size={14} /> Prontos para faturamento
              </p>
            </div>
            <CheckCircle2 size={80} className="absolute -right-4 -bottom-4 text-green-500/5 group-hover:text-green-500/10 transition-all -rotate-12" />
          </div>
        </div>

        {/* FILTROS */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              placeholder="Buscar por unidade ou projeto..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all text-brand-dark"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="button" className="bg-white border border-gray-100 p-5 rounded-[24px] text-gray-400 hover:text-brand-primary hover:shadow-lg transition-all flex items-center justify-center">
            <Filter size={20} />
          </button>
        </div>

        {/* TABELA METRIFICADA */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black border-b border-gray-100">
                  <th className="px-8 py-6">Detalhamento</th>
                  <th className="px-8 py-6">Parceiro Agaemetec</th>
                  <th className="px-8 py-6">Horas / Valor H</th>
                  <th className="px-8 py-6">Subtotal</th>
                  <th className="px-8 py-6 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center text-[10px] font-black uppercase text-gray-300 animate-pulse tracking-[4px]">Sincronizando Balanços...</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center font-bold text-sm text-gray-400 italic">Nenhum registro com lançamento de horas localizado.</td></tr>
                ) : filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-brand-dark text-sm italic">{t.title}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">Ref: {t.id.substring(0,6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-brand-primary opacity-50" />
                        <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">
                          {t.company_name || 'Unidade Geral'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-bold text-gray-400">
                        <span className="text-brand-dark font-black text-sm">{t.estimated_hours}h</span> × R$ {Number(t.hourly_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-brand-dark italic">
                        {t.no_cost ? (
                          <span className="text-brand-primary text-xs font-black uppercase tracking-wider">CORTESIA</span>
                        ) : (
                          `R$ ${(Number(t.estimated_hours || 0) * Number(t.hourly_rate || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button type="button" className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-sm group-hover:scale-110">
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}