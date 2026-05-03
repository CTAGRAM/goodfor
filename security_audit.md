# 🔒 GoodFor — Security Audit Report

**Date:** 21 Feb 2026
**Project:** yiilubsznpyiswpvqyhy (GoodFor Mobile)

---

## Executive Summary

8 security issues identified. **7 resolved**, 1 requires manual Dashboard action.

---

## Findings

### 🔴 CRITICAL — Resolved

| # | Issue | Fix |
|---|-------|-----|
| 1 | OpenAI API key in client bundle (`EXPO_PUBLIC_`) | ✅ Moved to Edge Function Secret. Removed from `.env`. |
| 2 | System prompts embedded in client JS | ✅ Moved to `lumi-chat` Edge Function (server-side only). |

---

### 🟠 HIGH — Resolved

| # | Issue | Fix |
|---|-------|-----|
| 3 | Edge functions `verify_jwt: false` | ✅ `scan-product` v3 + `get-alternatives` v7 redeployed with `verify_jwt: true` |
| 4 | `products` UPDATE RLS always `true` | ✅ Migration applied — UPDATE restricted to products user has scanned |

---

### 🟡 MEDIUM — Resolved

| # | Issue | Fix |
|---|-------|-----|
| 5 | `handle_new_user` mutable search_path | ✅ `ALTER FUNCTION ... SET search_path = public` applied |
| 6 | `alert_preferences` RLS role `{public}` | ✅ All 4 policies recreated with `{authenticated}` role |

---

### 🟡 MEDIUM — Requires Manual Action

| # | Issue | Fix |
|---|-------|-----|
| 7 | Leaked password protection disabled | ⏳ Enable in Dashboard: **Auth → Settings → Password Security** |
| | | [Supabase Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |

---

### 🟢 INFO — No Action Needed

| # | Issue | Status |
|---|-------|--------|
| 8 | Supabase anon key in client | ✅ Expected — security relies on RLS (all policies now correct) |

---

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| `profiles` | `uid = id` | `uid = id` | `uid = id` | — | ✅ |
| `family_members` | `uid = user_id` | `uid = user_id` | `uid = user_id` | `uid = user_id` | ✅ |
| `scans` | `uid = user_id` | `uid = user_id` | `uid = user_id` | `uid = user_id` | ✅ |
| `favorites` | `uid = user_id` | `uid = user_id` | — | `uid = user_id` | ✅ |
| `ai_conversations` | `uid = user_id` | `uid = user_id` | `uid = user_id` | `uid = user_id` | ✅ |
| `ai_messages` | via conversation | via conversation | — | — | ✅ |
| `products` | `true` (public read) | `true` (scan creates new) | scoped to user scans | — | ✅ Fixed |
| `alert_preferences` | `uid = user_id` | `uid = user_id` | `uid = user_id` | `uid = user_id` | ✅ Fixed |

---

## Google OAuth Fix

**Issue:** Redirect loop / loading page after Google sign-in.

**Root cause:** Both `sign-in.jsx` and `AuthContext.jsx` were trying to navigate to `/(tabs)/home` after OAuth, creating a race condition.

**Fix:** Removed manual `router.replace('/(tabs)/home')` from Google OAuth handlers in `sign-in.jsx` and `sign-up.jsx`. AuthContext's navigation effect now exclusively handles post-OAuth routing.
