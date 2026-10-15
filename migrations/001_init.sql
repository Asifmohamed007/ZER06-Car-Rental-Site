-- ZER06 Rental Cars: initial schema
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE vehicle_category AS ENUM ('economy','sedan','suv','luxury','sports','van');
CREATE TYPE transmission AS ENUM ('automatic','manual');
CREATE TYPE booking_status AS ENUM ('pending','confirmed','cancelled','completed');
CREATE TYPE payment_status AS ENUM ('unpaid','pending','paid','failed','refunded');
CREATE TYPE admin_role AS ENUM ('owner','staff');

CREATE TABLE vehicles (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INT  NOT NULL CHECK (year BETWEEN 1950 AND 2100),
  category      vehicle_category NOT NULL,
  transmission  transmission NOT NULL,
  seats         INT  NOT NULL CHECK (seats BETWEEN 1 AND 60),
  fuel_type     TEXT,
  daily_rate    INT  NOT NULL CHECK (daily_rate > 0),       -- whole QAR
  deposit       INT  NOT NULL DEFAULT 0 CHECK (deposit >= 0),-- whole QAR
  summary       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  features      JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,   -- manual on/off switch for bookings
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title     TEXT,
  seo_description TEXT,
  archived_at   TIMESTAMPTZ,                      -- soft delete; booking history is kept
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_images (
  id          BIGSERIAL PRIMARY KEY,
  vehicle_id  BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  external_url TEXT,          -- placeholder images (Unsplash/Pexels)
  data        BYTEA,          -- uploaded images, served by /api/images/:id
  mime_type   TEXT,
  alt         TEXT NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((external_url IS NOT NULL) <> (data IS NOT NULL))
);
CREATE INDEX vehicle_images_vehicle_idx ON vehicle_images(vehicle_id, sort_order);

CREATE TABLE blocked_periods (
  id          BIGSERIAL PRIMARY KEY,
  vehicle_id  BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  reason      TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX blocked_periods_vehicle_idx ON blocked_periods(vehicle_id, starts_at);

CREATE TABLE bookings (
  id               BIGSERIAL PRIMARY KEY,
  reference        TEXT NOT NULL UNIQUE,
  -- SHA-256 of the client-generated idempotency key. The raw key doubles as the
  -- customer's private access token for the confirmation page, so it is never stored.
  idempotency_key  TEXT NOT NULL UNIQUE,
  vehicle_id       BIGINT NOT NULL REFERENCES vehicles(id),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  driver_age       INT,
  notes            TEXT NOT NULL DEFAULT '',
  pickup_at        TIMESTAMPTZ NOT NULL,
  return_at        TIMESTAMPTZ NOT NULL,
  pickup_location  TEXT NOT NULL,
  return_location  TEXT NOT NULL,
  additional_driver BOOLEAN NOT NULL DEFAULT FALSE,
  billable_days    INT NOT NULL,
  daily_rate       INT NOT NULL,
  price_breakdown  JSONB NOT NULL,
  total            INT NOT NULL,
  deposit          INT NOT NULL DEFAULT 0,
  status           booking_status NOT NULL DEFAULT 'pending',
  payment_method   TEXT NOT NULL,
  payment_status   payment_status NOT NULL DEFAULT 'unpaid',
  admin_notes      TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (return_at > pickup_at),
  -- Database-level guarantee: no two active bookings for the same car can overlap.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(pickup_at, return_at, '[)') WITH &&
  ) WHERE (status IN ('pending','confirmed'))
);
CREATE INDEX bookings_status_idx ON bookings(status, pickup_at);
CREATE INDEX bookings_vehicle_idx ON bookings(vehicle_id, pickup_at);

CREATE TABLE enquiries (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL DEFAULT '',
  subject    TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  is_handled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admins (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role          admin_role NOT NULL DEFAULT 'staff',
  disabled      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_sessions (
  token_hash  TEXT PRIMARY KEY,
  admin_id    BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX admin_sessions_expiry_idx ON admin_sessions(expires_at);

CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  count        INT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL
);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  admin_id   BIGINT REFERENCES admins(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  detail     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
