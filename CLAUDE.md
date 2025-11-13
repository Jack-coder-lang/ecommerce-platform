# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-commerce backend platform built with Node.js/Express, Prisma ORM, PostgreSQL, and Socket.IO for real-time features. The platform supports multi-role authentication (BUYER, SELLER, ADMIN), product management, cart/order processing, and integrated payment via CinetPay.

## Tech Stack

- **Runtime**: Node.js with ES modules (`"type": "module"` in package.json)
- **Framework**: Express.js
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO
- **Payment Gateway**: CinetPay (Ivory Coast mobile money/cards)
- **File Upload**: Multer
- **Email**: Nodemailer

## Essential Commands

### Development
```bash
npm run dev              # Start with nodemon (auto-reload)
npm start                # Production start
```

### Database (Prisma)
```bash
npm run prisma:generate  # Generate Prisma Client after schema changes
npm run prisma:migrate   # Run migrations in dev
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run seed             # Seed database with initial data
```

### Manual Prisma Commands
```bash
npx prisma migrate dev --name <migration_name>  # Create new migration
npx prisma migrate deploy                       # Deploy migrations (production)
npx prisma db push                              # Push schema without migrations (dev only)
```

## Architecture

### Core Structure

```
src/
├── server.js              # Entry point, Express + Socket.IO setup
├── config/
│   ├── database.js        # Prisma client singleton
│   ├── index.js           # Environment configs
│   └── paymentGateways.js # CinetPay config
├── routes/                # Route definitions (*.routes.js)
├── controllers/           # Business logic (*.controller.js)
├── middleware/
│   └── auth.middleware.js # JWT auth + role-based authorization
├── services/              # External service integrations
│   ├── cinetpay.service.js
│   └── email.service.js
├── socket/
│   └── index.js           # Socket.IO initialization
└── utils/                 # Helper functions

prisma/
├── schema.prisma          # Database schema (source of truth)
├── migrations/            # Auto-generated migration SQL
└── seed.js                # Database seeding script

models/                    # Legacy Mongoose models (likely unused, Prisma is primary)
```

### Database Schema (Prisma)

**Key Models**: User, Product, Cart, CartItem, Order, OrderItem, Review, Notification

**User Roles**: BUYER, SELLER, ADMIN
**User Status**: PENDING, APPROVED, REJECTED, SUSPENDED

**Critical**: New sellers/buyers start as PENDING. Admin must approve (status → APPROVED) before they can access protected routes. The `authenticate` middleware (src/middleware/auth.middleware.js:32) blocks non-APPROVED users.

### Authentication Flow

1. **Register** (`POST /api/auth/register`): Creates user with status=PENDING, auto-creates Cart
2. **Login** (`POST /api/auth/login`): Returns JWT token
3. **Protected Routes**: Use `authenticate` middleware, optionally chained with `authorize(...roles)`
4. **Token Format**: `Authorization: Bearer <token>`

Middleware exports:
- `authenticate`: Validates JWT, checks user status (must be APPROVED)
- `authorize(...roles)`: Restricts to specific roles (e.g., `authorize('ADMIN', 'SELLER')`)
- `optionalAuth`: Attaches user if token exists, doesn't block if missing

### Real-time Notifications (Socket.IO)

Socket.IO server runs alongside Express via `createServer` in src/server.js.

**Client Connection Flow**:
1. Client connects to Socket.IO
2. Client emits `authenticate` event with userId
3. Server joins socket to user's room (socket.join(userId))
4. Server emits notifications via `io.to(userId).emit('notification', data)`

**Server-side usage**: Access io via `req.app.get('io')` in controllers

### Payment Integration (CinetPay)

- **Service**: src/services/cinetpay.service.js
- **Webhook**: `POST /api/payments/notify` in src/server.js:98
- **Flow**:
  1. Order created with transactionId
  2. CinetPay redirects user to payment page
  3. CinetPay POSTs webhook with status (cpm_trans_status === '00' = success)
  4. Backend updates Order paymentStatus to PAID, emits Socket.IO event to user

**Environment Variables Required**:
- CINETPAY_API_KEY
- CINETPAY_SITE_ID
- CINETPAY_SECRET_KEY
- CINETPAY_NOTIFY_URL

### API Routes

All routes prefixed with `/api`:

```
/api/auth        → auth.routes.js       (register, login, profile)
/api/products    → product.routes.js    (CRUD, search, filtering)
/api/cart        → cart.routes.js       (add, remove, update quantities)
/api/orders      → order.routes.js      (create, list, update status)
/api/notifications → notification.routes.js (list, mark read)
/api/analytics   → analytics.routes.js  (seller/admin dashboards)
/api/profile     → profile.routes.js    (update user info)
```

Admin routes (src/routes/admin.routes.js) require `authenticate` + `authorize('ADMIN')`.

### Static Files

- **Directory**: `public/`
- **Served at**: Root level via `express.static`
- **PWA Icons**: Explicit routes for `/pwa-192x192.png` and `/pwa-512x512.png` in src/server.js:74-80

### Environment Configuration

**Critical .env variables**:
```
PORT=5000
JWT_SECRET=<strong_secret>
JWT_EXPIRES_IN=7d
DATABASE_URL=<postgresql_connection_string>
FRONTEND_URL=<comma_separated_origins>  # For CORS
NODE_ENV=production|development

# CinetPay (see Payment Integration above)
# Email (Gmail SMTP, currently optional)
```

**CORS**: Configured to allow origins from FRONTEND_URL env var (comma-separated). Applies to both Express and Socket.IO.

## Development Workflow

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration + applies)
3. Prisma Client auto-regenerates
4. If migration fails, fix schema and run `npx prisma migrate dev` again

### Adding New Routes

1. Create controller in `src/controllers/<name>.controller.js`
2. Create routes file in `src/routes/<name>.routes.js`
3. Import and mount in `src/server.js` (e.g., `app.use('/api/<name>', routes)`)

### Testing Payment Webhook Locally

- Use ngrok or similar to expose localhost
- Update CINETPAY_NOTIFY_URL to public URL
- CinetPay will POST to `/api/payments/notify`

## Common Pitfalls

1. **User Status**: Forgetting to approve users via admin panel. Non-APPROVED users get 403 on protected routes.
2. **ES Modules**: Must use `.js` extension in imports, `import` not `require`
3. **Prisma Client**: After schema changes, must run `prisma:generate` or migrations
4. **Socket.IO CORS**: Must match FRONTEND_URL origins, clients will fail silently if misconfigured
5. **File Paths**: Use `path.join(__dirname, ...)` carefully; __dirname must be derived from `import.meta.url` in ES modules
6. **Duplicate Models**: `models/` directory has Mongoose models (legacy), Prisma is source of truth

## Deployment Notes

- **Platform**: Configured for Vercel (vercel.json) and Render
- **Database**: Uses Render PostgreSQL (connection string in DATABASE_URL)
- **Build**: No build step, Node directly runs `src/server.js`
- **Migrations**: Run `npx prisma migrate deploy` after deploying schema changes

## Key Files to Check First

- `src/server.js` - Main entry, middleware, Socket.IO setup
- `prisma/schema.prisma` - Database schema
- `src/middleware/auth.middleware.js` - Authentication logic
- `src/config/database.js` - Prisma client setup
- `.env` - Environment configuration (not in git)
