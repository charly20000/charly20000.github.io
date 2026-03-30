export default function Impressum() {
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
          Impressum
        </h1>

        <Section title="Angaben gemäß § 5 DDG">
          <p>
            Christoph Zapp<br />
            Sorauer Str. 15<br />
            10997 Berlin
          </p>
        </Section>

        <Section title="Kontakt">
          <p>
            E-Mail: chs.zapp@posteo.de<br />
            Kontaktformular: <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ''; setTimeout(() => { document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} style={linkStyle}>zum Kontaktformular</a>
          </p>
        </Section>

        <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <p>
            Christoph Zapp<br />
            Sorauer Str. 15<br />
            10997 Berlin
          </p>
        </Section>

        <Section title="EU-Streitschlichtung">
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p>
            Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Section>

        <Section title="Haftung für Inhalte">
          <p>
            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG bin ich als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
            allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden von entsprechenden Rechtsverletzungen werde ich diese Inhalte umgehend
            entfernen.
          </p>
        </Section>

        <Section title="Haftung für Links">
          <p>
            Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen
            Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
            verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
            Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung
            nicht erkennbar.
          </p>
          <p>
            Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
            Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
            Rechtsverletzungen werde ich derartige Links umgehend entfernen.
          </p>
        </Section>

        <Section title="Urheberrecht">
          <p>
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
            nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          </p>
          <p>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
            Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
            gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
            bitte ich um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
            werde ich derartige Inhalte umgehend entfernen.
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
