# LMS Backend API

This is the backend API for a Learning Management System (LMS) built with Node.js, Express, and TypeScript. It provides a robust and scalable foundation for managing courses, users, and other LMS-related data.

## Key Features

*   User authentication and authorization using JWT (JSON Web Tokens).
*   Course management.
*   User profile management.
*   RESTful API design.
*   TypeScript for type safety.
*   Structured logging with Winston.
*   Robust error handling.
*   Database integration with Prisma (PostgreSQL).
*   Input validation with Zod.

## Technologies Used

*   Node.js
*   Express
*   TypeScript
*   Prisma (ORM)
*   Winston (Logging)
*   Zod (Schema Validation)
*   bcrypt (Password Hashing - *If you're implementing password hashing, keep this*)
*   jsonwebtoken (JSON Web Token implementation)
*   PostgreSQL (Database)
*   Helmet (Security)
*   CORS (Cross-Origin Resource Sharing)
*   cookie-parser (For parsing cookies)
*   dotenv-flow (For managing environment variables)

## Scripts

The following npm scripts are available:

*   `npm run dist`: Compiles the TypeScript code to JavaScript.
*   `npm run dev`: Starts the development server with automatic restarts using Nodemon.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Runs ESLint for code linting.
*   `npm run lint:fix`: Automatically fixes linting errors.
*   `npm run format:check`: Checks code formatting with Prettier.
*   `npm run format:fix`: Automatically fixes code formatting with Prettier.
*   `npm run init:prisma`: Initializes Prisma.
*   `npm run migratedev:prisma`: Runs Prisma migrations in development using `.env.development`.
*   `npm run migrateprod:prisma`: Runs Prisma migrations in production using `.env.production`.
*   `npm run generate:prisma`: Generates Prisma Client.
*   `npm run prepare`: Installs Husky hooks for Git.

## Development

*   Uses `.env.development` and `.env.production` files for environment-specific configuration (using `dotenv-flow`).
*   Uses Husky and lint-staged for pre-commit hooks to ensure code quality (linting and formatting).

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

ISC
