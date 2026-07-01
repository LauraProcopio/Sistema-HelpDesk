/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do Blueprint Visual (Agaemetec Help Desk)
        brand: {
          dark: "#1E3A5F",    // Azul escuro (Sidebar e Headers) [cite: 57]
          primary: "#2E75B6", // Azul médio (Botões e Destaques) [cite: 57]
          accent: "#4A90D9",  // Azul claro (Hover states) [cite: 57]
        },
        surface: "#F4F6FA",   // Fundo geral das páginas [cite: 57]
        success: "#27AE60",   // Status 'Concluido' [cite: 57]
        warning: "#E67E22",   // Status 'Pendente' / Prioridade Alta [cite: 57]
        error: "#E74C3C",     // Prioridade Crítica / Erros [cite: 57]
      },
      borderRadius: {
        'std': '8px',         // Border radius padrão corporativo [cite: 57]
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)', // Sombra definida na arquitetura [cite: 57]
      }
    },
  },
  plugins: [],
}