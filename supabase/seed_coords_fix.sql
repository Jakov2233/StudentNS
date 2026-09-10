-- StudentNS — Ispravka koordinata seed-a
-- Neka mesta su u seed-u imala IDENTICNE koordinate (marker se krio pod drugim).
-- Ovo ih odvaja na male udaljenosti. Idempotentno.

update public.places
set lat = 45.2557000, lng = 19.8280000
where id = '20000000-0000-0000-0000-000000000002';  -- Menza 2 (bila na istoj tacki kao dom Sajmiste)

update public.places
set lat = 45.2554000, lng = 19.8447000
where id = '20000000-0000-0000-0000-000000000020';  -- Bankomat Trg slobode (bio pored knjizare)

update public.places
set lat = 45.2467000, lng = 19.8533000
where id = '20000000-0000-0000-0000-000000000023';  -- Kopirnica Krug (bila pored Pravnog fakulteta)

update public.places
set lat = 45.2476000, lng = 19.8518000
where id = '20000000-0000-0000-0000-000000000025';  -- Teretana Student (bila na istoj tacki kao Menza 1)

update public.places
set lat = 45.2466000, lng = 19.8512000
where id = '20000000-0000-0000-0000-000000000027';  -- Stajaliste FTN (bilo na istoj tacki kao FTN)

update public.places
set lat = 45.2543000, lng = 19.8452000
where id = '20000000-0000-0000-0000-000000000029';  -- Turisticka info tacka (bila na istoj tacki kao kafic Dnevni boravak)