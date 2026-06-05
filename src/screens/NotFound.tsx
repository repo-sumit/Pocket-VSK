import { Link } from "react-router-dom";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/atoms";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl font-extrabold text-neutral-200">404</div>
      <p className="text-sm text-neutral-500">{t("common.notFound")}</p>
      <Link to="/app"><Button>{t("nav.home")}</Button></Link>
    </div>
  );
}
