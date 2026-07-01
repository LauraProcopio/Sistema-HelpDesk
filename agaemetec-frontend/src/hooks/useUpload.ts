import { useState } from 'react';

export function useUpload() {
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File, ticketId: string, messageId?: string) {
    setUploading(true);
    try {
      // 1. Resgata o token de autenticação local
      const token = localStorage.getItem('@Agametec:token');

      // 2. Monta o corpo da requisição usando FormData (obrigatório para arquivos)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);
      if (messageId) {
        formData.append('messageId', messageId);
      }

      // 3. Dispara para o nosso back-end local
      const response = await fetch('http://localhost:3001/api/attachments/upload', {
        method: 'POST',
        headers: {
          // Nota: NÃO coloque 'Content-Type' manual aqui! O próprio navegador define o boundary correto do FormData
          'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao realizar upload.');
      }

      return { success: true, url: data.url };
    } catch (error: any) {
      console.error("❌ Erro no upload Agaemetec:", error.message);
      // Repassamos falso para o componente tratar com o toast de erro se quiser
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  }

  return { uploadFile, uploading };
}