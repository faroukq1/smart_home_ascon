# Smart Home Security - Express.js Server

Backend API server for Smart Home Security System with Prisma ORM and SQLite database.

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Navigate to server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file:**

   ```bash
   cp .env.example .env
   ```

4. **Setup Prisma and database:**

   ```bash
   # Create database and run migrations
   npx prisma migrate dev --name init

   # Optional: Seed database
   npx prisma db seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:3000`

## Available Commands

```bash
npm run dev              # Start development server with hot reload
npm run build          # Compile TypeScript to JavaScript
npm start              # Run compiled JavaScript server
npm run prisma:migrate # Create new migrations
npm run prisma:studio  # Open Prisma Studio (database GUI)
npm run lint           # Run ESLint
```

## Project Structure

```
server/
├── src/
│   ├── controllers/     # Business logic
│   │   ├── authController.ts
│   │   ├── notificationController.ts
│   │   ├── controlController.ts
│   │   └── sensorController.ts
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── controlRoutes.ts
│   │   └── sensorRoutes.ts
│   ├── middleware/      # Express middleware
│   │   └── auth.ts      # JWT authentication
│   ├── utils/           # Helper functions
│   │   ├── encryption.ts
│   │   ├── helpers.ts
│   │   └── db.ts
│   └── index.ts         # Express app entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/change-password` - Change password (auth required)
- `PUT /api/auth/language` - Update language preference (auth required)
- `GET /api/auth/profile` - Get user profile (auth required)

### Notifications

- `GET /api/notifications` - Get all notifications (auth required)
- `POST /api/notifications` - Create notification (auth required)
- `DELETE /api/notifications/:id` - Delete notification (auth required)
- `DELETE /api/notifications` - Clear all notifications (auth required)
- `GET /api/notifications/stats/alerts` - Get alert statistics (auth required)

### Controls

- `POST /api/controls/log` - Log control action (auth required)
- `POST /api/controls/led` - Toggle LED (auth required)
- `POST /api/controls/buzzer` - Toggle buzzer (auth required)
- `POST /api/controls/capture` - Capture image (auth required)
- `GET /api/controls/history` - Get control history (auth required)

### Sensor

- `GET /api/sensor/status` - Get sensor status
- `POST /api/sensor/status` - Update sensor status
- `POST /api/sensor/image` - Update last image URL

## Authentication

Uses JWT (JSON Web Tokens) with:

- Token generation on login/register
- Token stored in AsyncStorage on client
- Middleware validates token on protected routes
- Token expires in 7 days

## Database Schema

### User

- id, email, password, language, createdAt, updatedAt
- Relations: notifications, controls

### Notification

- id, userId, type, status, date, time, createdAt, updatedAt
- Types: "alarm", "control"

### Control

- id, userId, type, action, date, time, createdAt, updatedAt
- Types: "led", "buzzer", "capture"

### SensorStatus

- id, status, lastImageUrl, updatedAt
- Singleton table (always id=1)

## ASCON Encryption

Simple ASCON-like encryption implementation in `utils/encryption.ts`:

- "1" → encrypted motion detected value
- "0" → connected status
- Custom values hashed with master key
- Production should use proper crypto library

## Error Handling

All errors returned as JSON:

```json
{
  "error": "Error message"
}
```

Common status codes:

- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Environment Variables

Required in `.env`:

```
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret_key_here_min_32_chars"
CORS_ORIGIN=http://localhost:8081
```

## Prisma Studio

View and manage database visually:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

## Development Notes

- TypeScript strict mode enabled
- ESM modules (import/export)
- Database auto-migrations
- Graceful shutdown handlers
- CORS enabled for Expo client

## Production Deployment

1. Build:

   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run migrations:

   ```bash
   npx prisma migrate deploy
   ```

4. Start:
   ```bash
   npm start
   ```
