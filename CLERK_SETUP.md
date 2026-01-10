# Clerk + Supabase Integration Setup Guide

## Overview

This app uses **Clerk** for authentication and **Supabase** for the database. Clerk session tokens are used to authenticate Supabase requests.

## Prerequisites

1. **Clerk Account**: Sign up at https://dashboard.clerk.com
2. **Supabase Project**: Already set up (GoodFor project)

## Setup Steps

### 1. Configure Clerk

1. Go to https://dashboard.clerk.com
2. Create a new application or select existing one
3. Navigate to **Configure > Native Applications**
4. Enable **Native API**
5. Go to https://dashboard.clerk.com/setup/supabase
6. Click **Activate Supabase integration**
7. Copy your **Clerk domain** (e.g., `your-app.clerk.accounts.dev`)
8. Copy your **Publishable Key** from the API Keys page

### 2. Configure Supabase

1. Go to https://supabase.com/dashboard
2. Select your project (GoodFor)
3. Navigate to **Authentication > Third-Party Auth**
4. Click **Add provider**
5. Select **Clerk** from the list
6. Paste your **Clerk domain** from step 1.7

### 3. Update Environment Variables

Add your Clerk Publishable Key to `.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Important**: Keep your `.env` file secure and never commit it to version control.

### 4. Install Dependencies

Already installed:
- `@clerk/clerk-expo` - Clerk SDK for Expo
- `expo-secure-store` - Secure token storage

## How It Works

### Authentication Flow

1. **Sign Up**:
   - User enters email, password, and name
   - Clerk creates account and sends verification email
   - User enters 6-digit code
   - Account is verified and session created

2. **Sign In**:
   - User enters email and password
   - Clerk validates credentials
   - Session token is created and stored securely

3. **Session Management**:
   - Clerk session tokens are stored in `expo-secure-store`
   - Tokens are automatically refreshed
   - On app restart, session is restored

### Database Access

1. **Supabase Client**:
   - Uses `useSupabaseClient()` hook
   - Automatically includes Clerk token in requests
   - Clerk token is passed via `Authorization` header

2. **Row Level Security (RLS)**:
   - All tables have RLS enabled
   - Policies check Clerk user ID from JWT `sub` claim
   - Users can only access their own data

### User ID Mapping

- **Clerk User ID**: Stored in JWT `sub` claim (e.g., `user_2abc123...`)
- **Supabase profiles.id**: Matches Clerk user ID
- **RLS Policies**: Use `auth.jwt()->>'sub'` to get Clerk user ID

## Usage in Code

### Get Current User

```jsx
import { useUser } from '@clerk/clerk-expo';

function MyComponent() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <Loading />;
  if (!user) return <SignIn />;
  
  return <Text>Hello {user.firstName}!</Text>;
}
```

### Query Supabase

```jsx
import { useSupabaseClient } from '@/lib/supabase';

function MyComponent() {
  const supabase = useSupabaseClient();
  
  const loadData = async () => {
    const { data, error } = await supabase
      .from('scans')
      .select('*');
  };
}
```

### Sign Out

```jsx
import { useClerk } from '@clerk/clerk-expo';

function SignOutButton() {
  const { signOut } = useClerk();
  
  return (
    <Button onPress={() => signOut()}>
      Sign Out
    </Button>
  );
}
```

## Database Schema

All tables use Clerk user IDs:

- `profiles.id` - UUID (matches Clerk user ID)
- `family_members.user_id` - UUID (references profiles.id)
- `scans.user_id` - UUID (references profiles.id)
- `favorites.user_id` - UUID (references profiles.id)
- `ai_conversations.user_id` - UUID (references profiles.id)

## Testing

1. **Sign Up**: Create a new account
2. **Verify Email**: Check email for verification code
3. **Sign In**: Log in with credentials
4. **Create Data**: Add family members, scans, etc.
5. **Sign Out**: Verify session is cleared
6. **Sign In Again**: Verify data persists

## Troubleshooting

### "Missing Publishable Key" Error
- Ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is in `.env`
- Restart Expo dev server after adding env vars

### "Unauthorized" Database Errors
- Check Clerk domain is configured in Supabase
- Verify RLS policies are enabled
- Ensure user is signed in

### Session Not Persisting
- Check `expo-secure-store` is installed
- Verify `tokenCache` is passed to `ClerkProvider`

## Next Steps

1. ✅ Clerk authentication integrated
2. ✅ Supabase client configured with Clerk tokens
3. ✅ RLS policies updated for Clerk
4. 🔄 Update app screens to use Clerk hooks
5. 🔄 Add profile creation on first sign-in
6. 🔄 Implement OAuth providers (Google)

## Resources

- [Clerk Expo Docs](https://clerk.com/docs/quickstarts/expo)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/clerk)
