-- ============================================================
-- supabase/schema.sql — Listen to the City database schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.
-- ============================================================

-- 0. PostGIS (geographical queries). If this errors, your project
--    already has it or you can enable it under Database → Extensions.
create extension if not exists postgis;

-- 1. users (profiles linked to Supabase auth)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  city text default 'Chennai',
  created_at timestamptz not null default now()
);

-- 2. incident_categories (lookup)
create table if not exists incident_categories (
  category_key text primary key,
  label text not null,
  description text
);
insert into incident_categories (category_key, label) values
  ('traffic_congestion','Traffic Congestion'),
  ('road_accident','Road Accident'),
  ('waterlogging','Waterlogging'),
  ('road_closure','Road Closure'),
  ('road_construction','Road Construction'),
  ('public_transport_delay','Public Transport Delay'),
  ('other','Other')
on conflict (category_key) do nothing;

-- 3. mobility_reports (unified: citizen + news + social feeds)
create table if not exists mobility_reports (
  id bigserial primary key,
  source_type text not null check (source_type in ('citizen','news','social_sim','social_real')),
  source text,
  post_id text,
  description text not null,
  location_name text,
  latitude double precision,
  longitude double precision,
  geo geometry(point, 4326),                    -- PostGIS point (kept in sync below)
  event_time timestamptz not null default now(),
  category text references incident_categories(category_key) default 'other',
  severity text check (severity in ('low','medium','high')) default 'low',
  relevance_score int check (relevance_score between 0 and 100),
  relevant boolean default true,
  verification_status text check (verification_status in ('unverified','corroborated','officially_confirmed','rejected')) default 'unverified',
  confidence int check (confidence between 0 and 100),
  duplicate_of bigint references mobility_reports(id),
  is_simulated boolean default false,
  image_url text,
  url text,
  status text default 'pending',
  user_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- keep geo column in sync with lat/lng
create or replace function mobility_reports_set_geo() returns trigger as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.geo := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326);
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_reports_geo on mobility_reports;
create trigger trg_reports_geo before insert or update on mobility_reports
for each row execute function mobility_reports_set_geo();

-- 4. social_media_posts (simulated now; real APIs later)
create table if not exists social_media_posts (
  id bigserial primary key,
  platform text not null check (platform in ('x','reddit','other')),
  post_id text unique,
  post_text text not null,
  posted_at timestamptz,
  location_name text,
  url text,
  is_simulated boolean not null default true,
  processing_status text default 'pending',
  report_id bigint references mobility_reports(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. news_reports
create table if not exists news_reports (
  id bigserial primary key,
  title text not null,
  url text unique,
  source text,
  published_at timestamptz,
  category text references incident_categories(category_key) default 'other',
  relevance_score int,
  report_id bigint references mobility_reports(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 6. verification_records (audit trail of AI scoring)
create table if not exists verification_records (
  id bigserial primary key,
  report_id bigint not null references mobility_reports(id) on delete cascade,
  status text not null check (status in ('unverified','corroborated','officially_confirmed','rejected')),
  confidence int not null check (confidence between 0 and 100),
  reasons jsonb not null default '[]',
  scored_by text default 'keyword-baseline-v1',
  created_at timestamptz not null default now()
);

-- 7. Indexes
create index if not exists idx_reports_event_time on mobility_reports (event_time desc);
create index if not exists idx_reports_category on mobility_reports (category);
create index if not exists idx_reports_severity on mobility_reports (severity);
create index if not exists idx_reports_location on mobility_reports (lower(location_name));
create index if not exists idx_reports_geo on mobility_reports using gist (geo);
create index if not exists idx_reports_verification on mobility_reports (verification_status);
create index if not exists idx_social_post_id on social_media_posts (post_id);
create index if not exists idx_news_published on news_reports (published_at desc);

-- 8. Row Level Security
alter table users enable row level security;
alter table mobility_reports enable row level security;
alter table social_media_posts enable row level security;
alter table news_reports enable row level security;
alter table incident_categories enable row level security;
alter table verification_records enable row level security;

-- Anyone (even anon) can READ; only authenticated users can insert citizen reports;
-- writes to news/social tables require the service key (server-side only).
create policy "public read users" on users for select using (true);
create policy "self insert users" on users for insert with check (auth.uid() = id);
create policy "public read reports" on mobility_reports for select using (true);
create policy "anon insert citizen reports" on mobility_reports for insert with check (source_type = 'citizen');
create policy "public read social" on social_media_posts for select using (true);
create policy "public read news" on news_reports for select using (true);
create policy "public read categories" on incident_categories for select using (true);
create policy "public read verification" on verification_records for select using (true);
