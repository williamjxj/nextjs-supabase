# Migration Consolidation

This directory contains the consolidated database schema for the NextJS Supabase Gallery project.

## What Was Done

All previous migration files have been consolidated into a single init file: `init_gallery_schema.sql`

## Consolidated Schema Includes

### 1. Storage Setup
- Creates `images` bucket with public access
- Sets up storage policies for public upload/view/update/delete

### 2. Tables Created

#### `public.profiles`
- User profile information
- Supports both email/password and social auth
- Auto-created via trigger when new user signs up

#### `public.images`
- Image metadata storage
- Public access (no authentication required)
- Includes file info, dimensions, storage paths

#### `public.purchases`  
- Purchase transaction records
- Supports both Stripe and PayPal payments
- Links images to buyers with license types

#### `public.subscriptions`
- User subscription plans (standard/premium/commercial)
- Includes pricing, features, and Stripe integration
- User-specific with RLS policies

### 3. Features
- Row Level Security (RLS) on all tables
- Automatic `updated_at` timestamps
- Proper foreign key relationships
- Comprehensive indexing for performance
- Auto profile creation on user signup

## Old Migrations Backup

All previous migration files are preserved in `migrations_backup/` directory:
- 20240528000001_create_images_table.sql
- 20240528000002_create_storage_policies.sql
- 20240528000003_create_purchases_table.sql
- 20240604000001_update_storage_policies_public.sql
- 20240604000002_update_images_table_public.sql
- 20240605000001_add_paypal_support.sql
- 20240605000002_update_purchases_policies.sql
- 20241205000001_add_paypal_order_id.sql
- 20250610000001_simplified_schema.sql
- 20250611000001_create_profiles_table.sql
- 20250611000002_fix_subscriptions_template.sql

## Usage

To apply this consolidated migration to a fresh Supabase project:

```bash
supabase db reset
```

This will apply the consolidated init file and set up the complete schema.

## Benefits of Consolidation

1. **Cleaner codebase** - Single source of truth for schema
2. **Easier maintenance** - No need to track multiple migration files
3. **Faster setup** - Single migration instead of 11 separate ones
4. **Reduced complexity** - Eliminates conflicting or redundant migrations
5. **Better documentation** - All schema changes in one well-documented file
