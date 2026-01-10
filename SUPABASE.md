# Supabase Backend Integration

## Project Details

- **Project Name**: GoodFor
- **Project ID**: yiilubsznpyiswpvqyhy
- **Region**: ap-southeast-1 (Singapore)
- **Status**: Active & Healthy
- **API URL**: https://yiilubsznpyiswpvqyhy.supabase.co

## Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The environment variables are already configured with the correct values.

### 3. Supabase Client

The Supabase client is configured in `src/lib/supabase.js` and uses AsyncStorage for session persistence.

## Usage

### Import the Client

```javascript
import { supabase } from '@/lib/supabase';
```

### Example Queries

#### Fetch Data

```javascript
const { data, error } = await supabase
  .from('products')
  .select('*');
```

#### Insert Data

```javascript
const { data, error } = await supabase
  .from('scans')
  .insert([
    { product_id: 1, user_id: 'user-123', safety_score: 95 }
  ]);
```

#### Authentication

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

## Database Schema

The database is currently empty. You can create tables using the Supabase dashboard or migrations.

### Suggested Schema for GoodFor App

```sql
-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Family profiles
create table public.family_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  age integer,
  allergies text[],
  dietary_restrictions text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table public.products (
  id uuid default gen_random_uuid() primary key,
  barcode text unique not null,
  name text not null,
  brand text,
  category text,
  image_url text,
  ingredients jsonb,
  nutrition_facts jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scan history
create table public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  family_member_id uuid references public.family_members on delete set null,
  safety_score integer,
  safety_level text, -- 'safe', 'caution', 'avoid'
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Favorites
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.products enable row level security;
alter table public.scans enable row level security;
alter table public.favorites enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view own family members"
  on public.family_members for select
  using (auth.uid() = user_id);

create policy "Users can insert own family members"
  on public.family_members for insert
  with check (auth.uid() = user_id);

create policy "Products are viewable by everyone"
  on public.products for select
  to authenticated
  using (true);

create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can view own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id);
```

## Next Steps

1. Create the database schema in Supabase dashboard or using migrations
2. Implement authentication flows in the app
3. Connect screens to Supabase queries
4. Add real-time subscriptions for live updates
