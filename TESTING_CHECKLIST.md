# OAuth Fix Testing Checklist

## Before Testing

### 1. Clear All Caches
```bash
# Run the provided restart script
./restart-clean.sh
```

Or manually:
```bash
# Kill Expo processes
pkill -f "expo start"
pkill -f "metro"

# Clear caches
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Start fresh
npx expo start --clear
```

### 2. Prepare Test Accounts
- **New User Test:** Have a Google account that has NEVER signed into this app before
- **Returning User Test:** Have a Google account that has previously created an account

### 3. Enable Detailed Console Logging
- Open Expo Go app
- Shake device to open developer menu
- Enable "Remote JS Debugging" (optional, for detailed logs)
- Keep terminal visible to watch logs

---

## Test Scenarios

### ✅ Test 1: Fresh Sign-Up with New Google Account

**Goal:** Verify profile creation works for brand new users

**Steps:**
1. ✅ Clear app data (uninstall/reinstall or clear data in device settings)
2. ✅ Open app in Expo Go
3. ✅ Tap "Continue with Google"
4. ✅ Sign in with Google account that has NEVER used the app
5. ✅ Complete Google sign-in
6. ✅ Watch console logs

**Expected Logs:**
```
[SignIn] Starting Google OAuth flow...
[OAuth] Opening Google OAuth URL...
[OAuth] Browser dismissed - OAuth may complete via deep link handler
[SignIn] No session from WebBrowser - waiting for deep link callback (normal in Expo Go)

[AuthContext] Deep link received: goodfor://auth/callback#access_token=...
[AuthContext] Processing OAuth callback...
[AuthContext] Session set successfully from deep link!
[AuthContext] Auth state changed: SIGNED_IN
[AuthContext] loadProfile called with userId: ... (attempt 1)
[AuthContext] No profile found, creating one for new user...
[AuthContext] Profile created successfully
[AuthContext] Profile loading completed
```

**Success Criteria:**
- [ ] Screen navigates to `/edit-profile` within 5 seconds
- [ ] Profile shows correct name from Google account
- [ ] No infinite loading
- [ ] No error alerts shown

**If Failed:**
- [ ] Check console logs for error messages
- [ ] Note exact timestamp where flow stopped
- [ ] Screenshot the error state

---

### ✅ Test 2: Sign-In with Existing Account

**Goal:** Verify returning users can sign in instantly

**Steps:**
1. ✅ Use Google account that has previously signed up
2. ✅ Tap "Continue with Google"
3. ✅ Complete OAuth flow
4. ✅ Watch console logs

**Expected Logs:**
```
[AuthContext] Deep link received: goodfor://auth/callback#access_token=...
[AuthContext] loadProfile called with userId: ... (attempt 1)
[AuthContext] Profile query completed: {hasData: true, name: 'John Doe'}
[AuthContext] Profile loading completed
```

**Success Criteria:**
- [ ] Screen navigates to `/(tabs)/home` within 3 seconds
- [ ] Profile loads immediately (faster than new user)
- [ ] User sees their existing data (name, preferences, etc.)
- [ ] No errors or delays

---

### ✅ Test 3: Network Error Recovery

**Goal:** Verify retry mechanism handles network issues

**Steps:**
1. ✅ Start OAuth flow with NEW Google account
2. ✅ Complete Google sign-in
3. ✅ **Immediately enable Airplane Mode** after browser closes
4. ✅ Watch retry mechanism in console

**Expected Logs:**
```
[AuthContext] loadProfile called (attempt 1)
[AuthContext] Profile creation error: NetworkError
[AuthContext] Retrying profile creation after 1 second...
[AuthContext] loadProfile called (attempt 2)
[AuthContext] Profile creation error: NetworkError
[AuthContext] Creating emergency fallback profile
[AuthContext] Profile loading completed
```

