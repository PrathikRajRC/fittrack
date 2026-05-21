import { LegalShell } from "./PrivacyPage.jsx";

export default function TermsPage({ onNavigate }) {
  return (
    <LegalShell title="Terms of Service" onNavigate={onNavigate}>

      <section className="legal-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Runlytics ("Service"), you agree to be bound by these Terms of Service
          ("Terms"). If you do not agree to these Terms, do not use the Service.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and Runlytics. We reserve
          the right to modify these Terms at any time. Continued use of the Service after changes
          constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Description of Service</h2>
        <p>
          Runlytics is a personal fitness analytics web application that connects to your Strava account
          via OAuth to provide performance dashboards, training intelligence, AI coaching, and route
          visualization. The Service is provided "as is" for personal, non-commercial use.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Eligibility</h2>
        <p>
          You must be at least 13 years of age to use Runlytics. By using the Service, you represent
          that you meet this requirement. You must also have a valid Strava account and agree to
          Strava's Terms of Service to use Runlytics.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Permitted Use</h2>
        <p>You may use Runlytics for personal, non-commercial purposes. You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
          <li>Attempt to reverse-engineer, decompile, or extract source code from the Service</li>
          <li>Use automated tools (bots, scrapers) to access or extract data from the Service</li>
          <li>Impersonate other users or provide false information</li>
          <li>Interfere with or disrupt the Service or its servers</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Use the Service to infringe any intellectual property rights</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>5. Strava API and Third-Party Dependency</h2>
        <p>
          Runlytics relies on the Strava API to function. By using Runlytics, you acknowledge that:
        </p>
        <ul>
          <li>Runlytics is an independent application and is not affiliated with, endorsed by, or sponsored by Strava</li>
          <li>Strava may change, restrict, or discontinue their API at any time, which may affect or terminate Runlytics functionality</li>
          <li>Your use of Strava through Runlytics is also governed by <a href="https://www.strava.com/legal/terms" target="_blank" rel="noopener noreferrer">Strava's Terms of Service</a></li>
          <li>Runlytics requests read-only access and will never post to Strava on your behalf</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>6. Service Availability and Limitations</h2>
        <p>
          Runlytics is provided on a best-effort basis. We make no guarantees regarding:
        </p>
        <ul>
          <li><strong>Uptime</strong> — the Service may be unavailable at any time due to maintenance, outages, or Strava API limitations</li>
          <li><strong>Data accuracy</strong> — all analytics are derived from your Strava data and are for informational purposes only. Runlytics is not a medical device and its outputs (VO2 Max estimates, injury risk alerts, etc.) should not be used as medical advice</li>
          <li><strong>Continuity</strong> — we reserve the right to modify, suspend, or discontinue the Service at any time without notice</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>7. AI Coaching Disclaimer</h2>
        <p>
          The AI Fitness Coach feature uses Claude AI (Anthropic) to generate coaching responses based
          on your Strava activity data. These responses are for informational and motivational purposes
          only. They do not constitute professional athletic coaching, medical advice, or injury
          treatment guidance. Always consult a qualified professional for medical or training decisions.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. User Account and Access</h2>
        <p>
          Your Runlytics account is tied to your Strava account. You are responsible for:
        </p>
        <ul>
          <li>Maintaining the security of your Strava credentials</li>
          <li>All activity that occurs through your Runlytics session</li>
          <li>Notifying us of any unauthorized access</li>
        </ul>
        <p>
          We reserve the right to terminate access for users who violate these Terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. Intellectual Property</h2>
        <p>
          The Runlytics name, logo, design, and source code are proprietary. Your Strava data belongs
          to you and Strava as per Strava's policies. We claim no ownership over your personal data.
        </p>
        <p>
          By using the Service, you grant Runlytics a limited, non-exclusive license to process your
          Strava data solely for the purpose of providing the Service to you.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Runlytics and its operators shall not be liable for:
        </p>
        <ul>
          <li>Any indirect, incidental, or consequential damages arising from use of the Service</li>
          <li>Loss of data due to service outages, data corruption, or third-party failures</li>
          <li>Decisions made based on analytics or AI coaching outputs from Runlytics</li>
          <li>Inability to access the Service due to Strava API changes or downtime</li>
          <li>Any damages exceeding the amount you paid for the Service (which is zero, as Runlytics is free)</li>
        </ul>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties or liability limitations.
          In such cases, these exclusions apply to the maximum extent permitted by applicable law.
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Termination</h2>
        <p>
          You may terminate your use of Runlytics at any time by:
        </p>
        <ul>
          <li>Using the "Disconnect Strava" button in your Profile to end your session</li>
          <li>Using the "Delete My Data" button to permanently remove all your data from our systems</li>
          <li>Revoking Runlytics' access from your <a href="https://www.strava.com/settings/apps" target="_blank" rel="noopener noreferrer">Strava settings page</a></li>
        </ul>
        <p>
          We may terminate or suspend your access immediately if you violate these Terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with applicable laws. Any
          disputes arising from these Terms or use of the Service shall be resolved through good-faith
          negotiation before any legal proceedings.
        </p>
      </section>

      <section className="legal-section">
        <h2>13. Contact</h2>
        <p>
          For questions about these Terms, contact us at:<br />
          <a href="mailto:support@runlytics.app">support@runlytics.app</a>
        </p>
      </section>

    </LegalShell>
  );
}
