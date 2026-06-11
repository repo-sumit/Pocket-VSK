import {
  Award, Activity, BarChart3, BookOpen, Boxes, Building2, CalendarCheck, ChartNoAxesColumn,
  CheckCircle2, Check, ChevronRight, ChevronLeft, ChevronDown, ClipboardCheck, Drama, DoorOpen, Download, Flag,
  Gauge, GraduationCap, Landmark, LayoutGrid, LogOut, Map, Medal, Minus, Printer, Search, ShieldCheck, Sparkles,
  Target, TrendingDown, TrendingUp, Trophy, Users, User, AlertTriangle, ArrowUpRight, ArrowDownRight,
  ArrowLeft, Info, Clock, Database, CloudOff, SlidersHorizontal, X, type LucideIcon,
} from "lucide-react";

/** Curated registry so domain/KPI icons referenced by name in config resolve
 *  without bundling all of lucide. Add a row to extend. */
const REGISTRY: Record<string, LucideIcon> = {
  Award, Activity, BarChart3, BookOpen, Boxes, Building2, CalendarCheck, ChartNoAxesColumn,
  CheckCircle2, ClipboardCheck, Drama, DoorOpen, Flag, Gauge, GraduationCap, Landmark, LayoutGrid,
  Map, Medal, ShieldCheck, Sparkles, Target, Trophy, Users, User,
};

export function Icon({ name, className, size = 18 }: { name?: string; className?: string; size?: number }) {
  const Cmp = (name && REGISTRY[name]) || LayoutGrid;
  return <Cmp className={className} size={size} aria-hidden />;
}

/* ── Custom design-handoff icons (Docs/*.svg), drawn with currentColor so they
 *    inherit text colour like the lucide set. ── */
type SvgIconProps = { size?: number; className?: string; strokeWidth?: number };

/** Funnel filter (Docs/filter.svg) — opens the School-type / Language filter sheet. */
export function FunnelFilter({ size = 18, className, strokeWidth = 2 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M20 5.6001C20 5.04005 19.9996 4.75981 19.8906 4.5459C19.7948 4.35774 19.6423 4.20487 19.4542 4.10899C19.2403 4 18.9597 4 18.3996 4H5.59961C5.03956 4 4.75981 4 4.5459 4.10899C4.35774 4.20487 4.20487 4.35774 4.10899 4.5459C4 4.75981 4 5.04005 4 5.6001V6.33736C4 6.58195 4 6.70433 4.02763 6.81942C4.05213 6.92146 4.09263 7.01893 4.14746 7.1084C4.20928 7.20928 4.29591 7.29591 4.46875 7.46875L9.53149 12.5315C9.70443 12.7044 9.79044 12.7904 9.85228 12.8914C9.90711 12.9808 9.94816 13.0786 9.97266 13.1807C10 13.2946 10 13.4155 10 13.6552V18.411C10 19.2682 10 19.6971 10.1805 19.9552C10.3382 20.1806 10.5814 20.331 10.8535 20.3712C11.1651 20.4172 11.5487 20.2257 12.3154 19.8424L13.1154 19.4424C13.4365 19.2819 13.5966 19.2013 13.7139 19.0815C13.8176 18.9756 13.897 18.8485 13.9453 18.7084C14 18.5499 14 18.37 14 18.011V13.6626C14 13.418 14 13.2958 14.0276 13.1807C14.0521 13.0786 14.0926 12.9808 14.1475 12.8914C14.2089 12.7911 14.2947 12.7053 14.4653 12.5347L14.4688 12.5315L19.5315 7.46875C19.7044 7.2958 19.7904 7.20932 19.8523 7.1084C19.9071 7.01893 19.9482 6.92146 19.9727 6.81942C20 6.70551 20 6.58444 20 6.3448V5.6001Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Bar chart in a frame (Docs/bar-compare.svg) — the Compare action. */
export function BarCompare({ size = 18, className, strokeWidth = 2 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M16 10V17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7V17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13L8 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Circled chevron-left (Docs/left side.svg) — step one hierarchy level up. */
export function CircleChevronLeft({ size = 22, className, strokeWidth = 1.5 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="-0.5 0 25 25" fill="none" className={className} aria-hidden>
      <path d="M12 22.4199C17.5228 22.4199 22 17.9428 22 12.4199C22 6.89707 17.5228 2.41992 12 2.41992C6.47715 2.41992 2 6.89707 2 12.4199C2 17.9428 6.47715 22.4199 12 22.4199Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.4102 16.4199L10.3502 13.55C10.1944 13.4059 10.0702 13.2311 9.98526 13.0366C9.9003 12.8422 9.85645 12.6321 9.85645 12.4199C9.85645 12.2077 9.9003 11.9979 9.98526 11.8035C10.0702 11.609 10.1944 11.4342 10.3502 11.29L13.4102 8.41992" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Circled chevron-right (Docs/right-side.svg) — open the next-level selector. */
export function CircleChevronRight({ size = 22, className, strokeWidth = 1.5 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="-0.5 0 25 25" fill="none" className={className} aria-hidden>
      <path d="M12 22.4199C17.5228 22.4199 22 17.9428 22 12.4199C22 6.89707 17.5228 2.41992 12 2.41992C6.47715 2.41992 2 6.89707 2 12.4199C2 17.9428 6.47715 22.4199 12 22.4199Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5596 8.41992L13.6196 11.29C13.778 11.4326 13.9047 11.6068 13.9914 11.8015C14.0781 11.9962 14.123 12.2068 14.123 12.4199C14.123 12.633 14.0781 12.8439 13.9914 13.0386C13.9047 13.2332 13.778 13.4075 13.6196 13.55L10.5596 16.4199" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Share / export-PDF action icon (replaces the mobile Export button). */
export function Share({ size = 18, className, strokeWidth = 2 }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export {
  Award, Activity, BarChart3, BookOpen, Boxes, Building2, CalendarCheck, ChartNoAxesColumn, CheckCircle2, Check,
  ChevronRight, ChevronLeft, ChevronDown, ClipboardCheck, Download, Flag, Gauge, GraduationCap, Landmark, LayoutGrid,
  LogOut, Map, Medal, Minus, Printer, Search, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, Trophy,
  Users, User, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowLeft, Info, Clock, Database, CloudOff,
  SlidersHorizontal, X,
};
