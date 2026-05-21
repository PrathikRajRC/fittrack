import { useState } from "react";
import { LegalShell } from "./PrivacyPage.jsx";

export default function ContactPage({ onNavigate }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "General", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Opens mailto as a fallback — production would use a form backend
    const body = encodeURIComponent(`Name: ${form.name}\n\n${form.message}`);
    window.open(`mailto:support@runlytics.app?subject=${encodeURIComponent(`[Runlytics] ${form.subject}`)}&body=${body}`);
    setSent(true);
  };

  return (
    <LegalShell title="Contact Us" onNavigate={onNavigate}>

      <section className="legal-section">
        <p>
          Have a question, found a bug, or want to share feedback? We'd love to hear from you.
          Reach out directly at{" "}
          <a href="mailto:support@runlytics.app">support@runlytics.app</a>{" "}
          or use the form below.
        </p>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }} className="contact-grid">
        {/* Contact info cards */}
        <div>
          {[
            {
              icon: "✉️",
              title: "General Support",
              desc: "Questions about features, account issues, or getting started.",
              email: "support@runlytics.app",
              subject: "General",
            },
            {
              icon: "🐛",
              title: "Bug Reports",
              desc: "Found something broken? Let us know and we'll fix it.",
              email: "support@runlytics.app",
              subject: "Bug Report",
            },
            {
              icon: "💡",
              title: "Feature Requests",
              desc: "Have an idea to make Runlytics better? We're all ears.",
              email: "support@runlytics.app",
              subject: "Feature Request",
            },
            {
              icon: "🔒",
              title: "Privacy & Data",
              desc: "Data deletion requests, privacy questions, or GDPR enquiries.",
              email: "support@runlytics.app",
              subject: "Privacy / Data Request",
            },
          ].map((c) => (
            <div key={c.title} className="contact-card">
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6, lineHeight: 1.5 }}>{c.desc}</div>
                <a
                  href={`mailto:${c.email}?subject=${encodeURIComponent(`[Runlytics] ${c.subject}`)}`}
                  style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}
                >
                  {c.email}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div>
          {sent ? (
            <div className="contact-sent">
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Thanks for reaching out!</div>
              <div style={{ fontSize: 14, color: "var(--text2)" }}>
                Your email client should have opened. If not, email us directly at{" "}
                <a href="mailto:support@runlytics.app">support@runlytics.app</a>.
              </div>
              <button className="btn-secondary" style={{ marginTop: 20 }} onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-field">
                <label>Name</label>
                <input
                  type="text" required placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="contact-field">
                <label>Email</label>
                <input
                  type="email" required placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="contact-field">
                <label>Subject</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option>General</option>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Privacy / Data Request</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="contact-field">
                <label>Message</label>
                <textarea
                  required rows={5} placeholder="Describe your question or issue..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="legal-section">
        <h2>Response Time</h2>
        <p>
          We aim to respond to all enquiries within 48 hours. For data deletion requests, we will
          confirm deletion within 30 days as required by applicable privacy regulations.
        </p>
      </section>

    </LegalShell>
  );
}
