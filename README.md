# Abbosbek Maxmudov — portfolio sayti

React (Vite) + Node.js (Express) + admin panel.

```
client/   React sayt va admin panel (GSAP ScrollTrigger + Lenis animatsiyalar)
server/   Express API: kontent, login, rasm yuklash, xabarlar
  seed/*.json         boshlang'ich kontent (en, ru, uz)
  data/               ishlayotgan kontent, parol, xabarlar, tarix (avtomatik yaratiladi)
  uploads/            yuklangan rasmlar
```

## Ishga tushirish (dev)

```bash
npm install
npm run install:all
npm run dev
```

- Sayt: http://localhost:5173
- Admin panel: http://localhost:5173/admin — standart parol `admin123`
  (birinchi kirishdan keyin **Xavfsizlik** bo'limida almashtiring)

## Production

```bash
npm run build
npm start
```

Server `client/dist` ni ham o'zi tarqatadi — bitta port (standart 5000) kifoya.
Sozlamalar uchun `server/.env.example` ni `server/.env` ga nusxalang.

## Render'ga joylash (bepul)

Bepul Render'da disk har qayta ishga tushganda tozalanadi, shuning uchun:
- kontent, xabarlar, parol → **MongoDB Atlas** (`MONGODB_URI`)
- yuklangan rasmlar → o'sha MongoDB'da (GridFS), alohida hisob kerak emas

1. Kodni GitHub'ga yuklang.
2. Render → **New → Blueprint** → repozitoriyni tanlang (`render.yaml` avtomatik o'qiladi).
3. So'ralgan maydonlarni to'ldiring: `MONGODB_URI`, `ADMIN_PASSWORD`.
4. Deploy tugagach sayt `https://<nom>.onrender.com` da ochiladi. Kodga har push qilinganda qayta deploy bo'ladi.

Bu o'zgaruvchilar bo'lmasa server avvalgidek `server/data` va `server/uploads` papkalaridan foydalanadi.

## Tillar

Sayt 3 tilda: inglizcha (`/`), ruscha (`/ru`), o'zbekcha (`/uz`). Asosiy til va yoqilgan tillar
admin panelning **Tillar** bo'limida tanlanadi. Birinchi kirishda sayt brauzer tiliga qarab
mos tilni ochadi, foydalanuvchi tanlovi esa eslab qolinadi.

Admin panelda har bo'lim tepasida EN / RU / UZ tablari bor. "Barcha tillarda" belgili maydonlar
(rasmlar, raqamlar, havolalar) bir tilda o'zgartirilsa, boshqa tillarda ham yangilanadi.
Boshlang'ich tarjimalar: `server/seed/en.json`, `ru.json`, `uz.json`.

## Admin panel imkoniyatlari

- Saytning barcha bo'limlari: matnlar, raqamlar, keyslar, grafik, skrinshotlar, brendlar, aloqa
- Elementlarni qo'shish / o'chirish / nusxalash / tartibini o'zgartirish
- Rasm yuklash (sudrab tashlash ham) va media kutubxona
- Jonli ko'rinish — saqlashdan oldin o'zgarish sayt ichida ko'rinadi
- Ctrl+S bilan saqlash, har saqlashda oldingi versiya tarixga yoziladi (tiklash mumkin)
- Saytdagi aloqa formasidan kelgan xabarlar
- Sarlavhalarda `*so'z*` yozilsa, u yashil rangda ajraladi

Yangi maydon qo'shish: `client/src/admin/schema.js` ga yozing va tegishli sayt komponentida ishlating.
# sayt
