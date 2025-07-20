import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white flex flex-col items-center">
      {/* Hero */}
      <section className="w-full max-w-4xl px-4 py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
          DriftPro – Fremtidens digitale driftssystem
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-8">
          Alt du trenger for effektiv drift, avvikshåndtering, dokumentasjon, rapportering og kommunikasjon – samlet i én moderne plattform.
        </p>
        <Link href="https://admin.driftpro.no" className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 font-bold text-lg shadow-lg hover:scale-105 transition">
          Logg inn på admin
        </Link>
      </section>

      {/* Funksjoner */}
      <section className="w-full max-w-5xl px-4 py-12 grid md:grid-cols-2 gap-8">
        <FeatureCard title="Web-basert adminpanel" desc="Full oversikt og kontroll fra hvor som helst."/>
        <FeatureCard title="Stemple-system" desc="Enkelt og sikkert stempling for ansatte."/>
        <FeatureCard title="Avvikssystem" desc="Rapporter, følg opp og lukk avvik lynraskt."/>
        <FeatureCard title="Chat & varslinger" desc="Sikker intern chat og push-varsler."/>
        <FeatureCard title="Dokumenthåndtering" desc="Last opp, signer og del dokumenter trygt."/>
        <FeatureCard title="Rapporter & statistikk" desc="Automatiske rapporter og innsikt i sanntid."/>
        <FeatureCard title="Skiftplan & bemanning" desc="Planlegg skift og bemanning digitalt."/>
        <FeatureCard title="Bruker- og rettighetsstyring" desc="Full kontroll på tilgang og roller."/>
      </section>

      {/* Kontakt */}
      <section className="w-full max-w-xl px-4 py-16 flex flex-col items-center bg-gray-900/70 rounded-xl shadow-xl mt-8">
        <h2 className="text-2xl font-bold mb-4">Kontakt oss</h2>
        <form className="w-full flex flex-col gap-4" action="mailto:hazhera@outlook.com" method="POST" encType="text/plain">
          <input className="p-3 rounded bg-gray-800 text-white" name="Navn" placeholder="Navn" required />
          <input className="p-3 rounded bg-gray-800 text-white" name="E-post" type="email" placeholder="E-post" required />
          <input className="p-3 rounded bg-gray-800 text-white" name="Telefon" placeholder="Telefon" />
          <textarea className="p-3 rounded bg-gray-800 text-white" name="Melding" placeholder="Melding" rows={4} required />
          <button type="submit" className="mt-2 px-6 py-3 rounded bg-gradient-to-r from-blue-500 to-purple-600 font-bold hover:scale-105 transition">Send</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="w-full text-center text-gray-400 py-8 text-sm mt-12">
        &copy; {new Date().getFullYear()} DriftPro. Alle rettigheter reservert.
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 flex flex-col items-start hover:scale-105 transition">
      <h3 className="text-xl font-semibold mb-2 text-blue-400">{title}</h3>
      <p className="text-gray-300">{desc}</p>
    </div>
  );
} 