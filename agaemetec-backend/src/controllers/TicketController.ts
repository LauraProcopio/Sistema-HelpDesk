import { Request, Response } from 'express';
import { pool } from '../config/database';

export const TicketController = {
  // 1. LISTAGEM GERAL COM FILTRO DE CARGO E CÁLCULO DE STATS
  async index(req: Request, res: Response): Promise<any> {
    try {
      const { userId, role } = req.query;

      if (!userId || !role) {
        return res.status(400).json({ error: 'Parâmetros userId e role são obrigatórios.' });
      }

      const isAdmin = (role as string).toLowerCase() === 'admin';
      let tickets: any[] = [];

      if (isAdmin) {
        // Admin vê tudo de todas as empresas
        const query = `
          SELECT t.*, u.name as user_name, c.name as company_name 
          FROM tickets t
          LEFT JOIN users u ON u.id = t.created_by
          LEFT JOIN companies c ON c.id = t.company_id
          ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query);
        tickets = result.rows;
      } else {
        // Cliente vê apenas os chamados das empresas em que está vinculado
        const query = `
          SELECT t.*, u.name as user_name, c.name as company_name 
          FROM tickets t
          LEFT JOIN users u ON u.id = t.created_by
          LEFT JOIN companies c ON c.id = t.company_id
          WHERE t.company_id IN (
            SELECT company_id FROM user_companies WHERE user_id = $1
          )
          ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        tickets = result.rows;
      }

      // Mapeia o retorno para manter o formato exato que o seu front-end (React) consome
      const formattedTickets = tickets.map(t => ({
        ...t,
        profiles: { name: t.user_name },
        companies: { id: t.company_id, name: t.company_name }
      }));

      // Calcula as estatísticas na memória com segurança
      const stats = {
        total: formattedTickets.length,
        open: formattedTickets.filter(t => t.status === 'Aberto').length,
        inProgress: formattedTickets.filter(t => t.status === 'Em_Andamento' || t.status === 'Em Andamento').length,
        resolved: formattedTickets.filter(t => t.status === 'Concluido' || t.status === 'Concluído' || t.status === 'Resolvido').length,
      };

      return res.json({ tickets: formattedTickets, stats });
    } catch (error: any) {
      console.error('Erro ao listar chamados:', error);
      return res.status(500).json({ error: 'Erro ao listar chamados.', details: error.message });
    }
  },

  // 2. BUSCA INDIVIDUAL DE UM TICKET E SEUS COMENTÁRIOS (Página TicketDetail)
  async show(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      // Busca os dados do chamado
      const ticketQuery = `
        SELECT t.*, c.name as company_name, u.name as user_name
        FROM tickets t
        LEFT JOIN companies c ON c.id = t.company_id
        LEFT JOIN users u ON u.id = t.created_by
        WHERE t.id = $1
      `;
      const ticketResult = await pool.query(ticketQuery, [id]);

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: 'Chamado não localizado.' });
      }

      const t = ticketResult.rows[0];
      const ticketFormatted = {
        ...t,
        companies: { name: t.company_name },
        profiles: { name: t.user_name }
      };

      // Busca as mensagens/comentários associados a esse chamado
      const messagesQuery = `
        SELECT tm.*, u.name as user_name
        FROM ticket_messages tm
        LEFT JOIN users u ON u.id = tm.sender_id
        WHERE tm.ticket_id = $1
        ORDER BY tm.created_at ASC
      `;
      const messagesResult = await pool.query(messagesQuery, [id]);

      const formattedMessages = messagesResult.rows.map(m => ({
        ...m,
        profiles: m.user_name ? { name: m.user_name } : null
      }));

      return res.json({ ticket: ticketFormatted, messages: formattedMessages });
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do chamado:', error);
      return res.status(500).json({ error: 'Erro ao buscar detalhes do chamado.' });
    }
  },

  // 3. EXCLUSÃO DE TICKET
  async delete(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM tickets WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Ticket não encontrado.' });
      }

      return res.json({ message: 'Ticket removido com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao deletar chamado:', error);
      return res.status(500).json({ error: 'Erro ao deletar chamado.' });
    }
  },

  // 4. GERAR COMPILADO MENSAL PARA EXPORTAÇÕES (Faturamento/Métricas)
  async getMonthlyReport(req: Request, res: Response): Promise<any> {
    try {
      const { month, year, companyId } = req.query;

      if (!month || !year) {
        return res.status(400).json({ error: 'Mês e ano são parâmetros obrigatórios.' });
      }

      const mString = month.toString().padStart(2, '0');
      const firstDay = `${year}-${mString}-01 00:00:00`;
      const lastDayDate = new Date(Number(year), Number(month), 0).getDate();
      const lastDay = `${year}-${mString}-${lastDayDate} 23:59:59`;

      let query = `
        SELECT t.*, c.name as company_name, c.document_number
        FROM tickets t
        LEFT JOIN companies c ON c.id = t.company_id
        WHERE t.created_at >= $1 AND t.created_at <= $2
      `;
      
      const params: any[] = [firstDay, lastDay];

      if (companyId && companyId !== 'all') {
        params.push(companyId);
        query += ` AND t.company_id = $3`;
      }

      query += ` ORDER BY t.created_at ASC`;

      const result = await pool.query(query, params);

      const formattedReport = result.rows.map(t => ({
        ...t,
        companies: { name: t.company_name, legal_responsible: null, document_number: t.document_number }
      }));

      return res.json(formattedReport);
    } catch (error: any) {
      console.error('Erro ao processar relatório mensal:', error);
      return res.status(500).json({ error: 'Erro interno ao processar folha de métricas.' });
    }
  },

  // 5. BALANÇO FINANCEIRO DE HORAS TRABALHADAS
  async getFinanceMetrics(req: Request, res: Response): Promise<any> {
    try {
      const query = `
        SELECT t.*, c.name as company_name
        FROM tickets t
        LEFT JOIN companies c ON c.id = t.company_id
        WHERE t.estimated_hours IS NOT NULL AND t.estimated_hours > 0
        ORDER BY t.created_at DESC
      `;
      const result = await pool.query(query);

      const formattedMetrics = result.rows.map(t => ({
        ...t,
        companies: { name: t.company_name }
      }));

      return res.json(formattedMetrics);
    } catch (error: any) {
      console.error('Erro ao buscar balancete:', error);
      return res.status(500).json({ error: 'Erro interno ao processar métricas financeiras.' });
    }
  }
};