import LegalShell from "@/components/LegalShell";

export const metadata = {
  title: "Uslovi korišćenja | StudentNS",
  description: "Uslovi korišćenja aplikacije StudentNS.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Uslovi korišćenja" updated="06.09.2026.">
      <section>
        <h2 className="mb-2 text-lg font-semibold">1. Prihvatanje uslova</h2>
        <p>
          Korišćenjem aplikacije StudentNS prihvatate ove uslove korišćenja.
          Ako se ne slažete sa njima, molimo vas da ne koristite aplikaciju.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">2. Opis usluge</h2>
        <p>
          StudentNS je interaktivna mapa Novog Sada sa lokacijama korisnim
          studentima. Aplikacija omogućava pregled mesta i dodavanje novih
          mesta od strane korisnika. Aplikacija se nudi u stanju kakva jeste,
          bez garancija da će informacije biti potpune, tačne ili ažurne.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">3. Pravila ponašanja</h2>
        <p>Prilikom korišćenja aplikacije ne smete:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>dodavati neistinite, obmanjujuće ili pristrasne podatke o mestima;</li>
          <li>objavljivati uvredljiv, nezakonit ili diskriminatorski sadržaj;</li>
          <li>širiti zlonamerni softver, lažne podatke ili spam;</li>
          <li>pokušavati narušavanje rada aplikacije, servisa ili baze podataka;</li>
          <li>koristiti aplikaciju za bilo kakvu komercijalnu promociju bez
          odobrenja.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">4. Korisnički sadržaj</h2>
        <p>
          Mesta koja dodate predstavljaju korisnički sadržaj. Dajete nam
          neekskluzivno pravo da taj sadržaj prikazujemo drugim korisnicima u
          okviru aplikacije. Zadržavate pravo da zatražite uklanjanje vašeg
          sadržaja.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">5. Moderacija</h2>
        <p>
          Zadržavamo pravo da pregledamo i uklonimo sadržaj koji krši ove
          uslove ili je očigledno netačan, kao i da onemogućimo pristup
          korisnicima koji sistematski krše pravila.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          6. Odricanje od odgovornosti
        </h2>
        <p>
          Podaci o cenama, radnom vremenu i karakteristikama mesta koje unose
          korisnici mogu biti neprecizni ili zastareli. Pre odlaska na neko
          mesto proverite informacije kod zvaničnih izvora. StudentNS ne snosi
          odgovornost za štetu nastalu oslanjanjem na sadržaj aplikacije.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          7. Ograničenje odgovornosti
        </h2>
        <p>
          U najvećoj meri dozvoljenoj zakonom, StudentNS ne odgovara za
          indirektnu, slučajnu ili posledičnu štetu nastalu korišćenjem ili
          nemogućnošću korišćenja aplikacije.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">8. Raskid</h2>
        <p>
          Možete prestati da koristite aplikaciju u svakom trenutku. Mi
          zadržavamo pravo da promenimo, obustavimo ili ukinemo bilo koji deo
          aplikacije bez prethodne najave.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">9. Merodavno pravo</h2>
        <p>
          Na ove uslove primenjuje se pravo Republike Srbije, a za eventualne
          sporove nadležni su sudovi u Novom Sadu.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">10. Izmene uslova</h2>
        <p>
          Uslove možemo menjati kada to bude potrebno. Izmenjeni uslovi važe
          od datuma objave na ovoj stranici.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">11. Kontakt</h2>
        <p>
          Za pitanja u vezi sa uslovima korišćenja obratite nam se preko forme
          za prijavu problema projekta StudentNS na GitHub-u.
        </p>
      </section>
    </LegalShell>
  );
}