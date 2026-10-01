# Person

A small profile management backend built with Bun and MySQL. The project is designed to store and validate personal profile information such as full name, email, phone number, age, bio, and location.

## Project summary
This application exposes a lightweight API for creating profile records in a MySQL database. It includes server setup, database connection configuration, validation logic, and a database schema for a personal profile table. The backend is currently the main focus of the project; the frontend folder is present but is still empty.

## Features
- Bun-based HTTP server
- MySQL database connection through environment variables
- Profile creation endpoint with validation
- Unique email enforcement
- Input checks for empty values, invalid email format, and invalid age
- Basic health routes for server status

## Project structure
- `index.ts` - starts the Bun server and defines the API routes
- `src/config/database.ts` - initializes the MySQL connection
- `src/controllers/profile.ts` - handles profile validation and insertion logic
- `schema.sql` - creates the `profiles` table in MySQL
- `frontend/` - intended frontend workspace; currently empty
- `text.sql` - contains unrelated example SQL practice queries
- `.env` - local environment configuration for the database connection

## Database schema
The main table is defined in `schema.sql`:

```sql
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50),
    age int,
    bio TEXT,
    location VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

## Environment setup
Create or update a `.env` file in the project root with your local MySQL settings:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=personal_profile
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## Installation and run
Install dependencies:

```bash
bun install
```

Start the app:

```bash
bun run dev
```

You can also run the app directly:

```bash
bun run index.ts
```

## API routes
The project currently exposes the following routes:

- `GET /` - welcome message
- `GET /api/server` - server health check response
- `POST /api/profile` - creates a profile record

## Example profile request
```json
{
  "full_name": "Givendarian Developer",
  "email": "givendarian@example.com",
  "phone": "+256700000000",
  "bio": "I am a software developer.",
  "location": "Kampala, Uganda",
  "age": 25
}
```

## Notes
This project is currently a backend-focused profile system. The profile controller validates inputs before inserting records into MySQL, and it returns appropriate responses for invalid input, duplicate emails, and database failures.
