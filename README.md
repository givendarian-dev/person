# Personal Profile API

This project is a small backend service for managing personal profiles. It is built with Bun, TypeScript, and MySQL, and it focuses on creating profile records with validation and secure database insertion.

## Overview
The app exposes a minimal API for storing a person's profile information, including:
- full name
- email address
- phone number
- age
- bio
- location

The current implementation is backend-focused and includes data validation before insertion into the database.

## Tech stack
- Bun runtime
- TypeScript
- MySQL database
- Environment-based configuration

## Project structure
- `index.ts` — starts the Bun server and defines application routes
- `src/config/database.ts` — configures the MySQL database connection
- `src/controllers/profile.ts` — handles profile validation and storage logic
- `schema.sql` — creates the `profiles` table in MySQL
- `frontend/` — placeholder frontend folder; currently empty
- `text.sql` — SQL practice/examples, not part of the main app logic
- `.env` — environment variables used to connect to MySQL
- `package.json` — Bun project dependencies and scripts

## Database schema
The main database table is defined in `schema.sql`:

```sql
CREATE DATABASE IF NOT EXISTS personal_profile;

USE personal_profile;

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
Create a `.env` file in the project root with your local MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=personal_profile
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## Installation
Install dependencies:

```bash
bun install
```

## Run the app
Start the app in development mode:

```bash
bun run dev
```

Or run the production/start script:

```bash
bun run start
```

The server listens on port 5500 by default.

## API endpoints
The server exposes the following routes:

- `GET /` — welcome message
- `GET /api/server` — confirms the server is running
- `GET /api/profile` — returns all profiles
- `GET /api/profile?id=1` — returns a single profile by ID
- `POST /api/profile` — creates a new profile record
- `DELETE /api/profile?id=1` — deletes a profile by ID

## Profile validation rules
The `POST /api/profile` route validates the payload before inserting data. It checks:
- required `full_name` and `email`
- non-empty string values
- valid email format
- age is a positive integer between 1 and 150 when provided
- duplicate emails are rejected

## Example request
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

## Response example
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "full_name": "Givendarian Developer"
  }
}
```

## Current status
This project is currently a working backend prototype for personal profile creation. The frontend folder is present but not yet implemented, so the primary functionality is the API and database layer.
