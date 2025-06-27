# 🔐 Authentication Flow Documentation

## 📋 Overview

This application implements a dual authentication system:

- **Email/Password Signup**: Available only on `/signup` page
- **Social Login**: Available only on `/login` page (Google, GitHub, Facebook)
- **Email/Password Login**: Available on `/login` page

## 🎯 Authentication Pages

### `/signup` Page

- **Purpose**: New user registration with email/password only
- **Features**:
  - Email/password form
  - Full name collection
  - Password confirmation
  - **NO social auth options** (by design)
- **Redirect**: After successful signup → `/gallery`

### `/login` Page

- **Purpose**: User authentication (existing users)
- **Features**:
  - Email/password form
  - Social authentication (Google, GitHub, Facebook)
  - "Remember me" functionality
- **Redirect**: After successful login → `/gallery`

## 🔄 Authentication Flow

### Email/Password Signup Flow

1. User visits `/signup`
2. Fills email, password, full name
3. Supabase creates user in `auth.users`
4. Database trigger `handle_new_user()` creates profile in `public.profiles`
5. User redirected to `/gallery`

### Social Login Flow (Google/GitHub/Facebook)

1. User visits `/login`
2. Clicks social auth button
3. Redirected to OAuth provider
4. OAuth provider redirects to `/auth/callback`
5. Supabase creates user in `auth.users` with OAuth data
6. Database trigger `handle_new_user()` creates profile in `public.profiles`
7. User redirected to `/gallery`

### Email/Password Login Flow

1. User visits `/login`
2. Enters email/password
3. Supabase validates credentials
4. User redirected to `/gallery`

## 🗄️ Database Schema

### `auth.users` (Supabase Built-in)

```sql
id                 UUID PRIMARY KEY
email              VARCHAR UNIQUE
encrypted_password VARCHAR (email auth only)
email_confirmed_at TIMESTAMP
raw_user_meta_data JSONB  -- {full_name, avatar_url, name}
raw_app_meta_data  JSONB  -- {provider: "email"|"google"|"github"}
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### `public.profiles` (Custom Table)

```sql
id         UUID PRIMARY KEY REFERENCES auth.users(id)
email      VARCHAR
full_name  VARCHAR
avatar_url VARCHAR
provider   VARCHAR  -- "email"|"google"|"github"|"facebook"
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

## ⚡ Database Trigger

### `handle_new_user()` Function

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, provider)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      NEW.raw_user_meta_data->>'avatar_url',
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Trigger Creation

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🛡️ Security Features

### Row Level Security (RLS)

- **`auth.users`**: Managed by Supabase
- **`public.profiles`**: Users can only access their own profile

### OAuth Configuration

- **Google OAuth**: Configured with client ID and secret
- **GitHub OAuth**: Configured with client ID and secret
- **Facebook OAuth**: Configured with client ID and secret
- **Callback URL**: `/auth/callback`

## 🔧 Configuration

### Supabase Auth Settings

- `mailer_autoconfirm: true` - Auto-confirm email signups
- `external_email_enabled: true` - Enable email/password auth
- `external_google_enabled: true` - Enable Google OAuth
- `external_github_enabled: true` - Enable GitHub OAuth
- `external_facebook_enabled: false` - Facebook OAuth (optional)

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 Testing Authentication

### Test Email Signup

1. Go to `/signup`
2. Enter email, password, full name
3. Check `auth.users` and `public.profiles` tables

### Test Social Login

1. Go to `/login`
2. Click social auth button
3. Complete OAuth flow
4. Check `auth.users` and `public.profiles` tables

### Verify Data Consistency

```sql
-- Check user-profile matching
SELECT
  u.id,
  u.email as user_email,
  p.email as profile_email,
  u.raw_app_meta_data->>'provider' as auth_provider,
  p.provider as profile_provider
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## 🚨 Troubleshooting

### Common Issues

1. **Profile not created**: Check trigger function and permissions
2. **OAuth redirect fails**: Verify callback URL configuration
3. **Social auth data missing**: Check OAuth provider configuration
4. **RLS blocking access**: Verify user authentication state

### Debug Queries

```sql
-- Check recent users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Check recent profiles
SELECT id, email, provider, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- Check trigger function
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';
```
