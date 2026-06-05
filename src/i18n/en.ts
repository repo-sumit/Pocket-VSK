export const en = {
  app: { name: "VSK Gujarat", tagline: "School Performance Scorecard", interim: "Interim login — SSO coming" },
  common: {
    na: "NA", back: "Back", all: "All", of: "of", points: "pts", week: "Week", more: "more",
    viewAll: "View all", search: "Search", schools: "schools", you: "You", average: "Avg",
    benchmark: "Benchmark", vsBenchmark: "vs benchmark", target: "Target", source: "Source",
    weightage: "Weightage", achieved: "achieved", currentPeriod: "Current period", grade: "Grade",
    loading: "Loading…", notFound: "Nothing here", close: "Close", apply: "Apply",
    liveData: "live data", score: "score", notTracked: "Not tracked at this level",
  },
  status: { green: "On track", amber: "Needs attention", red: "At risk", na: "Not tracked" },
  roles: {
    teacher: "Teacher", principal: "Principal", crc: "Cluster (CRC)", brc: "Block (BRC/BEO)",
    deo: "District (DEO)", state: "State", pick: "Who are you?", pickHint: "Choose your role to continue",
  },
  levels: { state: "State", district: "District", block: "Block", cluster: "Cluster", school: "School", grade: "Grade", section: "Section" },
  login: {
    welcome: "Welcome to VSK Gujarat",
    subtitle: "Sign in to see your performance scorecard",
    userId: "User ID", userIdPh: "Enter your User ID",
    schoolId: "School ID", schoolIdPh: "Enter your School ID",
    cluster: "Cluster ID", block: "Block ID", district: "District ID", state: "State ID",
    idPh: "Enter your ID", passcode: "Passcode", passcodePh: "Enter passcode",
    continue: "Continue", verifyTitle: "Confirm your details", verifySub: "Please confirm your details below to continue",
    name: "Name", role: "Role", designation: "Designation", Grade: "Scope",
    signIn: "Continue & Sign In", goBack: "Go Back",
    permTitle: "VSK Scorecard wants to access your profile", permBody: "Allow VSK Gujarat to read your role and scope from your account.",
    giveAccess: "Give access", cancel: "Cancel",
    invalid: "We couldn't verify those details. Check your ID / passcode and try again.",
    demoHint: "Demo logins",
  },
  nav: { home: "Scorecard", domains: "Domains", compare: "Compare", sections: "Sections", leaderboard: "Leaderboard", export: "Export", logout: "Log out", language: "ગુજરાતી", menu: "Menu" },
  scorecard: {
    overall: "Overall score", rating: "Rating", domainWise: "Domain-wise score", youVsParent: "You vs {level} average",
    needsAttention: "Needs attention", mostImproved: "Most improved", closeGap: "Close the gap",
    viewDomain: "View domain", drillInto: "Drill into {label}", contribution: "Contribution to overall",
    yourScope: "Your scope", explore: "Explore below",
  },
  domain: { kpisIn: "KPIs in {name}", achievedVsBench: "{value} vs {benchmark} benchmark", noKpis: "No KPIs configured." },
  kpi: {
    current: "Current value", deltaWoW: "Δ this week", deltaMoM: "Δ this month", trend: "Trend over weeks",
    why: "What this means", cascadeTitle: "How {name} compares across levels", statusLabel: "Status",
    weeklyTrend: "Weekly trend", noData: "Not tracked at this level — shown as NA.",
  },
  cascade: { title: "Performance comparison", subtitle: "{name} across every level — Section to State", overall: "Overall score across levels" },
  section: {
    title: "Section comparison", subtitle: "Compare sections of a class on any KPI", choose: "Choose a KPI",
    chooseGrade: "Choose a class", rank: "Rank", yourSection: "Your section", noSections: "No sections under this scope.",
  },
  leaderboard: {
    title: "Leaderboard", subtitlePeers: "How you rank among {level}s", subtitleChildren: "Ranking of {level}s in your scope",
    rank: "Rank", topMovers: "Top movers this week", mostImproved: "Most improved", movement: "Movement",
    you: "You", noPeers: "No peers to rank at this level.", peers: "Peers", below: "In your scope",
  },
  export: { title: "Export scorecard", download: "Download / Print", generatedOn: "Generated for current period", note: "Use your browser's print dialog to save as PDF.", domain: "Domain", overall: "Overall" },
  framework: { label: "Framework", switch: "Switch framework" },
} as const;

/** A parallel dictionary (e.g. gu) must mirror the shape but may use any
 *  string values — so we widen the literal types to `string`. */
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
export type Dict = DeepString<typeof en>;
