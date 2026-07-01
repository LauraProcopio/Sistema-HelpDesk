import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { ArrowLeft, Send, Save, Trash2, Info, Building2, User, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('0');
  const [hourlyRate, setHourlyRate] = useState('0');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Carrega os dados consolidados (Ticket + Mensagens) vindo da API do Postgres local
  async function loadData() {
    try {
      const response = await fetch(`http://localhost:3001/api/tickets/${id}`);
      if (!response.ok) throw new Error('Não foi possível recuperar os dados do chamado.');
      const data = await response.json();
      
      const userJson = localStorage.getItem('@Agametec:user');
      if (userJson) {
        setCurrentUser(JSON.parse(userJson));
      }

      if (data.ticket) {
        // Realiza o mapeamento de compatibilidade flat do Postgres para o front
        const formattedTicket = {
          ...data.ticket,
          companies: { name: data.ticket.company_name },
          profiles: { name: data.ticket.user_name }
        };
        
        setTicket(formattedTicket);
        setEstimatedHours(data.ticket.estimated_hours || '0');
        setHourlyRate(data.ticket.hourly_rate || '0');
      }
      setMessages(data.messages || []);

    } catch (error: any) {
      toast.error("Erro ao carregar dados", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  // 2. Envia a interação técnica injetando o UUID dinâmico do usuário autenticado
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!currentUser?.id) {
      return toast.error("Erro de Sessão", { description: "Usuário não identificado. Por favor, refaça o login." });
    }

    try {
      const cachedRole = localStorage.getItem('@Agametec:role') || 'Client';

      const response = await fetch('http://localhost:3001/api/tickets/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: id,
          message: newMessage,
          sender_id: currentUser.id,
          sender_role: cachedRole === 'Admin' ? 'ADMIN' : 'CLIENT'
        })
      });

      if (!response.ok) throw new Error("Erro ao salvar mensagem no servidor.");

      setNewMessage('');
      loadData(); 
    } catch (error: any) {
      toast.error("Falha no chat", { description: error.message });
    }
  }

  // 3. Salva alterações de status e dados financeiros via PATCH na API (Gatilha e-mail/whats automático no Back)
  async function saveChanges() {
    try {
      const response = await fetch(`http://localhost:3001/api/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: ticket.status,
          internal_notes: `Atualização de métricas operacionais via painel administrativo.`,
          estimated_hours: Number(estimatedHours),
          hourly_rate: Number(hourlyRate),
          no_cost: ticket.no_cost
        })
      });

      if (!response.ok) throw new Error("Falha ao salvar modificações no back-end.");

      toast.success("Registro Agametec atualizado!");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    }
  }

  // 4. Remove o ticket do ecossistema de forma irreversível via DELETE HTTP
  const handleDelete = () => {
    toast.warning("Deseja deletar este chamado?", {
      description: "Esta ação é irreversível.",
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/tickets/${id}`, {
              method: 'DELETE'
            });

            if (!response.ok) throw new Error("Falha ao deletar o registro na API.");

            toast.success("Ticket removido");
            navigate('/admin/tickets');
          } catch (error: any) {
            toast.error("Erro ao remover", { description: error.message });
          }
        }
      }
    });
  };

  if (loading) return <div className="p-20 text-center font-black text-brand-primary animate-pulse uppercase tracking-[4px] text-[10px]">Sincronizando Chamado...</div>;
  if (!ticket) return <div className="p-20 text-center font-black text-red-500 uppercase">Chamado não localizado.</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 flex flex-col h-full overflow-hidden text-left font-sans relative">
        
        {/* HEADER RESPONSIVO */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-gray-400 border border-gray-100 hover:border-brand-primary transition-all">
              <ArrowLeft size={18} />
            </button>
            <div>
              <nav className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                <Building2 size={10} className="text-brand-primary" /> {ticket.companies?.name || 'Unidade Avulsa'}
              </nav>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter italic truncate max-w-[200px] sm:max-w-none">
                #{ticket.id.substring(0, 5).toUpperCase()} — {ticket.title}
              </h1>
            </div>
          </div>
          
          <div className="flex w-full sm:w-auto gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden flex-1 bg-white border border-gray-100 p-3 rounded-2xl text-gray-500 flex justify-center italic">
              <MoreHorizontal size={20} />
            </button>
            <button onClick={saveChanges} className="flex-1 sm:flex-none bg-brand-primary text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all text-[10px] flex items-center justify-center gap-2">
              <Save size={16} /> Salvar
            </button>
          </div>
        </header>

        <div className="flex gap-6 flex-1 overflow-hidden relative">
          
          {/* ÁREA DO CHAT */}
          <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
              
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 mb-4 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                   <User size={14} className="text-brand-primary" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{ticket.profiles?.name}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{ticket.description}</p>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] p-4 md:p-5 rounded-[24px] text-sm shadow-sm ${
                      isMe ? 'bg-brand-primary text-white rounded-tr-none font-medium' : 'bg-gray-100 text-gray-700 rounded-tl-none'
                    }`}>
                      {msg.body || msg.message}
                    </div>
                    <span className="text-[8px] font-black text-gray-300 uppercase mt-2 px-1 tracking-tighter">
                      {isMe ? 'Você' : msg.user_name || 'Sistema'} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-gray-50 bg-white flex gap-3 shrink-0">
              <input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Resposta técnica..." 
                className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none text-brand-dark" 
              />
              <button type="submit" className="bg-brand-dark text-white p-4 rounded-2xl shadow-lg hover:bg-brand-primary transition-all shadow-brand-dark/10"><Send size={20} /></button>
            </form>
          </div>

          {/* PAINEL FINANCEIRO LATERAL */}
          <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 space-y-4 shrink-0 overflow-y-auto absolute md:relative z-30 h-full bg-[#F8FAFC]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 md:p-0 transition-all`}>
            
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Finanças</h3>
                <input 
                  type="checkbox" 
                  checked={ticket.no_cost || false} 
                  onChange={(e) => setTicket({...ticket, no_cost: e.target.checked})} 
                  className="w-5 h-5 rounded-lg text-brand-primary border-gray-200 focus:ring-0 cursor-pointer" 
                />
              </div>

              {ticket.no_cost ? (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase flex items-center gap-2 mb-6">
                  <Info size={14} /> Atendimento Cortesia
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest">Horas</label>
                    <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl p-4 text-xs font-black text-brand-dark" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block ml-1 tracking-widest">Valor/H (R$)</label>
                    <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl p-4 text-xs font-black text-brand-dark" />
                  </div>
                </div>
              )}
              
              <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase">Total</span>
                <span className="text-xl font-black text-brand-primary italic">R$ {ticket.no_cost ? '0,00' : (Number(estimatedHours) * Number(hourlyRate)).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
               <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest ml-1">Status</h3>
               {/* Values corrigidos para bater com as constraints do Postgres */}
               <select value={ticket.status} onChange={(e) => setTicket({...ticket, status: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-4 text-[10px] font-black uppercase text-brand-dark cursor-pointer outline-none shadow-inner">
                <option value="Aberto">Aberto</option>
                <option value="Em_Andamento">Em Andamento</option>
                <option value="Concluido">Concluído</option>
               </select>
            </div>
            
            <button 
              type="button"
              onClick={handleDelete} 
              className="w-full p-5 text-red-400 text-[10px] font-black uppercase hover:bg-red-50 rounded-[24px] flex items-center justify-center gap-2 transition-all border border-transparent hover:border-red-100"
            >
              <Trash2 size={14} /> Eliminar Chamado
            </button>
            
            <button type="button" onClick={() => setIsSidebarOpen(false)} className="md:hidden w-full p-4 text-gray-400 text-[10px] font-black uppercase border border-gray-100 rounded-2xl">
              Fechar Painel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}