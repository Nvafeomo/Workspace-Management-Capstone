-- Run this if you already applied university_upgrade.sql and only need more departments.
-- Safe to re-run (on conflict do nothing).

insert into public.departments (name, code, description)
values
  ('Computer Science', 'CS', 'School of Computing'),
  ('Engineering', 'ENG', 'College of Engineering'),
  ('Library Services', 'LIB', 'Central library and study spaces'),
  ('Business Administration', 'BUS', 'School of Business'),
  ('Arts & Sciences', 'A&S', 'College of Arts and Sciences'),
  ('Mathematics', 'MATH', 'Department of Mathematics'),
  ('Physics', 'PHYS', 'Department of Physics'),
  ('Biology', 'BIO', 'Department of Biology'),
  ('Chemistry', 'CHEM', 'Department of Chemistry'),
  ('Nursing', 'NURS', 'School of Nursing'),
  ('Education', 'EDU', 'School of Education'),
  ('Student Life', 'STU', 'Student affairs and campus life'),
  ('Facilities Management', 'FAC', 'Buildings, maintenance, and campus operations')
on conflict (code) do nothing;
