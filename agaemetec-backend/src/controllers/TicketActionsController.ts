import { Request, Response } from 'express';
import { pool } from '../config/database';
import { transporter } from '../config/mail';
import https from 'https';

const HOSTGATOR_URL = process.env.EVOLUTION_API_URL || "https://api.exemplo.com.br";
const GLOBAL_API_KEY = process.env.EVOLUTION_API_KEY || "chave_ficticia_portfolio";
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "MAIN";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const TicketActionsController = {
  // CLIENTE CRIA CHAMADO -> DISPARA WHATSAPP DINÂMICO PARA TODOS OS ADMINS DO BANCO
  async create(req: Request, res: Response): Promise<any> {
    try {
      const { title, description, company_id, priority, created_by } = req.body;

      if (!title || !company_id) {
        return res.status(400).json({ error: 'Título e Empresa são obrigatórios.' });
      }

      // 1. Insere o chamado na tabela 'tickets' do Postgres trazendo o nome da empresa associada
      const insertTicketQuery = `
        INSERT INTO tickets (title, description, company_id, priority, status, created_by)
        VALUES ($1, $2, $3, $4, 'Aberto', $5)
        RETURNING *
      `;
      const ticketResult = await pool.query(insertTicketQuery, [title, description, company_id, priority, created_by]);
      const ticketBase = ticketResult.rows[0];

      // Busca o nome da empresa para montar a mensagem do WhatsApp de forma limpa
      const companyQuery = 'SELECT name FROM companies WHERE id = $1';
      const companyResult = await pool.query(companyQuery, [company_id]);
      const companyName = companyResult.rows[0]?.name || 'Não informada';

      // 2. Busca o telefone de todos os administradores ativos no Postgres
      const adminQuery = "SELECT phone FROM users WHERE role = 'Admin' AND is_active = true";
      const adminResult = await pool.query(adminQuery);
      const telefonesAdmins = adminResult.rows.map(a => a.phone).filter(Boolean);

      // 3. Dispara as mensagens via Evolution API
      if (telefonesAdmins.length > 0) {
        const endpoint = `${HOSTGATOR_URL}/message/sendText/${INSTANCE_NAME}`;
        const mensagemTexto = `🔔 *Novo Chamado Cadastrado!*\n\n*Empresa:* ${companyName}\n*Título:* ${ticketBase.title}\n*Prioridade:* ${priority || 'Media'}\n*Descrição:* ${ticketBase.description || 'Sem descrição.'}`;

        telefonesAdmins.forEach((numero) => {
          const numLimpo = numero.replace(/\D/g, '');
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': GLOBAL_API_KEY },
            body: JSON.stringify({
              number: numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`,
              options: { delay: 1200, presence: "composing", linkPreview: false },
              text: mensagemTexto
            }),
            agent: httpsAgent
          } as any).catch(err => console.error(`❌ Erro Whats Novo Chamado para ${numero}:`, err));
        });
      }

      // Monta o objeto de resposta no formato esperado pelo seu front-end
      const ticketResponse = {
        ...ticketBase,
        companies: { name: companyName }
      };

      return res.status(201).json({ message: 'Chamado aberto e administradores notificados!', ticket: ticketResponse });
    } catch (error: any) {
      console.error('Erro ao cadastrar chamado:', error);
      return res.status(500).json({ error: 'Erro ao cadastrar chamado.', details: error.message });
    }
  },

  // TÉCNICO ATUALIZA CHAMADO -> AVISA O CLIENTE QUE ABRIU O TICKET POR E-MAIL
  async updateStatus(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { status, internal_notes, estimated_hours, hourly_rate, no_cost } = req.body;

      // 1. Atualiza o registro do chamado no Postgres
      const updateQuery = `
        UPDATE tickets
        SET status = $1, internal_notes = $2, estimated_hours = $3, hourly_rate = $4, no_cost = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      const updateResult = await pool.query(updateQuery, [status, internal_notes, estimated_hours, hourly_rate, no_cost, id]);
      
      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: 'Chamado não encontrado.' });
      }

      const ticketBase = updateResult.rows[0];

      // Busca o nome da empresa vinculada ao ticket
      const companyQuery = 'SELECT name FROM companies WHERE id = $1';
      const companyResult = await pool.query(companyQuery, [ticketBase.company_id]);
      const companyName = companyResult.rows[0]?.name || '';

      // 2. Envia o e-mail de atualização para o criador do ticket (created_by)
      if (ticketBase.created_by) {
        const clientQuery = 'SELECT email FROM users WHERE id = $1';
        const clientResult = await pool.query(clientQuery, [ticketBase.created_by]);

        if (clientResult.rows.length > 0 && clientResult.rows[0].email) {
          const clienteEmail = clientResult.rows[0].email;

          const mailOptions = {
            from: `"Agaemetec Sistemas" <${process.env.SMTP_USER}>`,
            to: clienteEmail,
            subject: `Atualização no Chamado - ${companyName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                <h2 style="color: #0f172a; font-style: italic;">Agaemetec Intelligence</h2>
                <p>Olá! O status do seu chamado técnico foi atualizado.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                <p><strong>Chamado:</strong> ${ticketBase.title}</p>
                <p><strong>Novo Status:</strong> <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-weight: bold; color: #0284c7;">${status}</span></p>
                ${internal_notes ? `<p><strong>Atualização do Técnico:</strong> ${internal_notes}</p>` : ''}
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8;">Esse é um e-mail automático enviado pelo suporte da Agaemetec Sistemas.</p>
              </div>
            `
          };

          transporter.sendMail(mailOptions).catch(err => console.error('❌ Erro SMTP Atualização Status:', err));
        }
      }

      const ticketResponse = {
        ...ticketBase,
        companies: { name: companyName }
      };

      return res.json({ message: 'Chamado atualizado e cliente notificado!', ticket: ticketResponse });
    } catch (error: any) {
      console.error('Erro ao atualizar chamado:', error);
      return res.status(500).json({ error: 'Erro ao atualizar chamado.' });
    }
  }
};