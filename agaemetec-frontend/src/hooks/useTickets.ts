import { useEffect, useState } from 'react';

export function useTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  const distribution = [
    { name: 'Abertos', value: stats.open, color: '#3B82F6' },
    { name: 'Em Andamento', value: stats.inProgress, color: '#F59E0B' },
    { name: 'Concluídos', value: stats.resolved, color: '#10B981' },
  ];

  async function loadData() {
    try {
      setLoading(true);
      
      // 1. Busca os dados reais armazenados pelo useAuth no localStorage
      const cachedRole = localStorage.getItem('@Agametec:role') || 'Client';
      const userJson = localStorage.getItem('@Agametec:user');
      
      let userId = '';
      if (userJson) {
        const user = JSON.parse(userJson);
        userId = user.id; // Captura o UUID real do Postgres (ex: o da Mariana ou o seu)
      }

      // Se por algum motivo bizarro não tiver usuário logado, não faz a requisição
      if (!userId) {
        console.warn("⚠️ Nenhum usuário logado encontrado no localStorage.");
        return;
      }

      // 2. Passa os parâmetros reais e limpos para o seu back-end local
      const response = await fetch(
        `http://localhost:3001/api/tickets?role=${cachedRole}&userId=${userId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar dados do painel.');
      }

      if (data) {
        setTickets(data.tickets);
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar tickets do dashboard via API:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData(); 
  }, []);

  return { tickets, stats, distribution, loading, refresh: loadData };
}