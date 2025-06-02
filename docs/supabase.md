## 🔧 prisma

`prisma` is an ORM for `PostgreSQL`

### ❌ No, this app does NOT need Prisma ❌

- Direct Supabase Client Usage (@spabase/supabase-js)
- Database Schema Management (create_images_table.sql...)
- Type Safety with TypeScript
- Prisma would be Redundant

## 🚀 supabase

Supabase is a cloud service that provides a full stack of tools for building web applications, including authentication, storage, and databases.

### 📁 1. storage

Supabase provides a simple and fast way to store and retrieve files and images.

### 🗄️ 2. database

PostgreSQL + Prisma + Supabase

### 🔐 3. auth

nextauth + supabase

### 📋 Database Tables Created

- `images` table with user authentication and RLS policies
- `Storage bucket images` with upload/access policies
- Proper indexes and triggers for performance

- Store image metadata in the images table
- Upload actual files to the images storage bucket
- Enforce user-level security for both data and files
- Support the gallery features in your Next.js app
- https://supabase.com/dashboard/project/saamqzojqivrumnnnyrf/storage/buckets
- https://supabase.com/docs/guides/database/prisma

```bash
$ npm run supabase login
$ npm run supabase link --project-ref saamqzojqivrumnnnyrf
$ npm run db:push
```
