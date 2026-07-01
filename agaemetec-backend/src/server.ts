import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Agaemetec Back-end rodando perfeitamente!' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor da Agaemetec rodando na porta ${port}`);
});