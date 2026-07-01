import { Request, Response } from 'express';
import { pool } from '../config/database';
import { transporter } from '../config/mail';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const HOSTGATOR_URL = process.env.EVOLUTION_API_URL || "https://api.exemplo.com.br";
const GLOBAL_API_KEY = process.env.EVOLUTION_API_KEY || "chave_ficticia_portfolio";
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "MAIN";

export const MessageController = {
  async createComment(req: Request, res: Response): Promise<any> {
    try {
      const { ticket_id, message, sender_id, sender_role } = req.body;

      if (!ticket_id || !message) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      // 1. Salva o comentário na tabela de mensagens do Postgres
      const insertMessageQuery = `
        INSERT INTO ticket_messages (ticket_id, body, sender_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const messageIdParam = sender_id === 'all' ? null : sender_id;
      const messageResult = await pool.query(insertMessageQuery, [ticket_id, message, messageIdParam]);
      
      const comment = messageResult.rows[0];

      // 2. Busca dados do ticket, da empresa associada e de quem abriu (created_by)
      const ticketQuery = `
        SELECT t.title, t.company_id, t.created_by, c.name as company_name
        FROM tickets t
        LEFT JOIN companies c ON c.id = t.company_id
        WHERE t.id = $1
      `;
      const ticketResult = await pool.query(ticketQuery, [ticket_id]);
      
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: 'Chamado não encontrado.' });
      }

      const ticket = ticketResult.rows[0];
      const nomeEmpresa = ticket.company_name;

      // 3. SE QUEM COMENTOU FOI O CLIENTE -> DIRECIONA WHATSAPP PARA TODOS OS ADMINS ATIVOS NO BANCO
      // Nota: No banco ajustamos a role como 'Admin' ou 'Client' com a primeira letra maiúscula
      if (sender_role?.toUpperCase() === 'CLIENT') {
        const adminQuery = "SELECT phone FROM users WHERE role = 'Admin' AND is_active = true";
        const adminResult = await pool.query(adminQuery);
        
        const telefonesAdmins = adminResult.rows.map(a => a.phone).filter(Boolean);

        if (telefonesAdmins.length > 0) {
          const endpoint = `${HOSTGATOR_URL}/message/sendText/${INSTANCE_NAME}`;
          const textoWhats = `💬 *Nova Interação no Chamado!*\n\n*Empresa:* ${nomeEmpresa || 'Não informada'}\n*Chamado:* ${ticket.title || 'Sem título'}\n*Comentário do Cliente:* _"${message}"_`;

          telefonesAdmins.forEach(numero => {
            const numLimpo = numero.replace(/\D/g, '');
            // Se o seu Node.js for v18+, o fetch global aceita a propriedade agent perfeitamente
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': GLOBAL_API_KEY },
              body: JSON.stringify({
                number: numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`,
                options: { delay: 1200, presence: "composing", linkPreview: false },
                text: textoWhats
              }),
              agent: httpsAgent
            } as any).catch(err => console.error('❌ Erro Evolution API Comentário:', err));
          });
        }
      }

      // 4. SE QUEM COMENTOU FOI UM ADMIN -> ENVIA E-MAIL DINÂMICO PARA O CLIENTE DONO DO CHAMADO
      if (sender_role?.toUpperCase() === 'ADMIN') {
        if (ticket.created_by) {
          const clientQuery = 'SELECT email FROM users WHERE id = $1';
          const clientResult = await pool.query(clientQuery, [ticket.created_by]);

          if (clientResult.rows.length > 0 && clientResult.rows[0].email) {
            const clienteEmail = clientResult.rows[0].email;

            const mailOptions = {
              from: `"Agaemetec Sistemas" <${process.env.SMTP_USER}>`,
              to: clienteEmail,
              subject: `Nova resposta no Chamado - ${nomeEmpresa || ''}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
                  <h2 style="color: #0f172a; font-style: italic;">Agaemetec Intelligence</h2>
                  <p>Olá! O suporte técnico deixou uma nova mensagem no seu chamado <strong>"${ticket.title}"</strong>.</p>
                  <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #0f172a; margin: 20px 0; font-style: italic;">
                    "${message}"
                  </div>
                  <p style="font-size: 11px; color: #94a3b8;">Para responder ou ver mais detalhes, acesse a sua área do cliente no sistema.</p>
                </div>
              `
            };

            transporter.sendMail(mailOptions).catch(err => console.error('❌ Erro SMTP Envio Comentário:', err));
          }
        }
      }

      return res.status(201).json({ message: 'Interação registrada com sucesso!', comment });
    } catch (error: any) {
      console.error('Erro ao processar comentário:', error);
      return res.status(500).json({ error: 'Erro interno ao processar comentário.' });
    }
  }
};