import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';

export const CustomerController = {
  // 1. LISTAR TODOS OS USUÁRIOS E SEUS VÍNCULOS N:N (Usando agregações JSON nativas do Postgres)
  async index(req: Request, res: Response): Promise<any> {
    try {
      const query = `
        SELECT 
          u.id, u.name, u.email, u.role, u.department, u.phone, u.is_active, u.created_at,
          COALESCE(
            json_strip_nulls(
              json_agg(
                json_build_object(
                  'company_id', c.id,
                  'companies', json_build_object('name', c.name)
                )
              ) FILTER (WHERE c.id IS NOT NULL)
            ), '[]'
          ) as user_companies
        FROM users u
        LEFT JOIN user_companies uc ON uc.user_id = u.id
        LEFT JOIN companies c ON c.id = uc.company_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `;
      
      const result = await pool.query(query);
      return res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno ao listar acessos.' });
    }
  },

  // 2. BUSCAR UM CLIENTE INDIVIDUAL (Página EditCustomer.tsx)
  async show(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          u.id, u.name, u.email, u.role, u.department, u.phone, u.is_active, u.created_at,
          COALESCE(
            json_agg(
              json_build_object('company_id', uc.company_id)
            ) FILTER (WHERE uc.company_id IS NOT NULL), '[]'
          ) as user_companies
        FROM users u
        LEFT JOIN user_companies uc ON uc.user_id = u.id
        WHERE u.id = $1
        GROUP BY u.id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      return res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar perfil.' });
    }
  },

  // 3. ATUALIZAR DADOS E VÍNCULOS N:N (Submissão do EditCustomer.tsx)
  async update(req: Request, res: Response): Promise<any> {
    const client = await pool.connect(); // Abre um client para gerenciar transações
    try {
      const { id } = req.params;
      const { name, email, phone, role, department, is_active, companies } = req.body;

      await client.query('BEGIN'); // Inicia a transação de segurança

      // Atualiza os dados principais na tabela users
      const updateUserQuery = `
        UPDATE users
        SET name = $1, email = $2, phone = $3, role = $4, department = $5, is_active = $6
        WHERE id = $7
      `;
      await client.query(updateUserQuery, [name, email, phone, role, department, is_active, id]);

      // Remove vínculos antigos de empresas
      await client.query('DELETE FROM user_companies WHERE user_id = $1', [id]);

      // Insere os novos vínculos se houver
      if (companies && companies.length > 0) {
        for (const companyId of companies) {
          await client.query(
            'INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2)',
            [id, companyId]
          );
        }
      }

      await client.query('COMMIT'); // Se tudo deu certo, consolida no banco
      return res.json({ message: 'Perfil e vínculos atualizados com sucesso!' });
    } catch (error: any) {
      await client.query('ROLLBACK'); // Se der erro, desfaz tudo e não quebra os dados
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({ error: 'Erro interno ao atualizar perfil.' });
    } finally {
      client.release();
    }
  },

  // 4. CRIAR NOVO USUÁRIO COM SENHA CRIPTOGRAFADA (Bcrypt)
  async store(req: Request, res: Response): Promise<any> {
    const client = await pool.connect();
    try {
      const { name, email, password, role, company_id, department, phone } = req.body;

      if (!name || !email || !password || !company_id) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      // Verifica se o e-mail já existe cadastrado no Postgres
      const userExists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      await client.query('BEGIN');

      // 1. Criptografa a senha com Bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 2. Insere na tabela users
      const insertUserQuery = `
        INSERT INTO users (name, email, password_hash, role, department, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `;
      const userResult = await client.query(insertUserQuery, [
        name,
        email,
        passwordHash,
        role || 'Client',
        department || null,
        phone || null
      ]);

      const newUserId = userResult.rows[0].id;

      // 3. Cria o vínculo na tabela intermediária user_companies
      await client.query(
        'INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2)',
        [newUserId, company_id]
      );

      await client.query('COMMIT');
      return res.status(201).json({ message: 'Utilizador e vínculos cadastrados com sucesso!' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Erro ao cadastrar acesso:', error);
      return res.status(500).json({ error: 'Erro interno ao efetivar cadastro de acesso.' });
    } finally {
      client.release();
    }
  },

  // 5. ALTERNAR STATUS ATIVO/BLOQUEADO RAPIDAMENTE
  async toggleStatus(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const query = 'UPDATE users SET is_active = $1 WHERE id = $2';
      await pool.query(query, [is_active, id]);

      return res.json({ message: 'Status de acesso alterado com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      return res.status(500).json({ error: 'Erro interno ao alterar status.' });
    }
  },

  // 6. ATUALIZAR APENAS A SENHA DO USUÁRIO COM BCYPT
  async updatePassword(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
      }

      // Criptografa a nova senha informada
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
      const result = await pool.query(query, [passwordHash, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      return res.json({ message: 'Senha de acesso atualizada com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      return res.status(500).json({ error: 'Erro interno ao processar redefinição de segurança.' });
    }
  }
};