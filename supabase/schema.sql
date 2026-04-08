-- ============================================================
-- MediaLog - Supabase Schema Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE media_type AS ENUM ('movie', 'tv', 'book', 'manga');

CREATE TYPE media_status AS ENUM (
  'watching',
  'watched',
  'reading',
  'read',
  'plan_to_watch',
  'plan_to_read',
  'dropped'
);

CREATE TYPE platform_type AS ENUM (
  'YouTube',
  'Netflix',
  'Disney+',
  'iQiyi',
  'WeTV',
  'MonoMax',
  'HBO',
  'Amazon Prime',
  'Apple TV+',
  'Other'
);

-- ============================================================
-- MAIN TABLE: media_items
-- ============================================================

CREATE TABLE media_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Core fields
  title           TEXT NOT NULL,
  type            media_type NOT NULL,
  status          media_status NOT NULL DEFAULT 'plan_to_watch',
  rating          SMALLINT CHECK (rating >= 1 AND rating <= 5),
  release_year    SMALLINT CHECK (release_year >= 1800 AND release_year <= 2100),
  image_url       TEXT,
  genre           TEXT[],           -- Array of genres e.g. {"Action","Drama"}
  notes           TEXT,

  -- Movie / TV specific
  watched_with    TEXT,             -- e.g. "Solo", "Family", "Friends"
  watched_date    DATE,
  platform        platform_type,
  episodes        INTEGER,          -- TV: total episodes
  current_episode INTEGER,          -- TV: currently on episode

  -- Book / Manga specific
  author          TEXT,
  total_chapters  INTEGER,          -- Manga: total chapters
  current_chapter INTEGER,          -- Manga: currently on chapter
  publisher       TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_media_items_type    ON media_items (type);
CREATE INDEX idx_media_items_status  ON media_items (status);
CREATE INDEX idx_media_items_rating  ON media_items (rating DESC NULLS LAST);
CREATE INDEX idx_media_items_created ON media_items (created_at DESC);
CREATE INDEX idx_media_items_title   ON media_items USING gin(to_tsvector('english', title));

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable if you add auth — disable for personal single-user use
-- ============================================================

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations (single-user personal app)
CREATE POLICY "Allow all operations" ON media_items
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET
-- Run in Supabase Dashboard > Storage > New Bucket
-- OR via SQL using storage schema:
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-posters', 'media-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow public reads + authenticated uploads
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-posters');

CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media-posters');

CREATE POLICY "Allow updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media-posters');

CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'media-posters');

-- ============================================================
-- SAMPLE DATA (optional — comment out if not needed)
-- ============================================================

INSERT INTO media_items (title, type, status, rating, release_year, genre, platform, watched_date, watched_with, notes) VALUES
  ('Dune: Part Two',       'movie', 'watched',       5, 2024, '{"Sci-Fi","Adventure"}', 'Netflix',    '2024-03-15', 'Solo',   'Visually stunning epic'),
  ('Oppenheimer',          'movie', 'watched',       5, 2023, '{"Drama","History"}',    'Netflix',    '2023-07-31', 'Friends','Nolan at his finest'),
  ('Shogun',               'tv',    'watched',       5, 2024, '{"Drama","History"}',    'Disney+',    '2024-04-20', 'Solo',   'Best show of the year'),
  ('The Bear',             'tv',    'watching',      4, 2023, '{"Drama","Comedy"}',     'Disney+',    NULL,         NULL,     'Season 3 ongoing'),
  ('Atomic Habits',        'book',  'read',          5, 2018, '{"Self-Help"}',           NULL,         NULL,         NULL,     'Life changing'),
  ('Project Hail Mary',    'book',  'read',          5, 2021, '{"Sci-Fi"}',              NULL,         NULL,         NULL,     'Andy Weir is genius'),
  ('Berserk',              'manga', 'reading',       5, 1989, '{"Fantasy","Action"}',    NULL,         NULL,         NULL,     'Dark fantasy masterpiece'),
  ('One Piece',            'manga', 'reading',       5, 1997, '{"Adventure","Action"}',  NULL,         NULL,         NULL,     'Greatest story ever told');
