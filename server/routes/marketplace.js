import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import express from 'express';
import { sql } from '../store.js';

const router = express.Router();
const scrypt = promisify(scryptCallback);
const PROFILE_DEFAULTS = {
  about: '',
  avatarUrl: '',
  bannerUrl: '',
  isProfileVisible: true,
  status: '',
  activityAreas: [],
  experience: 'bir ilden azdir',
  hourlyRate: 0,
  rateType: '1 saat üçün',
  companyName: '',
  companyIndustry: '',
  companyWebsite: '',
  companySize: '',
  customerType: 'employer',
};

export function databaseRequired(_req, res, next) {
  if (!sql) return res.status(503).json({ error: 'Marketplace verilənlər bazası qoşulmayıb. DATABASE_URL təyin edin.' });
  next();
}

function safeUser(user) {
  return { id: user.id, email: user.email, fullName: user.full_name, role: user.role };
}

function tokenFor(user) {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) throw new Error('APP_JWT_SECRET konfiqurasiya edilməyib.');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })).toString('base64url');
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function verifyToken(token) {
  const [header, payload, signature] = String(token || '').split('.');
  if (!header || !payload || !signature || !process.env.APP_JWT_SECRET) return null;
  const expected = createHmac('sha256', process.env.APP_JWT_SECRET).update(`${header}.${payload}`).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return decoded.exp > Math.floor(Date.now() / 1000) ? decoded.sub : null;
  } catch {
    return null;
  }
}

