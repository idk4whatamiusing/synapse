-- Synapse seed: 10 Adamas schools, their departments, years 1-4 (FR-22).
-- ponytail: representative departments per school; expand from adamas DB later.
-- Idempotent: only inserts when schools table is empty.

DO $$
DECLARE
  s_school UUID;
  s_soet UUID; s_solt UUID; s_soms UUID; s_sohs UUID; s_soes UUID;
  s_sohss UUID; s_socs UUID; s_sobss UUID; s_sol UUID; s_soa UUID;
  y1 UUID; y2 UUID; y3 UUID; y4 UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM schools LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO years (level) VALUES (1),(2),(3),(4)
    ON CONFLICT (level) DO NOTHING;
  SELECT id INTO y1 FROM years WHERE level = 1;
  SELECT id INTO y2 FROM years WHERE level = 2;
  SELECT id INTO y3 FROM years WHERE level = 3;
  SELECT id INTO y4 FROM years WHERE level = 4;

  INSERT INTO schools (code, name) VALUES
    ('SOET','School of Engineering & Technology') RETURNING id INTO s_soet;
  INSERT INTO schools (code, name) VALUES
    ('SOLT','School of Law') RETURNING id INTO s_solt;
  INSERT INTO schools (code, name) VALUES
    ('SOMS','School of Management Sciences') RETURNING id INTO s_soms;
  INSERT INTO schools (code, name) VALUES
    ('SOHS','School of Health Sciences') RETURNING id INTO s_sohs;
  INSERT INTO schools (code, name) VALUES
    ('SOES','School of Education') RETURNING id INTO s_soes;
  INSERT INTO schools (code, name) VALUES
    ('SOHSS','School of Humanities & Social Sciences') RETURNING id INTO s_sohss;
  INSERT INTO schools (code, name) VALUES
    ('SOCS','School of Commerce & Social Sciences') RETURNING id INTO s_socs;
  INSERT INTO schools (code, name) VALUES
    ('SOBSS','School of Basic & Applied Sciences') RETURNING id INTO s_sobss;
  INSERT INTO schools (code, name) VALUES
    ('SOL','School of Liberal Arts') RETURNING id INTO s_sol;
  INSERT INTO schools (code, name) VALUES
    ('SOA','School of Agriculture') RETURNING id INTO s_soa;

  -- SOET departments (representative; add the rest from adamas DB).
  INSERT INTO departments (school_id, code, name) VALUES
    (s_soet,'CSE','Computer Science & Engineering'),
    (s_soet,'ECE','Electronics & Communication Engineering'),
    (s_soet,'ME','Mechanical Engineering'),
    (s_soet,'CE','Civil Engineering');
  -- SOMS
  INSERT INTO departments (school_id, code, name) VALUES
    (s_soms,'BBA','Bachelor of Business Administration'),
    (s_soms,'MBA','Master of Business Administration');
  -- SOBSS
  INSERT INTO departments (school_id, code, name) VALUES
    (s_sobss,'MATH','Mathematics'),
    (s_sobss,'PHY','Physics'),
    (s_sobss,'CHEM','Chemistry');
  -- SOHSS
  INSERT INTO departments (school_id, code, name) VALUES
    (s_sohss,'ENG','English'),
    (s_sohss,'PSY','Psychology');
  -- others: one dept each as placeholder
  INSERT INTO departments (school_id, code, name) VALUES
    (s_solt,'LLB','Bachelor of Laws'),
    (s_sohs,'NURS','Nursing'),
    (s_soes,'BED','Bachelor of Education'),
    (s_socs,'BCOM','Bachelor of Commerce'),
    (s_sol,'BA','Bachelor of Arts'),
    (s_soa,'AGR','Agriculture');

  -- ponytail: dev test accounts so login (Story 2.1) is verifiable end-to-end.
  -- Plaintext credential is DEV ONLY — hash + salt before any real deploy.
  INSERT INTO students (roll_number, name, school_id, department_id, year_id, credential)
  VALUES
    ('SOET/CSE/2024/001','Riya Sharma',
       (SELECT id FROM schools WHERE code='SOET'),
       (SELECT id FROM departments WHERE code='CSE'),
       (SELECT id FROM years WHERE level=1),
       'test123'),
    ('SOMS/BBA/2023/042','Dev Patel',
       (SELECT id FROM schools WHERE code='SOMS'),
       (SELECT id FROM departments WHERE code='BBA'),
       (SELECT id FROM years WHERE level=2),
       'devpass');
END $$;
