import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

async function runSeed() {
  console.log("🌱 Iniciando carga de usuários de teste para o portfólio...");
  
  try {
    // 1. Gera o hash da senha padrão '123456' usando 10 rounds de salt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('123456', saltRounds);

    // Limpa registros antigos na users por segurança antes de inserir (evita duplicar IDs)
    await pool.query('TRUNCATE TABLE users CASCADE');

    // 2. Query de inserção com parâmetros blindados contra SQL Injection
    const insertQuery = `
      INSERT INTO users (id, name, email, password_hash, role, department, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    // 3. Injeta os 4 perfis mantendo os mesmos UIDs que usamos anteriormente
    await pool.query(insertQuery, [
      '62b447b0-10a9-4d4c-ad7e-a47d28d4cf58',
      'Laura Procópio',
      'laura.procopio@agaemetec.com.br',
      passwordHash,
      'Admin',
      'Engenharia de Software',
      '5567999991122',
      true
    ]);

    await pool.query(insertQuery, [
      'baeec3cf-6e1a-4d0d-a02e-0390d676e17a',
      'Rodrigo Sanches',
      'rodrigo.sanches@agaemetec.com.br',
      passwordHash,
      'Admin',
      'Infraestrutura e Redes',
      '5567999993344',
      true
    ]);

    await pool.query(insertQuery, [
      '7bfc101d-016f-4acc-99ff-4d02761a1fa9',
      'Carlos Eduardo Miranda',
      'carlos.miranda@unidadealpha.com.br',
      passwordHash,
      'Client',
      'Diretoria Executiva',
      '5567999995566',
      true
    ]);

    await pool.query(insertQuery, [
      '4046dab5-a4c6-420b-b103-6ea16b0a1981',
      'Mariana Costa Vieira',
      'mariana.vieira@grupobeta.com.br',
      passwordHash,
      'Client',
      'Gerência de Operações',
      '5567999997788',
      true
    ]);

    console.log("██████████████████████████████████████████████████");
    console.log("✅ Usuários injetados no Postgres local com sucesso!");
    console.log("🔑 Todos configurados com a senha padrão: 123456");
    console.log("██████████████████████████████████████████████████");

  } catch (error) {
    console.error("❌ Falha crítica ao rodar seed de usuários:", error);
  } finally {
    // Fecha o pool para encerrar o processo no terminal de forma graciosa
    await pool.end();
  }
}

runSeed();