**Success Criteria:**
- [ ] App retries profile creation once
- [ ] If network restored: Profile created successfully
- [ ] If network still down: Emergency fallback profile created
- [ ] User sees home screen (may show generic "User" name)
- [ ] Navigation happens within 15 seconds max

**Then:**
- [ ] Disable Airplane Mode
- [ ] Force-close app and reopen
- [ ] Verify full profile loads on restart

---

### ✅ Test 4: Expo Go Deep Link Handling

**Goal:** Verify OAuth works correctly in Expo Go development environment

**Steps:**
1. ✅ Ensure running in Expo Go (not standalone build)
2. ✅ Tap "Continue with Google"
3. ✅ Watch console for WebBrowser behavior

**Expected Logs (Expo Go Specific):**
```
[OAuth] Starting Google sign-in with redirect: exp://...
[OAuth] Opening Google OAuth URL...
[OAuth] Browser dismissed - OAuth may complete via deep link handler
OR
[OAuth] Browser timeout in Expo Go - AuthContext will handle callback

[AuthContext] Deep link received: goodfor://auth/callback#access_token=...
[AuthContext] Session set successfully from deep link!
```

**Success Criteria:**
- [ ] WebBrowser opens Google sign-in page
- [ ] After sign-in, browser dismisses (this is normal in Expo Go)
- [ ] Deep link handler receives callback
- [ ] Session is set via deep link
- [ ] Navigation happens within 5 seconds
- [ ] No timeout errors shown to user

**Notes:**
- In Expo Go, WebBrowser returning `dismiss` is EXPECTED behavior
- The deep link handler is the primary OAuth completion mechanism in Expo Go
- This is different from production builds where WebBrowser returns tokens directly

---

### ✅ Test 5: Profile Load Timeout (Artificial Delay)

**Goal:** Verify timeout protection prevents infinite loading

**Setup Required:**
Add this temporary code to `AuthContext.jsx` in the `loadProfile` function after line 214:
```javascript
console.log('[AuthContext] 🔄 loadProfile called with userId:', userId, '(attempt', retryCount + 1, ')');

// TEMPORARY: Artificial delay for testing timeout
await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds

const startTime = Date.now();
```

**Steps:**
1. ✅ Complete OAuth flow
2. ✅ Watch timeout trigger after 10 seconds

**Expected Logs:**
```
[AuthContext] loadProfile called (attempt 1)
[AuthContext] ⏱️ Profile load timeout after 10001ms - forcing navigation
[AuthContext] Setting minimal profile for timeout recovery
[AuthContext] Profile loading completed in 12456ms
```

**Success Criteria:**
- [ ] After 10 seconds, timeout fires
- [ ] Minimal profile created from Google user data
- [ ] Loading completes, navigation happens
- [ ] User sees home screen with basic profile info

**After Test:**
- [ ] REMOVE the artificial delay code
- [ ] Restart Expo: `npx expo start --clear`

---

### ✅ Test 6: Sign-In Screen Fallback Timeout

**Goal:** Verify 15-second user-facing timeout on sign-in screen

**Setup Required:**
Temporarily disable internet BEFORE tapping "Continue with Google"

**Steps:**
1. ✅ Enable Airplane Mode
2. ✅ Tap "Continue with Google"
3. ✅ Watch for timeout alert after 15 seconds

**Expected Behavior:**
- [ ] Loading spinner shows for ~15 seconds
- [ ] Alert appears: "Sign In Taking Too Long"
- [ ] User can dismiss alert and try again
- [ ] Loading state clears

**After Test:**
- [ ] Disable Airplane Mode
- [ ] Try OAuth again with network enabled

---

## Post-Testing Verification

