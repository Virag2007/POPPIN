# POPPIN Real-Time Socket.IO Messaging Service

Independently deployable Node.js + Socket.IO 4.x real-time server for the POPPIN social platform.

## Architecture

- **Runtime**: Node.js 22 LTS / TypeScript 5.7
- **Engine**: Socket.IO 4.8.1 with WebSocket & HTTP long-polling fallback
- **Database**: Neon PostgreSQL via Prisma ORM 5.22
- **Auth**: HS256 JWT signature verification sharing Next.js `JWT_SECRET`
- **Hosting**: Railway (Docker / Nixpacks)
- **CORS**: Strict allowed origins (`ALLOWED_ORIGINS`)

## Railway Deployment Instructions

1. **Create New Service on Railway**:
   - In your Railway project, click **New Service** -> **GitHub Repo**.
   - Select the `POPPIN` repository.
   - Set **Root Directory** to `.` and specify Dockerfile path `realtime-server/Dockerfile` (or use the provided `realtime-server/railway.json`).

2. **Configure Environment Variables in Railway**:
   - `DATABASE_URL`: Your Neon pooled connection string.
   - `JWT_SECRET`: The identical `JWT_SECRET` used in Next.js.
   - `ALLOWED_ORIGINS`: Comma-separated allowed client domains (e.g. `https://poppin.vercel.app,http://localhost:3000`).
   - `PORT`: Automatically assigned by Railway.

3. **Public Networking**:
   - In Railway Settings -> **Networking**, click **Generate Domain** (e.g., `https://poppin-realtime.up.railway.app`).

4. **Connect Frontend on Vercel**:
   - Add environment variable in your Vercel project settings:
     ```env
     NEXT_PUBLIC_SOCKET_URL=https://poppin-realtime.up.railway.app
     ```
   - Redeploy the frontend.

## Local Development

```bash
cd realtime-server
npm install
npm run db:generate
npm run dev
```

Health check will be available at: `http://localhost:4000/health`.

