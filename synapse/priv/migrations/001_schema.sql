-- Synapse adamas-DB schema (spine AD-4: Postgres = system of record).
-- Seed populates schools/departments/years + baseline campus data (FR-22).
-- ponytail: plain SQL, run in order by the seed runner. No migration framework.

CREATE TABLE IF NOT EXISTS schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level       INT NOT NULL UNIQUE CHECK (level BETWEEN 1 AND 4)
);

CREATE TABLE IF NOT EXISTS students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  school_id   UUID NOT NULL REFERENCES schools(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  year_id     UUID NOT NULL REFERENCES years(id),
  credential  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS notices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  publisher   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dept_year_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  year_id     UUID NOT NULL REFERENCES years(id),
  author_id   UUID REFERENCES students(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    UUID NOT NULL REFERENCES group_spaces(id),
  author_id   UUID REFERENCES students(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS note_shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  year_id     UUID NOT NULL REFERENCES years(id),
  uploader_id UUID REFERENCES students(id),
  filename    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
