import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppUser } from "@/types";
import { dataProvider } from "@/data/provider";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { greetingKey, roleFromIdLength } from "@/lib/format";
import { Button } from "@/components/ui/atoms";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { CheckCircle2, Info, ChevronRight } from "@/components/ui/Icon";
import meta from "@/data/seed/meta.json";

type Step = "form" | "verify";

export default function Login() {
  const { t, tn, lang } = useT();
  const login = useSession((s) => s.login);
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [second, setSecond] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AppUser | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  // role inferred purely from ID digit-length
  const role = roleFromIdLength(id);
  const isTeacher = role === "teacher";
  const secondLabel = isTeacher ? t("login.schoolId") : t("login.passcode");
  const secondPh = isTeacher ? t("login.schoolIdPh") : t("login.passcodePh");
  const greet = t(`greeting.${greetingKey()}`);

  const submitForm = () => {
    setError(null);
    if (!role) {
      setError(t("login.invalid"));
      return;
    }
    const user = dataProvider.resolveLogin(role, id, second);
    if (!user) {
      setError(t("login.invalid"));
      return;
    }
    setPending(user);
    setStep("verify");
  };

  // straight to the dashboard after confirming details (no SSO consent page)
  const finish = () => {
    if (!pending) return;
    login(pending);
    navigate("/app", { replace: true });
  };

  const scopeEntity = pending ? dataProvider.getEntity(pending.entity_id) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary-50 to-surface-muted">
      <div className="flex items-center justify-between bg-primary-500 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <img src="/logo-vsk.png" alt="" className="h-7 w-7 object-contain brightness-0 invert" />
          <span className="font-extrabold tracking-tight">{t("app.name")}</span>
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

                <div className="mt-5 space-y-3">
                  <Field label={t("login.userId")} value={id} onChange={setId} placeholder={t("login.idPh")} autoFocus />
                  {role ? (
                    <div className="animate-fade-in">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-700">{secondLabel}</span>
                        <span className="chip bg-primary-50 text-primary-600 !py-0.5">{t(`roles.${role}`)}</span>
                      </div>
                      <Input value={second} onChange={setSecond} placeholder={secondPh} type={isTeacher ? "text" : "password"} />
                    </div>
                  ) : (
                    id.trim().length > 0 && (
                      <p className="text-xs text-neutral-400">{t("login.idHint")}</p>
                    )
                  )}
                </div>

                {error && <p className="mt-3 rounded-lg bg-rag-redSoft px-3 py-2 text-xs font-medium text-rag-redText">{error}</p>}
                <Button full type="submit" className="mt-5" disabled={!role || !second}>{t("login.continue")}</Button>
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
                  <Row label={t("login.Grade")} value={scopeEntity ? tn(scopeEntity.name, scopeEntity.name_gu) : "—"} />
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
              {showDemo && <DemoTable onPick={(lid, sec) => { setId(lid); setSecond(sec); }} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoTable({ onPick }: { onPick: (id: string, second: string) => void }) {
  const { t } = useT();
  const logins = useMemo(() => meta.demoLogins.filter((d, i, a) => a.findIndex((x) => x.role === d.role) === i), []);
  return (
    <div className="mt-2 animate-fade-in space-y-1 rounded-xl border border-line/70 bg-white p-3 text-left text-xs">
      {logins.map((d) => (
        <button
          key={d.role}
          onClick={() => onPick(d.login_id, (d.passcode ?? d.school_id) ?? "")}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
        >
          <span className="font-semibold text-neutral-700">{t(`roles.${d.role}`)}</span>
          <span className="text-neutral-500">
            {d.login_id} · {d.passcode ? `PIN ${d.passcode}` : `School ${d.school_id}`}
          </span>
          <ChevronRight size={13} className="text-neutral-300" />
        </button>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-neutral-700">{label}</span>
      <Input value={value} onChange={onChange} placeholder={placeholder} type={type} autoFocus={autoFocus} />
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text", autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={type === "text" ? "numeric" : undefined}
      className="w-full rounded-xl border border-line bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary-400 focus:bg-white"
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
