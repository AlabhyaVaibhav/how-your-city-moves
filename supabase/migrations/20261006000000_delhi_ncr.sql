-- Delhi becomes Delhi NCR: more of Gurugram, Noida and Greater Noida. The city id stays 'delhi'.
-- Keep in step with src/cities/delhi/index.ts (tests/areas.test.ts checks).

insert into public.areas (city, id) values
  ('delhi', 'golfcourseroad'),
  ('delhi', 'sohnaroad'),
  ('delhi', 'newgurgaon'),
  ('delhi', 'manesar'),
  ('delhi', 'noida18'),
  ('delhi', 'noidaexpressway'),
  ('delhi', 'greaternoida'),
  ('delhi', 'grnoidawest');
