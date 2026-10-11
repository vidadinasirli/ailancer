import 'dotenv/config';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { init, sql } from '../store.js';

const scrypt = promisify(scryptCallback);
const connectionString = (process.env.DATABASE_URL || '').trim();
if (!/^postgres(ql)?:\/\//.test(connectionString)) throw new Error('Demo məlumatları üçün PostgreSQL DATABASE_URL tələb olunur.');
if (process.env.DEMO_SEED_CONFIRM !== 'YES') throw new Error('Yoxlama üçün DEMO_SEED_CONFIRM=YES təyin edin.');
if (!sql) throw new Error('Demo məlumatları üçün PostgreSQL bağlantısı qurulmayıb.');
const demoBadge = 'Demo hesabı';
const freelancers = [
  { key: 'freelancer-01', name: 'Demo · UI dizayner 01', title: 'UI/UX və məhsul dizayneri', skills: ['Dizayn və kreativ', 'Figma', 'Mobil tətbiq dizaynı'], about: 'Mobil tətbiqlər və veb məhsullar üçün aydın, əlçatan interfeyslər hazırlayan nümunə freelancer profilidir.', experience: '3-5 il', rate: 35, company: 'Demo Design Studio', certificate: 'UI/UX dizayn əsasları', project: 'Mobil bank tətbiqinin interfeysi', description: 'Bank əməliyyatlarını sadələşdirən mobil tətbiq üçün demo istifadəçi axınları, komponentlər və interfeys konsepti.' },
  { key: 'freelancer-02', name: 'Demo · Frontend developer 02', title: 'React və frontend developer', skills: ['Proqramlaşdırma', 'React', 'JavaScript'], about: 'React ilə sürətli, istifadəsi rahat və müxtəlif ekranlara uyğun veb tətbiqlər quran nümunə developer profili.', experience: '3-5 il', rate: 45, company: 'Demo Web Lab', certificate: 'Frontend proqramlaşdırma', project: 'SaaS analitika paneli', description: 'Cədvəllər, göstəricilər və responsiv naviqasiya ilə demo SaaS analitika paneli.' },
  { key: 'freelancer-03', name: 'Demo · Brend dizayner 03', title: 'Brend və qrafik dizayner', skills: ['Dizayn və kreativ', 'Brendinq', 'Vektor qrafika'], about: 'Vizual kimlik, loqo və sosial media materialları hazırlayan nümunə dizayner profili.', experience: '1-3 il', rate: 30, company: 'Demo Visuals', certificate: 'Qrafik dizayn', project: 'Ekoloji brendin vizual kimliyi', description: 'Ekoloji məhsul brendi üçün rəng palitrası, qablaşdırma və loqo sisteminin demo təqdimatı.' },
  { key: 'freelancer-04', name: 'Demo · Backend developer 04', title: 'Node.js və API developer', skills: ['Proqramlaşdırma', 'Node.js', 'Verilənlər bazası'], about: 'REST API və PostgreSQL əsaslı xidmətlər quran nümunə backend developer profili.', experience: '5+ il', rate: 55, company: 'Demo Backend Works', certificate: 'Bulud texnologiyaları', project: 'Onlayn rezervasiya API-si', description: 'Rezervasiya, istifadəçi hesabları və bildirişlər üçün demo REST API arxitekturası.' },
  { key: 'freelancer-05', name: 'Demo · Kontent müəllifi 05', title: 'Azərbaycan dili üzrə kopirayter', skills: ['Marketinq', 'Kopiraytinq', 'Kontent'], about: 'Brendlər üçün Azərbaycan dilində aydın veb mətnləri və məhsul təsvirləri hazırlayan nümunə müəllif profili.', experience: '1-3 il', rate: 25, company: 'Demo Content House', certificate: 'Rəqəmsal marketinq', project: 'Yerli qəhvə brendi üçün kontent', description: 'Veb-sayt, sosial şəbəkələr və məhsul səhifələri üçün demo kontent strategiyası və mətnlər.' },
  { key: 'freelancer-06', name: 'Demo · Motion dizayner 06', title: 'Video montaj və motion dizayner', skills: ['Dizayn və kreativ', 'Video montaj', 'Motion dizayn'], about: 'Qısa sosial media videoları və animasiyalı təqdimatlar hazırlayan nümunə motion dizayner profili.', experience: '3-5 il', rate: 40, company: 'Demo Motion Studio', certificate: 'Motion dizayn', project: 'Mobil tətbiq üçün məhsul videosu', description: 'Tətbiqin əsas üstünlüklərini göstərən 20 saniyəlik demo motion video konsepti.' },
  { key: 'freelancer-07', name: 'Demo · Mobil developer 07', title: 'Flutter mobil developer', skills: ['Proqramlaşdırma', 'Flutter', 'Mobil tətbiq dizaynı'], about: 'iOS və Android üçün vahid kod bazalı mobil tətbiqlər hazırlayan nümunə developer profili.', experience: '3-5 il', rate: 50, company: 'Demo Mobile Lab', certificate: 'Mobil tətbiq hazırlanması', project: 'Vərdiş izləmə tətbiqi', description: 'Gündəlik məqsədlər, irəliləyiş və xatırlatmalar üçün demo mobil tətbiq konsepti.' },
  { key: 'freelancer-08', name: 'Demo · Marketinq mütəxəssisi 08', title: 'SMM və rəqəmsal marketinq', skills: ['Marketinq', 'SMM', 'Analitika'], about: 'Sosial media üçün planlama, kontent təqvimi və ölçülə bilən kampaniyalar quran nümunə marketinq profili.', experience: '1-3 il', rate: 32, company: 'Demo Growth Studio', certificate: 'Sosial media marketinqi', project: 'Təhsil platforması üçün SMM planı', description: 'Bir aylıq demo kontent təqvimi, auditoriya seqmentləri və kampaniya ölçüləri.' },
];

const customers = [
  { key: 'customer-01', name: 'Demo · Sifarişçi 01', company: 'Demo Təhsil Platforması', industry: 'Təhsil və texnologiya', about: 'Təhsil məhsullarını sınaqdan keçirmək üçün nümunə sifarişçi profilidir.' },
  { key: 'customer-02', name: 'Demo · Sifarişçi 02', company: 'Demo E-ticarət Studiyası', industry: 'Elektron ticarət', about: 'Rəqəmsal mağaza ideyalarını nümayiş etdirmək üçün nümunə sifarişçi profilidir.' },
];

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
}

