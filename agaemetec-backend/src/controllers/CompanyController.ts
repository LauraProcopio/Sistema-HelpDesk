import { Request, Response } from 'express';
import { pool } from '../config/database';

export class CompanyController {
  
  // Lista as empresas aplicando segurança de dados baseada no perfil
  static index = async (req: Request, res: Response): Promise<any> => {
    const { role, userId } = req.query;

    try {
      let queryText = '';
      let queryParams: any[] = [];

      // Se for Admin pleno ou não for injetado o filtro, lista tudo ordenado por nome
      if (role === 'Admin' || !userId || userId === 'all') {
        queryText = 'SELECT * FROM companies ORDER BY name ASC';
      } else {
        // Se for um Client, faz INNER JOIN com a tabela de vinculação de utilizadores
        queryText = `
          SELECT c.* FROM companies c
          INNER JOIN user_companies uc ON uc.company_id = c.id
          WHERE uc.user_id = $1 AND c.is_active = true
          ORDER BY c.name ASC
        `;
        queryParams = [userId];
      }

      const result = await pool.query(queryText, queryParams);
      return res.json(result.rows);

    } catch (error: any) {
      console.error('Erro ao listar empresas no PostgreSQL:', error.message);
      return res.status(500).json({ error: 'Erro interno ao processar unidades.' });
    }
  };

  // Criação de novas empresas
  static store = async (req: Request, res: Response): Promise<any> => {
    const { name, cnpj, email, phone } = req.body;

    try {
      if (!name) {
        return res.status(400).json({ error: 'O nome da empresa é obrigatório.' });
      }

      const query = `
        INSERT INTO companies (name, cnpj, email, phone, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [name, cnpj || null, email || null, phone || null]);
      return res.status(201).json(result.rows[0]);

    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error.message);
      return res.status(500).json({ error: 'Erro ao registar empresa no banco de dados.' });
    }
  };

  // Atualização dos dados cadastrais
  static update = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { name, cnpj, email, phone } = req.body;

    try {
      const query = `
        UPDATE companies
        SET name = $1, cnpj = $2, email = $3, phone = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;

      const result = await pool.query(query, [name, cnpj, email, phone, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não localizada.' });
      }

      return res.json(result.rows[0]);

    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error.message);
      return res.status(500).json({ error: 'Erro ao salvar alterações da empresa.' });
    }
  };

  // Ativa / Desativa unidades
  static toggleStatus = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
      const query = `
        UPDATE companies
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [is_active, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não localizada.' });
      }

      return res.json(result.rows[0]);

    } catch (error: any) {
      console.error('Erro no toggle de status da empresa:', error.message);
      return res.status(500).json({ error: 'Erro ao alterar status da unidade.' });
    }
  };
}