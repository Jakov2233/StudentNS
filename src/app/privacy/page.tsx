import LegalShell from "@/components/LegalShell";

export const metadata = {
  title: "Politika privatnosti | StudentNS",
  description: "Politika privatnosti aplikacije StudentNS.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Politika privatnosti" updated="06.09.2026.">
      <section>
        <h2 className="mb-2 text-lg font-semibold">1. Ko smo mi</h2>
        <p>
          StudentNS je studentski projekat, web aplikacija koja na mapi
          Novog Sada prikazuje lokacije korisne studentima. Projekat trenutno
          nema pravno lice i ne prikuplja podatke za komercijalne svrhe.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          2. Koje podatke prikupljamo
        </h2>
        <p>
          Prikupljamo samo podatke koji su neophodni za rad aplikacije:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong>Podaci koje dobrovoljno unesete</strong> prilikom dodavanja
            mesta na mapu (naziv, opis, adresa, lokacija, kategorija i
            informacije o mestu).
          </li>
          <li>
            <strong>Podatke o svojoj saglasnosti za kolačiće</strong>, koji se
            čuvaju isključivo u vašem pregledaču (localStorage) i ne šalju se
            na naše servere.
          </li>
        </ul>
        <p>
          Ne prikupljamo lokaciju uređaja, istoriju pretrage, ponašanje na
          sajtu ni bilo koje druge marketinške ili analitičke podatke.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">3. Svrha obrade</h2>
        <p>
          Podaci koje unesete koriste se isključivo da bi aplikacija mogla da
          prikaže mesta drugim korisnicima na mapi. Svrha obrade je pružanje
          usluge koje ste zatražili.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">4. Čuvanje podataka</h2>
        <p>
          Podaci se čuvaju u bazi podataka koju hostuje Supabase
          (obrada u oblaku) i prikazuju preko platforme Vercel. Ovi provajderi
          su obavezani da štite podatke svojim bezbednosnim merama. Podatke
          čuvamo dok su potrebni za funkcionisanje aplikacije, odnosno dok
          korisnik ne zatraži brisanje.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">5. Deljenje podataka</h2>
        <p>
          Ne prodajemo i ne iznajmljujemo podatke trećim licima. Podatke
          delimo samo sa infrastrukturnim provajderima (Supabase, Vercel) koji
          su neophodni za hosting i skladištenje, i to samo u meri neophodnoj
          za pružanje usluge.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">6. Vaša prava</h2>
        <p>
          U skladu sa Zakonom o zaštiti podataka o ličnosti Republike Srbije
          imate pravo na pristup, ispravku, brisanje i ograničenje obrade
          vaših podataka. Zahtev možete poslati na adresu navedenu u odeljku 9.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">7. Bezbednost</h2>
        <p>
          Aplikacija koristi merama kao što su HTTPS, bezbednosni zaglavlja
          odgovora, ograničenja dužine unosa i sanitizacija korisničkog
          sadržaja da bi se smanjio rizik od napada. Međutim, nijedan sistem
          nije potpuno bezbedan; podatke unosite na sopstvenu odgovornost.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">8. Izmene politike</h2>
        <p>
          Ovu politiku možemo ažurirati kada to zahtevaju zakon ili promene u
          radu aplikacije. Izmenjena verzija važi od datuma koji stoji na
          vrhu stranice.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">9. Kontakt</h2>
        <p>
          Za sva pitanja u vezi sa privatnošću možete nas kontaktirati putem
          forme za prijavu problema projekta na GitHub-u, koristeći ime
          projekta StudentNS.
        </p>
      </section>
    </LegalShell>
  );
}