function svgDataUri(title, subtitle, colors, initials = '') {
  const [start, end] = colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient><pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#fff" opacity=".2"/></pattern></defs><rect width="1200" height="720" rx="44" fill="url(#g)"/><rect width="1200" height="720" rx="44" fill="url(#p)"/><circle cx="1000" cy="120" r="190" fill="#fff" opacity=".09"/><circle cx="1060" cy="650" r="260" fill="#fff" opacity=".08"/><rect x="72" y="68" width="88" height="42" rx="21" fill="#fff" opacity=".2"/><text x="116" y="96" font-family="Arial,sans-serif" font-size="19" text-anchor="middle" fill="#fff">DEMO</text>${initials ? `<circle cx="600" cy="360" r="220" fill="#fff" opacity=".14"/><text x="600" y="430" font-family="Arial,sans-serif" font-size="200" font-weight="700" text-anchor="middle" fill="#fff">${escapeXml(initials)}</text>` : `<text x="88" y="500" font-family="Arial,sans-serif" font-size="55" font-weight="700" fill="#fff">${escapeXml(title)}</text><text x="92" y="555" font-family="Arial,sans-serif" font-size="26" fill="#fff" opacity=".84">${escapeXml(subtitle)}</text><rect x="88" y="600" width="160" height="7" rx="3" fill="#fff" opacity=".65"/>`}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function palette(index) {
  return [
    ['#2563eb', '#06b6d4'], ['#7c3aed', '#2563eb'], ['#db2777', '#f97316'],
    ['#0891b2', '#4f46e5'], ['#059669', '#0d9488'], ['#ea580c', '#db2777'],
    ['#4f46e5', '#7c3aed'], ['#ca8a04', '#ea580c'],
  ][index % 8];
}

