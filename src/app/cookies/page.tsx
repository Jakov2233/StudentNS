import LegalShell from "@/components/LegalShell";

export const metadata = {
  title: "Politika kolačića | StudentNS",
  description: "Politika kolačića aplikacije StudentNS.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Politika kolačića" updated="06.09.2026.">
      <section>
        <h2 className="mb-2 text-lg font-semibold">1. Šta su kolačići</h2>
        <p>
          Kolačići su male datoteke koje sajt čuva u vašem pregledaču da bi
          zapamtio vaš izbor i podešavanja. StudentNS koristi minimalno
          skladištenje i to isključivo da bi aplikacija mogla da radi.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">2. Koje kolačiće koristimo</h2>
        <p>Koristimo samo tehnički neophodno skladištenje:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong>Izbor saglasnosti za kolačiće</strong>: pamti vaš odgovor
            na pitanje o kolačićima da vam tu poruku ne prikazujemo ponovo.
          </li>
          <li>
            <strong>Preference prikaza</strong>: pamti vaše izbore u okviru
            stranice (na primer otvorenu ili zatvorenu listu mesta) tokom
            korišćenja.
          </li>
        </ul>
        <p>
          <strong>Ne koristimo</strong> marketinške, analitičke ni kolačiće
          trećih strana. Nemamo reklame, sisteme za praćenje ponašanja,
          piksele ili slične mehanizme.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">3. Saglasnost</h2>
        <p>
          Prilikom prve posete prikazujemo vam poruku o kolačićima. Dodatno
          skladištenje u vaš pregledač ne događa se pre vašeg izbora. Možete
          odabrati Prihvati ili Odbij, a svoj izbor možete promeniti
          brisanjem podataka sajta u podešavanjima pregledača.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">4. Upravljanje kolačićima</h2>
        <p>
          Kolačiće i lokalno skladištenje možete obrisati ili blokirati u
          podešavanjima svog pregledača. Imajte u vidu da blokiranje tehnički
          neophodnog skladištenja može uticati na rad aplikacije (na primer,
          poruka o kolačićima bi se ponovo prikazivala).
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">5. Treće strane</h2>
        <p>
          Mapa se učitava sa servisa trećih strana koji obezbeđuju podloge
          mape (OpenStreetMap preko MapLibre). Ovi servisi mogu obrađivati
          tehnički neophodne podatke za prikaz mape. Sami ne postavljamo
          kolačiće tih servisa.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">6. Kontakt</h2>
        <p>
          Za pitanja u vezi sa kolačićima obratite nam se preko forme za
          prijavu problema projekta StudentNS na GitHub-u.
        </p>
      </section>
    </LegalShell>
  );
}