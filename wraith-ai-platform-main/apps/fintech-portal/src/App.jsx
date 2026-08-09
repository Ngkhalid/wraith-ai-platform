import { useEffect, useMemo, useState } from "react";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowDownLeft,
  IconArrowRight,
  IconArrowsLeftRight,
  IconArrowUpRight,
  IconBell,
  IconBuildingBank,
  IconBuildingStore,
  IconCalendar,
  IconChartPie,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCopy,
  IconCreditCard,
  IconDeviceDesktop,
  IconDots,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconFileInvoice,
  IconFilter,
  IconFingerprint,
  IconHelpCircle,
  IconHome,
  IconInfoCircle,
  IconKey,
  IconLanguage,
  IconLock,
  IconLogout,
  IconMenu2,
  IconPlus,
  IconReceipt,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconSnowflake,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconWallet,
  IconX,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  accounts,
  beneficiaries,
  bills,
  cards,
  cashflow,
  formatDate,
  formatMoney,
  loginActivity,
  merchants,
  notifications,
  spendingByCategory,
  transactions,
} from "./data";

const COPY = {
  en: {
    overview: "Overview",
    accounts: "Accounts & cards",
    transactions: "Transactions",
    transfers: "Transfers",
    beneficiaries: "Beneficiaries",
    bills: "Bills & invoices",
    merchants: "Merchants",
    notifications: "Notifications",
    security: "Profile & security",
    search: "Search",
    logout: "Sign out",
    welcome: "Good afternoon, Layla",
    welcomeOps: "Good afternoon, Operations",
    subtitle: "Here is your financial picture at a glance.",
    totalBalance: "Total balance",
    available: "Available to spend",
    income: "Money in",
    spending: "Money out",
    cashflow: "Cash flow",
    recentTransactions: "Recent transactions",
    viewAll: "View all",
    quickActions: "Quick actions",
    sendMoney: "Send money",
    payBill: "Pay a bill",
    addRecipient: "Add recipient",
    download: "Download statement",
    categorySpend: "Spending by category",
    period7: "7D",
    period30: "30D",
    period90: "90D",
    periodYear: "1Y",
  },
  ar: {
    overview: "نظرة عامة",
    accounts: "الحسابات والبطاقات",
    transactions: "المعاملات",
    transfers: "الحوالات",
    beneficiaries: "المستفيدون",
    bills: "الفواتير",
    merchants: "التجار",
    notifications: "الإشعارات",
    security: "الملف والأمان",
    search: "بحث",
    logout: "تسجيل الخروج",
    welcome: "مساء الخير، ليلى",
    welcomeOps: "مساء الخير، فريق العمليات",
    subtitle: "إليك ملخص وضعك المالي في لمحة.",
    totalBalance: "إجمالي الرصيد",
    available: "متاح للإنفاق",
    income: "الأموال الواردة",
    spending: "الأموال الصادرة",
    cashflow: "التدفق النقدي",
    recentTransactions: "أحدث المعاملات",
    viewAll: "عرض الكل",
    quickActions: "إجراءات سريعة",
    sendMoney: "إرسال أموال",
    payBill: "دفع فاتورة",
    addRecipient: "إضافة مستفيد",
    download: "تنزيل كشف الحساب",
    categorySpend: "الإنفاق حسب الفئة",
    period7: "٧ أيام",
    period30: "٣٠ يوم",
    period90: "٩٠ يوم",
    periodYear: "سنة",
  },
};

const navItems = [
  ["overview", IconHome],
  ["accounts", IconWallet],
  ["transactions", IconArrowsLeftRight],
  ["transfers", IconArrowUpRight],
  ["beneficiaries", IconUsers],
  ["bills", IconFileInvoice],
  ["merchants", IconBuildingStore],
  ["notifications", IconBell],
  ["security", IconShieldLock],
];

const pageDescriptions = {
  en: {
    accounts: "Balances, cards and controls in one secure place.",
    transactions: "Search and review every movement across your accounts.",
    transfers: "Move money safely between trusted accounts.",
    beneficiaries: "Manage the people and businesses you pay.",
    bills: "Track, schedule and settle your recurring commitments.",
    merchants: "Understand where your money goes.",
    notifications: "Security, payments and account updates.",
    security: "Your identity, devices and protection settings.",
  },
  ar: {
    accounts: "أرصدتك وبطاقاتك وتحكمك في مكان آمن واحد.",
    transactions: "ابحث وراجع كل حركة عبر حساباتك.",
    transfers: "انقل أموالك بأمان بين الحسابات الموثوقة.",
    beneficiaries: "أدر الأشخاص والشركات التي تدفع لها.",
    bills: "تتبع وجدول وسدد التزاماتك المتكررة.",
    merchants: "افهم أين تنفق أموالك.",
    notifications: "تحديثات الأمان والمدفوعات والحساب.",
    security: "هويتك وأجهزتك وإعدادات الحماية.",
  },
};

