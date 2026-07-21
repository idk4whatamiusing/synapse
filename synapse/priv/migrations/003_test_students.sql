-- Dev test accounts so login (Story 2.1) is verifiable end-to-end.
-- ponytail: plaintext credential is DEV ONLY — hash + salt before any real deploy.
INSERT INTO students (roll_number, name, school_id, department_id, year_id, credential)
SELECT v.roll, v.name, s.id, d.id, y.id, v.cred
FROM (VALUES
  ('SOET/CSE/2024/001'::text,'Riya Sharma'::text,'SOET'::text,'CSE'::text,1,'test123'::text),
  ('SOMS/BBA/2023/042'::text,'Dev Patel'::text,'SOMS'::text,'BBA'::text,2,'devpass'::text)
) AS v(roll, name, school, dept, year, cred)
JOIN schools s ON s.code = v.school
JOIN departments d ON d.code = v.dept
JOIN years y ON y.level = v.year
WHERE NOT EXISTS (SELECT 1 FROM students WHERE roll_number = v.roll);
