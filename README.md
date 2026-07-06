# Professional Business Services

Complete Next.js 14 website and admin panel for Professional Business Services.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth credentials login
- Framer Motion SVG/CSS motion graphics
- jsPDF dependency included for quote/invoice PDF extension

## Local Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Seeded Admin Users

Password for all seeded staff users:

```text
Password123!
```

- `admin@professionalbs.local`
- `manager@professionalbs.local`
- `pro@professionalbs.local`

Visit `/admin` to log in.

## Environment Variables

```env
DATABASE_URL="postgresql://professionalbs:professionalbs@localhost:5432/professionalbs?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-secret"
DEEPSEEK_API_KEY=""
```

The chatbot capture widget saves messages to `ChatbotConversation`. `DEEPSEEK_API_KEY` is reserved for connecting a live DeepSeek response layer.

## Docker

```bash
docker compose up --build
```

The compose file includes PostgreSQL and Traefik labels. Update the host rule, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` before production deployment.

## Included Pages

- Home
- About
- Services
- CEO Message
- Contact
- FAQ with schema markup
- Blog with 10 SEO-oriented posts and generated SVG hero art
- Quote multi-step form
- Admin panel with 14 requested modules

## Notes

All public forms post through API routes and save to Prisma models. Public motion assets are implemented as lightweight SVG/CSS/Framer Motion components, with no video files.
