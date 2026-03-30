export default function Datenschutz() {
  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#ffffff",
      color: "#222",
      minHeight: "100vh",
    }}>

      {/* NAV */}
      <nav style={{
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <a href="#" style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#111",
          textDecoration: "none",
          cursor: "pointer",
        }}>
          C<span style={{ color: "#008c46" }}>.</span>Z
        </a>
        <a href="#" style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#999",
          textDecoration: "none",
        }}>
          ← Zurück zur Seite
        </a>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 32px 120px" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          Rechtliches
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 48, lineHeight: 1.3 }}>
          Datenschutzerklärung
        </h1>

        <Section title="1. Verantwortlicher">
          <p>
            Christoph Zapp<br />
            Sorauer Str. 15<br />
            10997 Berlin<br />
            E-Mail: chs.zapp@posteo.de
          </p>
        </Section>

        <Section title="2. Übersicht der Datenverarbeitungen">
          <p>
            <strong>Arten der verarbeiteten Daten:</strong> Nutzungsdaten (z.{"\u00A0"}B. besuchte
            Seiten, Zugriffszeiten), Meta-/Kommunikationsdaten (z.{"\u00A0"}B. IP-Adressen,
            Geräte-Informationen).
          </p>
          <p>
            <strong>Kategorien betroffener Personen:</strong> Besucher und Nutzer der Website.
          </p>
        </Section>

        <Section title="3. Rechtsgrundlagen">
          <p>
            Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf folgenden Rechtsgrundlagen:
          </p>
          <p>
            <strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Bereitstellung
            der Website, Gewährleistung der IT-Sicherheit, Performance-Optimierung.
          </p>
          <p>
            <strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Soweit Sie uns eine
            Einwilligung erteilt haben.
          </p>
        </Section>

        <Section title="4. Hosting — Vercel">
          <p>
            Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
            („Vercel") gehostet. Beim Aufruf dieser Website werden durch Vercel automatisch
            Informationen in Server-Logfiles erfasst, die Ihr Browser übermittelt. Hierzu gehören
            insbesondere: IP-Adresse des zugreifenden Geräts, Datum und Uhrzeit des Zugriffs, Name
            und URL der abgerufenen Seite, übertragene Datenmenge, Browser-Typ und -Version,
            Betriebssystem sowie Referrer-URL.
          </p>
          <p>
            Diese Daten werden zur Sicherstellung eines störungsfreien Betriebs der Website und zur
            Erkennung und Abwehr von Angriffen erhoben. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
            DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen Webauftritt).
          </p>
          <p>
            Vercel verarbeitet Daten auch in den USA. Vercel ist unter dem EU-U.S. Data Privacy
            Framework zertifiziert und verpflichtet sich zur Einhaltung eines angemessenen
            Datenschutzniveaus. Die Zertifizierung kann unter{" "}
            <a href="https://www.dataprivacyframework.gov/list" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              dataprivacyframework.gov
            </a>{" "}
            eingesehen werden. Zusätzlich wurden Standardvertragsklauseln gemäß Art. 46 Abs. 2
            lit. c DSGVO vereinbart. Weitere Informationen:{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Vercel Privacy Policy
            </a>,{" "}
            <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Vercel DPA
            </a>.
          </p>
        </Section>

        <Section title="5. Webanalyse — Vercel Analytics">
          <p>
            Diese Website nutzt Vercel Web Analytics, einen Dienst der Vercel Inc. Vercel Web
            Analytics sammelt und speichert nach eigenen Angaben ausschließlich aggregierte Daten,
            die keine Identifizierung oder Re-Identifizierung einzelner Nutzer ermöglichen. Es
            werden keine Cookies gesetzt und keine persönlichen Identifikatoren erfasst.
          </p>
          <p>
            Es werden lediglich Informationen wie Seitenaufrufe, Referrer und allgemeine
            Geräteinformationen aggregiert ausgewertet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
            DSGVO. Weitere Informationen:{" "}
            <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Vercel Analytics Privacy Policy
            </a>.
          </p>
        </Section>

        <Section title="6. Performance-Analyse — Vercel Speed Insights">
          <p>
            Zusätzlich wird Vercel Speed Insights eingesetzt, ein Dienst der Vercel Inc. zur
            Messung und Verbesserung der Ladegeschwindigkeit. Dabei werden Web-Vitals-Metriken
            (z.{"\u00A0"}B. Largest Contentful Paint, First Input Delay, Cumulative Layout Shift)
            erhoben. Die Daten werden aggregiert verarbeitet und nicht mit anderen
            personenbezogenen Daten zusammengeführt.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Weitere Informationen:{" "}
            <a href="https://vercel.com/docs/speed-insights/privacy-policy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Vercel Speed Insights Privacy &amp; Compliance
            </a>.
          </p>
        </Section>

        <Section title="7. Schriftarten">
          <p>
            Diese Website nutzt lokal gehostete Schriftarten (DM Sans, Space Mono, DM Mono).
            Die Schriftdateien werden direkt von diesem Server ausgeliefert. Es findet keine
            Verbindung zu externen Servern (wie z.{"\u00A0"}B. Google) statt, und es werden keine
            Daten an Dritte übermittelt.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Diese Website verwendet derzeit keine Cookies und setzt keine Tracking-Technologien
            ein, die eine Einwilligung nach § 25 TDDDG erfordern. Sollte sich dies in Zukunft
            ändern, wird diese Datenschutzerklärung entsprechend aktualisiert.
          </p>
        </Section>

        <Section title="9. Ihre Rechte">
          <p>Ihnen stehen folgende Rechte gemäß DSGVO zu:</p>
          <p>
            <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie haben das Recht, Auskunft über
            Ihre bei mir gespeicherten personenbezogenen Daten zu erhalten.
          </p>
          <p>
            <strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie haben das Recht, unrichtige
            Daten berichtigen zu lassen.
          </p>
          <p>
            <strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie haben das Recht, die Löschung
            Ihrer Daten zu verlangen, sofern keine gesetzlichen Aufbewahrungspflichten
            entgegenstehen.
          </p>
          <p>
            <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie haben das Recht,
            die Einschränkung der Verarbeitung Ihrer Daten zu verlangen.
          </p>
          <p>
            <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie haben das Recht, Ihre
            Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
          </p>
          <p>
            <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie haben das Recht, der
            Verarbeitung Ihrer personenbezogenen Daten, die auf Art. 6 Abs. 1 lit. f DSGVO
            basiert, jederzeit zu widersprechen.
          </p>
          <p>
            <strong>Widerrufsrecht (Art. 7 Abs. 3 DSGVO):</strong> Erteilte Einwilligungen können
            Sie jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>
          <p>
            <strong>Beschwerderecht (Art. 77 DSGVO):</strong> Sie haben das Recht, sich bei einer
            Datenschutzaufsichtsbehörde zu beschweren. Zuständig ist die Berliner Beauftragte für
            Datenschutz und Informationsfreiheit, Friedrichstr. 219, 10969 Berlin —{" "}
            <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              www.datenschutz-berlin.de
            </a>.
          </p>
        </Section>

        <Section title="10. Änderungen dieser Datenschutzerklärung">
          <p>
            Diese Datenschutzerklärung wird bei Bedarf aktualisiert, um sie an geänderte Rechtslage
            oder Änderungen der Datenverarbeitung anzupassen. Die jeweils aktuelle Fassung ist stets
            auf dieser Seite abrufbar.
          </p>
          <p style={{ color: "#999", fontSize: 12, marginTop: 8, fontFamily: "'Space Mono', monospace" }}>
            Stand: März 2026
          </p>
        </Section>
      </div>

      {/* FOOTER */}
      <Footer />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(0,140,70,0.15); }
      `}</style>
    </div>
  );
}

const linkStyle = {
  color: "#008c46",
  textDecoration: "none",
  borderBottom: "1px solid rgba(0,140,70,0.3)",
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.05em",
        color: "#111",
        marginBottom: 12,
        textTransform: "uppercase",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: "#555", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: "48px 32px",
      borderTop: "1px solid #f0f0f0",
      textAlign: "center",
    }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
        <a href="#impressum" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", textDecoration: "none", letterSpacing: "0.05em" }}>
          Impressum
        </a>
        <a href="#datenschutz" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", textDecoration: "none", letterSpacing: "0.05em" }}>
          Datenschutz
        </a>
      </div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        color: "#ccc",
        letterSpacing: "0.05em",
      }}>
        © 2026 Christoph Zapp — Berlin
      </div>
    </footer>
  );
}