export async function authenticated(req, res, next) {
  const subject = verifyToken(req.get('authorization')?.replace(/^Bearer\s+/i, ''));
  if (!subject) return res.status(401).json({ error: 'Sessiya bitib və ya etibarsızdır. Yenidən daxil olun.' });
  try {
    const [user] = await sql`SELECT id, email, full_name, role, profile FROM users WHERE id = ${subject}`;
    if (!user) return res.status(401).json({ error: 'Hesab tapılmadı. Yenidən daxil olun.' });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticated(req, res, next) {
  const subject = verifyToken(req.get('authorization')?.replace(/^Bearer\s+/i, ''));
  if (!subject) return next();
  try {
    const [user] = await sql`SELECT id, email, full_name, role, profile FROM users WHERE id = ${subject}`;
    if (user) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function profileFor(user) {
  return { ...PROFILE_DEFAULTS, ...(user.profile || {}), fullName: user.full_name, role: user.role };
}

function taskFor(row) {
  return { ...row.payload, id: row.id, ownerId: row.owner_id, ownerName: row.owner_name, status: row.status, createdAt: row.created_at };
}

router.post('/auth/register', databaseRequired, async (req, res, next) => {
  if (!process.env.APP_JWT_SECRET) return res.status(503).json({ error: 'Autentifikasiya konfiqurasiya edilməyib. APP_JWT_SECRET təyin edin.' });
  const fullName = String(req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const role = req.body?.role === 'musteri' ? 'musteri' : req.body?.role === 'freelancer' ? 'freelancer' : '';
  if (!fullName || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200 || !role) {
    return res.status(400).json({ error: 'Ad, düzgün e-poçt, hesab növü və ən azı 8 simvolluq şifrə daxil edin.' });
  }
  try {
    const salt = randomBytes(16);
    const hash = await scrypt(password, salt, 64);
    const profile = { ...PROFILE_DEFAULTS, ...req.body, fullName, role };
    delete profile.email;
    delete profile.password;
    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name, role, profile)
      VALUES (${email}, ${`${salt.toString('hex')}:${Buffer.from(hash).toString('hex')}`}, ${fullName}, ${role}, ${sql.json(profile)})
      RETURNING id, email, full_name, role, profile`;
    res.status(201).json({ token: tokenFor(user), user: safeUser(user), profile: profileFor(user) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Bu e-poçt artıq qeydiyyatdan keçib.' });
    next(error);
  }
});

router.post('/auth/login', databaseRequired, async (req, res, next) => {
  if (!process.env.APP_JWT_SECRET) return res.status(503).json({ error: 'Autentifikasiya konfiqurasiya edilməyib. APP_JWT_SECRET təyin edin.' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  try {
    const [user] = await sql`SELECT id, email, password_hash, full_name, role, profile FROM users WHERE email = ${email}`;
    if (!user) return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır.' });
    const [saltHex, hashHex] = user.password_hash.split(':');
    const submitted = Buffer.from(await scrypt(password, Buffer.from(saltHex, 'hex'), 64));
    const expected = Buffer.from(hashHex, 'hex');
    if (submitted.length !== expected.length || !timingSafeEqual(submitted, expected)) {
      return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır.' });
    }
    res.json({ token: tokenFor(user), user: safeUser(user), profile: profileFor(user) });
  } catch (error) {
    next(error);
  }
});

router.use(databaseRequired);

router.get('/auth/me', authenticated, (req, res) => res.json({ user: safeUser(req.user), profile: profileFor(req.user) }));

router.get('/users/freelancers', async (_req, res, next) => {
  try {
    const rows = await sql`SELECT id, full_name, role, profile FROM users WHERE role = 'freelancer' AND COALESCE((profile->>'isProfileVisible')::boolean, true) ORDER BY created_at DESC LIMIT 100`;
    res.json(rows.map((row) => ({ ...row.profile, id: row.id, fullName: row.full_name, role: row.role })));
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const [row] = await sql`SELECT id, full_name, role, profile FROM users WHERE id = ${req.params.id}`;
    if (!row) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
    const [specialties, experiences, certificates, projects, reviews, stats, social] = await Promise.all([
      sql`SELECT id, payload, created_at, updated_at FROM profile_items WHERE user_id = ${row.id} AND kind = 'specialty' ORDER BY created_at DESC`,
      sql`SELECT id, payload, created_at, updated_at FROM profile_items WHERE user_id = ${row.id} AND kind = 'experience' ORDER BY created_at DESC`,
      sql`SELECT id, payload, created_at, updated_at FROM profile_items WHERE user_id = ${row.id} AND kind = 'certificate' ORDER BY created_at DESC`,
      sql`SELECT id, payload, created_at FROM projects WHERE owner_id = ${row.id} ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT r.id, r.rating, r.text, r.created_at, t.title AS task_title, u.id AS author_id, u.full_name AS author_name, u.profile AS author_profile
        FROM task_reviews r JOIN tasks t ON t.id = r.task_id JOIN users u ON u.id = r.reviewer_id
        WHERE r.freelancer_id = ${row.id} ORDER BY r.created_at DESC LIMIT 100`,
      sql`SELECT COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed_orders
        FROM task_applications a JOIN tasks t ON t.id = a.task_id
        WHERE a.freelancer_id = ${row.id} AND a.status = 'accepted'`,
      sql`SELECT is_online, last_seen FROM user_social_data WHERE user_id = ${row.id}`,
    ]);
    const profile = row.profile || {};
    const mappedProjects = projects.map((project) => ({ ...project.payload, id: project.id, createdAt: project.created_at }));
    const mappedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.created_at,
      taskTitle: review.task_title,
      authorId: review.author_id,
      authorName: review.author_name,
      authorAvatarUrl: review.author_profile?.avatarUrl || '',
    }));
    const positiveReviews = mappedReviews.filter((review) => review.rating >= 4).length;
    const negativeReviews = mappedReviews.filter((review) => review.rating <= 2).length;
    res.json({
      ...profile,
      id: row.id,
      fullName: row.full_name,
      name: row.full_name,
      username: profile.nickname ? `@${profile.nickname}` : `@${row.full_name.toLowerCase().replace(/\s+/g, '')}`,
      role: row.role,
      description: profile.about || '',
      skills: profile.activityAreas || profile.skills || [],
      specialties: specialties.map((item) => ({ ...item.payload, id: item.id })),
      workExperiences: experiences.map((item) => ({ ...item.payload, id: item.id })),
      certificates: certificates.map((item) => ({ ...item.payload, id: item.id })),
      portfolio: mappedProjects,
      reviews: mappedReviews,
      stats: {
        views: Number(profile.views || 0),
        completedOrders: stats[0]?.completed_orders || 0,
        conflictJobs: 0,
        customerReviews: { pos: `+${positiveReviews}`, neg: `-${negativeReviews}` },
      },
      onlineStatus: { isOnline: social[0]?.is_online || false, lastSeen: social[0]?.last_seen || null },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticated, (req, res) => res.json(profileFor(req.user)));

router.put('/profile', authenticated, async (req, res, next) => {
  const fullName = String(req.body?.fullName || req.user.full_name).trim().slice(0, 120);
  const profile = { ...req.user.profile, ...req.body, fullName };
  delete profile.email;
  delete profile.password;
  try {
    const [user] = await sql`
      UPDATE users SET full_name = ${fullName}, profile = ${sql.json(profile)}, updated_at = NOW()
      WHERE id = ${req.user.id}
      RETURNING id, email, full_name, role, profile`;
    res.json(profileFor(user));
  } catch (error) {
    next(error);
  }
});

router.patch('/profile/media', authenticated, async (req, res, next) => {
  const field = ['avatarUrl', 'bannerUrl'].includes(req.body?.field) ? req.body.field : '';
  const url = String(req.body?.url || '').trim();
  if (!field || (url && !/^https:\/\//i.test(url))) return res.status(400).json({ error: 'HTTPS media URL və dəstəklənən sahə daxil edin.' });
  try {
    const profile = { ...req.user.profile, [field]: url };
    const [user] = await sql`UPDATE users SET profile = ${sql.json(profile)}, updated_at = NOW() WHERE id = ${req.user.id} RETURNING id, email, full_name, role, profile`;
    res.json(profileFor(user));
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (_req, res, next) => {
  try {
    const rows = await sql`SELECT id, name FROM categories ORDER BY name`;
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/tasks', async (_req, res, next) => {
  try {
    const search = String(_req.query.search || '').trim().slice(0, 120);
    const rows = await sql`
      SELECT t.id, t.owner_id, t.payload, t.status, t.created_at, u.full_name AS owner_name
      FROM tasks t JOIN users u ON u.id = t.owner_id
      WHERE t.status = 'open'
        AND (${search} = '' OR t.title ILIKE ${`%${search}%`} OR t.payload->>'description' ILIKE ${`%${search}%`})
      ORDER BY t.created_at DESC LIMIT 100`;
    res.json(rows.map(taskFor));
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/mine', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`SELECT t.id, t.owner_id, t.payload, t.status, t.created_at, u.full_name AS owner_name FROM tasks t JOIN users u ON u.id = t.owner_id WHERE t.owner_id = ${req.user.id} ORDER BY t.created_at DESC`;
    res.json(rows.map(taskFor));
  } catch (error) {
    next(error);
  }
});

router.post('/tasks', authenticated, async (req, res, next) => {
  if (req.user.role !== 'musteri') return res.status(403).json({ error: 'Yeni layihə yalnız sifarişçi hesabı ilə yaradıla bilər.' });
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  if (!title || title.length > 180 || description.length < 10 || description.length > 12000) {
    return res.status(400).json({ error: 'Başlıq (maksimum 180 simvol) və ən azı 10 simvolluq təsvir daxil edin.' });
  }
  try {
    const payload = { ...req.body, title, description };
    const [row] = await sql`
      INSERT INTO tasks (owner_id, title, payload)
      VALUES (${req.user.id}, ${title}, ${sql.json(payload)})
      RETURNING id, owner_id, payload, status, created_at`;
    res.status(201).json(taskFor({ ...row, owner_name: req.user.full_name }));
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/:id', async (req, res, next) => {
  try {
    const [row] = await sql`SELECT t.id, t.owner_id, t.payload, t.status, t.created_at, u.full_name AS owner_name FROM tasks t JOIN users u ON u.id = t.owner_id WHERE t.id = ${req.params.id}`;
    if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
    res.json(taskFor(row));
  } catch (error) {
    next(error);
  }
});

router.delete('/tasks/:id', authenticated, async (req, res, next) => {
  try {
    const deleted = await sql`DELETE FROM tasks WHERE id = ${req.params.id} AND owner_id = ${req.user.id} RETURNING id`;
    if (!deleted.length) return res.status(404).json({ error: 'Layihə tapılmadı və ya onu silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:id/apply', authenticated, async (req, res, next) => {
  if (req.user.role !== 'freelancer') return res.status(403).json({ error: 'Layihəyə yalnız freelancer müraciət edə bilər.' });
  const message = String(req.body?.message || '').trim();
  if (message.length < 10 || message.length > 5000) return res.status(400).json({ error: 'Müraciət mətni 10-5000 simvol olmalıdır.' });
  try {
    const [task] = await sql`SELECT id FROM tasks WHERE id = ${req.params.id} AND status = 'open'`;
    if (!task) return res.status(404).json({ error: 'Açıq layihə tapılmadı.' });
    const payload = { ...req.body, message };
    const [application] = await sql`
      INSERT INTO task_applications (task_id, freelancer_id, payload)
      VALUES (${task.id}, ${req.user.id}, ${sql.json(payload)})
      ON CONFLICT (task_id, freelancer_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      RETURNING id, status, payload, created_at`;
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

router.get('/projects', async (_req, res, next) => {
  try {
    const rows = await sql`SELECT p.id, p.payload, p.created_at, u.full_name FROM projects p JOIN users u ON u.id = p.owner_id ORDER BY p.created_at DESC LIMIT 100`;
    res.json(rows.map((row) => ({ ...row.payload, id: row.id, ownerName: row.full_name, createdAt: row.created_at })));
  } catch (error) {
    next(error);
  }
});

router.post('/projects', authenticated, async (req, res, next) => {
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  if (!title || title.length > 180 || !description || description.length > 12000) return res.status(400).json({ error: 'Portfolio üçün başlıq və təsvir daxil edin.' });
  try {
    const [project] = await sql`INSERT INTO projects (owner_id, payload) VALUES (${req.user.id}, ${sql.json({ ...req.body, title, description })}) RETURNING id, payload, created_at`;
    res.status(201).json({ ...project.payload, id: project.id, ownerId: req.user.id, ownerName: req.user.full_name, createdAt: project.created_at });
  } catch (error) {
    next(error);
  }
});

router.get('/projects/:id', async (req, res, next) => {
  try {
    const [row] = await sql`SELECT p.id, p.payload, p.created_at, u.id AS owner_id, u.full_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ${req.params.id}`;
    if (!row) return res.status(404).json({ error: 'Portfolio layihəsi tapılmadı.' });
    res.json({ ...row.payload, id: row.id, ownerId: row.owner_id, ownerName: row.full_name, createdAt: row.created_at });
  } catch (error) {
    next(error);
  }
});

export default router;
