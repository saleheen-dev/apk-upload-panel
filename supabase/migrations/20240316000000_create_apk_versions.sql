-- Create the apk_versions table
create table apk_versions (
  id uuid default uuid_generate_v4() primary key,
  version text not null,
  download_url text not null,
  release_notes text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table apk_versions enable row level security;

-- Allow public access for reading
create policy "Allow public read access"
  on apk_versions for select
  to public
  using (true);

-- Allow service role to insert
create policy "Allow service role to insert"
  on apk_versions for insert
  to service_role
  with check (true);

-- Create index on version for faster lookups
create index idx_apk_versions_version on apk_versions(version);

-- Create index on created_at for order by queries
create index idx_apk_versions_created_at on apk_versions(created_at desc); 