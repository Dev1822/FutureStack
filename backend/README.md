# FutureTracker Backend API

Express.js backend with Clerk authentication and Supabase PostgreSQL.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your actual keys

# Run development server
npm run dev
```

## Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PORT` | Server port (default: 3001) | - |
| `NODE_ENV` | Environment (development/production) | - |
| `CORS_ORIGIN` | Frontend URL for CORS | Your frontend URL |
| `CLERK_SECRET_KEY` | Clerk secret key (starts with `sk_`) | [Clerk Dashboard](https://clerk.com) → API Keys |
| `SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://supabase.com) → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (⚠️ secret!) | Supabase Dashboard → Settings → API |

## API Endpoints

### Public
- `GET /api/health` - Health check

### Protected (require Bearer token)
- `GET /api/me` - Get current user info
- `GET /api/opportunities` - List all opportunities
- `GET /api/opportunities/:id` - Get single opportunity
- `POST /api/opportunities` - Create opportunity
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity
- `GET /api/analytics` - Get analytics data

## Testing with cURL

```bash
# Health check (no auth needed)
curl http://localhost:3001/api/health

# Get opportunities (requires token)
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:3001/api/opportunities

# Create opportunity
curl -X POST \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Internship","category":"internship","status":"applied"}' \
  http://localhost:3001/api/opportunities
```

## Deploy to Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variables in Render dashboard
7. Update `CORS_ORIGIN` to your production frontend URL

## Project Structure

```
backend/
├── src/
│   ├── server.js          # Main entry point
│   ├── lib/
│   │   └── supabase.js    # Supabase client
│   ├── middleware/
│   │   └── auth.js        # Clerk JWT verification
│   └── routes/
│       ├── opportunities.js  # CRUD routes
│       └── analytics.js      # Analytics endpoint
├── .env.example           # Environment template
└── package.json
```
