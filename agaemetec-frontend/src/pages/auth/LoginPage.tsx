import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { KeyRound, Mail, LogIn, Eye, EyeOff, ShieldAlert, User } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Função utilitária com as credenciais reais do teu PostgreSQL
  function handleQuickFill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('123456'); // Define aqui a senha padrão correspondente aos hashes do banco
    toast.info('Campos preenchidos!', { 
      description: 'Clique em "Entrar no Painel" para aceder ao sistema.' 
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return toast.error('Campos obrigatórios', { 
        description: 'Por favor, preencha o e-mail e a senha de acesso.' 
      });
    }

    try {
      // Dispara a autenticação contra a API do Postgres local
      const result = await signIn(email, password);

      if (result && result.user) {
        toast.success(`Bem-vinda, ${result.user.name}!`, {
          description: 'Acesso autorizado no ecossistema Agaemetec.'
        });

        // Captura a role de forma segura do hook
        const userRole = result.role || result.user.role || 'client';
        const normalizedRole = userRole.toLowerCase();

        // Redirecionamento dinâmico baseado na Role guardada localmente
        if (normalizedRole === 'admin') {
          navigate('/admin/tickets');
        } else {
          navigate('/client/tickets'); 
        }
      }
    } catch (error: any) {
      console.error("Erro capturado no fluxo de login:", error);
      toast.error('Falha na Autenticação', { 
        description: error.message || 'Verifique as suas credenciais e tente novamente.' 
      });
    }
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] items-center justify-center font-sans text-left text-brand-dark p-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-center relative">
        
        {/* LOGO E IDENTIDADE */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-black tracking-tighter italic leading-none text-brand-dark">
            AGAEMETEC <span className="text-brand-primary">SISTEMAS</span>
          </h1>
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-[3px] mt-2">
            Agaemetec Intelligence Platform
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">
              E-mail corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="email"
                required
                placeholder="nome@agaemetec.com.br"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">
              Senha de acesso
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all text-[10px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <LogIn size={16} /> Entrar no Painel
                </>
              )}
            </button>
          </div>
        </form>

        {/* ACESSO RÁPIDO PARA O PORTFÓLIO (POSTGRESQL REAL) */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
            Acesso Rápido (Demonstração)
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              type="button"
              onClick={() => handleQuickFill('laura.procopio@agaemetec.com.br')}
              className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-left border border-gray-200/60 hover:border-brand-primary/40 transition-all group"
            >
              <ShieldAlert size={14} className="text-amber-500" />
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-gray-700 group-hover:text-brand-primary">Perfil Admin</p>
                <p className="text-[9px] text-gray-400 truncate max-w-[125px]">laura.procopio@...</p>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => handleQuickFill('carlos.miranda@unidadealpha.com.br')}
              className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-left border border-gray-200/60 hover:border-brand-primary/40 transition-all group"
            >
              <User size={14} className="text-blue-500" />
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-gray-700 group-hover:text-brand-primary">Perfil Cliente</p>
                <p className="text-[9px] text-gray-400 truncate max-w-[125px]">carlos.miranda@...</p>
              </div>
            </button>
          </div>
          <p className="text-[8px] text-center text-gray-400 font-medium">Senha padrão do banco: <span className="font-bold">123456</span></p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-50 text-center">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
            Segurança Criptografada SSL End-to-End
          </p>
        </div>
      </div>
    </div>
  );
}