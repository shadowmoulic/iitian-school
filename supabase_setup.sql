-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create User Profiles Table
create table public."iitianschool-profiles" (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    mobile_number text,
    role text default 'student' check (role in ('student', 'admin')),
    created_at timestamptz default now()
);

-- Enable RLS (Row Level Security)
alter table public."iitianschool-profiles" enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on public."iitianschool-profiles" for select using (true);
create policy "Users can insert their own profile." on public."iitianschool-profiles" for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public."iitianschool-profiles" for update using (auth.uid() = id);

-- 3. Create Courses Table
create table public."iitianschool-courses" (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    price numeric not null,
    created_at timestamptz default now()
);

alter table public."iitianschool-courses" enable row level security;
create policy "Courses viewable by everyone." on public."iitianschool-courses" for select using (true);
create policy "Only admins can modify courses." on public."iitianschool-courses" for all using (
    exists (select 1 from public."iitianschool-profiles" where id = auth.uid() and role = 'admin')
);

-- 4. Create Enrollments (Purchases) Table
create table public."iitianschool-enrollments" (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    course_id uuid references public."iitianschool-courses" on delete cascade not null,
    status text default 'active' check (status in ('active', 'cancelled')),
    created_at timestamptz default now(),
    unique(user_id, course_id)
);

alter table public."iitianschool-enrollments" enable row level security;
create policy "Users can view their own enrollments." on public."iitianschool-enrollments" for select using (auth.uid() = user_id);
create policy "Users can purchase/enroll." on public."iitianschool-enrollments" for insert with check (auth.uid() = user_id);

-- 5. Create Quiz Results Table
create table public."iitianschool-quiz-results" (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    score integer not null,
    total_questions integer default 10 not null,
    answers jsonb,
    created_at timestamptz default now()
);

alter table public."iitianschool-quiz-results" enable row level security;
create policy "Users can view their own results." on public."iitianschool-quiz-results" for select using (auth.uid() = user_id);
create policy "Admins can view all results." on public."iitianschool-quiz-results" for select using (
    exists (select 1 from public."iitianschool-profiles" where id = auth.uid() and role = 'admin')
);
create policy "Users can record test scores." on public."iitianschool-quiz-results" for insert with check (auth.uid() = user_id);

-- 6. Trigger to automatically create a profile when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public."iitianschool-profiles" (id, full_name, mobile_number, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
        new.raw_user_meta_data->>'mobile_number',
        'student'
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
