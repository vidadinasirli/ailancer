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

`server` eyni Node.js xidmətində AI və marketplace API-sini verir. Cari başlanğıc API-si qeydiyyat/giriş, profilin əsas məlumatları, freelancer siyahısı, layihə elanı yaratmaq/siyahılamaq/müraciət etmək və portfolio layihəsi yaratmaq/oxumaq endpoint-lərini saxlayır. Mesajlaşma, fayl yükləmə, sosial klub, bəyənmə və layihə şərhləri kimi frontend səthlər üçün ayrıca endpoint və storage işi hələ tamamlanmalıdır; həmin funksiyaları bu backend-də mövcud kimi qəbul etməyin.

## Pulsuz hostinq

Bu layihə üçün sadə başlanğıc kombinasiyası **Supabase Free (PostgreSQL) + Render Free (Node API) + Vercel/Netlify Free (frontend)**-dir. Pulsuz planların resurs və boş qalma qaydaları dəyişə bilər; canlı tədbirdən əvvəl xidməti əl ilə yoxlayın. Render serveri boş qalanda yatarsa ilk sorğu gecikə bilər.

1. **Supabase:** yeni layihə açın. Database settings-dəki `Session pooler` connection string-i Render-də `DATABASE_URL` secret kimi saxlayın. Bu layihə backend-dən PostgreSQL-ə qoşulur; service-role və DB açarlarını frontend-ə heç vaxt qoymayın.
2. **Render:** GitHub repozitoriyasını Render Blueprint-ə qoşun və [render.yaml](./render.yaml)-ı deploy edin. Web service üçün root directory `server`, build `npm ci`, start `npm start`, health check isə `/api/health` olmalıdır. Render dashboard-da `AI_API_KEY` secret-ini və `DATABASE_URL`-ni Supabase pooler URL-i ilə təyin edin. `APP_JWT_SECRET` Blueprint tərəfindən avtomatik yaradılır; mövcud servisdə yoxdursa, Environment bölməsində uzun və təsadüfi dəyər kimi ayrıca əlavə edin. Sonra backend URL-ini qeyd edin: `https://<service>.onrender.com`.
3. **Frontend:** Vercel-də əsas repozitoriyanı import edin; Vite tətbiqini (repo kökü, `./`) seçin, build `npm run build`, output `dist`. `vercel.json` SPA marşrutlarını və `/api/*` sorğularını `https://ailancer-api.onrender.com` backend-inə yönləndirir. Production frontend API sorğularını həmin same-origin proxy ilə göndərir; Vercel-də `VITE_API_URL` və `VITE_AI_API_URL` təyin etməyin, əks halda birbaşa Render sorğuları CORS səbəbindən bloklana bilər. Backend dəyişdiriləndə `vercel.json` faylındakı rewrite destination-ı yeniləyin.

   `CORS_ORIGIN` boş olduqda backend brauzer origin-lərinə açıq CORS cavabı verir. İstehsalda bunu Vercel domeni ilə məhdudlaşdırın.

## API əhatəsi və limitlər

Marketplace üçün `server/routes/marketplace.js` hazırda qeydiyyat/giriş (şifrə hash-i və müddətli imzalı token), əsas profil oxuma/redaktə, açıq freelancer siyahısı, açıq tapşırıqlar, tapşırıq yaratma/silmə/müraciət və portfolio layihələrini oxuma/yazma endpoint-lərini verir. Verilənlər bazası cədvəlləri `DATABASE_URL` qoşulduqda server başlanarkən yaradılır. Mesajlaşma, fayl storage, klub, bildirişlər, bəyənmələr, şərhlər və təkliflərin idarəsi tamamlanmayıb; onları təqdimat öncəsi ayrıca həyata keçirmək və sınaqdan keçirmək lazımdır.

AI portfolio mətnini qaralama kimi yaradır. Portfolio media/fayl yükləməsi və dərc etmə istifadəçinin təsdiqini tələb edir; backend-də fayl yükləmə xidməti hazır deyil.
