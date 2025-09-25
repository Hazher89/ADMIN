export class EmailTemplates {
  static getNewCompanyNotificationTemplate(adminEmail: string, companyName: string, adminName: string) {
    return {
      subject: `🏢 Ny bedrift registrert: ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2rem;">🏢 DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Ny bedrift registrert</p>
          </div>
          
          <div style="background-color: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Ny bedrift registrert i systemet</h2>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">📋 Bedriftsdetaljer:</h3>
              <ul style="color: #0c4a6e; margin: 0; padding-left: 1.5rem;">
                <li><strong>Bedriftsnavn:</strong> ${companyName}</li>
                <li><strong>Administrator:</strong> ${adminName}</li>
                <li><strong>E-post:</strong> ${adminEmail}</li>
                <li><strong>Registrert:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
              </ul>
            </div>
            
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #15803d; margin-top: 0;">✅ Neste steg:</h3>
              <ul style="color: #15803d; margin: 0; padding-left: 1.5rem;">
                <li>Administrator må sette opp passord</li>
                <li>Konfigurer bedriftsspesifikke innstillinger</li>
                <li>Legg til ansatte og avdelinger</li>
                <li>Opprett HMS-prosedyrer</li>
              </ul>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                Dette er en automatisk varsel fra DriftPro-systemet.<br>
                Med vennlig hilsen,<br>
                <strong>DriftPro Team</strong><br>
                driftpro@mavilogistikk.no
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  static getVacationRequestTemplate(adminEmail: string, employeeName: string, startDate: string, endDate: string, days: number) {
    return {
      subject: `🏖️ Feriesøknad fra ${employeeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 2rem; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2rem;">🏖️ DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Feriesøknad mottatt</p>
          </div>
          
          <div style="background-color: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Feriesøknad krever godkjenning</h2>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #92400e; margin-top: 0;">📅 Feriedetaljer:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 1.5rem;">
                <li><strong>Ansatt:</strong> ${employeeName}</li>
                <li><strong>Fra:</strong> ${startDate}</li>
                <li><strong>Til:</strong> ${endDate}</li>
                <li><strong>Antall dager:</strong> ${days} dager</li>
                <li><strong>Søknadsdato:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
              </ul>
            </div>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">⚡ Handling påkrevd:</h3>
              <p style="color: #0c4a6e; margin: 0;">
                Logg inn på DriftPro for å godkjenne eller avslå denne feriesøknaden.
              </p>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                Dette er en automatisk varsel fra DriftPro-systemet.<br>
                Med vennlig hilsen,<br>
                <strong>DriftPro Team</strong><br>
                driftpro@mavilogistikk.no
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  static getDeviationReportTemplate(adminEmail: string, reporterName: string, deviationTitle: string, description: string, severity: string) {
    return {
      subject: `⚠️ HMS-avvik rapportert: ${deviationTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 2rem; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2rem;">⚠️ DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">HMS-avvik rapportert</p>
          </div>
          
          <div style="background-color: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">HMS-avvik krever umiddelbar oppmerksomhet</h2>
            
            <div style="background-color: #fef2f2; border: 1px solid #dc2626; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #991b1b; margin-top: 0;">🚨 Avviksdetaljer:</h3>
              <ul style="color: #991b1b; margin: 0; padding-left: 1.5rem;">
                <li><strong>Tittel:</strong> ${deviationTitle}</li>
                <li><strong>Beskrivelse:</strong> ${description}</li>
                <li><strong>Alvorlighetsgrad:</strong> ${severity}</li>
                <li><strong>Rapportert av:</strong> ${reporterName}</li>
                <li><strong>Rapportert:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #92400e; margin-top: 0;">⚡ Umiddelbar handling påkrevd:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 1.5rem;">
                <li>Vurder alvorlighetsgraden</li>
                <li>Implementer umiddelbare sikkerhetstiltak</li>
                <li>Opprett korrigerende tiltak</li>
                <li>Dokumenter håndteringsprosessen</li>
              </ul>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                Dette er en automatisk varsel fra DriftPro-systemet.<br>
                Med vennlig hilsen,<br>
                <strong>DriftPro Team</strong><br>
                driftpro@mavilogistikk.no
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  static getPartnerAssignmentTemplate(partnerEmail: string, partnerName: string, routeName: string, assignmentDate: string) {
    return {
      subject: `🚛 Ny rute tildelt: ${routeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 2rem; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2rem;">🚛 DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Ny rute tildelt</p>
          </div>
          
          <div style="background-color: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Ny rute tildelt til samarbeidspartner</h2>
            
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #15803d; margin-top: 0;">📋 Rutedetaljer:</h3>
              <ul style="color: #15803d; margin: 0; padding-left: 1.5rem;">
                <li><strong>Samarbeidspartner:</strong> ${partnerName}</li>
                <li><strong>Rute:</strong> ${routeName}</li>
                <li><strong>Tildelt:</strong> ${assignmentDate}</li>
                <li><strong>Tildelingsdato:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
              </ul>
            </div>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">📝 Neste steg:</h3>
              <ul style="color: #0c4a6e; margin: 0; padding-left: 1.5rem;">
                <li>Logg inn på DriftPro for å se rutdetaljer</li>
                <li>Bekreft mottak av rute</li>
                <li>Oppdater status og fremdrift</li>
                <li>Rapporter eventuelle problemer</li>
              </ul>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                Dette er en automatisk varsel fra DriftPro-systemet.<br>
                Med vennlig hilsen,<br>
                <strong>DriftPro Team</strong><br>
                driftpro@mavilogistikk.no
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  static getNewUserTemplate(userEmail: string, userName: string, companyName: string, role: string) {
    return {
      subject: `👤 Ny bruker opprettet: ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 2rem; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2rem;">👤 DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Ny bruker opprettet</p>
          </div>
          
          <div style="background-color: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Ny bruker har blitt opprettet i systemet</h2>
            
            <div style="background-color: #faf5ff; border: 1px solid #a855f7; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #7c2d12; margin-top: 0;">👤 Brukerdetaljer:</h3>
              <ul style="color: #7c2d12; margin: 0; padding-left: 1.5rem;">
                <li><strong>Navn:</strong> ${userName}</li>
                <li><strong>E-post:</strong> ${userEmail}</li>
                <li><strong>Bedrift:</strong> ${companyName}</li>
                <li><strong>Rolle:</strong> ${role}</li>
                <li><strong>Opprettet:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
              </ul>
            </div>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">📝 Neste steg:</h3>
              <ul style="color: #0c4a6e; margin: 0; padding-left: 1.5rem;">
                <li>Brukeren må sette opp passord</li>
                <li>Tilordne passende rettigheter</li>
                <li>Gi tilgang til relevante moduler</li>
                <li>Opprett brukerprofil og preferanser</li>
              </ul>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                Dette er en automatisk varsel fra DriftPro-systemet.<br>
                Med vennlig hilsen,<br>
                <strong>DriftPro Team</strong><br>
                driftpro@mavilogistikk.no
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  static getAuditNotificationTemplate(adminEmail: string, auditType: string, findings: string, severity: string) {
    return {
      subject: `🔍 Audit-rapport: ${auditType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 2rem; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2rem;">🔍 DriftPro</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Audit-rapport generert</p>
          </div>
          
          <div style="background-color: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Audit-rapport krever gjennomgang</h2>
            
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #1e40af; margin-top: 0;">📊 Audit-detaljer:</h3>
              <ul style="color: #1e40af; margin: 0; padding-left: 1.5rem;">
                <li><strong>Audit-type:</strong> ${auditType}</li>
                <li><strong>Funn:</strong> ${findings}</li>
                <li><strong>Alvorlighetsgrad:</strong> ${severity}</li>
                <li><strong>Generert:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <h3 style="color: #92400e; margin-top: 0;">📋 Anbefalte tiltak:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 1.5rem;">
                <li>Gjennomgå audit-funnene</li>
                <li>Implementer korrigerende tiltak</li>
                <li>Oppdater prosedyrer og retningslinjer</li>
                <li>Planlegg oppfølgingsaudit</li>
              </ul>
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                Dette er en automatisk varsel fra DriftPro-systemet.<br>
                Med vennlig hilsen,<br>
                <strong>DriftPro Team</strong><br>
                driftpro@mavilogistikk.no
              </p>
            </div>
          </div>
        </div>
      `
    };
  }
}
