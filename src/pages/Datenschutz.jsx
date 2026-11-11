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

        <Section title="4. Hosting — GitHub Pages">
          <p>
            Diese Website wird über GitHub Pages bereitgestellt, einen Dienst der GitHub, Inc.,
            88 Colin P. Kelly Jr. St., San Francisco, CA 94107, USA („GitHub"). Beim Aufruf der
            Website verarbeitet GitHub technisch notwendige Daten, die Ihr Browser übermittelt,
            insbesondere die IP-Adresse des zugreifenden Geräts, Datum und Uhrzeit des Zugriffs,
            die abgerufene Seite sowie Browser- und Geräteinformationen. Ich selbst habe keinen
            Zugriff auf diese Daten und führe keine eigene Auswertung durch.
          </p>
          <p>
            Die Verarbeitung dient der Auslieferung der Website, ihrer Stabilität und der Abwehr
            von Angriffen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
            an einem sicheren und funktionsfähigen Webauftritt).
          </p>
          <p>
            GitHub verarbeitet Daten auch in den USA. GitHub ist nach dem EU-U.S. Data Privacy
            Framework zertifiziert; die Zertifizierung kann unter{" "}
            <a href="https://www.dataprivacyframework.gov/list" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              dataprivacyframework.gov
            </a>{" "}
            eingesehen werden. Weitere Informationen:{" "}
            <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              GitHub-Datenschutzerklärung
            </a>.
          </p>
          <p>
            Auf dieser Website werden keine Analyse- oder Statistikdienste eingesetzt. Das gilt
            auch für das Musterdepot-Dashboard unter /musterdepot/: Es ist eine statische Seite,
            lädt keine Inhalte von Dritten und speichert keine Daten im Browser.
          </p>
        </Section>

        <Section title="5. Schriftarten">
          <p>
            Diese Website nutzt lokal gehostete Schriftarten (DM Sans, Space Mono, DM Mono).
            Die Schriftdateien werden direkt von diesem Server ausgeliefert. Es findet keine
            Verbindung zu externen Servern (wie z.{"\u00A0"}B. Google) statt, und es werden keine
            Daten an Dritte übermittelt.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            Diese Website verwendet derzeit keine Cookies und setzt keine Tracking-Technologien
            ein, die eine Einwilligung nach § 25 TDDDG erfordern. Sollte sich dies in Zukunft
            ändern, wird diese Datenschutzerklärung entsprechend aktualisiert.
          </p>
        </Section>

        <Section title="7. Ihre Rechte">
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

        <Section title="8. Änderungen dieser Datenschutzerklärung">
          <p>
            Diese Datenschutzerklärung wird bei Bedarf aktualisiert, um sie an geänderte Rechtslage
            oder Änderungen der Datenverarbeitung anzupassen. Die jeweils aktuelle Fassung ist stets
            auf dieser Seite abrufbar.
          </p>
          <p style={{ color: "#999", fontSize: 12, marginTop: 8, fontFamily: "'Space Mono', monospace" }}>
            Stand: November 2026
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
