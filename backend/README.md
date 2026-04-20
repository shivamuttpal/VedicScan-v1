# Node.js Express TypeScript MongoDB Backend

A scalable, modular backend built with **Node.js**, **Express**, **TypeScript**, and **MongoDB** using the Repository Pattern.

## Architecture

```
/app/backend/
├── src/
│   ├── config/               # Configuration files
│   │   ├── index.ts          # Main config (env variables)
│   │   └── database.ts       # MongoDB connection
│   │
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── validate.middleware.ts # Zod validation
│   │   └── index.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── jwt.util.ts       # Token generation/verification
│   │   ├── password.util.ts  # Password hashing (bcrypt)
│   │   ├── pagination.util.ts # Pagination helpers
│   │   ├── response.util.ts  # Standardized API responses
│   │   └── index.ts
│   │
│   ├── modules/              # Feature modules
│   │   ├── user/             # User module
│   │   │   ├── model/        # Mongoose schema
│   │   │   ├── repository/   # Database operations
│   │   │   ├── services/     # Business logic
│   │   │   ├── controller/   # Request handlers
│   │   │   ├── router/       # Routes + validation
│   │   │   └── index.ts      # Module exports
│   │   │
│   │   ├── course/           # Course module (template)
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   ├── services/
│   │   │   ├── controller/
│   │   │   ├── router/
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts          # Module aggregator
│   │
│   └── server.ts             # Express app entry point
│
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

## Module Structure Pattern

Each module follows this structure:

```
module/
├── model/
│   ├── module.model.ts       # Mongoose schema definition
│   └── index.ts              # Export model
├── repository/
│   ├── module.repository.ts  # Database operations (CRUD)
│   └── index.ts
├── services/
│   ├── module.service.ts     # Business logic
│   └── index.ts
├── controller/
│   ├── module.controller.ts  # HTTP request handlers
│   └── index.ts
├── router/
│   ├── module.validation.ts  # Zod schemas
│   ├── module.router.ts      # Express routes
│   └── index.ts
└── index.ts                  # Module public exports
```

## API Endpoints

### User Routes (`/api/users`)

| Method | Endpoint           | Auth     | Description          |
|--------|-------------------|----------|----------------------|
| POST   | /register         | Public   | Register new user    |
| POST   | /login            | Public   | User login           |
| GET    | /profile          | Required | Get user profile     |
| PUT    | /profile          | Required | Update profile       |
| POST   | /change-password  | Required | Change password      |
| GET    | /                 | Admin    | List all users       |
| GET    | /:id              | Admin    | Get user by ID       |
| DELETE | /:id              | Admin    | Delete user          |

### Course Routes (`/api/courses`)

| Method | Endpoint                                    | Auth       | Description           |
|--------|---------------------------------------------|------------|-----------------------|
| GET    | /                                           | Public     | List published courses|
| GET    | /categories                                 | Public     | Get categories        |
| GET    | /featured                                   | Public     | Featured courses      |
| GET    | /popular                                    | Public     | Popular courses       |
| GET    | /slug/:slug                                 | Public     | Get by slug           |
| GET    | /:id                                        | Public     | Get by ID             |
| POST   | /                                           | Instructor | Create course         |
| GET    | /instructor/my-courses                      | Instructor | My courses            |
| PUT    | /:id                                        | Instructor | Update course         |
| DELETE | /:id                                        | Instructor | Delete course         |
| POST   | /:id/sections                               | Instructor | Add section           |
| DELETE | /:id/sections/:sectionIndex                 | Instructor | Remove section        |
| POST   | /:id/sections/:sectionIndex/lessons         | Instructor | Add lesson            |
| DELETE | /:id/sections/:sectionIndex/lessons/:lessonIndex | Instructor | Remove lesson    |
| POST   | /:id/publish                                | Instructor | Publish course        |
| POST   | /:id/unpublish                              | Instructor | Unpublish course      |

## User Roles

- `user`: Default role, can browse courses
- `student`: Enrolled users
- `instructor`: Can create/manage courses
- `admin`: Full system access

## Environment Variables

```env
NODE_ENV=development
PORT=8001
MONGO_URL=mongodb://localhost:27017
DB_NAME=app_database
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the Server

```bash
# Development
yarn dev

# Build
yarn build

# Production
yarn start
```

## Adding New Modules

1. Create folder structure under `src/modules/[module-name]/`
2. Create model with Mongoose schema
3. Create repository for database operations
4. Create service for business logic
5. Create controller for HTTP handlers
6. Create router with validation schemas
7. Export from module index
8. Register router in `src/modules/index.ts`
9. Add route in `src/server.ts`

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting
- **Password Hashing:** bcryptjs
