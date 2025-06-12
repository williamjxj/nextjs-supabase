# Social Media Authentication Setup Guide

This guide explains how to implement and configure Google and Facebook authentication using Supabase Auth.

## ✅ What's Already Implemented

### 1. **Database Schema**

- ✅ `profiles` table created for storing user profile information
- ✅ Automatic profile creation trigger for new users
- ✅ Row Level Security (RLS) policies implemented

### 2. **Authentication Components**

- ✅ `SocialAuthSection` component with Google and Facebook buttons
- ✅ Integrated into login and signup forms
- ✅ Error handling and user feedback

### 3. **Auth Callback Handling**

- ✅ Enhanced `/auth/callback` route with profile creation
- ✅ Error page for authentication failures
- ✅ Proper error messages and redirects

### 4. **Local Configuration**

- ✅ OAuth providers configured in `supabase/config.toml`
- ✅ Environment variables template added

## 🔧 Configuration Required

### 1. **Google OAuth Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and/or People API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add authorized redirect URIs:

   - For local development: `http://127.0.0.1:54321/auth/v1/callback`
   - For production: `https://your-project.supabase.co/auth/v1/callback`

7. Copy the Client ID and Client Secret
8. Update `.env.local`:
   ```bash
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id_here
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret_here
   ```

### 2. **Facebook OAuth Setup**

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add "Facebook Login" product to your app
4. Configure Facebook Login settings:

   - Valid OAuth Redirect URIs:
     - For local development: `http://127.0.0.1:54321/auth/v1/callback`
     - For production: `https://your-project.supabase.co/auth/v1/callback`

5. Copy the App ID and App Secret
6. Update `.env.local`:
   ```bash
   SUPABASE_AUTH_EXTERNAL_FACEBOOK_CLIENT_ID=your_facebook_app_id_here
   SUPABASE_AUTH_EXTERNAL_FACEBOOK_SECRET=your_facebook_app_secret_here
   ```

### 3. **Restart Supabase**

After updating environment variables:

```bash
npx supabase stop
npx supabase start
```

## 🧪 Testing Social Authentication

### 1. **Local Testing**

1. Start the development server: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Click on "Continue with Google" or "Continue with Facebook"
4. Complete the OAuth flow
5. You should be redirected back to the gallery

### 2. **Verify Database**

Check that the user profile was created:

```sql
SELECT * FROM profiles WHERE provider IN ('google', 'facebook');
```

## 🚀 User Experience Flow

### 1. **New User Social Authentication**

1. User clicks social auth button
2. Redirected to OAuth provider (Google/Facebook)
3. User authorizes the application
4. Redirected back to app via `/auth/callback`
5. Profile automatically created in `profiles` table
6. User is signed in and redirected to gallery

### 2. **Existing User Social Authentication**

1. User clicks social auth button
2. If email matches existing user, accounts are linked
3. User is signed in immediately

### 3. **Error Handling**

- OAuth errors are captured and displayed
- Failed authentications redirect to error page with details
- Users can retry authentication easily

## 🔒 Security Features

### 1. **Profile Data**

- User metadata is automatically extracted from OAuth provider
- Full name, email, and avatar URL are stored
- Provider information is tracked

### 2. **Session Management**

- Sessions are handled by Supabase Auth
- Refresh tokens are managed automatically
- Secure session storage in HTTP-only cookies

### 3. **Row Level Security**

- Users can only access their own profile data
- Authentication required for all protected resources

## 📱 Frontend Components

### 1. **SocialAuthSection**

```tsx
// Usage in login/signup forms
<SocialAuthSection disabled={isLoading} showDivider={true} />
```

### 2. **Individual Buttons**

```tsx
// Individual components available
<GoogleAuthButton disabled={isLoading} />
<FacebookAuthButton disabled={isLoading} />
```

## 🔗 URL Configuration

### Local Development

- **Callback URL**: `http://127.0.0.1:54321/auth/v1/callback`
- **Site URL**: `http://127.0.0.1:3000`

### Production

- **Callback URL**: `https://your-project.supabase.co/auth/v1/callback`
- **Site URL**: `https://your-domain.com`

## ⚠️ Important Notes

1. **Environment Variables**: Never commit OAuth secrets to git
2. **Redirect URIs**: Must be exactly configured in OAuth providers
3. **Local Testing**: Use `127.0.0.1` instead of `localhost` for consistency
4. **Profile Creation**: Automatic via database trigger, fallback in callback route
5. **Error Handling**: Always provide clear error messages to users

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**

   - Check OAuth provider settings
   - Ensure URIs match exactly (including protocol)

2. **"Session not found"**

   - Check environment variables are loaded
   - Restart Supabase after config changes

3. **Profile not created**

   - Check database trigger is working
   - Fallback creation in callback route handles edge cases

4. **OAuth errors**
   - Check provider app status (published/in development)
   - Verify client ID and secret are correct

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
