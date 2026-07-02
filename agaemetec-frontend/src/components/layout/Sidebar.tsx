import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Settings, 
  LogOut,
  DollarSign,
  Building2,
  ChevronLeft,
  Menu,
  BarChart3
} from 'lucide-react';
import logoImg from '../../assets/logo-agaemetec2.png';
import { useNavigate, useLocation } from 'react-router-dom';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 1. Pega os dados reais salvos localmente na sessão do Postgres de forma instantânea
  const [userData, setUserData] = useState({
    name: '',
    role: localStorage.getItem('@Agametec:role') || 'Client', 
    initials: ''
  });

  function loadUserProfile() {
    try {
      // Recupera o objeto do usuário que guardamos no momento do Login
      const userJson = localStorage.getItem('@Agametec:user');
      const cachedRole = localStorage.getItem('@Agametec:role') || 'Client';
      
      if (userJson) {
        const user = JSON.parse(userJson);
        const userName = user.name || 'Utilizador';
        
        // Calcula as iniciais dinamicamente
        const nameParts = userName.split(' ') || ['U'];
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : nameParts[0].substring(0, 2).toUpperCase();

        setUserData({
          name: userName,
          role: cachedRole,
          initials: initials
        });
      }
    } catch (error) {
      console.error('Erro ao ler perfil do localStorage:', error);
    }
  }

  // Carrega os dados assim que o componente renderiza
  useEffect(() => { loadUserProfile(); }, []);

  function handleLogout() {
    // 2. Limpa todos os tokens e dados de sessão locais do Postgres ao sair
    localStorage.removeItem('@Agametec:role');
    localStorage.removeItem('@Agametec:user');
    localStorage.removeItem('@Agametec:token');
    
    setUserData({ name: '', role: '', initials: '' });
    navigate('/', { replace: true });
  }

  const isAdmin = userData.role?.toLowerCase() === 'admin';

  // Configuração de rotas baseadas no tipo de perfil logado
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: isAdmin ? '/admin/dashboard' : '/client/dashboard', show: true },
    { icon: Ticket, label: 'Chamados', path: isAdmin ? '/admin/tickets' : '/client/tickets', show: true },
    { icon: BarChart3, label: 'Relatórios', path: '/admin/reports', show: isAdmin },
    { icon: Users, label: 'Clientes', path: '/admin/customers', show: isAdmin },
    { icon: Building2, label: 'Empresas', path: '/admin/companies', show: isAdmin },
    { icon: DollarSign, label: 'Financeiro', path: '/admin/finance', show: isAdmin },
    { icon: Settings, label: 'Configurações', path: isAdmin ? '/admin/settings' : '/client/settings', show: true },
  ];

  return (
    <aside className={`bg-[#0D1117] h-screen sticky top-0 flex flex-col border-r border-white/5 shrink-0 text-left transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      
      <div className={`p-6 flex items-center transition-all ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        {isExpanded ? (
          <img src={logoImg} alt="Agaemetec" className="h-7 w-auto brightness-0 invert" />
        ) : (
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-black text-white italic">A</div>
        )}
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 hover:text-white transition-colors">
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide">
        <nav className="space-y-1">
          {menuItems.filter(item => item.show).map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div 
                key={item.label}
                onClick={() => navigate(item.path)}
                title={!isExpanded ? item.label : ''}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group relative
                  ${isActive 
                    ? 'bg-brand-primary/10 text-white border border-brand-primary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
                  ${!isExpanded && 'justify-center'}`}
              >
                <item.icon size={18} className={isActive ? 'text-brand-primary' : 'group-hover:text-white'} />
                {isExpanded && <span className="text-sm font-medium flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0D1117]">
        {userData.initials && (
          <div className={`flex items-center gap-3 p-2 mb-4 bg-white/5 rounded-2xl border border-white/5 transition-all ${!isExpanded && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center font-black text-xs text-white shadow-lg shadow-brand-primary/20 uppercase shrink-0">
              {userData.initials}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userData.name}</p>
                <p className="text-[9px] text-brand-primary uppercase font-black tracking-widest">{userData.role}</p>
              </div>
            )}
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${!isExpanded && 'justify-center'}`}
        >
          <LogOut size={16} />
          {isExpanded && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}