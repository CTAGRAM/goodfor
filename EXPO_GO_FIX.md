# Expo Go OAuth Fix - URGENT

## The Problem

Your console logs show:
```
LOG  [OAuth] Generated redirect URI: exp://zz5kz9o-goodfor-8081.exp.direct/--/auth/callback
LOG  [OAuth] Opening Google OAuth URL...
```

Then NOTHING. No deep link received.

**Root Cause:** The `exp://` redirect URL is NOT in your Supabase Redirect URLs list!

---

## The Solution

### Option 1: Add Wildcard Support (RECOMMENDED for Development)

Supabase now supports wildcards! Update your Supabase redirect URLs:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration

2. Add these to "Redirect URLs":
   ```
   goodfor://**
   exp://**
   http://localhost:*/**
   ```

3. Click "Save"

This allows ANY exp:// URL from Expo Go to work.

---

### Option 2: Force Custom Scheme in Expo Go (QUICK FIX)

Modify `src/lib/supabaseAuth.js` to always use `goodfor://`:

```javascript
const createRedirectUri = () => {
    // Force custom scheme even in Expo Go
    const customScheme = 'goodfor://auth/callback';
    console.log('[OAuth] Using custom scheme:', customScheme);
    return customScheme;
};
```

**Then update Supabase:**
1. Ensure `goodfor://auth/callback` is in Redirect URLs
2. Ensure `goodfor://` is in "Additional Redirect URLs"

---

## Test After Fix

1. Clear cache: `npx expo start --clear`
2. Try Google OAuth again
3. Watch for this log:
   ```
   [AuthContext] 🔗 Deep link received: goodfor://auth/callback#access_token=...
   ```

If you see that log, the deep link is working!

---

## Which Option Should You Use?

**For Development in Expo Go:** Use Option 1 (wildcards) - more flexible

**For Production:** Both work, but Option 2 is cleaner

**Right now:** Try Option 1 first (easiest, no code changes needed)