const DEMO_USERS = {
  "layla.haddad@finova-demo.local": { password: "Honeypot!Demo-2026", role: "customer", name: "Layla Haddad" },
  "ops@finova-demo.local": { password: "Ledger!Sim-2026", role: "ops", name: "Operations Team" },
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_AR = {
  All: "الكل",
  Completed: "مكتملة",
  Pending: "قيد المعالجة",
  Reversed: "مسترجعة",
  "Due soon": "مستحقة قريبًا",
  Scheduled: "مجدولة",
  Paid: "مدفوعة",
  Overdue: "متأخرة",
  active: "نشطة",
  locked: "مقفلة",
  Verified: "موثقة",
  Blocked: "محظورة",
};

const MONTH_AR = { Jan: "يناير", Feb: "فبراير", Mar: "مارس", Apr: "أبريل", May: "مايو", Jun: "يونيو", Jul: "يوليو", Aug: "أغسطس", Sep: "سبتمبر", Oct: "أكتوبر", Nov: "نوفمبر", Dec: "ديسمبر" };

function localizedStatus(value, locale) {
  return locale === "ar" ? (STATUS_AR[value] ?? value) : value;
}

function Brand({ compact = false }) {
  return (
    <div className={cx("brand", compact && "brand--compact")} aria-label="Finova digital banking">
      <span className="brand__mark"><IconBuildingBank size={22} stroke={1.8} /></span>
      {!compact && <span className="brand__name">finova<span>.</span></span>}
    </div>
  );
}

function Login({ locale, setLocale, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ar = locale === "ar";

  function submit(event) {
    event.preventDefault();
    setError("");
    const user = DEMO_USERS[email.trim().toLowerCase()];
    if (!user || user.password !== password) {
      setError(ar ? "بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور ثم حاول مجددًا." : "Those details do not match. Check your email and password, then try again.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => onLogin({ ...user, email }), 420);
  }

  return (
    <main className="login-shell" dir={ar ? "rtl" : "ltr"}>
      <section className="login-story" aria-label={ar ? "معلومات المنتج" : "Product information"}>
        <Brand />
        <div className="story-copy">
          <span className="eyebrow"><IconShieldCheck size={16} /> {ar ? "تجربة مصرفية محمية" : "Protected digital banking"}</span>
          <h1>{ar ? "أموالك، أوضح. يومك، أسهل." : "Your money, clearer. Your day, simpler."}</h1>
          <p>{ar ? "نظرة واحدة تجمع حساباتك ومدفوعاتك وأمانك في تجربة صممت لتمنحك الثقة." : "One calm view for accounts, payments and security—designed to keep you confidently in control."}</p>
        </div>
        <div className="trust-row">
          <div><IconFingerprint /><span><b>{ar ? "دخول محمي" : "Protected access"}</b><small>{ar ? "تحقق متعدد الخطوات" : "Multi-step verification"}</small></span></div>
          <div><IconActivity /><span><b>{ar ? "متابعة فورية" : "Live monitoring"}</b><small>{ar ? "تنبيهات لكل حركة" : "Alerts on every move"}</small></span></div>
        </div>
        <span className="story-orb story-orb--one" />
        <span className="story-orb story-orb--two" />
      </section>

      <section className="login-panel">
        <div className="login-topbar">
          <Brand compact />
          <button className="text-button" onClick={() => setLocale(ar ? "en" : "ar")}><IconLanguage size={18} /> {ar ? "English" : "العربية"}</button>
        </div>
        <form className="login-card" onSubmit={submit}>
          <div className="login-heading">
            <span className="secure-icon"><IconLock size={22} /></span>
            <div>
              <h2>{ar ? "مرحباً بعودتك" : "Welcome back"}</h2>
              <p>{ar ? "سجل الدخول إلى حسابك الآمن" : "Sign in to your secure account"}</p>
            </div>
          </div>
          <label className="field">
            <span>{ar ? "البريد الإلكتروني" : "Email address"}</span>
            <div className="input-wrap"><IconUser size={19} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></div>
          </label>
          <label className="field">
            <span>{ar ? "كلمة المرور" : "Password"}</span>
            <div className="input-wrap"><IconKey size={19} /><input type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" className="icon-button input-action" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <IconEyeOff size={19} /> : <IconEye size={19} />}</button></div>
          </label>
          <div className="form-options"><label className="checkbox"><input type="checkbox" defaultChecked /> <span>{ar ? "تذكر هذا الجهاز" : "Remember this device"}</span></label><button type="button" className="link-button">{ar ? "نسيت كلمة المرور؟" : "Forgot password?"}</button></div>
          {error && <div className="inline-alert inline-alert--error" role="alert"><IconAlertTriangle size={18} /> {error}</div>}
          <button className="primary-button login-submit" disabled={loading}>{loading ? (ar ? "جارٍ التحقق..." : "Verifying…") : (ar ? "دخول آمن" : "Secure sign in")} <IconArrowRight size={19} /></button>
          <div className="demo-hint">
            <div className="demo-hint__head"><IconShieldCheck size={18} /><span><b>{ar ? "دخول آمن" : "Secure sign-in"}</b><small>{ar ? "اتصال مشفر ومراقبة مستمرة" : "Encrypted connection and continuous monitoring"}</small></span></div>
            <p>{ar ? "لن نطلب منك مشاركة كلمة المرور أو رمز التحقق عبر الهاتف أو البريد." : "We will never ask you to share your password or verification code by phone or email."}</p>
          </div>
        </form>
        <div className="login-foot"><IconShieldCheck size={16} /> {ar ? "محمي بواسطة Finova Secure · مراقبة الحساب على مدار الساعة" : "Protected by Finova Secure · 24/7 account monitoring"}</div>
      </section>
    </main>
  );
}

function Sidebar({ page, setPage, locale, user, onLogout, mobileOpen, setMobileOpen }) {
  const t = COPY[locale];
  return (
    <>
      <aside className={cx("sidebar", mobileOpen && "sidebar--open")}>
        <div className="sidebar__head"><Brand /><button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close menu"><IconX /></button></div>
        <nav className="nav-list" aria-label="Main navigation">
          <span className="nav-label">{locale === "ar" ? "الحساب" : "MY FINOVA"}</span>
          {navItems.map(([id, Icon]) => (
            <button key={id} className={cx("nav-item", page === id && "nav-item--active")} onClick={() => { setPage(id); setMobileOpen(false); }}>
              <Icon size={20} stroke={1.8} />
              <span>{t[id]}</span>
              {id === "notifications" && <b className="nav-badge">6</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-help"><IconHelpCircle size={20} /><div><b>{locale === "ar" ? "تحتاج مساعدة؟" : "Need a hand?"}</b><span>{locale === "ar" ? "مركز الدعم متاح" : "Support centre is open"}</span></div><IconArrowRight size={18} /></div>
        <div className="sidebar-user"><span className="avatar">{user.role === "ops" ? "OP" : "LH"}</span><span><b>{user.name}</b><small>{locale === "ar" ? (user.role === "ops" ? "حساب العمليات" : "حساب شخصي") : (user.role === "ops" ? "Operations account" : "Personal account")}</small></span><button className="icon-button" onClick={onLogout} aria-label={t.logout}><IconLogout size={19} /></button></div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    </>
  );
}

function Header({ page, setPage, locale, setLocale, period, setPeriod, user, setMobileOpen }) {
  const t = COPY[locale];
  return (
    <header className="topbar">
      <div className="topbar__title">
        <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open menu"><IconMenu2 /></button>
        <div><h1>{page === "overview" ? (user.role === "ops" ? t.welcomeOps : t.welcome) : t[page]}</h1><p>{page === "overview" ? t.subtitle : pageDescriptions[locale][page]}</p></div>
      </div>
      <div className="topbar__actions">
        <div className="period-switcher" aria-label="Time period">{[["7", t.period7], ["30", t.period30], ["90", t.period90], ["365", t.periodYear]].map(([id, label]) => <button key={id} className={period === id ? "active" : ""} onClick={() => setPeriod(id)}>{label}</button>)}</div>
        <button className="icon-button header-action" onClick={() => setLocale(locale === "en" ? "ar" : "en")} aria-label="Switch language"><IconLanguage /><span>{locale === "en" ? "AR" : "EN"}</span></button>
        <button className="icon-button header-action has-indicator" onClick={() => setPage("notifications")} aria-label={t.notifications}><IconBell /><i /></button>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, detail, tone, delta }) {
  return <article className="stat-card"><span className={cx("stat-icon", `stat-icon--${tone}`)}><Icon size={20} /></span><div><span>{label}</span><strong>{value}</strong><small className={delta?.startsWith("+") ? "positive" : "muted"}>{delta} {detail}</small></div></article>;
}

function TransactionRow({ txn, locale, compact = false }) {
  const ar = locale === "ar";
  const merchant = txn.merchantId ? merchants.find((item) => item.id === txn.merchantId) : null;
  return (
    <div className={cx("transaction-row", compact && "transaction-row--compact")}>
      <span className={cx("transaction-icon", txn.direction === "in" ? "transaction-icon--in" : "")}>
        {txn.direction === "in" ? <IconArrowDownLeft size={20} /> : txn.channel === "Transfer" ? <IconArrowUpRight size={20} /> : <IconBuildingStore size={19} />}
      </span>
      <span className="transaction-main"><b>{ar ? txn.descriptionAr : txn.description}</b><small>{merchant ? (ar ? merchant.nameAr : merchant.name) : txn.reference}</small></span>
      {!compact && <span className="transaction-meta"><b>{txn.category}</b><small>{formatDate(txn.timestamp, locale)}</small></span>}
      <span className="transaction-amount"><b className={txn.direction === "in" ? "positive" : ""}>{txn.direction === "in" ? "+" : "−"}{formatMoney(txn.amount, txn.currency, locale)}</b><small className={cx("status-pill", `status-${txn.status.toLowerCase()}`)}>{localizedStatus(txn.status, locale)}</small></span>
    </div>
  );
}

function Overview({ locale, period, setPage, privacy, setPrivacy }) {
  const t = COPY[locale];
  const total = accounts.reduce((sum, item) => sum + item.balance * (item.currency === "USD" ? 3.75 : 1), 0);
  const periodData = period === "7" ? cashflow.slice(-3) : period === "30" ? cashflow.slice(-5) : period === "90" ? cashflow.slice(-8) : cashflow;
  const chartData = periodData.map((item) => ({ ...item, month: locale === "ar" ? MONTH_AR[item.month] : item.month }));
  return (
    <div className="page-stack">
      <section className="balance-hero">
        <div className="balance-hero__primary">
          <div className="balance-label"><span>{t.totalBalance}</span><button className="icon-button" onClick={() => setPrivacy(!privacy)} aria-label="Toggle balance visibility">{privacy ? <IconEye size={19} /> : <IconEyeOff size={19} />}</button></div>
          <strong>{privacy ? formatMoney(total, "SAR", locale) : "••••••••"}</strong>
          <small>{t.available}: {privacy ? formatMoney(138088.48, "SAR", locale) : "••••••"}</small>
        </div>
        <div className="balance-hero__status"><span><IconShieldCheck size={18} /> {locale === "ar" ? "جميع الحسابات محمية" : "All accounts protected"}</span><small>{locale === "ar" ? "آخر مزامنة الآن" : "Synced just now"}</small></div>
        <span className="balance-glow" />
      </section>

      <section className="stats-grid">
        <StatCard icon={IconArrowDownLeft} tone="green" label={t.income} value={privacy ? formatMoney(29400, "SAR", locale) : "••••"} delta="+5.2%" detail={locale === "ar" ? "عن الشهر الماضي" : "vs last month"} />
        <StatCard icon={IconArrowUpRight} tone="violet" label={t.spending} value={privacy ? formatMoney(14640, "SAR", locale) : "••••"} delta="−7.8%" detail={locale === "ar" ? "عن الشهر الماضي" : "vs last month"} />
        <StatCard icon={IconChartPie} tone="amber" label={locale === "ar" ? "معدل الادخار" : "Savings rate"} value="50.2%" delta="+4.1%" detail={locale === "ar" ? "هذا الشهر" : "this month"} />
      </section>

      <section className="overview-grid">
        <article className="panel cashflow-panel">
          <div className="panel-head"><div><h2>{t.cashflow}</h2><p>{locale === "ar" ? "الدخل مقابل الإنفاق عبر الفترة" : "Income compared with spending over time"}</p></div><div className="chart-legend"><span><i className="dot dot--green" />{t.income}</span><span><i className="dot dot--violet" />{t.spending}</span></div></div>
          <div className="chart-wrap" role="img" aria-label="Cash flow chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#18cbb5" stopOpacity={0.28} /><stop offset="95%" stopColor="#18cbb5" stopOpacity={0} /></linearGradient><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c6cf4" stopOpacity={0.22} /><stop offset="95%" stopColor="#7c6cf4" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#243247" strokeDasharray="3 5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8290a5", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8290a5", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "#101a2a", border: "1px solid #2a3a52", borderRadius: 10, color: "#e9eef7" }} formatter={(v) => formatMoney(v, "SAR", locale)} />
                <Area type="monotone" dataKey="income" stroke="#18cbb5" fill="url(#incomeFill)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="spending" stroke="#7c6cf4" fill="url(#spendFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel spending-panel">
          <div className="panel-head"><div><h2>{t.categorySpend}</h2><p>{locale === "ar" ? "آخر ٣٠ يوماً" : "Last 30 days"}</p></div><button className="icon-button" aria-label={locale === "ar" ? "خيارات الإنفاق" : "Spending options"}><IconDots /></button></div>
          <div className="donut-layout">
            <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendingByCategory} dataKey="value" innerRadius={58} outerRadius={78} paddingAngle={4} stroke="none">{spendingByCategory.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: "#101a2a", border: "1px solid #2a3a52", borderRadius: 10 }} formatter={(v) => formatMoney(v, "SAR", locale)} /></PieChart></ResponsiveContainer><div className="donut-center"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><b>{formatMoney(11660, "SAR", locale)}</b></div></div>
            <div className="category-list">{spendingByCategory.slice(0, 4).map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{locale === "ar" ? item.nameAr : item.name}</span><b>{formatMoney(item.value, "SAR", locale)}</b></div>)}</div>
          </div>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel transaction-panel"><div className="panel-head"><div><h2>{t.recentTransactions}</h2><p>{locale === "ar" ? "آخر نشاط عبر حساباتك" : "Latest activity across your accounts"}</p></div><button className="link-button arrow-link" onClick={() => setPage("transactions")}>{t.viewAll}<IconArrowRight size={17} /></button></div><div className="transaction-list">{transactions.slice(0, 6).map((txn) => <TransactionRow key={txn.id} txn={txn} locale={locale} compact />)}</div></article>
        <article className="panel quick-panel"><div className="panel-head"><div><h2>{t.quickActions}</h2><p>{locale === "ar" ? "أكثر ما تستخدمه" : "Your most-used tools"}</p></div></div><div className="quick-grid">
          {[["transfers", IconArrowUpRight, t.sendMoney, "green"], ["bills", IconReceipt, t.payBill, "violet"], ["beneficiaries", IconUserPlus, t.addRecipient, "blue"], ["accounts", IconDownload, t.download, "amber"]].map(([id, Icon, label, tone]) => <button key={id} onClick={() => setPage(id)}><span className={`quick-icon quick-icon--${tone}`}><Icon size={22} /></span><b>{label}</b><IconArrowRight size={17} /></button>)}
        </div><div className="insight-card"><IconActivity size={21} /><div><b>{locale === "ar" ? "إنفاقك أقل بنسبة ٧٫٨٪" : "You spent 7.8% less"}</b><span>{locale === "ar" ? "مقارنة بنفس الفترة الشهر الماضي" : "Compared with the same period last month"}</span></div></div></article>
      </section>
    </div>
  );
}

function AccountsPage({ locale }) {
  const [localCards, setLocalCards] = useState(cards);
  const [copied, setCopied] = useState("");
  function copyIban(account) {
    navigator.clipboard?.writeText(account.iban);
    setCopied(account.id);
    window.setTimeout(() => setCopied(""), 1200);
  }
  function toggleCard(id) { setLocalCards((items) => items.map((card) => card.id === id ? { ...card, status: card.status === "active" ? "locked" : "active" } : card)); }
  return <div className="page-stack"><section className="section-heading"><div><h2>{locale === "ar" ? "حساباتي" : "My accounts"}</h2><p>{locale === "ar" ? "أربعة أرصدة منفصلة ومحمية" : "Four separate, protected balances"}</p></div><button className="secondary-button"><IconPlus size={18} />{locale === "ar" ? "حساب جديد" : "Open account"}</button></section><div className="account-grid">{accounts.map((account) => <article className={cx("account-card", `account-card--${account.color}`)} key={account.id}><div className="account-card__top"><span className="account-icon"><IconWallet size={21} /></span><button className="icon-button" aria-label={`${locale === "ar" ? "خيارات" : "Options for"} ${locale === "ar" ? account.typeAr : account.type}`}><IconDots /></button></div><span>{locale === "ar" ? account.typeAr : account.type}</span><strong>{formatMoney(account.balance, account.currency, locale)}</strong><small>{account.number}</small><div className="account-card__foot"><span>{locale === "ar" ? "متاح" : "Available"}<b>{formatMoney(account.available, account.currency, locale)}</b></span><button className="icon-button" onClick={() => copyIban(account)} aria-label="Copy IBAN">{copied === account.id ? <IconCheck size={18} /> : <IconCopy size={18} />}</button></div></article>)}</div>
    <section className="section-heading section-heading--spaced"><div><h2>{locale === "ar" ? "بطاقاتي" : "My cards"}</h2><p>{locale === "ar" ? "عرض الحدود والتحكم الفوري" : "Limits and instant card controls"}</p></div><button className="secondary-button"><IconPlus size={18} />{locale === "ar" ? "بطاقة جديدة" : "Add card"}</button></section>
    <div className="cards-layout"><div className="payment-cards">{localCards.map((card) => <article key={card.id} className={cx("payment-card", `payment-card--${card.color}`, card.status === "locked" && "payment-card--locked")}><div className="payment-card__head"><Brand compact /><span className="card-network">{card.network}</span></div><div className="card-chip"><span /><span /><span /></div><strong>{card.number}</strong><div className="payment-card__meta"><span><small>{locale === "ar" ? "حامل البطاقة" : "CARD HOLDER"}</small>{card.holder}</span><span><small>{locale === "ar" ? "صالحة حتى" : "VALID THRU"}</small>{card.expiry}</span></div>{card.status === "locked" && <div className="locked-overlay"><IconLock size={18} />{locale === "ar" ? "مقفلة" : "LOCKED"}</div>}</article>)}</div>
      <div className="panel card-controls"><div className="panel-head"><div><h2>{locale === "ar" ? "ضوابط البطاقة" : "Card controls"}</h2><p>{locale === "ar" ? "تحكم فوري وآمن في بطاقاتك" : "Instant, secure controls for your cards"}</p></div></div>{localCards.map((card) => <div className="card-control-row" key={card.id}><span className={cx("mini-card", `mini-card--${card.color}`)}><IconCreditCard size={20} /></span><span className="control-main"><b>{locale === "ar" ? card.labelAr : card.label}</b><small>{card.number} · {localizedStatus(card.status, locale)}</small><i><em style={{ width: `${Math.min(100, card.spent / card.limit * 100)}%` }} /></i><small>{formatMoney(card.spent, "SAR", locale)} / {formatMoney(card.limit, "SAR", locale)}</small></span><button className={cx("toggle", card.status === "active" && "toggle--on")} onClick={() => toggleCard(card.id)} aria-label={locale === "ar" ? "تبديل حالة البطاقة" : "Toggle card"}><span /></button></div>)}</div></div>
  </div>;
}

function TransactionsPage({ locale }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [direction, setDirection] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 12;
  const filtered = useMemo(() => transactions.filter((txn) => {
    const text = `${txn.description} ${txn.descriptionAr} ${txn.reference} ${txn.category}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "All" || txn.status === status) && (direction === "All" || txn.direction === direction);
  }), [query, status, direction]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => setPage(1), [query, status, direction]);
  return <div className="page-stack"><section className="panel table-panel"><div className="table-tools"><div className="search-box"><IconSearch size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث بالاسم أو المرجع..." : "Search name or reference…"} /></div><div className="select-wrap"><IconFilter size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)}>{["All", "Completed", "Pending", "Reversed"].map((item) => <option key={item} value={item}>{localizedStatus(item, locale)}</option>)}</select></div><div className="select-wrap"><IconArrowsLeftRight size={17} /><select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="All">{locale === "ar" ? "كل الاتجاهات" : "All directions"}</option><option value="in">{locale === "ar" ? "وارد" : "Money in"}</option><option value="out">{locale === "ar" ? "صادر" : "Money out"}</option></select></div><button className="secondary-button"><IconDownload size={18} />{locale === "ar" ? "تصدير" : "Export"}</button></div><div className="table-summary"><span>{locale === "ar" ? "عرض" : "Showing"} <b>{filtered.length}</b> {locale === "ar" ? "معاملة" : "transactions"}</span><span>{locale === "ar" ? "آخر تحديث: الآن" : "Updated just now"}</span></div><div className="transaction-table">{filtered.slice((page - 1) * perPage, page * perPage).map((txn) => <TransactionRow key={txn.id} txn={txn} locale={locale} />)}{filtered.length === 0 && <EmptyState locale={locale} label="transactions" />}</div><div className="pagination"><span>{locale === "ar" ? `صفحة ${page} من ${pages}` : `Page ${page} of ${pages}`}</span><div><button className="icon-button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><IconChevronLeft /></button><button className="icon-button" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><IconChevronRight /></button></div></div></section></div>;
}

function TransferPage({ locale, setToast }) {
  const [recipient, setRecipient] = useState(beneficiaries[0].id);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState(0);
  const selected = beneficiaries.find((item) => item.id === recipient);
  const numeric = Number(amount);
  function review(event) { event.preventDefault(); if (numeric > 0 && numeric <= accounts[0].available) setStep(1); }
  function confirm() { setStep(2); }
  function close() { if (step === 2) { setToast(locale === "ar" ? "تمت جدولة الحوالة بنجاح" : "Transfer scheduled successfully"); setAmount(""); setNote(""); } setStep(0); }
  return <div className="transfer-layout"><form className="panel transfer-form" onSubmit={review}><div className="panel-head"><div><h2>{locale === "ar" ? "حوالة جديدة" : "New transfer"}</h2><p>{locale === "ar" ? "إرسال آمن إلى مستفيد محفوظ" : "Secure payment to a saved beneficiary"}</p></div><span className="secure-badge"><IconShieldCheck size={16} />{locale === "ar" ? "محمي" : "Protected"}</span></div><div className="from-account"><span className="account-icon"><IconWallet size={20} /></span><span><small>{locale === "ar" ? "من" : "From"}</small><b>{locale === "ar" ? accounts[0].typeAr : accounts[0].type} {accounts[0].number}</b></span><strong>{formatMoney(accounts[0].available, "SAR", locale)}</strong></div><label className="field"><span>{locale === "ar" ? "إلى المستفيد" : "To beneficiary"}</span><div className="select-field"><span className="avatar avatar--small">{selected.initials}</span><select value={recipient} onChange={(event) => setRecipient(event.target.value)}>{beneficiaries.slice(0, 30).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.bank}</option>)}</select></div></label><label className="field"><span>{locale === "ar" ? "المبلغ" : "Amount"}</span><div className="money-input"><span>SAR</span><input type="number" min="1" max={accounts[0].available} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div></label><div className="amount-chips">{[250, 500, 1000, 2500].map((value) => <button type="button" key={value} onClick={() => setAmount(String(value))}>{formatMoney(value, "SAR", locale)}</button>)}</div><label className="field"><span>{locale === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"}</span><input className="plain-input" value={note} onChange={(event) => setNote(event.target.value)} maxLength={80} placeholder={locale === "ar" ? "سبب الحوالة" : "What is this for?"} /></label><div className="fee-row"><span>{locale === "ar" ? "رسوم الحوالة" : "Transfer fee"}</span><b>{formatMoney(0, "SAR", locale)}</b></div><button className="primary-button transfer-submit" disabled={!numeric || numeric > accounts[0].available}>{locale === "ar" ? "مراجعة الحوالة" : "Review transfer"}<IconArrowRight size={19} /></button><p className="simulation-note"><IconInfoCircle size={16} />{locale === "ar" ? "سنراجع اسم المستفيد والمبلغ قبل جدولة الحوالة." : "We will verify the recipient and amount before scheduling this transfer."}</p></form>
    <div className="transfer-side"><article className="panel"><div className="panel-head"><div><h2>{locale === "ar" ? "مستفيدون متكررون" : "Frequent recipients"}</h2><p>{locale === "ar" ? "وصول سريع للأكثر استخداماً" : "Quick access to your favourites"}</p></div></div><div className="recipient-list">{beneficiaries.slice(0, 6).map((item) => <button key={item.id} onClick={() => setRecipient(item.id)} className={recipient === item.id ? "selected" : ""}><span className="avatar avatar--small">{item.initials}</span><span><b>{item.name}</b><small>{item.bank} · {item.iban.slice(-8)}</small></span><IconChevronRight size={18} /></button>)}</div></article><article className="panel transfer-tip"><span className="stat-icon stat-icon--green"><IconShieldCheck /></span><div><b>{locale === "ar" ? "تحقق قبل الإرسال" : "Pause before you pay"}</b><p>{locale === "ar" ? "تأكد من اسم المستفيد والمبلغ. لن يطلب منك فريق فينوفا إرسال أموال لحماية حسابك." : "Check the recipient and amount. Finova will never ask you to transfer money to protect your account."}</p></div></article></div>
    {step > 0 && <Modal onClose={close}><div className="confirmation">{step === 1 ? <><span className="confirm-icon"><IconArrowsLeftRight /></span><h2>{locale === "ar" ? "تأكيد الحوالة" : "Confirm transfer"}</h2><p>{locale === "ar" ? "راجع التفاصيل قبل الإرسال" : "Check the details before sending"}</p><div className="confirm-recipient"><span className="avatar">{selected.initials}</span><span><b>{selected.name}</b><small>{selected.bank} · {selected.iban.slice(-12)}</small></span></div><dl><div><dt>{locale === "ar" ? "المبلغ" : "Amount"}</dt><dd>{formatMoney(numeric, "SAR", locale)}</dd></div><div><dt>{locale === "ar" ? "الرسوم" : "Fee"}</dt><dd>{formatMoney(0, "SAR", locale)}</dd></div><div><dt>{locale === "ar" ? "الإجمالي" : "Total"}</dt><dd>{formatMoney(numeric, "SAR", locale)}</dd></div></dl><div className="modal-actions"><button className="secondary-button" onClick={close}>{locale === "ar" ? "رجوع" : "Go back"}</button><button className="primary-button" onClick={confirm}>{locale === "ar" ? "تأكيد وإرسال" : "Confirm & send"}</button></div></> : <><span className="success-icon"><IconCircleCheck /></span><h2>{locale === "ar" ? "تمت جدولة الحوالة" : "Transfer scheduled"}</h2><p>{locale === "ar" ? "تم استلام طلبك وسيظهر تحديث الحالة في سجل المعاملات." : "Your request was received. Its status will appear in your transaction history."}</p><div className="receipt-number">FNV-{Date.now().toString().slice(-10)}</div><button className="primary-button full-button" onClick={close}>{locale === "ar" ? "تم" : "Done"}</button></>}</div></Modal>}
  </div>;
}

function BeneficiariesPage({ locale }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  const visible = beneficiaries.filter((item) => `${item.name} ${item.bank} ${item.iban}`.toLowerCase().includes(query.toLowerCase())).slice(0, limit);
  return <div className="page-stack"><div className="table-tools beneficiaries-tools"><div className="search-box"><IconSearch size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={locale === "ar" ? "ابحث عن مستفيد..." : "Search beneficiaries…"} /></div><button className="primary-button"><IconUserPlus size={18} />{locale === "ar" ? "مستفيد جديد" : "New beneficiary"}</button></div><div className="beneficiary-grid">{visible.map((item) => <article className="panel beneficiary-card" key={item.id}><div className="beneficiary-head"><span className="avatar">{item.initials}</span>{item.trusted && <span className="verified"><IconShieldCheck size={15} />{locale === "ar" ? "موثوق" : "Trusted"}</span>}</div><h3>{item.name}</h3><p>{item.nickname} · {item.bank}</p><code>{item.iban}</code><div><button className="secondary-button"><IconArrowUpRight size={17} />{locale === "ar" ? "تحويل" : "Send"}</button><button className="icon-button" aria-label={`${locale === "ar" ? "خيارات المستفيد" : "Options for"} ${item.name}`}><IconDots /></button></div></article>)}</div>{visible.length < beneficiaries.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).length && <button className="load-more secondary-button" onClick={() => setLimit(limit + 24)}>{locale === "ar" ? "عرض المزيد" : "Load more"}</button>}</div>;
}

function BillsPage({ locale, setToast }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const filtered = bills.filter((bill) => filter === "All" || bill.status === filter);
  function pay() { setSelected(null); setToast(locale === "ar" ? "تم دفع الفاتورة بنجاح" : "Bill payment completed"); }
  return <div className="page-stack"><section className="bill-summary"><StatCard icon={IconFileInvoice} tone="violet" label={locale === "ar" ? "مستحق قريباً" : "Due soon"} value={formatMoney(bills.filter((b) => b.status === "Due soon").reduce((s, b) => s + b.amount, 0), "SAR", locale)} detail={locale === "ar" ? "٣ فواتير" : "3 bills"} delta="" /><StatCard icon={IconCalendar} tone="amber" label={locale === "ar" ? "مجدول" : "Scheduled"} value={formatMoney(bills.filter((b) => b.status === "Scheduled").slice(0, 5).reduce((s, b) => s + b.amount, 0), "SAR", locale)} detail={locale === "ar" ? "هذا الشهر" : "this month"} delta="" /><StatCard icon={IconCircleCheck} tone="green" label={locale === "ar" ? "مدفوع" : "Paid"} value={formatMoney(bills.filter((b) => b.status === "Paid").slice(0, 8).reduce((s, b) => s + b.amount, 0), "SAR", locale)} detail={locale === "ar" ? "آخر ٣٠ يوماً" : "last 30 days"} delta="" /></section><section className="panel table-panel"><div className="table-tools"><div className="status-tabs">{["All", "Due soon", "Scheduled", "Paid", "Overdue"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{localizedStatus(item, locale)}</button>)}</div><button className="secondary-button"><IconPlus size={18} />{locale === "ar" ? "إضافة فاتورة" : "Add bill"}</button></div><div className="invoice-table"><div className="invoice-row invoice-row--head"><span>{locale === "ar" ? "الجهة" : "Provider"}</span><span>{locale === "ar" ? "الاستحقاق" : "Due date"}</span><span>{locale === "ar" ? "الحالة" : "Status"}</span><span>{locale === "ar" ? "المبلغ" : "Amount"}</span><span /></div>{filtered.slice(0, 18).map((bill) => <div className="invoice-row" key={bill.id}><span className="invoice-provider"><i><IconReceipt size={19} /></i><b>{locale === "ar" ? bill.providerAr : bill.provider}<small>{bill.id} · {bill.type}</small></b></span><span>{formatDate(bill.dueDate, locale)}</span><span><em className={cx("status-pill", `bill-${bill.status.toLowerCase().replace(" ", "-")}`)}>{localizedStatus(bill.status, locale)}</em></span><strong>{formatMoney(bill.amount, bill.currency, locale)}</strong><button className="secondary-button small-button" onClick={() => setSelected(bill)} disabled={bill.status === "Paid"}>{bill.status === "Paid" ? (locale === "ar" ? "مدفوعة" : "Paid") : (locale === "ar" ? "دفع" : "Pay")}</button></div>)}</div></section>{selected && <Modal onClose={() => setSelected(null)}><div className="confirmation"><span className="confirm-icon"><IconReceipt /></span><h2>{locale === "ar" ? "دفع الفاتورة" : "Pay bill"}</h2><p>{locale === "ar" ? selected.providerAr : selected.provider} · {selected.id}</p><strong className="modal-amount">{formatMoney(selected.amount, selected.currency, locale)}</strong><div className="inline-alert"><IconInfoCircle size={18} />{locale === "ar" ? "راجع الجهة والمبلغ قبل تأكيد الدفع." : "Review the provider and amount before confirming payment."}</div><div className="modal-actions"><button className="secondary-button" onClick={() => setSelected(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</button><button className="primary-button" onClick={pay}>{locale === "ar" ? "تأكيد" : "Confirm"}</button></div></div></Modal>}</div>;
}

function MerchantsPage({ locale }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [limit, setLimit] = useState(24);
  const categories = ["All", ...new Set(merchants.map((item) => item.category))];
  const filtered = merchants.filter((item) => `${item.name} ${item.nameAr} ${item.city}`.toLowerCase().includes(query.toLowerCase()) && (category === "All" || item.category === category));
  return <div className="page-stack"><div className="table-tools"><div className="search-box"><IconSearch size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={locale === "ar" ? "ابحث عن تاجر..." : "Search merchants…"} /></div><div className="select-wrap"><IconBuildingStore size={17} /><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div><div className="merchant-grid">{filtered.slice(0, limit).map((item) => <article className="panel merchant-card" key={item.id}><span className="merchant-icon"><IconBuildingStore /></span><div><h3>{locale === "ar" ? item.nameAr : item.name}</h3><p>{item.category} · {item.city}</p></div><span className={item.trusted ? "verified" : "review-badge"}>{item.trusted ? <IconShieldCheck size={15} /> : <IconAlertTriangle size={15} />}{item.trusted ? (locale === "ar" ? "موثوق" : "Trusted") : (locale === "ar" ? "للمراجعة" : "Review")}</span><strong>{formatMoney(item.spend, "SAR", locale)}</strong><small>{locale === "ar" ? "إجمالي الإنفاق" : "total spend"}</small></article>)}</div>{limit < filtered.length && <button className="load-more secondary-button" onClick={() => setLimit(limit + 24)}>{locale === "ar" ? "عرض المزيد" : "Load more"}</button>}</div>;
}

function NotificationsPage({ locale }) {
  const [read, setRead] = useState(new Set(notifications.filter((item) => item.read).map((item) => item.id)));
  const [filter, setFilter] = useState("All");
  const filtered = notifications.filter((item) => filter === "All" || item.type === filter);
  const iconMap = { security: IconShieldCheck, payment: IconCreditCard, transfer: IconArrowsLeftRight, insight: IconActivity };
  function markAll() { setRead(new Set(notifications.map((item) => item.id))); }
  return <div className="page-stack"><section className="panel notification-panel"><div className="table-tools"><div className="status-tabs">{["All", "security", "payment", "transfer", "insight"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="link-button" onClick={markAll}><IconCheck size={17} />{locale === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}</button></div><div className="notification-list">{filtered.slice(0, 40).map((item) => { const Icon = iconMap[item.type]; const unread = !read.has(item.id); return <button key={item.id} className={cx("notification-row", unread && "notification-row--unread")} onClick={() => setRead(new Set(read).add(item.id))}><span className={cx("notification-icon", `notification-icon--${item.type}`)}><Icon size={20} /></span><span><b>{locale === "ar" ? item.titleAr : item.title}</b><small>{item.detail}</small></span><time>{formatDate(item.timestamp, locale, true)}</time>{unread && <i className="unread-dot" />}</button>; })}</div></section></div>;
}

function SecurityPage({ locale, setToast }) {
  const [tab, setTab] = useState("profile");
  const [settings, setSettings] = useState({ biometric: true, alerts: true, transfers: true, marketing: false });
  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });
  return <div className="settings-layout"><aside className="settings-tabs"><button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><IconUser size={19} />{locale === "ar" ? "الملف الشخصي" : "Personal details"}</button><button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}><IconShieldLock size={19} />{locale === "ar" ? "الأمان" : "Security"}</button><button className={tab === "devices" ? "active" : ""} onClick={() => setTab("devices")}><IconDeviceDesktop size={19} />{locale === "ar" ? "الأجهزة" : "Devices & sessions"}</button><button className={tab === "preferences" ? "active" : ""} onClick={() => setTab("preferences")}><IconSettings size={19} />{locale === "ar" ? "التفضيلات" : "Preferences"}</button></aside><section className="panel settings-panel">{tab === "profile" && <><div className="profile-hero"><span className="avatar avatar--large">LH</span><div><h2>Layla Haddad</h2><p>l•••••.h•••••@mail.com</p><span className="verified"><IconShieldCheck size={15} />{locale === "ar" ? "هوية موثقة" : "Verified identity"}</span></div><button className="secondary-button">{locale === "ar" ? "تغيير الصورة" : "Change photo"}</button></div><div className="profile-form"><label className="field"><span>{locale === "ar" ? "الاسم الأول" : "First name"}</span><input className="plain-input" defaultValue="Layla" /></label><label className="field"><span>{locale === "ar" ? "اسم العائلة" : "Last name"}</span><input className="plain-input" defaultValue="Haddad" /></label><label className="field"><span>{locale === "ar" ? "رقم الهاتف" : "Mobile number"}</span><input className="plain-input" defaultValue="+966 55 000 7842" /></label><label className="field"><span>{locale === "ar" ? "المدينة" : "City"}</span><input className="plain-input" defaultValue="Riyadh" /></label></div><button className="primary-button" onClick={() => setToast(locale === "ar" ? "تم حفظ الملف الشخصي" : "Profile saved")}>{locale === "ar" ? "حفظ التغييرات" : "Save changes"}</button></>}
        {tab === "security" && <><div className="panel-head"><div><h2>{locale === "ar" ? "حماية الحساب" : "Account protection"}</h2><p>{locale === "ar" ? "إعدادات الحماية الخاصة بحسابك" : "Protection settings for your account"}</p></div><span className="security-score">94 / 100</span></div><div className="security-banner"><IconShieldCheck /><div><b>{locale === "ar" ? "حسابك محمي جيداً" : "Your account is well protected"}</b><span>{locale === "ar" ? "آخر فحص أمني: اليوم ١٠:٤٢" : "Last security review: today at 10:42"}</span></div></div><SettingsRow icon={IconKey} title={locale === "ar" ? "كلمة المرور" : "Password"} detail={locale === "ar" ? "آخر تغيير قبل ٢١ يوماً" : "Last changed 21 days ago"} action={locale === "ar" ? "تغيير" : "Change"} /><SettingsRow icon={IconFingerprint} title={locale === "ar" ? "التحقق بخطوتين" : "Two-step verification"} detail={locale === "ar" ? "تطبيق المصادقة مفعل" : "Authenticator app enabled"} action={locale === "ar" ? "إدارة" : "Manage"} badge="Enabled" /><SettingsRow icon={IconBell} title={locale === "ar" ? "تنبيهات تسجيل الدخول" : "Sign-in alerts"} detail={locale === "ar" ? "تنبيه لكل جهاز جديد" : "Alert for every new device"} toggle value={settings.alerts} onToggle={() => toggle("alerts")} /></>}
        {tab === "devices" && <><div className="panel-head"><div><h2>{locale === "ar" ? "الأجهزة والجلسات" : "Devices & sessions"}</h2><p>{locale === "ar" ? "راجع الأجهزة والجلسات النشطة على حسابك" : "Review devices and active sessions on your account"}</p></div></div><div className="current-device"><span className="stat-icon stat-icon--green"><IconDeviceDesktop /></span><div><b>Windows · Edge</b><span>Riyadh, SA · 192.0.2.34</span></div><em>{locale === "ar" ? "هذا الجهاز" : "This device"}</em></div><div className="login-list">{loginActivity.slice(1, 9).map((item) => <div key={item.id}><span className="mini-device"><IconDeviceDesktop size={19} /></span><span><b>{item.device}</b><small>{item.location} · {item.ip}</small></span><time>{formatDate(item.timestamp, locale, true)}</time><em className={item.status === "Blocked" ? "danger" : "positive"}>{localizedStatus(item.status, locale)}</em></div>)}</div></>}
        {tab === "preferences" && <><div className="panel-head"><div><h2>{locale === "ar" ? "الإشعارات والتفضيلات" : "Notifications & preferences"}</h2><p>{locale === "ar" ? "اختر التحديثات التي تهمك" : "Choose the updates that matter to you"}</p></div></div><SettingsRow icon={IconCreditCard} title={locale === "ar" ? "تنبيهات البطاقات" : "Card activity"} detail={locale === "ar" ? "كل عملية شراء واسترداد" : "Every purchase and refund"} toggle value={settings.alerts} onToggle={() => toggle("alerts")} /><SettingsRow icon={IconArrowsLeftRight} title={locale === "ar" ? "تحديثات الحوالات" : "Transfer updates"} detail={locale === "ar" ? "تأكيدات وحالات الحوالات" : "Confirmations and status changes"} toggle value={settings.transfers} onToggle={() => toggle("transfers")} /><SettingsRow icon={IconActivity} title={locale === "ar" ? "ملخص أسبوعي" : "Weekly insights"} detail={locale === "ar" ? "تحليل إنفاقك كل أسبوع" : "A weekly view of your spending"} toggle value={settings.biometric} onToggle={() => toggle("biometric")} /><SettingsRow icon={IconBuildingStore} title={locale === "ar" ? "عروض المنتج" : "Product updates"} detail={locale === "ar" ? "مزايا وتجارب جديدة" : "New features and experiences"} toggle value={settings.marketing} onToggle={() => toggle("marketing")} /></>}
      </section></div>;
}

function SettingsRow({ icon: Icon, title, detail, action, badge, toggle, value, onToggle }) {
  return <div className="settings-row"><span className="settings-icon"><Icon size={20} /></span><span><b>{title}</b><small>{detail}</small></span>{badge && <em className="verified"><IconCheck size={14} />{badge}</em>}{action && <button className="secondary-button small-button">{action}</button>}{toggle && <button className={cx("toggle", value && "toggle--on")} onClick={onToggle} aria-label={title}><span /></button>}</div>;
}

function EmptyState({ locale, label }) { return <div className="empty-state"><span><IconSearch /></span><h3>{locale === "ar" ? "لا توجد نتائج" : `No ${label} found`}</h3><p>{locale === "ar" ? "جرّب تغيير البحث أو عوامل التصفية." : "Try changing your search or filters."}</p></div>; }

function Modal({ children, onClose }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true"><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><IconX /></button>{children}</section></div>; }

function AppShell({ user, locale, setLocale, onLogout }) {
  const [page, setPage] = useState("overview");
  const [period, setPeriod] = useState("365");
  const [privacy, setPrivacy] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(""), 2800); return () => clearTimeout(timer); }, [toast]);
  const content = {
    overview: <Overview locale={locale} period={period} setPage={setPage} privacy={privacy} setPrivacy={setPrivacy} />,
    accounts: <AccountsPage locale={locale} />,
    transactions: <TransactionsPage locale={locale} />,
    transfers: <TransferPage locale={locale} setToast={setToast} />,
    beneficiaries: <BeneficiariesPage locale={locale} />,
    bills: <BillsPage locale={locale} setToast={setToast} />,
    merchants: <MerchantsPage locale={locale} />,
    notifications: <NotificationsPage locale={locale} />,
    security: <SecurityPage locale={locale} setToast={setToast} />,
  }[page];
  return <div className="app-shell" dir={locale === "ar" ? "rtl" : "ltr"}><Sidebar page={page} setPage={setPage} locale={locale} user={user} onLogout={onLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /><div className="app-main"><Header page={page} setPage={setPage} locale={locale} setLocale={setLocale} period={period} setPeriod={setPeriod} user={user} setMobileOpen={setMobileOpen} /><main className="content">{content}<footer><span><IconShieldCheck size={15} />Finova Secure</span><span>{locale === "ar" ? "الخصوصية · الشروط · الأمان" : "Privacy · Terms · Security"}</span><span>Protected banking</span></footer></main></div>{toast && <div className="toast" role="status"><IconCircleCheck size={20} />{toast}</div>}</div>;
}

export function App() {
  const [locale, setLocaleState] = useState(() => localStorage.getItem("finova-locale") || "en");
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem("finova-demo-session")); } catch { return null; } });
  function setLocale(value) { setLocaleState(value); localStorage.setItem("finova-locale", value); }
  function login(nextUser) { sessionStorage.setItem("finova-demo-session", JSON.stringify(nextUser)); setUser(nextUser); }
  function logout() { sessionStorage.removeItem("finova-demo-session"); setUser(null); }
  return user ? <AppShell user={user} locale={locale} setLocale={setLocale} onLogout={logout} /> : <Login locale={locale} setLocale={setLocale} onLogin={login} />;
}
