# Ailancer

Ailancer freelancer sifarişlərini strukturlaşdırmağa kömək edir. Ana səhifədəki Gemini əsaslı Lumi köməkçisi platformanın açıq freelancer və elanlarını uyğunlaşdırır, portfolio mətni hazırlayır və təkmilləşdirir, müraciət qaralaması yaradır və brief analiz edir.

## Lokal quraşdırma

Tələblər: Node.js 20 və ya daha yeni versiya.

1. Frontend və server asılılıqlarını quraşdırın:

   ```powershell
   npm install
   npm --prefix server install
   ```

2. Server konfiqurasiyasını yaradın:

   ```powershell
   if (-not (Test-Path server\.env)) { Copy-Item server\.env.example server\.env }
   ```

3. `server\.env` faylında AI açarı, PostgreSQL ünvanı və lokal JWT sirrini təyin edin:

   ```env
   AI_PROVIDER=gemini
   AI_API_KEY=YOUR_GEMINI_API_KEY
   AI_MODEL=gemini-3.7-flash
   DATABASE_URL=YOUR_SUPABASE_SESSION_POOLER_URL
   APP_JWT_SECRET=YOUR_RANDOM_SECRET
   ```

   Supabase-də layihə yaradın və **Connect → Session pooler** bölməsindən PostgreSQL connection string-i götürün. `APP_JWT_SECRET` üçün PowerShell-də `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` işlədin. Açarları repozitoriyaya commit etməyin və çata göndərməyin; `.env` faylları Git tərəfindən nəzərə alınmır. Server açılarkən cədvəllər avtomatik yaradılır.

4. İki ayrı terminalda backend və frontend-i başladın:

   ```powershell
   npm run server
   ```

   ```powershell
   npm run dev
   ```

   Backend health: `http://localhost:4000/api/health`; Gemini status: `http://localhost:4000/api/ai/status`. Frontend: Vite-in göstərdiyi ünvan, adətən `http://localhost:5173`. PostgreSQL qurulmayıbsa marketplace health `503` və `database.ready:false` qaytarır; server isə bunu yaddaşda saxlanılan işlək məlumat kimi göstərmir.

`server` eyni Node.js xidmətində AI və marketplace API-sini verir. Marketplace endpoint-ləri PostgreSQL-də hesabları, profilləri və təcrübə/sertifikat məlumatlarını, tapşırıq və müraciətləri, portfolio və şərhləri, mesajları, bildirişləri, klub yazılarını, dəstək müraciətlərini və yüklənən medianı saxlayır. Server başlanarkən cədvəllər `CREATE TABLE IF NOT EXISTS` ilə əlavə olunur; mövcud cədvəllər və məlumatlar silinmir.

## Pulsuz hostinq

Bu layihə üçün sadə başlanğıc kombinasiyası **Supabase Free (PostgreSQL) + Render Free (Node API) + Vercel/Netlify Free (frontend)**-dir. Pulsuz planların resurs və boş qalma qaydaları dəyişə bilər; canlı tədbirdən əvvəl xidməti əl ilə yoxlayın. Render serveri boş qalanda yatarsa ilk sorğu gecikə bilər.

1. **Supabase:** yeni layihə açın. Database settings-dəki `Session pooler` connection string-i Render-də `DATABASE_URL` secret kimi saxlayın. Bu layihə backend-dən PostgreSQL-ə qoşulur; service-role və DB açarlarını frontend-ə heç vaxt qoymayın.
2. **Render:** GitHub repozitoriyasını Render Blueprint-ə qoşun və [render.yaml](./render.yaml)-ı deploy edin. Web service üçün root directory `server`, build `npm ci`, start `npm start`, health check isə `/api/health` olmalıdır. Render dashboard-da `AI_API_KEY` secret-ini və `DATABASE_URL`-ni Supabase pooler URL-i ilə təyin edin. `APP_JWT_SECRET` Blueprint tərəfindən avtomatik yaradılır; mövcud servisdə yoxdursa, Environment bölməsində uzun və təsadüfi dəyər kimi ayrıca əlavə edin. Sonra backend URL-ini qeyd edin: `https://<service>.onrender.com`.
3. **Frontend:** Vercel-də əsas repozitoriyanı import edin; Vite tətbiqini (repo kökü, `./`) seçin, build `npm run build`, output `dist`. `vercel.json` SPA marşrutlarını və `/api/*` sorğularını `https://ailancer-api.onrender.com` backend-inə yönləndirir. Production frontend API sorğularını həmin same-origin proxy ilə göndərir; Vercel-də `VITE_API_URL` və `VITE_AI_API_URL` təyin etməyin, əks halda birbaşa Render sorğuları CORS səbəbindən bloklana bilər. Backend dəyişdiriləndə `vercel.json` faylındakı rewrite destination-ı yeniləyin.

   Production frontend `https://ailancer-zeta.vercel.app` domenindən istifadə edir; backend bu origin-ə həmişə icazə verir. Başqa xüsusi domenlər də istifadə olunarsa, Render-də `CORS_ORIGIN` dəyişəninə vergüllə ayrılmış origin-ləri (`https://example.com`, sonda `/` olmadan) əlavə edin. `CORS_ORIGIN` boş olduqda digər brauzer origin-ləri də açıq qalır.

## API əhatəsi və limitlər

Marketplace endpoint-ləri `server/routes/marketplace.js` və `server/routes/features.js` daxilindədir. Qeydiyyat/giriş, profil məlumatları, iş təcrübəsi və sertifikatlar, tapşırıqlar/müraciətlər/rəylər, portfolio/bəyənmə/şərhlər, Klub, mesajlaşma/bloklama, bildirişlər, sosial linklər/onlayn status, dəstək forması və media yükləmə API-ləri PostgreSQL istifadə edir. Media faylları 50 MB-a qədər `uploaded_media` cədvəlində saxlanılır; bu yanaşma Supabase layihəsinin database storage limitlərinə daxildir. `/api/health` yalnız PostgreSQL bağlantısı və sxem başlanğıcı uğurlu olduqda `200` və `database.ready:true` qaytarır.

AI portfolio mətni qaralama kimi yaradır. Portfolio dərc etmə və media istifadəsi istifadəçinin təsdiqini tələb edir.

## Demo məlumatları

Təqdimat üçün nümunə hesab və məzmun yaratmaq istəyəndə əvvəlcə `server\.env` faylındakı `DATABASE_URL`-nin düzgün bazaya qoşulduğunu yoxlayın. Seed skripti mövcud cədvəlləri başladır, nümunə hesabları, portfolio, tapşırıq və Klub yazılarını təkrar işə salmada yeniləyir; demo olmayan hesabı heç vaxt yeniləmir. Nümunə hesablar `.invalid` e-poçt ünvanlarından istifadə edir, giriş üçün parol yaratmır və bütün görünən profillərdə “Demo hesabı” kimi işarələnir.

PowerShell-də repo kökündən yalnız yoxlanmış verilənlər bazası üçün başladın:

```powershell
$env:DEMO_SEED_CONFIRM = "YES"
npm --prefix server run seed:demo
Remove-Item Env:DEMO_SEED_CONFIRM
```
