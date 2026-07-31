# Walimatulurus RSVP — Muhammad Danish & Nur Yasmin Imanina

Laman web jemputan majlis perkahwinan (Walimatulurus) yang elegan, mobile-first, dan ditulis dalam Bahasa Melayu. Dibina dengan **Vite**, **HTML/CSS/JavaScript vanilla**, dan **Supabase**.

## 1. Keperluan projek

- [Node.js](https://nodejs.org/) **18+** (disyorkan LTS 20 atau 22)
- Akaun [Supabase](https://supabase.com/) (percuma)
- Penyemak imbas moden
- Editor teks (Cursor / VS Code)

Stack:

| Lapisan   | Teknologi              |
|-----------|------------------------|
| Build     | Vite                   |
| Frontend  | HTML, CSS, JavaScript  |
| Database  | Supabase (PostgreSQL)  |
| Hosting   | Vercel / Netlify       |

## 2. Pasang Node.js

1. Muat turun pemasang dari [https://nodejs.org/](https://nodejs.org/)
2. Pasang dan pastikan `npm` disertakan
3. Semak versi:

```bash
node -v
npm -v
```

## 3. Cipta projek Vite (jika bermula dari kosong)

Projek ini sudah menggunakan templat Vite vanilla. Jika anda ingin mencipta semula:

```bash
npm create vite@latest wedding-rsvp -- --template vanilla
cd wedding-rsvp
```

Kemudian salin fail sumber dari repositori ini ke dalam folder tersebut.

## 4. Pasang kebergantungan

Dalam folder projek:

```bash
npm install
```

Pakej utama:

```bash
npm install @supabase/supabase-js
```

(Sudah termasuk dalam `package.json`.)

## 5. Cipta projek Supabase

1. Log masuk ke [https://supabase.com/](https://supabase.com/)
2. Klik **New project**
3. Pilih organisasi, nama projek, kata laluan pangkalan data, dan rantau
4. Tunggu projek siap

## 6. Jalankan `supabase-schema.sql`

1. Dalam dashboard Supabase, buka **SQL Editor**
2. Klik **New query**
3. Salin seluruh kandungan fail `supabase-schema.sql`
4. Tampal dan klik **Run**

Skrip ini akan:

- Mencipta jadual `rsvp` dan `wishes`
- Menambah check constraints & indeks
- Mengaktifkan Row Level Security (RLS)
- Membenarkan anon memasukkan RSVP (tanpa baca awam)
- Membenarkan anon memasukkan & membaca ucapan
- Menyediakan fungsi RPC selamat untuk semakan/pengemaskinian RSVP berganda

## 7. Dapatkan URL dan anon key

1. Dashboard Supabase → **Project Settings** → **API**
2. Salin:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

Jangan sekali-kali letak **service_role** key dalam kod frontend.

## 8. Cipta fail `.env`

```bash
cp .env.example .env
```

Pada Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Fail `.env` tidak patut dikomit ke Git.

## 9. Jalankan secara lokal

```bash
npm run dev
```

Buka URL yang ditunjukkan Vite (biasanya `http://localhost:5173`).

## 10. Bina untuk produksi

```bash
npm run build
```

Pratonton binaan:

```bash
npm run preview
```

Output berada dalam folder `dist/`.

## 11. Deploy ke Vercel atau Netlify

### Vercel

1. Tolak projek ke GitHub
2. Import di [Vercel](https://vercel.com/)
3. Framework preset: **Vite**
4. Tambah Environment Variables (penting: Vite memasukkan nilai ini semasa **build**):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy / redeploy selepas menambah env vars

### Netlify

1. Import repositori di [Netlify](https://netlify.com/)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Tambah environment variables yang sama
5. Deploy

## 12. Kemaskini butiran majlis

Edit objek `weddingConfig` dalam `src/main.js`:

```js
export const weddingConfig = {
  couple: {
    groom: 'MUHAMMAD DANISH BIN SHAMSURI',
    bride: 'NUR YASMIN IMANINA BINTI MAZLAN',
  },
  event: {
    date: '2027-01-01T11:00:00+08:00',
    day: 'Jumaat',
    startTime: '11:00 pagi',
    endTime: '4:00 petang',
    venue: 'Nama Dewan',
    address: 'Alamat penuh majlis',
    googleMapsUrl: 'https://maps.google.com/...',
    wazeUrl: 'https://waze.com/ul/...',
  },
};
```

Semua paparan tarikh, masa, lokasi, pautan peta, countdown, dan kalendar mengambil data dari objek ini.

## 13. Ganti imej placeholder

Ganti fail berikut dalam `public/images/`:

| Fail                      | Kegunaan                          |
|---------------------------|-----------------------------------|
| `couple-placeholder.jpg`  | Gambar pasangan (hero & latar)    |
| `floral-decoration.png`   | Hiasan bunga hiasan (PNG lutsinar)|

Cadangan:

- Gambar pasangan: nisbah ~4:5, resolusi sekurang-kurangnya 800×1000
- Floral: PNG dengan latar lutsinar
- Kekalkan nama fail yang sama, atau kemaskini laluan dalam `index.html` / CSS

## 14. Semak penyerahan RSVP dengan selamat

Data RSVP **tidak** dibaca secara awam melalui frontend (RLS).

Untuk melihat RSVP:

1. Buka Supabase Dashboard
2. **Table Editor** → jadual `rsvp`
3. Atau gunakan SQL Editor:

```sql
SELECT * FROM rsvp ORDER BY created_at DESC;
```

Dashboard menggunakan keistimewaan admin dan memintas RLS. Jangan dedahkan `service_role` key kepada tetamu.

---

## Struktur fail

```text
wedding-rsvp/
├── index.html
├── package.json
├── .env.example
├── README.md
├── supabase-schema.sql
├── public/
│   └── images/
│       ├── couple-placeholder.jpg
│       └── floral-decoration.png
└── src/
    ├── main.js
    ├── style.css
    ├── supabase.js
    ├── rsvp.js
    ├── wishes.js
    ├── validation.js
    └── utils.js
```

## Ciri utama

- Hero dengan countdown langsung
- Jemputan Islamik dalam Bahasa Melayu
- Kad maklumat majlis + Google Maps / Waze / kalendar (.ics)
- Borang RSVP dengan pengesahan & pengendalian nombor telefon berganda
- Titipan ucapan + senarai dengan “Lihat Lagi”
- Animasi halus (menghormati `prefers-reduced-motion`)
- Aksesibiliti: label, fokus, modal trap, `aria-live`

## Arahan npm

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Lesen

Untuk kegunaan peribadi majlis perkahwinan Muhammad Danish & Nur Yasmin Imanina.
