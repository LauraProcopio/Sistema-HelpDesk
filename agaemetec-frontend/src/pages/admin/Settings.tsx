import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { User, Lock, Save, Camera, Mail, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userCompanies, setUserCompanies] = useState<string[]>([]); // Preserva os vínculos locais do usuário
  
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    initials: '??'
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // 1. Carrega os dados do utilizador autenticado via API do Back-end local do Postgres
  async function loadProfile() {
    try {
      setLoading(true);
      
      const userJson = localStorage.getItem('@Agametec:user');
      if (!userJson) throw new Error("Sessão não localizada. Faça login novamente.");
      const currentUser = JSON.parse(userJson);

      const response = await fetch(`http://localhost:3001/api/customers/${currentUser.id}`);
      if (!response.ok) throw new Error('Falha ao sincronizar dados do perfil.');
      const data = await response.json();

      if (data) {
        const nameParts = data.name?.split(' ') || ['U'];
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : nameParts[0].substring(0, 2).toUpperCase();

        setProfile({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || '',
          initials
        });

        // Mapeia e guarda temporariamente as empresas para não perdermos o vínculo no PUT
        if (data.user_companies) {
          setUserCompanies(data.user_companies.map((l: any) => l.company_id));
        }
      }
    } catch (error: any) {
      toast.error('Erro de carregamento', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  // 2. Atualiza os dados cadastrais (Nome e E-mail) via PUT
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Passamos os dados junto ao array de empresas preservado para manter a integridade relacional
      const response = await fetch(`http://localhost:3001/api/customers/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          role: profile.role,
          is_active: true,
          companies: userCompanies // Garante que as permissões multi-empresas fiquem intactas
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar alterações cadastrais no servidor.');
      
      // Atualiza o localStorage do front para sincronizar os cabeçalhos do ecossistema imediatamente
      const updatedUser = { id: profile.id, name: profile.name, email: profile.email, role: profile.role };
      localStorage.setItem('@Agametec:user', JSON.stringify(updatedUser));

      toast.success('Perfil Atualizado!', { description: 'Suas informações foram salvas na Agametec.' });
      loadProfile(); 
    } catch (error: any) {
      toast.error('Falha ao salvar', { description: error.message });
    } finally {
      setSaving(false);
    }
  }

  // 3. Atualiza a senha gerando um hash seguro por meio de Bcrypt no Back-end
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Divergência de senha", { description: "As senhas digitadas não coincidem." });
    }

    if (passwordData.newPassword.length < 6) {
      return toast.error("Senha muito curta", { description: "A senha deve ter pelo menos 6 caracteres." });
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`http://localhost:3001/api/customers/${profile.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao redefinir credenciais.');
      
      toast.success("Segurança Atualizada", { description: "Sua nova senha já está em vigor." });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error("Erro na alteração", { description: error.message });
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <div className="p-20 text-center font-black text-brand-primary animate-pulse uppercase tracking-[4px] text-[10px]">Sincronizando Base Agametec...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto scrollbar-hide">
        <header className="mb-8">
          <nav className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mb-2 flex items-center gap-2">
            Utilizador <span className="opacity-30">›</span> <span className="text-brand-primary">Configurações</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic leading-none">Minha Conta</h1>
        </header>

        <div className="max-w-4xl space-y-6 md:space-y-8 pb-20">
          
          <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 md:mb-10 text-lg flex items-center gap-2 italic">
              <User size={22} className="text-brand-primary" /> Dados do Perfil
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 mb-10 pb-10 border-b border-gray-50">
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-brand-primary rounded-[32px] flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-xl shadow-brand-primary/30 uppercase">
                  {profile.initials}
                </div>
                <button type="button" className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-xl shadow-lg border border-gray-100 text-brand-primary hover:scale-110 transition-all">
                  <Camera size={16} />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">{profile.name}</h4>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 mt-1">
                  <Mail size={14} />
                  <p className="text-sm font-medium lowercase truncate max-w-[200px] sm:max-w-none">{profile.email}</p>
                </div>
                <span className="inline-block mt-4 text-[8px] font-black bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full uppercase tracking-[2px] border border-brand-primary/5">
                  Cargo: {profile.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Nome de Exibição</label>
                <input 
                  required
                  className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-dark" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">E-mail Corporativo</label>
                <input 
                  required
                  className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-dark" 
                  value={profile.email} 
                  onChange={e => setProfile({...profile, email: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full sm:w-auto bg-brand-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> {saving ? 'Sincronizando...' : 'Efetivar Atualização'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="font-black mb-8 md:mb-10 text-lg flex items-center gap-2 italic">
              <Lock size={22} className="text-brand-primary" /> Segurança de Acesso
            </h3>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Nova Credencial (Senha)</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-dark" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Repetir Senha</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full border-none bg-gray-50 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-brand-dark" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <button 
                  type="submit"
                  disabled={changingPassword || !passwordData.newPassword}
                  className="w-full sm:w-auto px-10 py-5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-brand-dark/10"
                >
                  <KeyRound size={18} />
                  {changingPassword ? 'Processando Segurança...' : 'Alterar Senha Agora'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}