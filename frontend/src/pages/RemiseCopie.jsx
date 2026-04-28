import { useState, useEffect, useMemo } from "react";
import request from "../services/api";
import { useAuth } from "../contexts/AuthContext";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SESSIONS = [
  { value: "normale",    label: "Normale" },
  { value: "dette",      label: "Dette" },
  { value: "rattrapage", label: "Rattrapage" },
];

const STATUS_CONFIG = {
  non_remis: { label: "Non remis",  cls: "bg-danger/10 text-danger border-danger/20",     dot: "bg-danger" },
  remis:     { label: "Remis",      cls: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  en_retard: { label: "En retard",  cls: "bg-warning/10 text-warning border-warning/20",  dot: "bg-warning" },
};

// ─────────────────────────────────────────────────────────────
// PDF Generation
// ─────────────────────────────────────────────────────────────

function generatePDF(data) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/>
<title>P.V. Remise de Copies</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:30px 40px;font-size:13px;background:#fff}
  .header{text-align:center;padding-bottom:16px;margin-bottom:20px;border-bottom:2px solid #1a1a2e}
  .republic{font-size:11px;line-height:1.8;color:#444}
  .doc-title{font-size:20px;font-weight:700;margin-top:12px;letter-spacing:.5px}
  .doc-sub{font-size:12px;color:#555;margin-top:4px;text-transform:uppercase;letter-spacing:1px}
  .section{margin-bottom:16px}
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;background:#f5f5f5;padding:4px 8px;border-left:3px solid #1a1a2e;margin-bottom:10px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .field label{display:block;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#888;margin-bottom:3px}
  .field .val{border-bottom:1px solid #ccc;padding:4px 2px;font-size:13px;font-weight:600;min-height:24px}
  .field .val.empty{color:#ccc;font-style:italic;font-weight:400}
  .stats{display:flex;gap:16px;margin:8px 0}
  .stat{background:#f5f5f5;border-radius:6px;padding:8px 16px;text-align:center}
  .stat strong{display:block;font-size:22px;font-weight:700}
  .stat span{font-size:10px;color:#888;text-transform:uppercase}
  .obs{border:1px solid #ddd;padding:10px;min-height:60px;border-radius:4px;font-size:13px;line-height:1.6}
  .sigs{display:flex;justify-content:space-between;margin-top:30px}
  .sig{text-align:center;width:160px}
  .sig-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#888}
  .sig-line{border-top:1px solid #1a1a2e;margin-top:48px;padding-top:4px;font-size:10px;color:#aaa}
  .stamp{width:90px;height:90px;border:1.5px dashed #ccc;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto}
  .stamp span{font-size:9px;color:#ccc;text-align:center}
  hr{border:none;border-top:1px solid #eee;margin:14px 0}
  @media print{body{padding:16px 24px}@page{size:A4;margin:10mm}}
</style></head><body>
<div class="header">
  <div class="republic">
    République Algérienne Démocratique et Populaire<br/>
    Ministère de l'Enseignement Supérieur et de la Recherche Scientifique<br/>
    Université Ibn Khaldoun – Tiaret &nbsp;|&nbsp; Faculté des Mathématiques et de l'Informatique
  </div>
  <div class="doc-title">Procès-Verbal de Remise de Copies</div>
  <div class="doc-sub">Session ${data.sessionLabel || data.session || "—"} &nbsp;·&nbsp; Année Universitaire 2025/2026</div>
</div>

<div class="section">
  <div class="section-title">Informations de l'enseignant</div>
  <div class="grid">
    <div class="field"><label>Nom complet</label><div class="val ${!data.nomEnseignant ? 'empty' : ''}">${data.nomEnseignant || "—"}</div></div>
    <div class="field"><label>Grade</label><div class="val ${!data.grade ? 'empty' : ''}">${data.grade || "—"}</div></div>
    <div class="field"><label>Email</label><div class="val ${!data.email ? 'empty' : ''}">${data.email || "—"}</div></div>
    <div class="field"><label>Matricule</label><div class="val ${!data.matricule ? 'empty' : ''}">${data.matricule || "—"}</div></div>
  </div>
</div>
<hr/>
<div class="section">
  <div class="section-title">Module &amp; Promotion</div>
  <div class="grid">
    <div class="field"><label>Module</label><div class="val ${!data.nomModule ? 'empty' : ''}">${data.nomModule || "—"}</div></div>
    <div class="field"><label>Code module</label><div class="val ${!data.codeModule ? 'empty' : ''}">${data.codeModule || "—"}</div></div>
    <div class="field"><label>Promotion</label><div class="val ${!data.promotion ? 'empty' : ''}">${data.promotion || "—"}</div></div>
    <div class="field"><label>Lieu d'examen</label><div class="val ${!data.lieuExamen ? 'empty' : ''}">${data.lieuExamen || "—"}</div></div>
  </div>
</div>
<hr/>
<div class="section">
  <div class="section-title">Déroulement de l'épreuve</div>
  <div class="grid-3">
    <div class="field"><label>Date d'examen</label><div class="val">${data.dateExam ? new Date(data.dateExam).toLocaleDateString('fr-DZ') : "—"}</div></div>
    <div class="field"><label>Heure de début</label><div class="val">${data.heureDebut || "—"}</div></div>
    <div class="field"><label>Heure de fin</label><div class="val">${data.heureFin || "—"}</div></div>
  </div>
</div>
<hr/>
<div class="section">
  <div class="section-title">Statistiques</div>
  <div class="stats">
    <div class="stat"><strong>${data.nbInscrits || "—"}</strong><span>Inscrits</span></div>
    <div class="stat"><strong>${data.nbCopies || "—"}</strong><span>Copies remises</span></div>
    <div class="stat"><strong>${data.nbAbsents !== "" && data.nbAbsents != null ? data.nbAbsents : (data.nbInscrits && data.nbCopies ? Number(data.nbInscrits) - Number(data.nbCopies) : "—")}</strong><span>Absents</span></div>
    ${data.nbInscrits && data.nbCopies ? `<div class="stat"><strong>${Math.round(Number(data.nbCopies)/Number(data.nbInscrits)*100)}%</strong><span>Présence</span></div>` : ""}
  </div>
</div>
<hr/>
<div class="section">
  <div class="section-title">Observations</div>
  <div class="obs">${data.observations || "Aucune observation."}</div>
</div>
<div class="sigs">
  <div class="sig"><div class="sig-label">L'enseignant</div><div class="sig-line">Signature</div></div>
  <div class="sig"><div class="stamp"><span>Cachet<br/>Dépt.</span></div></div>
  <div class="sig"><div class="sig-label">Chef de Département</div><div class="sig-line">Signature &amp; Cachet</div></div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`);
  win.document.close();
}

// ─────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.non_remis;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = "rounded-xl border border-edge bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full transition";
const readonlyCls = "rounded-xl border border-edge bg-surface/60 px-3.5 py-2.5 text-sm text-ink-secondary w-full cursor-not-allowed";

// ─────────────────────────────────────────────────────────────
// TEACHER VIEW
// ─────────────────────────────────────────────────────────────

function TeacherView() {
  const { user } = useAuth();

  const [profile, setProfile]           = useState(null);
  const [enseignements, setEnseignements] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const [history, setHistory]           = useState([]);
  const [histLoading, setHistLoading]   = useState(true);

  const [form, setForm] = useState({
    enseignementId: "", session: "", dateExam: "",
    heureDebut: "", heureFin: "", lieuExamen: "",
    nbInscrits: "", nbCopies: "", nbAbsents: "",
    observations: "",
  });
  const [errors, setErrors]       = useState({});
  const [pdfReady, setPdfReady]   = useState(false);
  const [sending, setSending]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load teacher profile + enseignements in ONE call
  useEffect(() => {
    request("/api/v1/copies-remise/enseignements/my")
      .then((res) => {
        if (res?.data) {
          setProfile(res.data.enseignant);
          setEnseignements(res.data.enseignements || []);
        }
      })
      .catch((e) => console.error("Erreur profil:", e))
      .finally(() => setProfileLoading(false));
  }, []);

  // Load history
  useEffect(() => {
    request("/api/v1/copies-remise/my")
      .then((res) => setHistory(res?.data || []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, []);

  const selectedEnseignement = useMemo(
    () => enseignements.find((e) => String(e.id) === form.enseignementId),
    [form.enseignementId, enseignements]
  );

  const tauxPresence = form.nbInscrits && form.nbCopies
    ? Math.round((Number(form.nbCopies) / Number(form.nbInscrits)) * 100)
    : null;

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
    setPdfReady(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.enseignementId) errs.enseignementId = "Obligatoire";
    if (!form.session)         errs.session = "Obligatoire";
    if (!form.dateExam)        errs.dateExam = "Obligatoire";
    if (!form.nbCopies)        errs.nbCopies = "Obligatoire";
    if (form.nbCopies && form.nbInscrits && Number(form.nbCopies) > Number(form.nbInscrits))
      errs.nbCopies = "Ne peut pas dépasser le nombre d'inscrits";
    if (form.heureDebut && form.heureFin && form.heureFin <= form.heureDebut)
      errs.heureFin = "Doit être après l'heure de début";
    return errs;
  };

  const handleGeneratePDF = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const sessionLabel = SESSIONS.find((s) => s.value === form.session)?.label;
    generatePDF({
      ...form,
      sessionLabel,
      nomEnseignant: profile ? `${profile.user?.prenom ?? ""} ${profile.user?.nom ?? ""}`.trim() : "",
      grade:         profile?.grade?.libelle || "",
      email:         profile?.user?.email || "",
      matricule:     profile?.matricule || "",
      nomModule:     selectedEnseignement?.module?.nom || "",
      codeModule:    selectedEnseignement?.module?.code || "",
      promotion:     selectedEnseignement?.promo?.nom || "",
    });
    setPdfReady(true);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await request("/api/v1/copies-remise", {
        method: "POST",
        body: JSON.stringify({
          enseignementId: Number(form.enseignementId),
          session:        form.session,
          dateExam:       form.dateExam || null,
          dateRemise:     new Date().toISOString().split("T")[0],
          nbCopies:       Number(form.nbCopies),
          commentaire:    form.observations || null,
        }),
      });

      const res = await request("/api/v1/copies-remise/my");
      setHistory(res?.data || []);

      setForm({ enseignementId: "", session: "", dateExam: "", heureDebut: "", heureFin: "", lieuExamen: "", nbInscrits: "", nbCopies: "", nbAbsents: "", observations: "" });
      setErrors({});
      setPdfReady(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (e) {
      alert(`Erreur: ${e?.message || "Erreur serveur"}`);
    } finally {
      setSending(false);
    }
  };

  const teacherName = profile
    ? `${profile.user?.prenom ?? ""} ${profile.user?.nom ?? ""}`.trim()
    : user?.name || "";

  return (
    <div className="space-y-6 max-w-4xl min-w-0">

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative px-6 py-8 md:px-8 md:py-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Espace Enseignant</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Remise de Copies</h1>
            <p className="mt-2 text-sm text-ink-secondary max-w-xl leading-6">
              Remplissez le formulaire, générez le PDF puis envoyez-le à l'administrateur.
            </p>
          </div>
          <div className="shrink-0 hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-200">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card space-y-6">

        {/* Section 1 – Teacher info (read-only, auto-filled) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Informations de l'enseignant</h2>
            {!profileLoading && profile && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-success/10 border border-success/20 px-2.5 py-1 text-xs text-success font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Pré-rempli
              </span>
            )}
          </div>

          {profileLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i}><div className="h-3 w-24 rounded bg-gray-200 mb-2"/><div className="h-10 rounded-xl bg-gray-100"/></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet">
                <div className={readonlyCls}>{teacherName || "—"}</div>
              </Field>
              <Field label="Grade">
                <div className={readonlyCls}>{profile?.grade?.libelle || "—"}</div>
              </Field>
              <Field label="Email">
                <div className={readonlyCls}>{profile?.user?.email || "—"}</div>
              </Field>
              <Field label="Matricule">
                <div className={readonlyCls}>{profile?.matricule || "—"}</div>
              </Field>
            </div>
          )}
        </div>

        <div className="border-t border-edge" />

        {/* Section 2 – Exam info */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Module &amp; Session</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Module" required error={errors.enseignementId}>
              <select className={inputCls} value={form.enseignementId} onChange={set("enseignementId")} disabled={profileLoading}>
                <option value="">Choisir un module</option>
                {enseignements.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.module?.nom}{e.module?.code ? ` (${e.module.code})` : ""}{e.promo?.nom ? ` – ${e.promo.nom}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Promotion">
              <div className={readonlyCls}>{selectedEnseignement?.promo?.nom || "—"}</div>
            </Field>

            <Field label="Session" required error={errors.session}>
              <select className={inputCls} value={form.session} onChange={set("session")}>
                <option value="">Choisir la session</option>
                {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>

            <Field label="Lieu d'examen">
              <input className={inputCls} placeholder="Ex: Amphi A, Salle 12..." value={form.lieuExamen} onChange={set("lieuExamen")} />
            </Field>
          </div>
        </div>

        <div className="border-t border-edge" />

        {/* Section 3 – Exam timing */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Déroulement de l'épreuve</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date d'examen" required error={errors.dateExam}>
              <input type="date" className={inputCls} value={form.dateExam} onChange={set("dateExam")} />
            </Field>
            <Field label="Heure de début" error={errors.heureDebut}>
              <input type="time" className={inputCls} value={form.heureDebut} onChange={set("heureDebut")} />
            </Field>
            <Field label="Heure de fin" error={errors.heureFin}>
              <input type="time" className={inputCls} value={form.heureFin} onChange={set("heureFin")} />
            </Field>
          </div>
        </div>

        <div className="border-t border-edge" />

        {/* Section 4 – Statistics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">4</span>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Statistiques</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nb. inscrits">
              <input type="number" min="0" className={inputCls} placeholder="Ex: 45" value={form.nbInscrits} onChange={set("nbInscrits")} />
            </Field>
            <Field label="Nb. copies remises" required error={errors.nbCopies}>
              <input type="number" min="0" className={inputCls} placeholder="Ex: 38" value={form.nbCopies} onChange={set("nbCopies")} />
            </Field>
            <Field label="Nb. absents">
              <input type="number" min="0" className={inputCls} placeholder="Auto" value={form.nbAbsents} onChange={set("nbAbsents")} />
            </Field>
          </div>
          {tauxPresence !== null && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 border border-brand/20 px-3 py-1.5 text-xs font-medium text-brand">
                Taux de présence : <strong className="ml-1">{tauxPresence}%</strong>
              </span>
              {tauxPresence < 70 && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs font-medium text-danger">
                  ⚠ Taux faible
                </span>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-edge" />

        {/* Section 5 – Observations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">5</span>
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Observations</h2>
          </div>
          <textarea rows={3} className={`${inputCls} resize-none`}
            placeholder="Incidents, remarques sur le déroulement..."
            value={form.observations} onChange={set("observations")} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-edge">
          <p className="text-xs text-ink-tertiary">* Champs obligatoires</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setForm({ enseignementId: "", session: "", dateExam: "", heureDebut: "", heureFin: "", lieuExamen: "", nbInscrits: "", nbCopies: "", nbAbsents: "", observations: "" }); setErrors({}); setPdfReady(false); }}
              className="rounded-xl border border-edge bg-canvas px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface">
              Réinitialiser
            </button>

            {!pdfReady ? (
              <button type="button" onClick={handleGeneratePDF}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Générer PDF
              </button>
            ) : (
              <button type="button" onClick={handleSend} disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm disabled:opacity-60">
                {sending ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Envoi...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Envoyer à l'admin</>
                )}
              </button>
            )}
          </div>
        </div>

        {submitted && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            P.V. envoyé à l'administrateur avec succès.
          </div>
        )}
      </section>

      {/* History */}
      <section className="rounded-3xl border border-edge bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold text-ink mb-1">Historique des remises</h2>
        <p className="text-sm text-ink-secondary mb-4">Vos P.V. envoyés précédemment.</p>

        {histLoading ? (
          <div className="flex items-center gap-2 text-ink-secondary py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand"/>
            <span className="text-sm">Chargement...</span>
          </div>
        ) : history.length ? (
          <div className="overflow-x-auto rounded-2xl border border-edge">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-canvas">
                  {["Module", "Session", "Date examen", "Copies", "Statut", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={item.id} className={`border-b border-edge transition hover:bg-canvas ${i % 2 ? "bg-surface/40" : ""}`}>
                    <td className="px-4 py-3 font-medium text-ink">{item.enseignement?.module?.nom || "—"}</td>
                    <td className="px-4 py-3 text-ink-secondary">{SESSIONS.find((s) => s.value === item.session)?.label || item.session}</td>
                    <td className="px-4 py-3 text-ink-secondary">{item.dateExam ? new Date(item.dateExam).toLocaleDateString("fr-DZ") : "—"}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{item.nbCopies}</td>
                    <td className="px-4 py-3"><Badge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => generatePDF({ ...item, nomModule: item.enseignement?.module?.nom, codeModule: item.enseignement?.module?.code, promotion: item.enseignement?.promo?.nom, nomEnseignant: teacherName, grade: profile?.grade?.libelle, email: profile?.user?.email, matricule: profile?.matricule })}
                        className="rounded-lg border border-edge bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface">
                        Revoir PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-edge bg-canvas px-6 py-8 text-center">
            <p className="text-sm font-medium text-ink">Aucun P.V. envoyé pour le moment.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN VIEW  (completely different layout)
// ─────────────────────────────────────────────────────────────

function AdminView() {
  const [remises, setRemises]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [updating, setUpdating] = useState(null);

  const loadRemises = async () => {
    try {
      const res = await request("/api/v1/copies-remise/all");
      setRemises(res?.data || []);
    } catch (e) {
      console.error("Erreur:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRemises(); }, []);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await request(`/api/v1/copies-remise/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadRemises();
    } catch (e) {
      alert(`Erreur: ${e?.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce P.V. ?")) return;
    try {
      await request(`/api/v1/copies-remise/${id}`, { method: "DELETE" });
      await loadRemises();
    } catch (e) {
      alert(`Erreur: ${e?.message}`);
    }
  };

  const filtered = useMemo(() => {
    let list = remises;
    if (filterStatus)  list = list.filter((r) => r.status === filterStatus);
    if (filterSession) list = list.filter((r) => r.session === filterSession);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const teacher = `${r.enseignement?.enseignant?.user?.prenom ?? ""} ${r.enseignement?.enseignant?.user?.nom ?? ""}`.toLowerCase();
        const module  = (r.enseignement?.module?.nom ?? "").toLowerCase();
        return teacher.includes(q) || module.includes(q);
      });
    }
    return list;
  }, [remises, filterStatus, filterSession, search]);

  const stats = useMemo(() => ({
    total:     remises.length,
    non_remis: remises.filter((r) => r.status === "non_remis").length,
    remis:     remises.filter((r) => r.status === "remis").length,
    en_retard: remises.filter((r) => r.status === "en_retard").length,
  }), [remises]);

  return (
    <div className="space-y-6 max-w-7xl min-w-0">

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_30%)]" />
        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">Administration</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Gestion des P.V. de Remise</h1>
          <p className="mt-2 text-sm text-ink-secondary">Consultez, validez et gérez les procès-verbaux soumis par les enseignants.</p>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",      value: stats.total,     color: "text-ink",         bg: "bg-surface" },
          { label: "Non remis",  value: stats.non_remis, color: "text-danger",      bg: "bg-danger/10" },
          { label: "Remis",      value: stats.remis,     color: "text-success",     bg: "bg-success/10" },
          { label: "En retard",  value: stats.en_retard, color: "text-warning",     bg: "bg-warning/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-edge ${s.bg} p-4`}>
            <p className="text-xs text-ink-secondary">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <section className="rounded-3xl border border-edge bg-surface p-5 shadow-card">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">
            Tous les P.V.
            <span className="ml-2 text-sm font-normal text-ink-secondary">({filtered.length})</span>
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)}
              className="rounded-xl border border-edge bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand">
              <option value="">Toutes sessions</option>
              {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-edge bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand">
              <option value="">Tous statuts</option>
              <option value="non_remis">Non remis</option>
              <option value="remis">Remis</option>
              <option value="en_retard">En retard</option>
            </select>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher enseignant, module..."
              className="w-full sm:w-60 rounded-xl border border-edge bg-canvas px-3.5 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-ink-secondary py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand/30 border-t-brand"/>
            <span>Chargement...</span>
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto rounded-2xl border border-edge">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-canvas">
                  {["Enseignant", "Grade", "Module", "Promo", "Session", "Date exam", "Copies", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const teacher = item.enseignement?.enseignant;
                  const fullName = `${teacher?.user?.prenom ?? ""} ${teacher?.user?.nom ?? ""}`.trim();
                  return (
                    <tr key={item.id} className={`border-b border-edge transition hover:bg-canvas ${i % 2 ? "bg-surface/40" : ""}`}>
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{fullName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-ink-secondary">{teacher?.grade?.libelle || "—"}</td>
                      <td className="px-4 py-3 text-ink-secondary">{item.enseignement?.module?.nom || "—"}</td>
                      <td className="px-4 py-3 text-ink-secondary text-xs">{item.enseignement?.promo?.nom || "—"}</td>
                      <td className="px-4 py-3 text-ink-secondary">{SESSIONS.find((s) => s.value === item.session)?.label || item.session}</td>
                      <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">{item.dateExam ? new Date(item.dateExam).toLocaleDateString("fr-DZ") : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{item.nbCopies}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          disabled={updating === item.id}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border cursor-pointer ${STATUS_CONFIG[item.status]?.cls || ""}`}
                        >
                          <option value="non_remis">Non remis</option>
                          <option value="remis">Remis</option>
                          <option value="en_retard">En retard</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => generatePDF({ ...item, nomModule: item.enseignement?.module?.nom, codeModule: item.enseignement?.module?.code, promotion: item.enseignement?.promo?.nom, nomEnseignant: fullName, grade: teacher?.grade?.libelle, email: teacher?.user?.email, matricule: teacher?.matricule })}
                            className="rounded-lg border border-edge bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface whitespace-nowrap">
                            Voir PDF
                          </button>
                          <button type="button" onClick={() => handleDelete(item.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-edge bg-canvas px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink">Aucun P.V. trouvé.</p>
            <p className="mt-1 text-xs text-ink-secondary">Modifiez les filtres ou attendez les soumissions des enseignants.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────

export default function RemiseCopie() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
  return roles.includes("admin") ? <AdminView /> : <TeacherView />;
}
