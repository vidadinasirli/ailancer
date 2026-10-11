import express from 'express';
import multer from 'multer';
import { sql } from '../store.js';
import { authenticated, databaseRequired, optionalAuthenticated } from './marketplace.js';

const router = express.Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validId = (value) => UUID.test(String(value || ''));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    const allowed = /^(image\/|video\/|audio\/|application\/pdf$|application\/msword$|application\/vnd\.openxmlformats-officedocument\.)/i;
    if (!allowed.test(file.mimetype) || file.mimetype === 'image/svg+xml') {
      const error = new Error('Yalnız şəkil, video, audio və sənəd faylları yüklənə bilər.');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

function itemFor(row) {
  return { ...row.payload, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function createNotification(userId, title, description) {
  if (!userId) return;
  await sql`INSERT INTO notifications (user_id, title, description) VALUES (${userId}, ${title}, ${description})`;
}

async function applicationFor(taskId, applicationId) {
  const [row] = await sql`
    SELECT a.id, a.task_id, a.freelancer_id, a.payload, a.status, a.created_at, a.updated_at,
      t.owner_id, t.title AS task_title, u.full_name AS freelancer_name, u.profile AS freelancer_profile
    FROM task_applications a
    JOIN tasks t ON t.id = a.task_id
    JOIN users u ON u.id = a.freelancer_id
    WHERE a.id = ${applicationId} AND a.task_id = ${taskId}`;
  return row;
}

function applicationResponse(row, likes = 0, liked = false, replies = []) {
  return {
    ...row.payload,
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    freelancerId: row.freelancer_id,
    freelancerName: row.freelancer_name,
    freelancer: { ...row.freelancer_profile, id: row.freelancer_id, fullName: row.freelancer_name },
    status: row.status === 'accepted' ? 'qəbul edilib' : row.status === 'rejected' ? 'rədd edilib' : 'gözləyir',
    createdAt: row.created_at,
    likes,
    liked,
    replies,
  };
}

async function projectComments(projectId, userId = null) {
  const rows = await sql`
    SELECT c.id, c.project_id, c.user_id, c.parent_id, c.text, c.created_at, u.full_name AS author,
      (SELECT COUNT(*)::int FROM project_comment_likes l WHERE l.comment_id = c.id) AS likes,
      EXISTS(SELECT 1 FROM project_comment_likes l WHERE l.comment_id = c.id AND l.user_id = ${userId}) AS liked
    FROM project_comments c JOIN users u ON u.id = c.user_id
    WHERE c.project_id = ${projectId}
    ORDER BY c.created_at, c.id`;
  const comments = rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    parentId: row.parent_id,
    author: row.author,
    text: row.text,
    createdAt: row.created_at,
    likes: row.likes,
    liked: row.liked,
    replies: [],
  }));
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const roots = [];
  for (const comment of comments) {
    const parent = comment.parentId && byId.get(comment.parentId);
    if (parent) parent.replies.push(comment);
    else roots.push(comment);
  }
  return roots;
}

async function clubComments(postId) {
  const rows = await sql`
    SELECT c.id, c.post_id, c.user_id, c.text, c.created_at, c.updated_at, u.full_name AS author
    FROM club_comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ${postId}
    ORDER BY c.created_at`;
  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    author: row.author,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

router.get('/uploads/media/:id', databaseRequired, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Media identifikatoru yanlışdır.' });
  try {
    const [media] = await sql`SELECT filename, mime_type, data FROM uploaded_media WHERE id = ${req.params.id}`;
    if (!media) return res.status(404).json({ error: 'Media tapılmadı.' });
    res.set('Content-Type', media.mime_type);
    res.set('Content-Length', String(media.data.length));
    res.set('Content-Disposition', 'inline');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(media.data);
  } catch (error) { next(error); }
});

router.post('/support', databaseRequired, async (req, res, next) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !subject || subject.length > 200 || message.length < 10 || message.length > 12000) {
    return res.status(400).json({ error: 'Ad, düzgün e-poçt, mövzu və 10-12000 simvolluq mesaj daxil edin.' });
  }
  try {
    const [ticket] = await sql`
      INSERT INTO support_tickets (name, email, subject, message)
      VALUES (${name}, ${email}, ${subject}, ${message})
      RETURNING id, created_at`;
    res.status(201).json({ id: ticket.id, status: 'open', createdAt: ticket.created_at });
  } catch (error) { next(error); }
});

router.use(databaseRequired);

router.get('/profile/:kind(specialties|experiences|certificates)', authenticated, async (req, res, next) => {
  const kind = req.params.kind === 'specialties' ? 'specialty' : req.params.kind === 'experiences' ? 'experience' : 'certificate';
  try {
    const rows = await sql`SELECT id, payload, created_at, updated_at FROM profile_items WHERE user_id = ${req.user.id} AND kind = ${kind} ORDER BY created_at DESC`;
    res.json(rows.map(itemFor));
  } catch (error) { next(error); }
});

router.post('/profile/:kind(specialties|experiences|certificates)', authenticated, async (req, res, next) => {
  const kind = req.params.kind === 'specialties' ? 'specialty' : req.params.kind === 'experiences' ? 'experience' : 'certificate';
  if (kind === 'specialty' && req.user.role !== 'freelancer') return res.status(403).json({ error: 'İxtisas sahəsini yalnız freelancer hesabı əlavə edə bilər.' });
  const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const required = kind === 'specialty' ? payload.title : kind === 'experience' ? payload.positionTitle : payload.name;
  if (!String(required || '').trim()) return res.status(400).json({ error: 'Tələb olunan məlumatları doldurun.' });
  try {
    const [row] = await sql`INSERT INTO profile_items (user_id, kind, payload) VALUES (${req.user.id}, ${kind}, ${sql.json(payload)}) RETURNING id, payload, created_at, updated_at`;
    res.status(201).json(itemFor(row));
  } catch (error) { next(error); }
});

