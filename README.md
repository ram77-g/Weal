# WEAL

A community-driven platform for sharing mental and physical health experiences.

WEAL aims to create a safe, minimal, and meaningful space where people can express themselves, connect with others, and support each other without the noise of traditional social media.

## Tech Stack

* Frontend: React (Vite) + Tailwind CSS
* Backend: Node.js + Express
* Database: PostgreSQL
* ORM: Prisma
* Authentication: JWT + bcrypt
* API: REST

## Features (Planned)

* User authentication (signup/login)
* Create and share posts
* Like and comment on posts
* User profiles
* Clean and minimal UI
* Secure and scalable backend

## Security

* Password hashing using bcrypt
* JWT-based authentication
* Input validation and sanitization
* Protected API routes
* Secure backend-first architecture

## Project Structure (High Level)

```
/client   → React frontend
/server   → Node + Express backend
/prisma   → Database schema & migrations
```

## Setup

1. Clone the repository

2. Install PostgreSQL and create database `weal_db`

3. Create [/server/.env](cci:7://file:///c:/Users/praka/OneDrive/Documents/Weal/server/.env:0:0-0:0) with:
   DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/weal_db?schema=public"
   JWT_SECRET="your-secret-key"

4. Run migrations: `cd server && npx prisma migrate dev`

5. Start server: `npm run dev`

6. Server runs on http://localhost:3000

## Contributing

This project is being built as part of the WEAL club. Core contributors will be actively involved in development and feature design.

## Vision

WEAL is an attempt to build a genuine, supportive community around well-being.

## Status

Currently in development.