### Check App State
After successful OAuth:
- [ ] Navigate to Settings screen
- [ ] Verify user profile displays correctly
- [ ] Check that avatar image loads (if provided by Google)
- [ ] Try scanning a product (verify auth doesn't break other features)

### Check Database
In Supabase Dashboard:
- [ ] Open `profiles` table
- [ ] Verify new profile was created with correct data
- [ ] Check `is_profile_completed` field is `false` for new users
- [ ] Check `full_name`, `email`, `avatar_url` are populated

### Performance Metrics
Review console logs and note:
- [ ] Time from "Starting OAuth flow" to "Session set successfully": ____ms (should be <3 seconds)
- [ ] Time from "loadProfile called" to "Profile loading completed": ____ms (should be <2 seconds)
- [ ] Total time from OAuth start to navigation: ____ms (should be <5 seconds)

---

## Common Issues and Debugging

### Issue: "No deep link received" after OAuth
**Symptoms:** WebBrowser closes but no deep link logs appear
**Check:**
- [ ] Verify `goodfor://` is in Supabase Redirect URLs
- [ ] Check `app.json` has correct `scheme: "goodfor"`
- [ ] Restart Expo: `npx expo start --clear`

### Issue: "Profile remains 'User'"
**Symptoms:** Account created but shows generic "User" name
**Explanation:** This is emergency fallback profile (network error or timeout)
**Fix:**
- [ ] Check network connection
- [ ] Force-close app and reopen (should load full profile)
- [ ] Check Supabase database for profile data

### Issue: Timeout fires too quickly
**Symptoms:** Timeout logs appear before profile creation finishes
**Check:**
- [ ] Verify network speed (slow network may need longer timeout)
- [ ] Check Supabase region/latency
- [ ] Consider increasing `PROFILE_LOAD_TIMEOUT` to 15000ms for slow networks

### Issue: Duplicate profile errors
**Symptoms:** Console shows "duplicate key value violates unique constraint"
**Check:**
- [ ] Verify conflict resolution logs: "Duplicate profile detected, fetching existing..."
- [ ] Confirm navigation still happens successfully
- [ ] This is EXPECTED and handled gracefully

---

## Success Checklist

**All tests must pass:**
- [ ] Test 1: Fresh sign-up works
- [ ] Test 2: Existing user sign-in works
- [ ] Test 3: Network errors are recovered
- [ ] Test 4: Expo Go deep linking works
- [ ] Test 5: Timeout protection works
- [ ] Test 6: User-facing timeout works

**Performance benchmarks met:**
- [ ] 95%+ of OAuth flows complete within 5 seconds
- [ ] No infinite loading states
- [ ] All errors handled gracefully with retry/fallback
- [ ] Console logs are clear and informative

**User experience:**
- [ ] No confusing error messages shown to user
- [ ] Loading states are reasonable (<5 seconds for new users, <3 seconds for returning)
- [ ] Profile data displays correctly after OAuth
- [ ] App is usable immediately after sign-in

---

## Reporting Issues

If any test fails, provide:
1. **Test number that failed**: (e.g., Test 3: Network Error Recovery)
2. **Console logs**: Copy full console output from OAuth start to failure point
3. **Screenshots**: Show the stuck screen or error message
4. **Network conditions**: WiFi/Cellular/Airplane mode
5. **Device info**: iOS/Android version, Expo Go version
6. **Account type**: New user or returning user

---

**Testing Date:** _________
**Tester Name:** _________
**Expo Go Version:** _________
**Device:** _________
**Overall Result:** ⬜ PASS / ⬜ FAIL

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Commit changes:
   ```bash
   git add .
   git commit -m "Fix: OAuth loading and timeout issues

   - Added profile loading retry logic and timeout protection
   - Fixed WebBrowser hanging in Expo Go
   - Added comprehensive error handling and fallbacks
   - Improved logging for debugging OAuth flow

   Resolves infinite loading screen after Google OAuth"
   ```

2. Remove test modifications (if any artificial delays were added)

3. Deploy to production/TestFlight for broader testing

### If Tests Fail ❌
1. Review console logs to identify exact failure point
2. Check which protection mechanism failed (retry, timeout, fallback)
3. Adjust timeout values if network latency is an issue
4. Report detailed failure information for further debugging
