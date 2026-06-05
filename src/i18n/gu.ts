import type { Dict } from "./en";

export const gu: Dict = {
  app: { name: "VSK ગુજરાત", tagline: "શાળા પ્રદર્શન સ્કોરકાર્ડ", interim: "વચગાળાનું લોગિન — SSO ટૂંક સમયમાં" },
  common: {
    na: "લાગુ નથી", back: "પાછળ", all: "બધા", of: "/", points: "પોઈન્ટ", week: "અઠવાડિયું", more: "વધુ",
    viewAll: "બધું જુઓ", search: "શોધો", schools: "શાળાઓ", you: "તમે", average: "સરેરાશ",
    benchmark: "બેન્ચમાર્ક", vsBenchmark: "બેન્ચમાર્ક સામે", target: "લક્ષ્ય", source: "સ્ત્રોત",
    weightage: "વેઇટેજ", achieved: "પ્રાપ્ત", currentPeriod: "વર્તમાન સમયગાળો", grade: "ગ્રેડ",
    loading: "લોડ થઈ રહ્યું છે…", notFound: "અહીં કંઈ નથી", close: "બંધ કરો", apply: "લાગુ કરો",
    liveData: "વાસ્તવિક ડેટા", score: "સ્કોર", notTracked: "આ સ્તરે ટ્રેક થતું નથી",
  },
  status: { green: "સારી સ્થિતિ", amber: "ધ્યાન જરૂરી", red: "જોખમમાં", na: "ટ્રેક થતું નથી" },
  roles: {
    teacher: "શિક્ષક", principal: "આચાર્ય", crc: "ક્લસ્ટર (CRC)", brc: "બ્લોક (BRC/BEO)",
    deo: "જિલ્લા (DEO)", state: "રાજ્ય", pick: "તમે કોણ છો?", pickHint: "ચાલુ રાખવા તમારી ભૂમિકા પસંદ કરો",
  },
  levels: { state: "રાજ્ય", district: "જિલ્લો", block: "બ્લોક", cluster: "ક્લસ્ટર", school: "શાળા", grade: "ધોરણ", section: "વિભાગ" },
  login: {
    welcome: "VSK ગુજરાતમાં આપનું સ્વાગત છે",
    subtitle: "તમારું પ્રદર્શન સ્કોરકાર્ડ જોવા સાઇન ઇન કરો",
    userId: "યુઝર ID", userIdPh: "તમારું યુઝર ID દાખલ કરો",
    schoolId: "શાળા ID", schoolIdPh: "તમારી શાળા ID દાખલ કરો",
    cluster: "ક્લસ્ટર ID", block: "બ્લોક ID", district: "જિલ્લા ID", state: "રાજ્ય ID",
    idPh: "તમારું ID દાખલ કરો", passcode: "પાસકોડ", passcodePh: "પાસકોડ દાખલ કરો",
    continue: "ચાલુ રાખો", verifyTitle: "તમારી વિગતો ચકાસો", verifySub: "ચાલુ રાખવા નીચેની વિગતો ખાતરી કરો",
    name: "નામ", role: "ભૂમિકા", designation: "હોદ્દો", scope: "કાર્યક્ષેત્ર",
    signIn: "ચાલુ રાખો અને સાઇન ઇન કરો", goBack: "પાછા જાઓ",
    permTitle: "VSK સ્કોરકાર્ડ તમારી પ્રોફાઇલ ઍક્સેસ કરવા માંગે છે", permBody: "VSK ગુજરાતને તમારી ભૂમિકા અને કાર્યક્ષેત્ર વાંચવાની મંજૂરી આપો.",
    giveAccess: "ઍક્સેસ આપો", cancel: "રદ કરો",
    invalid: "વિગતો ચકાસી શકાઈ નહીં. તમારું ID / પાસકોડ તપાસો અને ફરી પ્રયાસ કરો.",
    demoHint: "ડેમો લોગિન",
  },
  nav: { home: "સ્કોરકાર્ડ", domains: "ડોમેન", compare: "સરખામણી", sections: "વિભાગો", leaderboard: "લીડરબોર્ડ", export: "નિકાસ", logout: "લોગ આઉટ", language: "English", menu: "મેનુ" },
  scorecard: {
    overall: "એકંદર સ્કોર", rating: "રેટિંગ", domainWise: "ડોમેન મુજબ સ્કોર", youVsParent: "તમે vs {level} સરેરાશ",
    needsAttention: "ધ્યાન જરૂરી", mostImproved: "સૌથી વધુ સુધારો", closeGap: "તફાવત ભરો",
    viewDomain: "ડોમેન જુઓ", drillInto: "{label} માં જાઓ", contribution: "એકંદરમાં યોગદાન",
    yourScope: "તમારું કાર્યક્ષેત્ર", explore: "નીચે અન્વેષણ કરો",
  },
  domain: { kpisIn: "{name} માં KPIs", achievedVsBench: "{value} vs {benchmark} બેન્ચમાર્ક", noKpis: "કોઈ KPI રૂપરેખાંકિત નથી." },
  kpi: {
    current: "વર્તમાન મૂલ્ય", deltaWoW: "Δ આ અઠવાડિયે", deltaMoM: "Δ આ મહિને", trend: "અઠવાડિયા મુજબ વલણ",
    why: "આનો અર્થ શું", cascadeTitle: "{name} સ્તરો વચ્ચે કેવી રીતે સરખાવાય", statusLabel: "સ્થિતિ",
    weeklyTrend: "સાપ્તાહિક વલણ", noData: "આ સ્તરે ટ્રેક થતું નથી — NA તરીકે બતાવેલ.",
  },
  cascade: { title: "પ્રદર્શન સરખામણી", subtitle: "{name} દરેક સ્તરે — વિભાગથી રાજ્ય સુધી", overall: "સ્તરો વચ્ચે એકંદર સ્કોર" },
  section: {
    title: "વિભાગ સરખામણી", subtitle: "કોઈપણ KPI પર વર્ગના વિભાગો સરખાવો", choose: "KPI પસંદ કરો",
    chooseGrade: "વર્ગ પસંદ કરો", rank: "ક્રમ", yourSection: "તમારો વિભાગ", noSections: "આ કાર્યક્ષેત્ર હેઠળ કોઈ વિભાગ નથી.",
  },
  leaderboard: {
    title: "લીડરબોર્ડ", subtitlePeers: "{level} વચ્ચે તમારો ક્રમ", subtitleChildren: "તમારા કાર્યક્ષેત્રમાં {level} નો ક્રમ",
    rank: "ક્રમ", topMovers: "આ અઠવાડિયાના ટોચના સુધારકો", mostImproved: "સૌથી વધુ સુધારો", movement: "ફેરફાર",
    you: "તમે", noPeers: "આ સ્તરે ક્રમ આપવા કોઈ સાથી નથી.", peers: "સાથીઓ", below: "તમારા કાર્યક્ષેત્રમાં",
  },
  export: { title: "સ્કોરકાર્ડ નિકાસ કરો", download: "ડાઉનલોડ / પ્રિન્ટ", generatedOn: "વર્તમાન સમયગાળા માટે બનાવેલ", note: "PDF તરીકે સાચવવા તમારા બ્રાઉઝરના પ્રિન્ટ ડાયલોગનો ઉપયોગ કરો.", domain: "ડોમેન", overall: "એકંદર" },
  framework: { label: "ફ્રેમવર્ક", switch: "ફ્રેમવર્ક બદલો" },
};
