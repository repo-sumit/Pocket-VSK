import {
  Award, Activity, BarChart3, BookOpen, Boxes, Building2, CalendarCheck, ChartNoAxesColumn,
  CheckCircle2, ChevronRight, ChevronLeft, ClipboardCheck, Drama, DoorOpen, Download, Flag,
  Gauge, GraduationCap, Landmark, LayoutGrid, LogOut, Map, Medal, Minus, Printer, ShieldCheck, Sparkles,
  Target, TrendingDown, TrendingUp, Trophy, Users, User, AlertTriangle, ArrowUpRight, ArrowDownRight,
  ArrowLeft, Info, type LucideIcon,
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

export {
  Award, Activity, BarChart3, BookOpen, Boxes, Building2, CalendarCheck, ChartNoAxesColumn, CheckCircle2,
  ChevronRight, ChevronLeft, ClipboardCheck, Download, Flag, Gauge, GraduationCap, Landmark, LayoutGrid,
  LogOut, Map, Medal, Minus, Printer, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, Trophy,
  Users, User, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowLeft, Info,
};
