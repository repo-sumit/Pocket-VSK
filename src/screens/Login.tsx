import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppUser, Role } from "@/types";
import { ROLES } from "@/types";
import { dataProvider } from "@/data/provider";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/atoms";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { BarChart3, User, CheckCircle2, Info, ShieldCheck, ChevronRight } from "@/components/ui/Icon";
import meta from "@/data/seed/meta.json";

type Step = "form" | "verify" | "permission";
const OFFICER: Role[] = ["crc", "brc", "deo", "state"];
const FIELD_KEY: Record<string, string> = { crc: "cluster", brc: "block", deo: "district", state: "state" };

export default function Login() {
  const { t, tn, lang } = useT();
  const login = useSession((s) => s.login);
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("teacher");
  const [id, setId] = useState("");
  const [second, setSecond] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AppUser | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const isOfficer = OFFICER.includes(role);
  const firstLabel = isOfficer ? t(`login.${FIELD_KEY[role]}`) : t("login.userId");

  const demoForRole = useMemo(() => meta.demoLogins.find((d) => d.role === role), [role]);

  const submitForm = () => {
    setError(null);
    const user = dataProvider.resolveLogin(role, id, second);
    if (!user) {
      setError(t("login.invalid"));
      return;
    }
    setPending(user);
    setStep("verify");
  };

  const finish = () => {
    if (!pending) return;
    login(pending);
    navigate("/app", { replace: true });
  };

  const scopeEntity = pending ? dataProvider.getEntity(pending.entity_id) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary-50 to-surface-muted">
      {/* brand bar */}
      <div className="flex items-center justify-between bg-primary-500 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} />
          <span className="font-extrabold tracking-tight">{t("app.name")}</span>
        </div>
        <LanguageToggle className="!bg-white/15" />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[440px] animate-scale-in">
          <div className="card card-pad sm:p-7">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-50">
              {step === "form" ? <User className="text-primary-500" size={26} /> : step === "verify" ? <CheckCircle2 className="text-primary-500" size={26} /> : <ShieldCheck className="text-primary-500" size={26} />}
            </div>

            {step === "form" && (
              <FormStep
                role={role} setRole={setRole} id={id} setId={setId} second={second} setSecond={setSecond}
                isOfficer={isOfficer} firstLabel={firstLabel} error={error} onSubmit={submitForm}
              />
            )}

            {step === "verify" && pending && (
              <div className="animate-fade-in">
                <h1 className="mt-4 text-center text-2xl font-extrabold text-neutral-900">{t("login.verifyTitle")}</h1>
                <p className="mt-1 text-center text-sm text-neutral-500">{t("login.verifySub")}</p>
                <dl className="mt-5 space-y-1 rounded-xl bg-neutral-50 p-4 text-sm">
                  <Row label={t("login.name")} value={tn(pending.name, pending.name_gu)} />
                  <Row label={t("login.userId")} value={pending.login_id} />
                  <Row label={t("login.designation")} value={lang === "gu" ? t(`roles.${pending.role}`) : pending.designation} />
                  <Row label={t("login.scope")} value={scopeEntity ? tn(scopeEntity.name, scopeEntity.name_gu) : "—"} />
                  <Row label={t("login.role")} value={t(`roles.${pending.role}`)} />
                </dl>
                <div className="mt-5 space-y-2.5">
                  <Button full onClick={() => setStep("permission")}>{t("login.signIn")}</Button>
                  <Button full variant="soft" onClick={() => { setStep("form"); setPending(null); }}>{t("login.goBack")}</Button>
                </div>
              </div>
            )}

            {step === "permission" && pending && (
              <div className="animate-fade-in">
                <h1 className="mt-4 text-center text-xl font-extrabold text-neutral-900">{t("login.permTitle")}</h1>
                <p className="mt-2 text-center text-sm text-neutral-500">{t("login.permBody")}</p>
                <div className="mt-6 flex gap-3">
                  <Button variant="secondary" full onClick={() => setStep("verify")}>{t("login.cancel")}</Button>
                  <Button full onClick={finish}>{t("login.giveAccess")}</Button>
                </div>
              </div>
            )}
          </div>

          {/* interim + demo hint */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Info size={13} /> {t("app.interim")}
          </div>
          {step === "form" && (
            <div className="mt-2 text-center">
              <button onClick={() => setShowDemo((v) => !v)} className="text-xs font-semibold text-primary-600 hover:underline">
                {t("login.demoHint")} {showDemo ? "▲" : "▼"}
              </button>
              {showDemo && demoForRole && (
                <div className="mt-2 animate-fade-in rounded-xl border border-line/70 bg-white p-3 text-left text-xs">
                  <div className="font-semibold text-neutral-700">{t(`roles.${role}`)} · {demoForRole.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-neutral-500">
                    <span><b className="text-neutral-700">ID:</b> {demoForRole.login_id}</span>
                    {isOfficer ? <span><b className="text-neutral-700">{t("login.passcode")}:</b> {demoForRole.passcode}</span> : <span><b className="text-neutral-700">{t("login.schoolId")}:</b> {demoForRole.school_id}</span>}
                  </div>
                  <button
                    onClick={() => { setId(demoForRole.login_id); setSecond((isOfficer ? demoForRole.passcode : demoForRole.school_id) ?? ""); }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    {t("common.apply")} <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormStep({
  role, setRole, id, setId, second, setSecond, isOfficer, firstLabel, error, onSubmit,
}: {
  role: Role; setRole: (r: Role) => void; id: string; setId: (v: string) => void; second: string; setSecond: (v: string) => void;
  isOfficer: boolean; firstLabel: string; error: string | null; onSubmit: () => void;
}) {
  const { t } = useT();
  return (
    <form
      className="animate-fade-in"
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <h1 className="mt-4 text-center text-2xl font-extrabold leading-tight text-neutral-900">{t("login.welcome")}</h1>
      <p className="mt-1 text-center text-sm text-neutral-500">{t("login.subtitle")}</p>

      <p className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">{t("roles.pick")}</p>
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "rounded-xl border-[1.5px] px-2 py-2 text-xs font-semibold transition-colors",
              role === r ? "border-primary-500 bg-primary-50 text-primary-700" : "border-line text-neutral-500 hover:border-neutral-300",
            )}
          >
            {t(`roles.${r}`)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <Field label={firstLabel} value={id} onChange={setId} placeholder={t("login.idPh")} autoFocus />
        <Field
          label={isOfficer ? t("login.passcode") : t("login.schoolId")}
          value={second}
          onChange={setSecond}
          placeholder={isOfficer ? t("login.passcodePh") : t("login.schoolIdPh")}
          type={isOfficer ? "password" : "text"}
        />
      </div>

      {error && <p className="mt-3 rounded-lg bg-rag-redSoft px-3 py-2 text-xs font-medium text-rag-red">{error}</p>}

      <Button full type="submit" className="mt-5">{t("login.continue")}</Button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-neutral-700">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary-400 focus:bg-white"
      />
    </label>
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
