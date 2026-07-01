import { useState } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  async function signIn(email: string, pass: string) {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao autenticar');
      }

      // Armazena com segurança os dados da sessão local no navegador
      localStorage.setItem('@Agametec:token', data.token);
      localStorage.setItem('@Agametec:role', data.user.role);
      localStorage.setItem('@Agametec:user', JSON.stringify(data.user));

      return { user: data.user, role: data.user.role };
    } catch (error: any) {
      // Repassa o erro para a página tratar nativamente com o Toast
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Função utilitária para recuperar a sessão do usuário em qualquer tela
  function getCurrentUser() {
    const userJson = localStorage.getItem('@Agametec:user');
    return userJson ? JSON.parse(userJson) : null;
  }

  return { signIn, loading, getCurrentUser };
}