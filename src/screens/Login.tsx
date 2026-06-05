import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppUser, Role } from "@/types";
import { dataProvider } from "@/data/provider";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { greetingKey } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/atoms";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { CheckCircle2, Info, ChevronRight } from "@/components/ui/Icon";
import meta from "@/data/seed/meta.json";

type Step = "form" | "verify";
/** Two login surfaces. Role is resolved from the seed, not the digit length —
 *  the toggle only picks which second credential (School UDISE vs PIN) we ask for. */
type Mode = "tp" | "officer";

const TP_ROLES: Role[] = ["teacher", "principal"];

export default function Login() {
  const { t, tn, lang } = useT();
  const login = useSession((s) => s.login);
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("tp");
  const [id, setId] = useState("");
  const [second, setSecond] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [secondTouched, setSecondTouched] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AppUser | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const isTP = mode === "tp";
  const greet = t(`greeting.${greetingKey()}`);

  // ── validation (format only; identity is checked against the seed on submit) ──
  const idValid = isTP ? /^\d{10}$/.test(id) : /^\d+$/.test(id);
  const secondValid = isTP ? /^\d{11}$/.test(second) : /^\d{4}$/.test(second);
  const idError = idTouched && id.length > 0 && !idValid && isTP ? t("login.errId10") : null;
  const secondError =
    secondTouched && second.length > 0 && !secondValid ? (isTP ? t("login.errUdise11") : t("login.errPin4")) : null;

  const idLabel = isTP ? t("login.tpId") : t("login.officerId");
  const idPh = isTP ? t("login.tpIdPh") : t("login.officerIdPh");
  const secondLabel = isTP ? t("login.schoolUdise") : t("login.passcode");
  const secondPh = isTP ? t("login.schoolUdisePh") : t("login.pinPh");

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setSecond("");
    setIdTouched(false);
    setSecondTouched(false);
    setError(null);
  };

  const submitForm = () => {
    setError(null);
    setIdTouched(true);
    setSecondTouched(true);
    if (!idValid || !secondValid) return;
    const user = dataProvider.resolveLoginById(id, second);
    // role from the seed must agree with the chosen surface (else credentials mismatch)
    if (!user || TP_ROLES.includes(user.role) !== isTP) {
      setError(t("login.invalid"));
      return;
    }
    setPending(user);
    setStep("verify");
  };

  // straight to the dashboard after confirming details (interim — SSO later)
  const finish = () => {
    if (!pending) return;
    login(pending);
    navigate("/app", { replace: true });
  };

  const pickDemo = (lid: string, sec: string, role: Role) => {
    switchMode(TP_ROLES.includes(role) ? "tp" : "officer");
    setId(lid);
    setSecond(sec);
  };

  const scopeEntity = pending ? dataProvider.getEntity(pending.entity_id) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary-50 to-surface-muted">
      <div className="flex items-center justify-between bg-primary-500 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/logo-vsk.png" alt="" className="h-7 w-7 shrink-0 object-contain brightness-0 invert" />
          <span className="truncate font-extrabold tracking-tight">{t("app.name")}</span>
        </div>
        <LanguageToggle className="!bg-white/15" />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[440px] animate-scale-in">
          <div className="card card-pad sm:p-7">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-50 ring-1 ring-primary-100">
              {step === "verify" ? (
                <CheckCircle2 className="text-primary-500" size={28} />
              ) : (
                <img src="/logo-vsk.png" alt="Vidya Samiksha Kendra" className="h-11 w-11 object-contain" />
              )}
            </div>

            {step === "form" && (
              <form className="animate-fade-in" onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
                <h1 className="mt-4 text-center text-2xl font-extrabold leading-tight text-neutral-900">{t("login.welcome")}</h1>
                <p className="mt-1 text-center text-sm text-neutral-500">{t("login.subtitle")}</p>

                {/* surface toggle — never a 6-way role picker */}
                <div role="tablist" aria-label={t("login.welcome")} className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                  {(["tp", "officer"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => switchMode(m)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                        mode === m ? "bg-white text-primary-600 shadow-card" : "text-neutral-500 hover:text-neutral-700",
                      )}
                    >
                      {m === "tp" ? t("login.modeTP") : t("login.modeOfficer")}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <Field
                    label={idLabel}
                    value={id}
                    onChange={setId}
                    onBlur={() => setIdTouched(true)}
                    placeholder={idPh}
                    maxLength={isTP ? 10 : 10}
                    error={idError}
                    autoFocus
                  />
                  {id.length > 0 && (
                    <Field
                      label={secondLabel}
                      value={second}
                      onChange={setSecond}
                      onBlur={() => setSecondTouched(true)}
                      placeholder={secondPh}
                      type={isTP ? "text" : "password"}
                      maxLength={isTP ? 11 : 4}
                      error={secondError}
                      className="animate-fade-in"
                    />
                  )}
                </div>

                {error && <p className="mt-3 rounded-lg bg-rag-redSoft px-3 py-2 text-xs font-medium text-rag-redText">{error}</p>}
                <Button full type="submit" className="mt-5" disabled={!idValid || !secondValid}>{t("login.continue")}</Button>
              </form>
            )}

            {step === "verify" && pending && (
              <div className="animate-fade-in">
                <h1 className="mt-4 text-center text-2xl font-extrabold text-neutral-900">{greet}, {tn(pending.name, pending.name_gu).split(" ")[0]}!</h1>
                <p className="mt-1 text-center text-sm text-neutral-500">{t("login.verifySub")}</p>
                <dl className="mt-5 space-y-1 rounded-xl bg-neutral-50 p-4 text-sm">
                  <Row label={t("login.name")} value={tn(pending.name, pending.name_gu)} />
                  <Row label={t("login.userId")} value={pending.login_id} />
                  <Row label={t("login.designation")} value={lang === "gu" ? t(`roles.${pending.role}`) : pending.designation} />
                  <Row label={t("login.Grade")} value={scopeEntity ? tn(scopeEntity.name, scopeEntity.name_gu) : t("common.na")} />
                  <Row label={t("login.role")} value={t(`roles.${pending.role}`)} />
                </dl>
                <div className="mt-5 space-y-2.5">
                  <Button full onClick={finish}>{t("login.signIn")}</Button>
                  <Button full variant="soft" onClick={() => { setStep("form"); setPending(null); }}>{t("login.goBack")}</Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Info size={13} /> {t("app.interim")}
          </div>

          {step === "form" && (
            <div className="mt-2 text-center">
              <button onClick={() => setShowDemo((v) => !v)} className="text-xs font-semibold text-primary-600 hover:underline">
                {t("login.demoHint")} {showDemo ? "▲" : "▼"}
              </button>
              {showDemo && <DemoTable onPick={pickDemo} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoTable({ onPick }: { onPick: (id: string, second: string, role: Role) => void }) {
  const { t } = useT();
  const logins = useMemo(() => meta.demoLogins.filter((d, i, a) => a.findIndex((x) => x.role === d.role) === i), []);
  return (
    <div className="mt-2 animate-fade-in space-y-1 rounded-xl border border-line/70 bg-white p-3 text-left text-xs">
      {logins.map((d) => (
        <button
          key={d.role}
          onClick={() => onPick(d.login_id, (d.passcode ?? d.school_id) ?? "", d.role as Role)}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
        >
          <span className="shrink-0 font-semibold text-neutral-700">{t(`roles.${d.role}`)}</span>
          <span className="min-w-0 truncate text-neutral-500">
            {d.login_id} · {d.passcode ? `${t("login.passcode")} ${d.passcode}` : `${t("login.schoolUdise")} ${d.school_id}`}
          </span>
          <ChevronRight size={13} className="shrink-0 text-neutral-300" />
        </button>
      ))}
    </div>
  );
}

function Field({
  label, value, onChange, onBlur, placeholder, type = "text", autoFocus, maxLength, error, className,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; type?: string; autoFocus?: boolean; maxLength?: number; error?: string | null; className?: string;
}) {
  // every credential here (ID, UDISE, PIN) is numeric — strip stray characters
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-semibold text-neutral-700">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode="numeric"
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-xl border bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:bg-white",
          error ? "border-rag-red focus:border-rag-red" : "border-line focus:border-primary-400",
        )}
      />
      {error && <span className="mt-1 block text-xs font-medium text-rag-redText">{error}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