function emailFor(key) {
  return `${key}@demo.ailancer.invalid`;
}

async function passwordHash() {
  const salt = randomBytes(16);
  const password = randomBytes(48);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${Buffer.from(derived).toString('hex')}`;
}

async function seedAccount(tx, account, role, profile) {
  const email = emailFor(account.key);
  const [user] = await tx`
    INSERT INTO users (email, password_hash, full_name, role, profile)
    VALUES (${email}, ${await passwordHash()}, ${account.name}, ${role}, ${tx.json(profile)})
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name, role = EXCLUDED.role, profile = EXCLUDED.profile, updated_at = NOW()
    WHERE users.profile->>'isDemo' = 'true'
    RETURNING id, email, full_name`;
  if (!user) throw new Error(`Bu demo e-poçtu artıq demo olmayan hesab tərəfindən istifadə olunur: ${email}`);
  return user;
}

async function seedProfileItem(tx, userId, key, kind, payload) {
  await tx`DELETE FROM profile_items WHERE user_id = ${userId} AND payload->>'demoKey' LIKE ${`${key}:%`}`;
  await tx`INSERT INTO profile_items (user_id, kind, payload) VALUES (${userId}, ${kind}, ${tx.json(payload)})`;
}

async function seedProject(tx, userId, key, payload) {
  const demoKey = `${key}:portfolio`;
  const [existing] = await tx`SELECT id FROM projects WHERE owner_id = ${userId} AND payload->>'demoKey' = ${demoKey}`;
  if (existing) {
    await tx`UPDATE projects SET payload = ${tx.json(payload)}, updated_at = NOW() WHERE id = ${existing.id}`;
    return existing.id;
  }
  const [project] = await tx`INSERT INTO projects (owner_id, payload) VALUES (${userId}, ${tx.json(payload)}) RETURNING id`;
  return project.id;
}

async function seedTask(tx, userId, key, payload) {
  const demoKey = `${key}:task`;
  const [existing] = await tx`SELECT id FROM tasks WHERE owner_id = ${userId} AND payload->>'demoKey' = ${demoKey}`;
  if (existing) {
    await tx`UPDATE tasks SET title = ${payload.title}, payload = ${tx.json(payload)}, updated_at = NOW() WHERE id = ${existing.id}`;
    return existing.id;
  }
  const [task] = await tx`INSERT INTO tasks (owner_id, title, payload) VALUES (${userId}, ${payload.title}, ${tx.json(payload)}) RETURNING id`;
  return task.id;
}

async function seedClubPost(tx, userId, key, payload) {
  const demoKey = `${key}:club`;
  const [existing] = await tx`SELECT id FROM club_posts WHERE user_id = ${userId} AND payload->>'demoKey' = ${demoKey}`;
  if (existing) {
    await tx`UPDATE club_posts SET payload = ${tx.json(payload)}, updated_at = NOW() WHERE id = ${existing.id}`;
    return existing.id;
  }
  const [post] = await tx`INSERT INTO club_posts (user_id, payload) VALUES (${userId}, ${tx.json(payload)}) RETURNING id`;
  return post.id;
}

try {
  await init();
  const counts = await sql.begin(async (tx) => {
    const accountIds = new Map();
    for (let index = 0; index < freelancers.length; index += 1) {
      const person = freelancers[index];
      const colors = palette(index);
      const initials = String(index + 1).padStart(2, '0');
      const profile = {
        about: person.about,
        avatarUrl: svgDataUri(person.title, demoBadge, colors, initials),
        bannerUrl: svgDataUri(person.title, demoBadge, colors),
        isProfileVisible: true,
        isDemo: true,
        demoLabel: demoBadge,
        status: person.title,
        activityAreas: person.skills,
        experience: person.experience,
        hourlyRate: person.rate,
        rateType: '1 saat üçün',
        nickname: `demo-${person.key}`,
        createdAt: new Date().toISOString(),
      };
      const user = await seedAccount(tx, person, 'freelancer', profile);
      accountIds.set(person.key, user.id);
      await seedProfileItem(tx, user.id, person.key, 'specialty', {
        demoKey: `${person.key}:specialty`,
        category: person.skills[0],
        title: person.title,
        about: person.about,
        experience: person.experience,
        hourlyRate: person.rate,
        rateType: 'Saatlıq',
      });
      await seedProfileItem(tx, user.id, person.key, 'experience', {
        demoKey: `${person.key}:experience`,
        positionTitle: person.title,
        companyName: person.company,
        location: 'Bakı, Azərbaycan',
        employmentType: 'Freelance',
        startDate: '2022-01',
        endDate: '',
        isCurrent: true,
        description: `${demoBadge} profili üçün nümunə iş təcrübəsi.`,
      });
      await seedProfileItem(tx, user.id, person.key, 'certificate', {
        demoKey: `${person.key}:certificate`,
        name: person.certificate,
        issuer: 'Ailancer demo nümunəsi',
        issueDate: '2025-01',
        credentialId: `DEMO-${String(index + 1).padStart(3, '0')}`,
        credentialUrl: '',
        description: 'Nümayiş məqsədli nümunə sertifikat. Real kvalifikasiya sənədi deyil.',
      });
      const image = svgDataUri(person.project, 'Portfolio nümunəsi', colors);
      await seedProject(tx, user.id, person.key, {
        demoKey: `${person.key}:portfolio`,
        isDemo: true,
        demoLabel: demoBadge,
        title: person.project,
        description: person.description,
        category: person.skills[0],
        categories: person.skills,
        author: user.full_name,
        image,
        imageUrl: image,
        mediaUrls: [image],
        views: 0,
      });
      await tx`
        INSERT INTO user_social_data (user_id, links, is_online, last_seen)
        VALUES (${user.id}, ${tx.json({ github: '', instagram: '', linkedin: '', facebook: '' })}, FALSE, NOW())
        ON CONFLICT (user_id) DO UPDATE SET links = EXCLUDED.links, is_online = FALSE`;
    }

    const clientIds = [];
    for (const [index, client] of customers.entries()) {
      const profile = {
        about: client.about,
        avatarUrl: svgDataUri(client.company, demoBadge, palette(index + 3), `S${index + 1}`),
        bannerUrl: svgDataUri(client.company, 'Nümunə sifarişçi', palette(index + 3)),
        isProfileVisible: true,
        isDemo: true,
        demoLabel: demoBadge,
        companyName: client.company,
        companyIndustry: client.industry,
        companySize: '2-10 əməkdaş',
        customerType: 'company',
        nickname: `demo-${client.key}`,
      };
      const user = await seedAccount(tx, client, 'musteri', profile);
      clientIds.push(user.id);
    }

    const taskSamples = [
      { owner: 0, title: 'Təhsil platforması üçün landing page', description: 'Mobil uyğun, Azərbaycan dilində təhsil platformasının landing page dizaynı və React ilə hazırlanması. Səhifədə kurslar, müəllimlər və qeydiyyat çağırışı olmalıdır.', price: 450, currency: 'AZN', priceType: 'Layihə üzrə', categories: ['Veb-Saytların hazırlanması', 'Front-end'], deliveryDays: 10 },
      { owner: 0, title: 'Onlayn kurs üçün vizual kimlik', description: 'Yeni onlayn kurs üçün loqo, rəng palitrası, sosial media post şablonları və qısa istifadə qaydaları hazırlansın.', price: 220, currency: 'AZN', priceType: 'Layihə üzrə', categories: ['Dizayn', 'Vektor qrafika'], deliveryDays: 7 },
      { owner: 0, title: 'Kurs kataloqu üçün backend API', description: 'Kurs siyahısı, kateqoriyalar və qeydiyyat üçün Node.js və PostgreSQL əsaslı demo REST API hazırlanmalıdır.', price: 600, currency: 'AZN', priceType: 'Layihə üzrə', categories: ['Back-end', 'Verilənlər bazası'], deliveryDays: 14 },
      { owner: 1, title: 'Məhsul kataloqu üçün mobil tətbiq prototipi', description: 'Elektron mağaza üçün məhsul kataloqu, axtarış və səbət axınlarını əhatə edən mobil prototip hazırlanmalıdır.', price: 380, currency: 'AZN', priceType: 'Layihə üzrə', categories: ['Mobil tətbiq dizaynı', 'Dizayn'], deliveryDays: 9 },
      { owner: 1, title: 'Sosial media üçün qısa məhsul videosu', description: 'Yeni kolleksiya üçün 15 saniyəlik şaquli məhsul videosu, animasiyalı başlıqlar və altyazılar hazırlanmalıdır.', price: 160, currency: 'AZN', priceType: 'Layihə üzrə', categories: ['Video montaj', 'Motion dizayn'], deliveryDays: 5 },
      { owner: 1, title: 'Mağaza üçün Azərbaycan dilində məhsul mətnləri', description: 'On məhsul üçün aydın, fayda yönümlü Azərbaycan dilində təsvirlər və meta başlıqlar yazılmalıdır.', price: 120, currency: 'AZN', priceType: 'Layihə üzrə', categories: ['Kopiraytinq', 'Marketinq'], deliveryDays: 4 },
    ];
    for (const [index, task] of taskSamples.entries()) {
      const owner = clientIds[task.owner];
      await seedTask(tx, owner, `demo-task-${index + 1}`, {
        ...task,
        demoKey: `demo-task-${index + 1}:task`,
        isDemo: true,
        demoLabel: demoBadge,
      });
    }

    const clubSamples = [
      { owner: 0, title: 'Nümunə mövzu: məhsul dizaynında sadəlik', type: 'müzakirə', tags: ['Dizayn'], content: 'Demo icma mövzusu: məhsul interfeysində sadəlik və əlçatanlıq barədə fikir mübadiləsi üçün nümunə paylaşım.' },
      { owner: 1, title: 'Nümunə sual: layihə briefini necə hazırlamaq olar?', type: 'sual', tags: ['Biznes dəstəyi'], content: 'Demo icma mövzusu: freelancerə ilk müraciətdən öncə hansı məlumatların hazırlanmasının faydalı olduğuna dair nümunə sual.' },
      { owner: 2, title: 'Nümunə təcrübə: portfolionu strukturlaşdırmaq', type: 'təcrübə', tags: ['Proqramlaşdırma'], content: 'Demo icma paylaşımı: portfolio layihələrində problem, yanaşma və nəticəni aydın göstərmək üçün nümunə.' },
      { owner: 3, title: 'Nümunə elan: yaradıcı əməkdaşlıq', type: 'elan', tags: ['Marketinq'], content: 'Demo icma elanı: dizayn və marketinq bacarıqlarını birləşdirən nümunəvi əməkdaşlıq mövzusu.' },
    ];
    for (const [index, post] of clubSamples.entries()) {
      const [postOwner] = await tx`SELECT id FROM users WHERE email = ${emailFor(freelancers[post.owner].key)}`;
      await seedClubPost(tx, postOwner.id, `demo-club-${index + 1}`, {
        ...post,
        demoKey: `demo-club-${index + 1}:club`,
        isDemo: true,
        demoLabel: demoBadge,
        views: 0,
      });
    }

    return { freelancerCount: freelancers.length, customerCount: customers.length, taskCount: taskSamples.length, projectCount: freelancers.length, clubPostCount: clubSamples.length };
  });
  console.log(`Seeded visible ${demoBadge} data: ${counts.freelancerCount} freelancer, ${counts.customerCount} sifarişçi, ${counts.projectCount} portfolio, ${counts.taskCount} tapşırıq, ${counts.clubPostCount} klub yazısı. Hesablar təkrar işə salmada yenilənir; giriş parolları yaradılmır/paylaşılmır.`);
} finally {
  await sql.end();
}
