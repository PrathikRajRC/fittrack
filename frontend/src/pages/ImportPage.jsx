import { useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { parseStravaExportZip, buildImportAthlete } from "../utils/stravaExportParser.js";

const STRAVA_EXPORT_URL = "https://www.strava.com/athlete/delete_your_account";

const STEPS = [
  {
    num: 1,
    title: "Export your Strava data",
    desc: "Go to Strava → Settings → My Account → Download or Delete Your Account → Request Your Archive. Strava will email you a download link.",
  },
  {
    num: 2,
    title: "Download the ZIP",
    desc: "Once Strava emails you the link, download the ZIP file. It contains all your activities in a file called activities.csv.",
  },
  {
    num: 3,
    title: "Upload here",
    desc: "Drop the ZIP file below. Everything is processed in your browser — nothing is uploaded to any server.",
  },
];

function StepGuide() {
  return (
    <div className="import-steps">
      {STEPS.map((s) => (
        <div key={s.num} className="import-step">
          <div className="import-step-num">{s.num}</div>
          <div>
            <div className="import-step-title">{s.title}</div>
            <div className="import-step-desc">{s.desc}</div>
          </div>
        </div>
      ))}
      <a
        href={STRAVA_EXPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary import-strava-link"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/><path d="M11.691 0L8.616 6.021H3.27l8.421 16.629 2.09-4.121-5.353-10.574h3.065L15.387 0z" opacity=".6"/></svg>
        Open Strava Data Export Page
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  );
}

function DropZone({ onFile, isDragOver, setIsDragOver }) {
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile, setIsDragOver]
  );

  return (
    <div
      className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div className="drop-zone-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div className="drop-zone-title">Drop your Strava ZIP here</div>
      <div className="drop-zone-sub">or click to browse your files</div>
      <div className="drop-zone-hint">Accepts the ZIP file exported from Strava</div>
    </div>
  );
}

function ProcessingState({ message }) {
  return (
    <div className="import-processing">
      <div className="import-processing-spinner">
        <div className="spinner" />
      </div>
      <div className="import-processing-title">Parsing your activities…</div>
      <div className="import-processing-msg">{message}</div>
      <div className="import-processing-note">
        Processing happens in your browser. Nothing is uploaded.
      </div>
    </div>
  );
}

function SuccessState({ count, onDashboard }) {
  return (
    <div className="import-success fade-up">
      <div className="import-success-icon">🎉</div>
      <h2 className="import-success-title">Import complete!</h2>
      <p className="import-success-desc">
        Successfully imported <strong>{count} activities</strong> from your Strava archive.
        All analytics, AI coaching, and performance insights are now available.
      </p>
      <button className="btn-primary import-success-btn" onClick={onDashboard}>
        Go to Dashboard
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
      <div className="import-success-note">
        Your data is stored locally in your browser. Clearing site data or using a different browser will require re-importing.
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="import-error fade-up">
      <div className="import-error-icon">⚠️</div>
      <div className="import-error-title">Import failed</div>
      <div className="import-error-msg">{message}</div>
      <button className="btn-secondary" onClick={onRetry} style={{ marginTop: 16 }}>
        Try Again
      </button>
    </div>
  );
}

export default function ImportPage({ onNavigate }) {
  const { setImportData } = useAuth();
  const [stage, setStage]           = useState("upload"); // upload | processing | success | error
  const [isDragOver, setIsDragOver] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [importCount, setImportCount] = useState(0);
  const [errorMsg, setErrorMsg]       = useState("");

  const goHome = (e) => { e?.preventDefault(); onNavigate?.("home"); };

  const handleFile = useCallback(async (file) => {
    if (!file.name.endsWith(".zip")) {
      setErrorMsg("Please upload a ZIP file (the one exported from Strava).");
      setStage("error");
      return;
    }

    setStage("processing");
    setProgressMsg("Reading ZIP file…");

    try {
      const activities = await parseStravaExportZip(file, setProgressMsg);
      const athlete    = buildImportAthlete(activities);

      setImportData(athlete, activities);
      setImportCount(activities.length);
      setStage("success");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStage("error");
    }
  }, [setImportData]);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <a href="/" onClick={goHome} style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="Runlytics" className="landing-nav-logo" />
        </a>
        <div className="landing-nav-links">
          <button className="landing-nav-link btn-ghost" onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer" }}>
            ← Back
          </button>
        </div>
      </nav>

      <div className="import-page">
        <div className="import-hero fade-up">
          <div className="import-hero-badge">Local Import</div>
          <h1 className="import-hero-title">Import Strava Export</h1>
          <p className="import-hero-sub">
            Get all of Runlytics' analytics using your exported Strava data.
            Everything is processed in your browser — no data leaves your device.
          </p>
        </div>

        <div className="import-body">
          {stage === "upload" && (
            <>
              <StepGuide />
              <div className="import-upload-section">
                <div className="import-upload-label">
                  <span>Upload your ZIP file</span>
                  <span className="import-privacy-note">🔒 Processed locally, never uploaded</span>
                </div>
                <DropZone onFile={handleFile} isDragOver={isDragOver} setIsDragOver={setIsDragOver} />
              </div>
            </>
          )}

          {stage === "processing" && <ProcessingState message={progressMsg} />}

          {stage === "success" && (
            <SuccessState
              count={importCount}
              onDashboard={() => onNavigate?.("dashboard")}
            />
          )}

          {stage === "error" && (
            <ErrorState
              message={errorMsg}
              onRetry={() => { setStage("upload"); setErrorMsg(""); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
