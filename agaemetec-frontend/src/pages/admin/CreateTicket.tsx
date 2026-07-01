import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Paperclip, X, Building2, TicketCheck } from 'lucide-react';
import { useUpload } from '../../hooks/useUpload';
import { toast } from 'sonner';

export function CreateTicket() {
  const navigate = useNavigate();
  const { uploadFile, uploading } = useUpload();
  const [loading, setLoading] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    priority: 'Media', // Corrigido estado inicial sem acento para casar com o CHECK do Postgres
    description: '',
    company_id: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. Busca as empresas disponíveis consumindo nosso Back-end local
  async function loadMyCompanies() {
    try {
      const response = await fetch('http://localhost:3001/api/companies');
      if (!response.ok) throw new Error('Falha ao obter lista de unidades da Agametec Sistemas.');
      const formatted = await response.json();

      setAvailableCompanies(formatted || []);
      
      if (formatted?.length === 1) {
        setFormData(prev => ({ ...prev, company_id: formatted[0].id }));
      }
    } catch (error: any) {
      toast.error("Erro com as unidades", { description: error.message });
    }
  }

  useEffect(() => { loadMyCompanies(); }, []);

  // 2. Envia o formulário centralizado para a API injetando o ID real do usuário logado
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.company_id) {
      return toast.error("Campo obrigatório", { description: "Selecione a unidade da Agametec Sistemas." });
    }
    
    setLoading(true);

    try {
      // Resgata o usuário real logado no localStorage para pegar o UUID real do Postgres
      const userJson = localStorage.getItem('@Agametec:user');
      if (!userJson) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
      const currentUser = JSON.parse(userJson);

      // Enviamos os dados do ticket para o nosso Back-end unificado com o UUID dinâmico
      const response = await fetch('http://localhost:3001/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          company_id: formData.company_id,
          priority: formData.priority,
          created_by: currentUser.id // Passa o ID real e dinâmico do profile logado
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao registrar chamado");

      // 3. Se tiver anexo, fazemos o upload usando o ID do ticket retornado pelo back-end
      if (selectedFile && data.ticket) {
        await uploadFile(selectedFile, data.ticket.id);
      }

      toast.success("Protocolado!", { description: "Chamado aberto e administradores avisados via WhatsApp!" });
      navigate('/admin/tickets');
    } catch (error: any) {
      toast.error("Falha no registro", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto relative scrollbar-hide">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <nav className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] mb-2 flex items-center gap-2">
              <span>Fluxo</span> <span className="text-brand-primary opacity-50">›</span> <span>Protocolo</span>
            </nav>
            <h1 className="text-4xl font-black tracking-tighter italic leading-none">Abrir Solicitação</h1>
          </div>
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="w-full sm:w-auto bg-white border border-gray-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-all shadow-sm tracking-widest"
          >
            Cancelar
          </button>
        </header>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-20">
          {/* SEÇÃO 1: CONFIGURAÇÃO DO TICKET */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg flex items-center gap-3 italic">
              <div className="p-2 bg-brand-primary/10 rounded-xl"><Building2 size={20} className="text-brand-primary" /></div>
              Configuração do Ticket
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Unidade / Empresa *</label>
                <select 
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer appearance-none text-brand-dark"
                  value={formData.company_id}
                  onChange={e => setFormData({...formData, company_id: e.target.value})}
                >
                  <option value="">Selecione a empresa...</option>
                  {availableCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Urgência Estimada</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer appearance-none text-brand-dark"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Media">Média</option> {/* value sem acento */}
                  <option value="Alta">Alta</option>
                  <option value="Critica">Crítica</option> {/* value sem acento */}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Assunto Curto *</label>
                <input 
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                  placeholder="Ex: Instabilidade no servidor central"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DETALHAMENTO */}
          <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 text-lg italic">Detalhamento Técnico</h3>
            <textarea 
              required
              rows={6}
              className="w-full bg-gray-50 border-none rounded-[32px] p-6 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-brand-primary/20 mb-8 resize-none"
              placeholder="Descreva o incidente com o máximo de detalhes..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidências (Opcional)</label>
              {!selectedFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] cursor-pointer hover:bg-white hover:border-brand-primary/40 transition-all group">
                  <Paperclip className="text-gray-300 group-hover:text-brand-primary mb-2 transition-colors" size={24} />
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Anexar Documento ou Imagem</p>
                  <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
              ) : (
                <div className="flex items-center justify-between p-5 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <Paperclip size={18} className="text-brand-primary" />
                    <span className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:bg-red-100/50 p-2 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pb-12">
            <button 
              type="submit"
              disabled={loading || uploading}
              className="w-full md:w-auto bg-brand-primary text-white px-16 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-2"
            >
              {(loading || uploading) ? (
                <>Sincronizando...</>
              ) : (
                <><TicketCheck size={18} /> Finalizar e Abrir Ticket</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}