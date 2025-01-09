# LMS Backend Information & Documentation

## Project Dependencies
### Core Dependencies (`dependencies`)

These packages are essential for the application to run in production:

*   `@prisma/client`: A type-safe ORM (Object-Relational Mapper) for Node.js and TypeScript. It simplifies database interactions (queries, migrations, etc.) with a generated client based on your Prisma schema.
*   `bcryptjs`: A pure JavaScript implementation of the bcrypt password hashing function. Used for securely storing user passwords. It's preferred over the native `bcrypt` in environments where native compilation is problematic (like Docker or serverless functions).
*   `colorette`: A small and fast library for adding colors to console output. Used for improving the readability of logs and CLI messages.
*   `compression`: Express middleware for compressing HTTP responses using gzip, deflate, or Brotli (if `compression-br` is also installed). Reduces bandwidth usage and improves performance.
*   `cookie-parser`: Express middleware for parsing cookies from incoming requests, making them easily accessible in `req.cookies`.
*   `cors`: Express middleware for enabling Cross-Origin Resource Sharing. Allows your backend to accept requests from different origins (domains, ports, protocols). Essential for frontend/backend separation.
*   `cross-env`: A utility for setting environment variables across different operating systems. Ensures consistent behavior of scripts regardless of the OS.
*   `dotenv-cli`: Allows you to run commands with environment variables loaded from `.env` files directly from the command line.
*   `dotenv-flow`: Loads environment variables from `.env` files based on the current environment (e.g., `.env.development`, `.env.test`, `.env.production`). Provides more advanced `.env` file management than `dotenv`.
*   `express`: The most popular Node.js web application framework. Provides routing, middleware, request/response handling, and many other features for building web APIs and applications.
*   `express-rate-limit`: Express middleware for rate limiting incoming requests. Protects your server from abuse and DoS attacks by limiting the number of requests from a single IP address within a given time window.
*   `helmet`: Express middleware for setting various HTTP headers that enhance security. Helps prevent common web vulnerabilities like XSS, clickjacking, and others.
*   `jsonwebtoken`: Implements JSON Web Tokens (JWT), a standard for creating access tokens used in authentication and authorization.
*   `source-map-support`: Provides source map support for stack traces in Node.js. Useful for debugging TypeScript code in production environments.
*   `winston`: A versatile logging library for Node.js. Supports various transports (console, files, databases, etc.) and log levels for structured logging.
*   `zod`: A TypeScript-first schema declaration and validation library. Used for validating data at runtime (e.g., request bodies, API responses).

### Development Dependencies (`devDependencies`)

These packages are only needed during development and are not included in the production build:

*   `@commitlint/cli`: A command-line tool for linting commit messages according to a specified configuration.
*   `@commitlint/config-conventional`: A shareable configuration for Commitlint that enforces conventional commit message formatting.
*   `@eslint/js`: Core ESLint rules.
*   `@types/bcryptjs`: TypeScript type definitions for `bcryptjs`.
*   `@types/compression`: TypeScript type definitions for `compression`.
*   `@types/cookie-parser`: TypeScript type definitions for `cookie-parser`.
*   `@types/cors`: TypeScript type definitions for `cors`.
*   `@types/eslint__js`: TypeScript type definitions for ESLint.
*   `@types/express`: TypeScript type definitions for Express.
*   `@types/node`: TypeScript type definitions for Node.js core modules.
*   `@types/source-map-support`: TypeScript type definitions for `source-map-support`.
*   `eslint`: A popular JavaScript/TypeScript linting tool for identifying and fixing code style issues and potential errors.
*   `eslint-config-prettier`: An ESLint configuration that disables rules that conflict with Prettier, ensuring consistent code formatting.
*   `globals`: Provides a list of global variables for different JavaScript environments (browser, Node.js, etc.). Used by ESLint to prevent errors related to undeclared global variables.
*   `husky`: A tool that makes it easy to use Git hooks. Used for running scripts (like linting and formatting) before commits or pushes.
*   `lint-staged`: Runs linters against staged Git files only, improving performance and preventing unnecessary linting of unchanged code.
*   `nodemon`: A utility that automatically restarts your Node.js application when file changes are detected. Used for faster development workflows.
*   `prettier`: A code formatter that enforces a consistent code style.
*   `prisma`: The Prisma CLI (Command-Line Interface). Used for managing Prisma schemas, generating the Prisma Client, and running database migrations.
*   `ts-node`: Allows you to execute TypeScript files directly without compiling them to JavaScript first. Useful for development and running scripts.
*   `typescript`: The TypeScript compiler. Used for transpiling TypeScript code to JavaScript.
* `typescript-eslint`: Allows you to use ESLint to lint TypeScript code.

### Scripts

The `scripts` section defines commands that can be run using `npm run <script-name>`:

*   `dist`: Compiles the TypeScript code to JavaScript using the TypeScript compiler (`tsc`).
*   `dev`: Starts the application in development mode using `nodemon` to automatically restart the server on file changes. Uses `cross-env` to set the `NODE_ENV` environment variable.
*   `start`: Starts the application in production mode. Uses `cross-env` to set the `NODE_ENV` environment variable and runs the compiled JavaScript code.
*   `lint`: Runs ESLint to lint the codebase.
*   `lint:fix`: Runs ESLint and automatically fixes any linting errors.
*   `format:check`: Runs Prettier to check if the code is formatted correctly.
*   `format:fix`: Runs Prettier to automatically format the code.
*   `init:prisma`: Initializes Prisma in your project.
*   `migratedev:prisma`: Runs Prisma migrations in the development environment.
*   `migrateprod:prisma`: Runs Prisma migrations in the production environment.
*   `generate:prisma`: Generates the Prisma Client based on your Prisma schema.

### Other Sections

*   `lint-staged`: Configures `lint-staged` to run linting and formatting on staged files before commits.