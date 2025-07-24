import React from "react";

export default function HelpPage() {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-4">Hjelp & FAQ</h1>
      <div className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold text-accent">Hvordan navigerer jeg i adminpanelet?</h2>
        <p className="text-muted">Bruk sidebaren til venstre for å gå til Dashboard, Brukere, Avvik, Skiftplan, Dokumenter, Rapporter og Innstillinger. Hold musepekeren over ikonene for å se hva de betyr.</p>
      </div>
      <div className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold text-accent">Hvordan oppretter jeg nye brukere, avvik, dokumenter eller skift?</h2>
        <p className="text-muted">Trykk på "Ny bruker", "Nytt avvik", "Nytt dokument" eller "Nytt skift"-knappen øverst på hver side. Fyll ut skjemaet og trykk "Opprett".</p>
      </div>
      <div className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold text-accent">Hvordan eksporterer jeg data?</h2>
        <p className="text-muted">Bruk "Eksporter CSV"-knappen på hver side for å laste ned filtrerte data som CSV-fil. Du kan åpne CSV-filer i Excel eller Google Sheets.</p>
      </div>
      <div className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold text-accent">Hvordan ser jeg rapporter og nøkkeltall?</h2>
        <p className="text-muted">Gå til "Rapporter" i sidebaren for å se nøkkeltall, grafer og utvikling over tid for brukere, avvik, dokumenter og skift.</p>
      </div>
      <div className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold text-accent">Hvordan får jeg hjelp eller support?</h2>
        <p className="text-muted">Kontakt support på <a href="mailto:support@driftpro.no" className="text-primary underline">support@driftpro.no</a> eller bruk hjelpesiden for vanlige spørsmål. Du kan også kontakte din systemadministrator.</p>
      </div>
    </div>
  );
} 