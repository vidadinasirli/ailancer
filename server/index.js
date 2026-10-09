import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.js';
import marketplaceRoutes from './routes/marketplace.js';
import { databaseStatus, init, provider, listAnalyses } from './store.js';

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);

app.set('trust proxy', 1); // Render arxasında düzgün IP üçün
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Bu origin üçün CORS icazəsi yoxdur.'));
  },
}));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => {
  const database = databaseStatus();
  res.status(database.ready ? 200 : 503).json({ ok: database.ready, storage: provider, database });
});

app.use('/api/ai', aiRoutes);
app.use('/api', marketplaceRoutes);

app.get('/api/analyses', async (_req, res) => {
  try {
    res.json({ items: await listAnalyses(20) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tarixçə oxunmadı.' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = Number.isInteger(err.statusCode) ? err.statusCode : Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: status < 500 ? 'Sorğu formatı yanlışdır.' : 'Server xətası baş verdi.' });
});

init()
  .catch((e) => console.error('Baza başlatma xətası:', e.message))
  .finally(() => app.listen(PORT, () => console.log(`Baman backend: http://localhost:${PORT} (storage: ${provider})`)));
