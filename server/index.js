import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.js';
import marketplaceRoutes from './routes/marketplace.js';
import featureRoutes from './routes/features.js';
import { databaseStatus, init, provider, listAnalyses } from './store.js';

const app = express();
const PORT = process.env.PORT || 4000;
const primaryFrontendOrigin = 'https://ailancer-zeta.vercel.app';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isAilancerVercelPreview(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && /^ailancer-[a-z0-9-]+-o1freelanceraz-1394\.vercel\.app$/i.test(url.hostname);
  } catch {
    return false;
  }
}

app.set('trust proxy', 1); // Render arxasında düzgün IP üçün
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || origin === primaryFrontendOrigin || allowedOrigins.includes(origin) || isAilancerVercelPreview(origin)) return callback(null, true);
    return callback(new Error('Bu origin üçün CORS icazəsi yoxdur.'));
  },
}));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => {
  const database = databaseStatus();
  res.status(database.ready ? 200 : 503).json({ ok: database.ready, storage: provider, database });
});

app.use('/api', featureRoutes);
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

app.use('/api', (_req, res) => res.status(404).json({ error: 'API ünvanı tapılmadı.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413
    : Number.isInteger(err.statusCode) ? err.statusCode
      : Number.isInteger(err.status) ? err.status : 500;
  const message = status === 413 ? 'Fayl ölçüsü 50 MB-dan böyük ola bilməz.'
    : status < 500 && err.message ? err.message
      : status < 500 ? 'Sorğu formatı yanlışdır.' : 'Server xətası baş verdi.';
  res.status(status).json({ error: message });
});

init()
  .catch((e) => console.error('Baza başlatma xətası:', e.message))
  .finally(() => app.listen(PORT, () => console.log(`Baman backend: http://localhost:${PORT} (storage: ${provider})`)));