router.put('/profile/:kind(specialties|experiences|certificates)/:id', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Element identifikatoru yanlışdır.' });
  const kind = req.params.kind === 'specialties' ? 'specialty' : req.params.kind === 'experiences' ? 'experience' : 'certificate';
  const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  try {
    const [row] = await sql`UPDATE profile_items SET payload = ${sql.json(payload)}, updated_at = NOW() WHERE id = ${req.params.id} AND user_id = ${req.user.id} AND kind = ${kind} RETURNING id, payload, created_at, updated_at`;
    if (!row) return res.status(404).json({ error: 'Profil məlumatı tapılmadı.' });
    res.json(itemFor(row));
  } catch (error) { next(error); }
});

router.delete('/profile/:kind(specialties|experiences|certificates)/:id', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Element identifikatoru yanlışdır.' });
  const kind = req.params.kind === 'specialties' ? 'specialty' : req.params.kind === 'experiences' ? 'experience' : 'certificate';
  try {
    const rows = await sql`DELETE FROM profile_items WHERE id = ${req.params.id} AND user_id = ${req.user.id} AND kind = ${kind} RETURNING id`;
    if (!rows.length) return res.status(404).json({ error: 'Profil məlumatı tapılmadı.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/categories', authenticated, async (req, res, next) => {
  const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 80) return res.status(400).json({ error: 'Kateqoriya 1-80 simvol olmalıdır.' });
  try {
    const [row] = await sql`INSERT INTO categories (name) VALUES (${name}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`;
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.post('/uploads/media', authenticated, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Yükləmək üçün fayl seçin.' });
  try {
    const [row] = await sql`
      INSERT INTO uploaded_media (user_id, filename, mime_type, data, size)
      VALUES (${req.user.id}, ${req.file.originalname.slice(0, 255)}, ${req.file.mimetype}, ${req.file.buffer}, ${req.file.size})
      RETURNING id, filename, mime_type, size`;
    res.status(201).json({ id: row.id, name: row.filename, mimeType: row.mime_type, size: row.size, url: `/api/uploads/media/${row.id}` });
  } catch (error) { next(error); }
});

router.get('/projects', optionalAuthenticated, async (req, res, next) => {
  if (req.query.ownerId && !validId(req.query.ownerId)) return res.status(400).json({ error: 'İstifadəçi identifikatoru yanlışdır.' });
  const ownerId = req.query.ownerId || null;
  const search = String(req.query.search || '').trim().slice(0, 120);
  try {
    const rows = await sql`
      SELECT p.id, p.owner_id, p.payload, p.created_at, u.full_name,
        (SELECT COUNT(*)::int FROM project_likes l WHERE l.project_id = p.id) AS likes,
        EXISTS(SELECT 1 FROM project_likes l WHERE l.project_id = p.id AND l.user_id = ${req.user?.id || null}) AS liked
      FROM projects p JOIN users u ON u.id = p.owner_id
      WHERE (${ownerId}::uuid IS NULL OR p.owner_id = ${ownerId}::uuid)
        AND (${search} = '' OR p.payload->>'title' ILIKE ${`%${search}%`} OR p.payload->>'description' ILIKE ${`%${search}%`})
      ORDER BY p.created_at DESC LIMIT 100`;
    res.json(rows.map((row) => ({
      ...row.payload,
      id: row.id,
      ownerId: row.owner_id,
      ownerName: row.full_name,
      author: row.payload.author || row.full_name,
      createdAt: row.created_at,
      views: Number(row.payload.views || 0),
      likes: row.likes,
      liked: row.liked,
    })));
  } catch (error) { next(error); }
});

router.get('/projects/liked', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT p.id, p.owner_id, p.payload, p.created_at, u.full_name AS author,
        (SELECT COUNT(*)::int FROM project_likes l WHERE l.project_id = p.id) AS likes
      FROM project_likes l JOIN projects p ON p.id = l.project_id JOIN users u ON u.id = p.owner_id
      WHERE l.user_id = ${req.user.id} ORDER BY l.created_at DESC`;
    res.json(rows.map((row) => ({ ...row.payload, id: row.id, ownerId: row.owner_id, author: row.payload.author || row.author, likes: row.likes, createdAt: row.created_at })));
  } catch (error) { next(error); }
});

router.get('/projects/liked/comments', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT c.id, c.project_id, c.text, u.full_name AS author, p.payload->>'title' AS project_title
      FROM project_comment_likes l JOIN project_comments c ON c.id = l.comment_id
      JOIN users u ON u.id = c.user_id JOIN projects p ON p.id = c.project_id
      WHERE l.user_id = ${req.user.id} ORDER BY l.created_at DESC`;
    res.json(rows.map((row) => ({ id: row.id, projectId: row.project_id, text: row.text, author: row.author, projectTitle: row.project_title })));
  } catch (error) { next(error); }
});

router.get('/projects/:id', optionalAuthenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Layihə identifikatoru yanlışdır.' });
  try {
    const [project] = await sql`
      UPDATE projects SET payload = jsonb_set(payload, '{views}', to_jsonb(
        CASE WHEN payload->>'views' ~ '^[0-9]+$' THEN (payload->>'views')::integer + 1 ELSE 1 END
      ), true)
      WHERE id = ${req.params.id}
      RETURNING id, owner_id, payload, created_at`;
    if (!project) return res.status(404).json({ error: 'Portfolio layihəsi tapılmadı.' });
    const [owner] = await sql`SELECT full_name FROM users WHERE id = ${project.owner_id}`;
    const [counts] = await sql`
      SELECT (SELECT COUNT(*)::int FROM project_likes WHERE project_id = ${project.id}) AS likes,
        EXISTS(SELECT 1 FROM project_likes WHERE project_id = ${project.id} AND user_id = ${req.user?.id || null}) AS liked`;
    res.json({
      ...project.payload,
      id: project.id,
      ownerId: project.owner_id,
      ownerName: owner.full_name,
      author: project.payload.author || owner.full_name,
      createdAt: project.created_at,
      views: Number(project.payload.views || 0),
      likes: counts.likes,
      liked: counts.liked,
      commentsList: await projectComments(project.id, req.user?.id || null),
    });
  } catch (error) { next(error); }
});

router.post('/projects/:id/like', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Layihə identifikatoru yanlışdır.' });
  try {
    const [project] = await sql`SELECT id FROM projects WHERE id = ${req.params.id}`;
    if (!project) return res.status(404).json({ error: 'Layihə tapılmadı.' });
    const existing = await sql`SELECT 1 FROM project_likes WHERE user_id = ${req.user.id} AND project_id = ${project.id}`;
    if (existing.length) await sql`DELETE FROM project_likes WHERE user_id = ${req.user.id} AND project_id = ${project.id}`;
    else await sql`INSERT INTO project_likes (user_id, project_id) VALUES (${req.user.id}, ${project.id}) ON CONFLICT DO NOTHING`;
    const [result] = await sql`SELECT COUNT(*)::int AS likes, EXISTS(SELECT 1 FROM project_likes WHERE user_id = ${req.user.id} AND project_id = ${project.id}) AS liked FROM project_likes WHERE project_id = ${project.id}`;
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/projects/:id/comments', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Layihə identifikatoru yanlışdır.' });
  const text = String(req.body?.text || '').trim();
  const parentId = req.body?.parentId || null;
  if (!text || text.length > 4000 || (parentId && !validId(parentId))) return res.status(400).json({ error: 'Şərh 1-4000 simvol olmalıdır.' });
  try {
    const [project] = await sql`SELECT id FROM projects WHERE id = ${req.params.id}`;
    if (!project) return res.status(404).json({ error: 'Layihə tapılmadı.' });
    if (parentId) {
      const [parent] = await sql`SELECT id FROM project_comments WHERE id = ${parentId} AND project_id = ${project.id}`;
      if (!parent) return res.status(400).json({ error: 'Cavab verilən şərh tapılmadı.' });
    }
    const [row] = await sql`INSERT INTO project_comments (project_id, user_id, parent_id, text) VALUES (${project.id}, ${req.user.id}, ${parentId}, ${text}) RETURNING id, project_id, user_id, parent_id, text, created_at`;
    res.status(201).json({ id: row.id, projectId: row.project_id, userId: row.user_id, parentId: row.parent_id, author: req.user.full_name, text: row.text, createdAt: row.created_at, likes: 0, liked: false, replies: [] });
  } catch (error) { next(error); }
});

