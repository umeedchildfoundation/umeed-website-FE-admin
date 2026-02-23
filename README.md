# UMEED Frontend

Web app for **UMEED Children Foundation**: public site (About, Programs, Events, Notices, Contact, Volunteer application) and a role-based dashboard for volunteers and admins. Built with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui.

**Use this repo as the root of your frontend GitHub repository.** Copy the entire contents of the `frontend` folder into the repo (so that this README and `package.json` are at the repo root).

The frontend talks to the **UMEED Backend API**. You need the backend running (or deployed) and its URL set in `.env.local`.

---

## Quick Start

```bash
# Clone your frontend repo, then:
npm install

# Create .env.local (see Environment Variables below)
# Set VITE_API_URL to your backend API URL (e.g. http://localhost:3001/api)

npm run dev
```

App runs at **http://localhost:8080** (or the port in `vite.config.ts`).

---

## Prerequisites

- **Node.js** v20.19+ or v22.12+ (for Vite 7; or use Node 20+ with an older Vite if needed)
- **npm** (or yarn/pnpm)
- **Backend API** running and reachable (local or deployed)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment file

Create a `.env.local` file in the **project root** (same folder as this README):

```
VITE_API_URL=http://localhost:3001/api
ALLOW_VOLUNTEER_CONTACT=false
```

- **Local dev:** Point `VITE_API_URL` to your local backend (e.g. `http://localhost:3001/api`).
- **Production / deployed:** Point it to your deployed backend (e.g. `https://api.yourdomain.com/api`).

Optional (for email features):

```
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

You can copy from `env.local.example` if present.

### 3. Start development server

```bash
npm run dev
```

Open **http://localhost:8080** in the browser.

### 4. Log in (with backend seeded)

If the backend has been seeded (`npm run seed` in the backend repo), use:

| Role        | Email               | Password     |
|------------|---------------------|--------------|
| Super Admin | preet@umeed.org    | admin2026    |
| Admin      | admin@umeed.org    | admin2026    |
| Volunteer  | volunteer@umeed.org | volunteer2026 |

---

## Project structure (repo root = frontend)

```
├── src/
│   ├── pages/           # Index, About, Programs, Events, Notices, Contact, Volunteer, Login, dashboard/*
│   ├── components/      # layout, dashboard, auth, ui, home, students, volunteers, etc.
│   ├── contexts/        # AuthContext, SiteContentContext
│   ├── hooks/
│   ├── lib/             # api, authService, dbService, contentService, storageService
│   ├── config/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/              # Static assets (images, favicon)
├── scripts/             # Optional scripts (e.g. seed)
├── .env.local           # Your env (do not commit)
├── env.local.example
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json
└── README.md            # This file
```

---

## Environment variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL (including `/api`) | Yes |
| `ALLOW_VOLUNTEER_CONTACT` | Show volunteer contact info | No (default false) |
| `VITE_EMAILJS_*` | EmailJS for contact/notifications | No |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Build for production

```bash
npm run build
```

Output is in **`dist/`**. Deploy the contents of `dist/` to Vercel, Netlify, GitHub Pages, S3+CloudFront, or any static host. Set `VITE_API_URL` in the build environment to your production API URL.

---

## Troubleshooting

- **“Invalid email or password” / API errors:** Ensure the backend is running and `VITE_API_URL` in `.env.local` is correct. If the backend was just seeded, restart the backend process so it reloads the DB.
- **CORS errors:** Configure `FRONTEND_URL` on the backend to match your frontend origin (e.g. `http://localhost:8080` or your production URL).
- **Port 8080 in use:** Change `server.port` in `vite.config.ts`.

---

## Related

- **Backend API:** Separate repo (UMEED backend). Must be running and reachable at `VITE_API_URL`.
- **Docs:** For full system overview and user flows, see the main monorepo docs (if you keep a parent repo) or the backend README for API details.

---

## License

UMEED Children Foundation — Frontend
