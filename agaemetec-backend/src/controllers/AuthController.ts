import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    // 1. Procura o usuário na nossa nova tabela do Postgres
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const user = userQuery.rows[0];

    // 2. Compara a senha digitada com o hash salvo no banco
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // 3. Verifica se o usuário está ativo
    if (!user.is_active) {
      return res.status(403).json({ error: 'Utilizador inativo no sistema' });
    }

    // 4. Gera o token JWT com os dados do usuário (incluindo a Role)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' } // Token expira em 1 dia
    );

    // 5. Retorna os dados do perfil e o token para o Front-end
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    console.error('Erro no fluxo de login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};