router.patch('/projects/:id/comments/:commentId', authenticated, async (req, res, next) => {
  const text = String(req.body?.text || '').trim();
  if (!validId(req.params.id) || !validId(req.params.commentId) || !text || text.length > 4000) return res.status(400).json({ error: 'Şərh məlumatları yanlışdır.' });
  try {
    const [row] = await sql`UPDATE project_comments SET text = ${text}, updated_at = NOW() WHERE id = ${req.params.commentId} AND project_id = ${req.params.id} AND user_id = ${req.user.id} RETURNING id, text`;
    if (!row) return res.status(404).json({ error: 'Şərh tapılmadı və ya redaktə icazəniz yoxdur.' });
    res.json(row);
  } catch (error) { next(error); }
});

router.delete('/projects/:id/comments/:commentId', authenticated, async (req, res, next) => {
  if (!validId(req.params.id) || !validId(req.params.commentId)) return res.status(400).json({ error: 'Şərh identifikatoru yanlışdır.' });
  try {
    const deleted = await sql`
      DELETE FROM project_comments c USING projects p
      WHERE c.id = ${req.params.commentId} AND c.project_id = ${req.params.id} AND p.id = c.project_id
        AND (c.user_id = ${req.user.id} OR p.owner_id = ${req.user.id}) RETURNING c.id`;
    if (!deleted.length) return res.status(404).json({ error: 'Şərh tapılmadı və ya silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/projects/:id/comments/:commentId/like', authenticated, async (req, res, next) => {
  if (!validId(req.params.id) || !validId(req.params.commentId)) return res.status(400).json({ error: 'Şərh identifikatoru yanlışdır.' });
  try {
    const [comment] = await sql`SELECT id FROM project_comments WHERE id = ${req.params.commentId} AND project_id = ${req.params.id}`;
    if (!comment) return res.status(404).json({ error: 'Şərh tapılmadı.' });
    const exists = await sql`SELECT 1 FROM project_comment_likes WHERE user_id = ${req.user.id} AND comment_id = ${comment.id}`;
    if (exists.length) await sql`DELETE FROM project_comment_likes WHERE user_id = ${req.user.id} AND comment_id = ${comment.id}`;
    else await sql`INSERT INTO project_comment_likes (user_id, comment_id) VALUES (${req.user.id}, ${comment.id}) ON CONFLICT DO NOTHING`;
    const [result] = await sql`SELECT COUNT(*)::int AS likes, EXISTS(SELECT 1 FROM project_comment_likes WHERE user_id = ${req.user.id} AND comment_id = ${comment.id}) AS liked FROM project_comment_likes WHERE comment_id = ${comment.id}`;
    res.json(result);
  } catch (error) { next(error); }
});

router.delete('/projects/:id', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Layihə identifikatoru yanlışdır.' });
  try {
    const deleted = await sql`DELETE FROM projects WHERE id = ${req.params.id} AND owner_id = ${req.user.id} RETURNING id`;
    if (!deleted.length) return res.status(404).json({ error: 'Layihə tapılmadı və ya silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/club', async (req, res, next) => {
  const search = String(req.query.search || '').trim().slice(0, 120);
  try {
    const rows = await sql`
      SELECT p.id, p.user_id, p.payload, p.created_at, u.full_name AS author,
        (SELECT COUNT(*)::int FROM club_comments c WHERE c.post_id = p.id) AS comment_count
      FROM club_posts p JOIN users u ON u.id = p.user_id
      WHERE (${search} = '' OR p.payload->>'title' ILIKE ${`%${search}%`} OR p.payload->>'content' ILIKE ${`%${search}%`})
      ORDER BY p.created_at DESC LIMIT 100`;
    res.json(rows.map((row) => ({ ...row.payload, id: row.id, userId: row.user_id, author: row.author, createdAt: row.created_at, comments: row.comment_count, views: Number(row.payload.views || 0) })));
  } catch (error) { next(error); }
});

router.get('/club/:id', async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Yazı identifikatoru yanlışdır.' });
  try {
    const [row] = await sql`
      UPDATE club_posts SET payload = jsonb_set(payload, '{views}', to_jsonb(
        CASE WHEN payload->>'views' ~ '^[0-9]+$' THEN (payload->>'views')::integer + 1 ELSE 1 END
      ), true)
      WHERE id = ${req.params.id}
      RETURNING id, user_id, payload, created_at, updated_at`;
    if (!row) return res.status(404).json({ error: 'Klub yazısı tapılmadı.' });
    const [owner] = await sql`SELECT full_name FROM users WHERE id = ${row.user_id}`;
    res.json({ ...row.payload, id: row.id, userId: row.user_id, author: owner.full_name, createdAt: row.created_at, updatedAt: row.updated_at, views: Number(row.payload.views || 0), commentsList: await clubComments(row.id) });
  } catch (error) { next(error); }
});

router.post('/club', authenticated, async (req, res, next) => {
  const title = String(req.body?.title || '').trim();
  const content = String(req.body?.content || '').trim();
  if (!title || title.length > 180 || !content || content.length > 20000) return res.status(400).json({ error: 'Başlıq və 1-20000 simvolluq məzmun daxil edin.' });
  try {
    const payload = { ...req.body, title, content, tags: Array.isArray(req.body.tags) ? req.body.tags.slice(0, 10).map((tag) => String(tag).slice(0, 80)) : [] };
    const [row] = await sql`INSERT INTO club_posts (user_id, payload) VALUES (${req.user.id}, ${sql.json(payload)}) RETURNING id, payload, created_at`;
    res.status(201).json({ ...row.payload, id: row.id, userId: req.user.id, author: req.user.full_name, createdAt: row.created_at, comments: 0, views: 0 });
  } catch (error) { next(error); }
});

router.delete('/club/:id', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Yazı identifikatoru yanlışdır.' });
  try {
    const deleted = await sql`DELETE FROM club_posts WHERE id = ${req.params.id} AND user_id = ${req.user.id} RETURNING id`;
    if (!deleted.length) return res.status(404).json({ error: 'Yazı tapılmadı və ya silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/club/:id/comments', authenticated, async (req, res, next) => {
  const text = String(req.body?.text || '').trim();
  if (!validId(req.params.id) || !text || text.length > 4000) return res.status(400).json({ error: 'Şərh 1-4000 simvol olmalıdır.' });
  try {
    const [post] = await sql`SELECT id, user_id, payload->>'title' AS title FROM club_posts WHERE id = ${req.params.id}`;
    if (!post) return res.status(404).json({ error: 'Klub yazısı tapılmadı.' });
    const [row] = await sql`INSERT INTO club_comments (post_id, user_id, text) VALUES (${post.id}, ${req.user.id}, ${text}) RETURNING id, post_id, user_id, text, created_at`;
    if (post.user_id !== req.user.id) await createNotification(post.user_id, 'Yeni şərh', `${req.user.full_name} “${post.title}” yazınıza şərh yazdı.`);
    res.status(201).json({ id: row.id, postId: row.post_id, userId: row.user_id, author: req.user.full_name, text: row.text, createdAt: row.created_at });
  } catch (error) { next(error); }
});

router.patch('/club/:id/comments/:commentId', authenticated, async (req, res, next) => {
  const text = String(req.body?.text || '').trim();
  if (!validId(req.params.id) || !validId(req.params.commentId) || !text || text.length > 4000) return res.status(400).json({ error: 'Şərh məlumatları yanlışdır.' });
  try {
    const [row] = await sql`UPDATE club_comments SET text = ${text}, updated_at = NOW() WHERE id = ${req.params.commentId} AND post_id = ${req.params.id} AND user_id = ${req.user.id} RETURNING id, text`;
    if (!row) return res.status(404).json({ error: 'Şərh tapılmadı və ya redaktə icazəniz yoxdur.' });
    res.json(row);
  } catch (error) { next(error); }
});

router.delete('/club/:id/comments/:commentId', authenticated, async (req, res, next) => {
  if (!validId(req.params.id) || !validId(req.params.commentId)) return res.status(400).json({ error: 'Şərh identifikatoru yanlışdır.' });
  try {
    const deleted = await sql`
      DELETE FROM club_comments c USING club_posts p
      WHERE c.id = ${req.params.commentId} AND c.post_id = ${req.params.id} AND p.id = c.post_id
        AND (c.user_id = ${req.user.id} OR p.user_id = ${req.user.id}) RETURNING c.id`;
    if (!deleted.length) return res.status(404).json({ error: 'Şərh tapılmadı və ya silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/notifications', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`SELECT id, title, description, is_read, created_at FROM notifications WHERE user_id = ${req.user.id} ORDER BY created_at DESC LIMIT 100`;
    res.json(rows.map((row) => ({ id: row.id, title: row.title, description: row.description, isRead: row.is_read, createdAt: row.created_at })));
  } catch (error) { next(error); }
});

router.post('/notifications/read', authenticated, async (req, res, next) => {
  try {
    await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${req.user.id} AND is_read = FALSE`;
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.post('/notifications/:id/read', authenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Bildiriş identifikatoru yanlışdır.' });
  try {
    const rows = await sql`UPDATE notifications SET is_read = TRUE WHERE id = ${req.params.id} AND user_id = ${req.user.id} RETURNING id`;
    if (!rows.length) return res.status(404).json({ error: 'Bildiriş tapılmadı.' });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.get('/social/links', authenticated, async (req, res, next) => {
  try {
    const [row] = await sql`SELECT links FROM user_social_data WHERE user_id = ${req.user.id}`;
    res.json(row?.links || {});
  } catch (error) { next(error); }
});

router.put('/social/links', authenticated, async (req, res, next) => {
  const fields = ['github', 'instagram', 'linkedin', 'facebook', 'displayLink1', 'displayLink2'];
  const links = {};
  for (const field of fields) {
    const value = String(req.body?.[field] || '').trim();
    if (value && (!/^https:\/\//i.test(value) || value.length > 500)) return res.status(400).json({ error: 'Sosial keçidlər HTTPS olmalı və 500 simvoldan uzun olmamalıdır.' });
    links[field] = value;
  }
  try {
    const [row] = await sql`INSERT INTO user_social_data (user_id, links) VALUES (${req.user.id}, ${sql.json(links)}) ON CONFLICT (user_id) DO UPDATE SET links = EXCLUDED.links RETURNING links`;
    res.json(row.links);
  } catch (error) { next(error); }
});

router.put('/social/status', authenticated, async (req, res, next) => {
  const isOnline = Boolean(req.body?.isOnline);
  try {
    await sql`
      INSERT INTO user_social_data (user_id, is_online, last_seen)
      VALUES (${req.user.id}, ${isOnline}, CASE WHEN ${isOnline} THEN NULL ELSE NOW() END)
      ON CONFLICT (user_id) DO UPDATE SET is_online = EXCLUDED.is_online, last_seen = CASE WHEN EXCLUDED.is_online THEN user_social_data.last_seen ELSE NOW() END`;
    res.json({ isOnline });
  } catch (error) { next(error); }
});

router.get('/social/status/:id', async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'İstifadəçi identifikatoru yanlışdır.' });
  try {
    const [row] = await sql`SELECT is_online, last_seen FROM user_social_data WHERE user_id = ${req.params.id}`;
    res.json({ isOnline: row?.is_online || false, lastSeen: row?.last_seen || null });
  } catch (error) { next(error); }
});

router.get('/messages/conversations', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT DISTINCT ON (other.id) other.id AS user_id, other.full_name, other.profile,
        m.text, m.attachment, m.created_at, m.sender_id
      FROM messages m
      JOIN users other ON other.id = CASE WHEN m.sender_id = ${req.user.id} THEN m.recipient_id ELSE m.sender_id END
      WHERE m.sender_id = ${req.user.id} OR m.recipient_id = ${req.user.id}
      ORDER BY other.id, m.created_at DESC`;
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(rows.map((row) => ({
      userId: row.user_id,
      user: { id: row.user_id, fullName: row.full_name, ...row.profile },
      lastMessage: row.text,
      attachment: row.attachment,
      createdAt: row.created_at,
      fromUserId: row.sender_id,
    })));
  } catch (error) { next(error); }
});

router.get('/messages/:userId/block-status', authenticated, async (req, res, next) => {
  if (!validId(req.params.userId)) return res.status(400).json({ error: 'İstifadəçi identifikatoru yanlışdır.' });
  try {
    const [status] = await sql`
      SELECT EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = ${req.user.id} AND blocked_id = ${req.params.userId}) AS blocked_by_me,
        EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = ${req.params.userId} AND blocked_id = ${req.user.id}) AS blocked_me`;
    res.json({ blockedByMe: status.blocked_by_me, blockedMe: status.blocked_me });
  } catch (error) { next(error); }
});

router.get('/messages/:userId', authenticated, async (req, res, next) => {
  if (!validId(req.params.userId) || req.params.userId === req.user.id) return res.status(400).json({ error: 'Söhbət istifadəçisi yanlışdır.' });
  try {
    const [user] = await sql`SELECT id, full_name, role, profile FROM users WHERE id = ${req.params.userId}`;
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
    const rows = await sql`
      SELECT id, sender_id, recipient_id, text, attachment, created_at
      FROM messages
      WHERE (sender_id = ${req.user.id} AND recipient_id = ${user.id}) OR (sender_id = ${user.id} AND recipient_id = ${req.user.id})
      ORDER BY created_at DESC LIMIT 200`;
    res.json({
      user: { id: user.id, fullName: user.full_name, role: user.role, ...user.profile },
      messages: rows.reverse().map((row) => ({
        id: row.id,
        fromUserId: row.sender_id,
        toUserId: row.recipient_id,
        text: row.attachment ? JSON.stringify({ kind: 'attachment', text: row.text, attachment: row.attachment }) : row.text,
        createdAt: row.created_at,
      })),
    });
  } catch (error) { next(error); }
});

router.post('/messages', authenticated, async (req, res, next) => {
  const toUserId = String(req.body?.toUserId || '');
  const text = String(req.body?.text || '').trim();
  const attachment = req.body?.attachment && typeof req.body.attachment === 'object' ? req.body.attachment : null;
  if (!validId(toUserId) || toUserId === req.user.id || (!text && !attachment) || text.length > 5000) return res.status(400).json({ error: 'Mesaj və düzgün alıcı daxil edin.' });
  try {
    const [recipient] = await sql`SELECT id FROM users WHERE id = ${toUserId}`;
    if (!recipient) return res.status(404).json({ error: 'Alıcı tapılmadı.' });
    const blocked = await sql`SELECT 1 FROM user_blocks WHERE (blocker_id = ${req.user.id} AND blocked_id = ${toUserId}) OR (blocker_id = ${toUserId} AND blocked_id = ${req.user.id})`;
    if (blocked.length) return res.status(403).json({ error: 'Bloklanmış istifadəçi ilə mesajlaşmaq mümkün deyil.' });
    const [row] = await sql`INSERT INTO messages (sender_id, recipient_id, text, attachment) VALUES (${req.user.id}, ${toUserId}, ${text}, ${attachment ? sql.json(attachment) : null}) RETURNING id, sender_id, recipient_id, text, attachment, created_at`;
    await createNotification(toUserId, 'Yeni mesaj', `${req.user.full_name} sizə mesaj göndərdi.`);
    res.status(201).json({
      id: row.id,
      fromUserId: row.sender_id,
      toUserId: row.recipient_id,
      text: row.attachment ? JSON.stringify({ kind: 'attachment', text: row.text, attachment: row.attachment }) : row.text,
      createdAt: row.created_at,
    });
  } catch (error) { next(error); }
});

router.post('/messages/:userId/block', authenticated, async (req, res, next) => {
  if (!validId(req.params.userId) || req.params.userId === req.user.id) return res.status(400).json({ error: 'Bloklamaq üçün istifadəçi seçin.' });
  try {
    const [user] = await sql`SELECT id FROM users WHERE id = ${req.params.userId}`;
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
    await sql`INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (${req.user.id}, ${user.id}) ON CONFLICT DO NOTHING`;
    res.json({ blocked: true });
  } catch (error) { next(error); }
});

router.delete('/messages/:userId/block', authenticated, async (req, res, next) => {
  if (!validId(req.params.userId)) return res.status(400).json({ error: 'İstifadəçi identifikatoru yanlışdır.' });
  try {
    await sql`DELETE FROM user_blocks WHERE blocker_id = ${req.user.id} AND blocked_id = ${req.params.userId}`;
    res.json({ blocked: false });
  } catch (error) { next(error); }
});

router.get('/tasks/:id', optionalAuthenticated, async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Tapşırıq identifikatoru yanlışdır.' });
  try {
    const [task] = await sql`SELECT t.id, t.owner_id, t.payload, t.status, t.created_at, u.full_name AS owner_name FROM tasks t JOIN users u ON u.id = t.owner_id WHERE t.id = ${req.params.id}`;
    if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
    const rows = await sql`
      SELECT a.id, a.task_id, a.freelancer_id, a.payload, a.status, a.created_at, a.updated_at,
        t.title AS task_title, u.full_name AS freelancer_name, u.profile AS freelancer_profile,
        (SELECT COUNT(*)::int FROM task_application_likes l WHERE l.application_id = a.id) AS likes,
        EXISTS(SELECT 1 FROM task_application_likes l WHERE l.application_id = a.id AND l.user_id = ${req.user?.id || null}) AS liked
      FROM task_applications a JOIN tasks t ON t.id = a.task_id JOIN users u ON u.id = a.freelancer_id
      WHERE a.task_id = ${task.id} AND (${req.user?.id === task.owner_id} OR a.freelancer_id = ${req.user?.id || null})
      ORDER BY a.created_at DESC`;
    const applications = await Promise.all(rows.map(async (row) => {
      const replies = await sql`SELECT r.id, r.parent_id, r.user_id, r.text, r.created_at, u.full_name AS author FROM task_application_replies r JOIN users u ON u.id = r.user_id WHERE r.application_id = ${row.id} ORDER BY r.created_at`;
      return applicationResponse(row, row.likes, row.liked, replies.map((reply) => ({ id: reply.id, parentId: reply.parent_id, userId: reply.user_id, author: reply.author, text: reply.text, createdAt: reply.created_at })));
    }));
    res.json({ ...task.payload, id: task.id, ownerId: task.owner_id, ownerName: task.owner_name, status: task.status, createdAt: task.created_at, applications });
  } catch (error) { next(error); }
});

router.get('/tasks/applications/mine', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT a.id, a.task_id, a.freelancer_id, a.payload, a.status, a.created_at, a.updated_at,
        t.title AS task_title, t.payload AS task_payload, t.status AS task_status, u.full_name AS freelancer_name, u.profile AS freelancer_profile
      FROM task_applications a JOIN tasks t ON t.id = a.task_id JOIN users u ON u.id = a.freelancer_id
      WHERE a.freelancer_id = ${req.user.id} ORDER BY a.created_at DESC`;
    res.json(rows.map((row) => ({ ...applicationResponse(row), task: { ...row.task_payload, id: row.task_id, title: row.task_title, status: row.task_status } })));
  } catch (error) { next(error); }
});

router.get('/tasks/liked/applications', authenticated, async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT a.id, a.task_id, a.freelancer_id, a.payload, a.status, a.created_at, a.updated_at,
        t.title AS task_title, u.full_name AS freelancer_name, u.profile AS freelancer_profile
      FROM task_application_likes l JOIN task_applications a ON a.id = l.application_id
      JOIN tasks t ON t.id = a.task_id JOIN users u ON u.id = a.freelancer_id
      WHERE l.user_id = ${req.user.id} ORDER BY l.created_at DESC`;
    res.json(rows.map((row) => applicationResponse(row, 0, true)));
  } catch (error) { next(error); }
});

router.get('/tasks/dashboard/mine', authenticated, async (req, res, next) => {
  try {
    if (req.user.role === 'musteri') {
      const tasks = await sql`
        SELECT t.id, t.owner_id, t.payload, t.status, t.created_at, u.full_name AS owner_name,
          (SELECT COUNT(*)::int FROM task_applications a WHERE a.task_id = t.id) AS application_count
        FROM tasks t JOIN users u ON u.id = t.owner_id WHERE t.owner_id = ${req.user.id} ORDER BY t.updated_at DESC`;
      const map = (row) => ({ ...row.payload, id: row.id, ownerId: row.owner_id, ownerName: row.owner_name, status: row.status, createdAt: row.created_at, applicationCount: row.application_count });
      res.json({ replies: tasks.filter((row) => row.application_count > 0).map(map), active: tasks.filter((row) => row.status === 'in_progress').map(map), completed: tasks.filter((row) => row.status === 'completed').map(map), arbitration: [] });
      return;
    }
    const rows = await sql`
      SELECT a.id, a.task_id, a.freelancer_id, a.payload, a.status, a.created_at, a.updated_at,
        t.title AS task_title, t.payload AS task_payload, t.status AS task_status, u.full_name AS freelancer_name, u.profile AS freelancer_profile
      FROM task_applications a JOIN tasks t ON t.id = a.task_id JOIN users u ON u.id = t.owner_id
      WHERE a.freelancer_id = ${req.user.id} ORDER BY a.updated_at DESC`;
    const map = (row) => ({ ...applicationResponse({ ...row, freelancer_name: req.user.full_name, freelancer_profile: req.user.profile }), task: { ...row.task_payload, id: row.task_id, title: row.task_title, status: row.task_status } });
    res.json({ replies: rows.filter((row) => row.status === 'pending').map(map), active: rows.filter((row) => row.status === 'accepted' && row.task_status === 'in_progress').map(map), completed: rows.filter((row) => row.task_status === 'completed').map(map), arbitration: [] });
  } catch (error) { next(error); }
});

router.post('/tasks/:taskId/applications/:applicationId/accept', authenticated, async (req, res, next) => {
  if (!validId(req.params.taskId) || !validId(req.params.applicationId)) return res.status(400).json({ error: 'Müraciət identifikatoru yanlışdır.' });
  try {
    const app = await applicationFor(req.params.taskId, req.params.applicationId);
    if (!app || app.owner_id !== req.user.id) return res.status(404).json({ error: 'Müraciət tapılmadı və ya qəbul etməyə icazəniz yoxdur.' });
    const [accepted] = await sql`UPDATE task_applications SET status = 'accepted', updated_at = NOW() WHERE id = ${app.id} RETURNING id`;
    await sql`UPDATE tasks SET status = 'in_progress', updated_at = NOW() WHERE id = ${app.task_id} AND status = 'open'`;
    await createNotification(app.freelancer_id, 'Müraciət qəbul edildi', `“${app.task_title}” tapşırığına müraciətiniz qəbul edildi.`);
    res.json({ ok: true, id: accepted.id, status: 'qəbul edilib' });
  } catch (error) { next(error); }
});

router.patch('/tasks/:taskId/applications/:applicationId', authenticated, async (req, res, next) => {
  if (!validId(req.params.taskId) || !validId(req.params.applicationId)) return res.status(400).json({ error: 'Müraciət identifikatoru yanlışdır.' });
  try {
    const app = await applicationFor(req.params.taskId, req.params.applicationId);
    if (!app || app.freelancer_id !== req.user.id || app.status !== 'pending') return res.status(404).json({ error: 'Müraciət tapılmadı və ya redaktə etmək mümkün deyil.' });
    const payload = { ...app.payload, ...req.body };
    if (req.body?.message !== undefined) {
      payload.message = String(req.body.message).trim();
      if (payload.message.length < 10 || payload.message.length > 5000) return res.status(400).json({ error: 'Müraciət mətni 10-5000 simvol olmalıdır.' });
    }
    const [row] = await sql`UPDATE task_applications SET payload = ${sql.json(payload)}, updated_at = NOW() WHERE id = ${app.id} RETURNING id, payload, status, created_at, updated_at`;
    res.json({ ...row.payload, id: row.id, status: 'gözləyir', createdAt: row.created_at, updatedAt: row.updated_at });
  } catch (error) { next(error); }
});

router.delete('/tasks/:taskId/applications/:applicationId', authenticated, async (req, res, next) => {
  if (!validId(req.params.taskId) || !validId(req.params.applicationId)) return res.status(400).json({ error: 'Müraciət identifikatoru yanlışdır.' });
  try {
    const deleted = await sql`
      DELETE FROM task_applications a USING tasks t
      WHERE a.id = ${req.params.applicationId} AND a.task_id = ${req.params.taskId} AND t.id = a.task_id
        AND (a.freelancer_id = ${req.user.id} OR t.owner_id = ${req.user.id}) RETURNING a.id`;
    if (!deleted.length) return res.status(404).json({ error: 'Müraciət tapılmadı və ya silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/tasks/:taskId/applications/:applicationId/like', authenticated, async (req, res, next) => {
  if (!validId(req.params.taskId) || !validId(req.params.applicationId)) return res.status(400).json({ error: 'Müraciət identifikatoru yanlışdır.' });
  try {
    const app = await applicationFor(req.params.taskId, req.params.applicationId);
    if (!app || app.owner_id !== req.user.id) return res.status(404).json({ error: 'Müraciət tapılmadı.' });
    const exists = await sql`SELECT 1 FROM task_application_likes WHERE user_id = ${req.user.id} AND application_id = ${app.id}`;
    if (exists.length) await sql`DELETE FROM task_application_likes WHERE user_id = ${req.user.id} AND application_id = ${app.id}`;
    else await sql`INSERT INTO task_application_likes (user_id, application_id) VALUES (${req.user.id}, ${app.id}) ON CONFLICT DO NOTHING`;
    const [result] = await sql`SELECT COUNT(*)::int AS likes, EXISTS(SELECT 1 FROM task_application_likes WHERE user_id = ${req.user.id} AND application_id = ${app.id}) AS liked FROM task_application_likes WHERE application_id = ${app.id}`;
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/tasks/:taskId/applications/:applicationId/replies', authenticated, async (req, res, next) => {
  const text = String(req.body?.text || '').trim();
  const parentId = req.body?.parentId || null;
  if (!validId(req.params.taskId) || !validId(req.params.applicationId) || !text || text.length > 2000 || (parentId && !validId(parentId))) return res.status(400).json({ error: 'Cavab 1-2000 simvol olmalıdır.' });
  try {
    const app = await applicationFor(req.params.taskId, req.params.applicationId);
    if (!app || ![app.owner_id, app.freelancer_id].includes(req.user.id)) return res.status(404).json({ error: 'Müraciət tapılmadı.' });
    if (parentId) {
      const [parent] = await sql`SELECT id FROM task_application_replies WHERE id = ${parentId} AND application_id = ${app.id}`;
      if (!parent) return res.status(400).json({ error: 'Cavab verilən mesaj tapılmadı.' });
    }
    const [row] = await sql`INSERT INTO task_application_replies (application_id, user_id, parent_id, text) VALUES (${app.id}, ${req.user.id}, ${parentId}, ${text}) RETURNING id, parent_id, user_id, text, created_at`;
    const recipient = req.user.id === app.owner_id ? app.freelancer_id : app.owner_id;
    await createNotification(recipient, 'Yeni müraciət cavabı', `${req.user.full_name} “${app.task_title}” tapşırığı üzrə cavab yazdı.`);
    res.status(201).json({ id: row.id, applicationId: app.id, parentId: row.parent_id, userId: row.user_id, author: req.user.full_name, text: row.text, createdAt: row.created_at });
  } catch (error) { next(error); }
});

router.patch('/tasks/:taskId/applications/:applicationId/replies/:replyId', authenticated, async (req, res, next) => {
  const text = String(req.body?.text || '').trim();
  if (![req.params.taskId, req.params.applicationId, req.params.replyId].every(validId) || !text || text.length > 2000) return res.status(400).json({ error: 'Cavab məlumatları yanlışdır.' });
  try {
    const [row] = await sql`
      UPDATE task_application_replies r SET text = ${text}, updated_at = NOW()
      FROM task_applications a WHERE r.id = ${req.params.replyId} AND r.application_id = a.id
        AND a.id = ${req.params.applicationId} AND a.task_id = ${req.params.taskId} AND r.user_id = ${req.user.id}
      RETURNING r.id, r.text`;
    if (!row) return res.status(404).json({ error: 'Cavab tapılmadı və ya redaktə icazəniz yoxdur.' });
    res.json(row);
  } catch (error) { next(error); }
});

router.delete('/tasks/:taskId/applications/:applicationId/replies/:replyId', authenticated, async (req, res, next) => {
  if (![req.params.taskId, req.params.applicationId, req.params.replyId].every(validId)) return res.status(400).json({ error: 'Cavab identifikatoru yanlışdır.' });
  try {
    const deleted = await sql`
      DELETE FROM task_application_replies r USING task_applications a
      WHERE r.id = ${req.params.replyId} AND r.application_id = a.id AND a.id = ${req.params.applicationId}
        AND a.task_id = ${req.params.taskId} AND r.user_id = ${req.user.id} RETURNING r.id`;
    if (!deleted.length) return res.status(404).json({ error: 'Cavab tapılmadı və ya silmək icazəniz yoxdur.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/tasks/:id/status', authenticated, async (req, res, next) => {
  const statuses = ['open', 'in_progress', 'completed', 'closed'];
  if (!validId(req.params.id) || !statuses.includes(req.body?.status)) return res.status(400).json({ error: 'Tapşırıq statusu yanlışdır.' });
  try {
    const [task] = await sql`UPDATE tasks SET status = ${req.body.status}, updated_at = NOW() WHERE id = ${req.params.id} AND owner_id = ${req.user.id} RETURNING id, status`;
    if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı və ya dəyişmək icazəniz yoxdur.' });
    res.json(task);
  } catch (error) { next(error); }
});

router.post('/tasks/:id/reviews', authenticated, async (req, res, next) => {
  const rating = Number(req.body?.rating);
  const freelancerId = String(req.body?.freelancerId || '');
  const text = String(req.body?.text || '').trim();
  if (!validId(req.params.id) || !validId(freelancerId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || text.length > 3000) return res.status(400).json({ error: 'Rəy üçün düzgün qiymət və freelancer seçin.' });
  try {
    const [task] = await sql`SELECT id FROM tasks WHERE id = ${req.params.id} AND owner_id = ${req.user.id} AND status = 'completed'`;
    const [app] = await sql`SELECT id FROM task_applications WHERE task_id = ${req.params.id} AND freelancer_id = ${freelancerId} AND status = 'accepted'`;
    if (!task || !app) return res.status(403).json({ error: 'Yalnız tamamlanmış tapşırıqda qəbul edilmiş freelancerə rəy yazmaq olar.' });
    const [row] = await sql`
      INSERT INTO task_reviews (task_id, reviewer_id, freelancer_id, rating, text)
      VALUES (${task.id}, ${req.user.id}, ${freelancerId}, ${rating}, ${text})
      ON CONFLICT (task_id, reviewer_id, freelancer_id) DO UPDATE SET rating = EXCLUDED.rating, text = EXCLUDED.text
      RETURNING id, rating, text, created_at`;
    await createNotification(freelancerId, 'Yeni müştəri rəyi', `Tamamlanmış tapşırıq üzrə sizə ${rating}/5 qiymət verildi.`);
    res.status(201).json(row);
  } catch (error) { next(error); }
});

export default router;
