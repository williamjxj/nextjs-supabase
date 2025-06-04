## 🔧 Supabase + Prisma ?

### ❌ No, this app does NOT need Prisma ❌

- Direct Supabase Client Usage (@spabase/supabase-js)
- Database Schema Management (create_images_table.sql...)
- Type Safety with TypeScript
- `prisma` is an ORM for `PostgreSQL`, it would be Redundant in this app

## 🚀 Supabase

Supabase is a cloud service that provides a full stack of tools for building web applications, including authentication, storage, and databases.

## 🔐 Auth: Where Login/Signup Info is Stored in Supabase

User authentication information is stored in Supabase's built-in authentication system: `auth.users`

## 🗄️ Database Tables

### 1️⃣ **`auth.users`** (Supabase Built-in)

- **Purpose**: User authentication and account management
- **Schema**: Managed by Supabase
- **Key Fields**:
  - `id` (UUID) - Primary key, referenced by other tables
  - `email` - User's email address
  - `encrypted_password` - Securely hashed password
  - `email_confirmed_at` - Email verification timestamp
  - `created_at`, `updated_at` - Account timestamps
  - `raw_user_meta_data` - Additional user metadata
- **RLS**: Managed by Supabase auth system

### 2️⃣ **`public.images`** (Custom Table)

- **Purpose**: Store image metadata and references
- **Schema**: Created via migration `20240528000001_create_images_table.sql`
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - Foreign key to `auth.users(id)` (CASCADE DELETE)
  - `filename` (TEXT) - Generated filename
  - `original_name` (TEXT) - Original uploaded filename
  - `storage_path` (TEXT) - Path in Supabase storage
  - `storage_url` (TEXT) - Public URL for image access
  - `file_size` (INTEGER) - File size in bytes
  - `mime_type` (TEXT) - File MIME type
  - `width`, `height` (INTEGER) - Image dimensions
  - `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps
- **Indexes**:
  - `idx_images_user_id` - Fast user-specific queries
  - `idx_images_created_at` - Ordered by creation date
- **RLS Policies**:
  - Users can INSERT their own images
  - Users can SELECT their own images
  - Users can UPDATE their own images
  - Users can DELETE their own images
- **Triggers**: Auto-update `updated_at` on modifications

### 3️⃣ **`public.purchases`** (Custom Table)

- **Purpose**: Track image license purchases and payments
- **Schema**: Created via migration `20240528000003_create_purchases_table.sql`
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `image_id` (UUID) - Foreign key to `images(id)` (CASCADE DELETE)
  - `user_id` (UUID) - Foreign key to `auth.users(id)` (SET NULL)
  - `license_type` (TEXT) - License type (default: 'standard')
  - `amount_paid` (INTEGER) - Amount in cents
  - `currency` (TEXT) - Currency code (default: 'usd')
  - `stripe_session_id` (TEXT) - Unique Stripe session identifier
  - `payment_status` (TEXT) - Payment status (default: 'pending')
  - `purchased_at` (TIMESTAMPTZ) - Purchase timestamp
  - `created_at`, `updated_at` (TIMESTAMPTZ) - Record timestamps
- **Indexes**:
  - `idx_purchases_user_id` - Fast user-specific queries
  - `idx_purchases_image_id` - Fast image-specific queries
  - `idx_purchases_stripe_session_id` - Fast Stripe session lookup
  - `idx_purchases_purchased_at` - Ordered by purchase date
- **RLS Policies**:
  - Users can SELECT their own purchases
  - Users can INSERT their own purchases
- **Triggers**: Auto-update `updated_at` on modifications

## 📁 Storage Buckets

### 1️⃣ **`images`** Bucket

- **Purpose**: Store actual image files
- **Configuration**: Created via migration `20240528000002_create_storage_policies.sql`
- **Settings**:
  - `public: true` - Allows public access to images
  - `fileSizeLimit: 5MB` - Maximum file size per upload
- **Storage Structure**:
  ```
  images/
  ├── {user_id}/
  │   ├── {timestamp}.{ext}
  │   ├── {timestamp}.{ext}
  │   └── ...
  └── {other_user_id}/
      └── ...
  ```
- **Storage Policies**:
  - **Upload**: Users can upload to their own folder (`{user_id}/`)
  - **View**: Public access to all images OR users can view their own
  - **Update**: Users can update their own images
  - **Delete**: Users can delete their own images
- **Access Pattern**: Files organized by user ID folders
- **Public URLs**: Generated via `supabase.storage.from('images').getPublicUrl(path)`

## 🔗 Relationships

```mermaid
graph TB
    AU[auth.users] -->|user_id| IMG[images]
    AU -->|user_id| PUR[purchases]
    IMG -->|image_id| PUR
    IMG -->|storage_path| SB[Storage: images bucket]
```

## 🛡️ Security Features

- **Row Level Security (RLS)**: Enabled on all custom tables
- **User Isolation**: Each user can only access their own data
- **Storage Security**: File access controlled by user-specific folder structure
- **Authentication**: Supabase Auth handles password hashing and session management
- **Data Integrity**: Foreign key constraints ensure referential integrity

## 🔧 Management Commands

- **Dashboard**: https://supabase.com/dashboard/project/saamqzojqivrumnnnyrf/storage/buckets

  ```bash
  $ npm run supabase login #William1!
  $ npm run supabase link --project-ref saamqzojqivrumnnnyrf
  $ npm run db:push
  $ npx supabase db dump -f schema.sql
  $ npx supabase db restore
  ```

## Supabase Local

```bash
$ npx supabase init
$ npx supabase start
$ supabase status
$ supabase stop
```
