const ANCHOR = new Date("2026-07-31T12:00:00Z");

const merchantSeed = [
  ["Northstar Market", "سوق نورث ستار", "Groceries"],
  ["Cedar & Co.", "سيدر وشركاه", "Shopping"],
  ["Urban Basket", "أوربان باسكت", "Groceries"],
  ["Atlas Energy", "أطلس للطاقة", "Utilities"],
  ["Nebula Telecom", "نيبيولا للاتصالات", "Utilities"],
  ["Cedar Health", "سيدر للصحة", "Healthcare"],
  ["Nova Eats", "نوفا إيتس", "Dining"],
  ["Beacon Travel", "بيكون للسفر", "Travel"],
  ["Loom Home", "لوم للمنزل", "Shopping"],
  ["Pulse Fitness", "بالس للياقة", "Wellness"],
  ["Mirage Mobility", "ميراج للتنقل", "Transport"],
  ["Paper & Pixel", "بيبر آند بيكسل", "Education"],
];

const firstNames = ["Amina", "Omar", "Lina", "Yousef", "Maya", "Karim", "Dana", "Rami", "Salma", "Tariq", "Noor", "Hadi"];
const lastNames = ["Haddad", "Nasser", "Khoury", "Mansour", "Salem", "Darwish", "Farah", "Khalil", "Aziz", "Rahman"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function isoDaysAgo(days, hour = 9) {
  const date = new Date(ANCHOR);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

export const accounts = [
  { id: "ACC-4821", type: "Everyday account", typeAr: "الحساب اليومي", number: "•••• 4821", iban: "SA92 8000 0000 6080 1016 4821", balance: 42840.62, available: 41218.62, currency: "SAR", color: "cyan" },
  { id: "ACC-1936", type: "Savings vault", typeAr: "خزنة التوفير", number: "•••• 1936", iban: "SA66 8000 0000 6080 1420 1936", balance: 68120.00, available: 68120.00, currency: "SAR", color: "violet" },
  { id: "ACC-7204", type: "Travel wallet", typeAr: "محفظة السفر", number: "•••• 7204", iban: "SA18 8000 0000 6080 3300 7204", balance: 4860.30, available: 4860.30, currency: "USD", color: "amber" },
  { id: "ACC-5559", type: "Business reserve", typeAr: "احتياطي الأعمال", number: "•••• 5559", iban: "SA39 8000 0000 6080 9001 5559", balance: 26390.18, available: 23890.18, currency: "SAR", color: "emerald" },
];

export const cards = [
  { id: "CARD-9184", label: "Midnight Platinum", labelAr: "بلاتينيوم منتصف الليل", number: "•••• 9184", holder: "LAYLA HADDAD", expiry: "08/29", network: "NOVA", accountId: "ACC-4821", status: "active", limit: 25000, spent: 6438.24, color: "cyan", contactless: true },
  { id: "CARD-3017", label: "Travel Signature", labelAr: "بطاقة السفر", number: "•••• 3017", holder: "LAYLA HADDAD", expiry: "02/30", network: "NOVA", accountId: "ACC-7204", status: "active", limit: 12000, spent: 2280.12, color: "violet", contactless: true },
  { id: "CARD-6632", label: "Virtual Online", labelAr: "البطاقة الافتراضية", number: "•••• 6632", holder: "LAYLA HADDAD", expiry: "11/28", network: "NOVA", accountId: "ACC-4821", status: "locked", limit: 5000, spent: 410.45, color: "slate", contactless: false },
];

export const merchants = Array.from({ length: 120 }, (_, index) => {
  const seed = merchantSeed[index % merchantSeed.length];
  const branch = Math.floor(index / merchantSeed.length) + 1;
  return {
    id: `MER-${String(index + 1).padStart(4, "0")}`,
    name: branch === 1 ? seed[0] : `${seed[0]} ${branch}`,
    nameAr: branch === 1 ? seed[1] : `${seed[1]} ${branch}`,
    category: seed[2],
    city: ["Riyadh", "Jeddah", "Dammam", "Amman", "Dubai"][index % 5],
    trusted: index % 11 !== 0,
    spend: Number((180 + ((index * 97) % 2400) + (index % 7) * 0.35).toFixed(2)),
  };
});

const txnStatuses = ["Completed", "Completed", "Completed", "Pending", "Completed", "Reversed"];
const channels = ["Card", "Transfer", "Direct debit", "Wallet"];

export const transactions = Array.from({ length: 180 }, (_, index) => {
  const merchant = merchants[(index * 7) % merchants.length];
  const incoming = index % 9 === 0;
  const transfer = index % 5 === 0;
  const amount = incoming
    ? 850 + ((index * 379) % 14200) + (index % 3) * 0.5
    : 18 + ((index * 137) % 1680) + (index % 4) * 0.25;
  const status = txnStatuses[index % txnStatuses.length];
  return {
    id: `TXN-2026-${String(95180 - index).padStart(6, "0")}`,
    timestamp: isoDaysAgo(Math.floor(index / 3), 8 + (index % 10)),
    description: incoming ? (index % 18 === 0 ? "Monthly salary" : "Incoming transfer") : transfer ? `Transfer to ${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}` : merchant.name,
    descriptionAr: incoming ? (index % 18 === 0 ? "إيداع الراتب الشهري" : "حوالة واردة") : transfer ? `حوالة إلى ${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}` : merchant.nameAr,
    merchantId: incoming || transfer ? null : merchant.id,
    category: incoming ? "Income" : transfer ? "Transfers" : merchant.category,
    channel: transfer ? "Transfer" : channels[index % channels.length],
    accountId: accounts[index % accounts.length].id,
    direction: incoming ? "in" : "out",
    amount: Number(amount.toFixed(2)),
    currency: accounts[index % accounts.length].currency,
    status,
    reference: `NBL-${pad(index % 99)}${pad((index * 17) % 99)}-${String(6502 + index)}`,
  };
});

export const beneficiaries = Array.from({ length: 120 }, (_, index) => ({
  id: `BEN-${String(index + 1).padStart(4, "0")}`,
  name: `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`,
  nickname: index % 5 === 0 ? "Family" : index % 7 === 0 ? "Business" : "Saved recipient",
  bank: ["Crescent Bank", "Harbor Finance", "Juniper Bank", "Nova Digital"][index % 4],
  iban: `SA${pad(12 + (index % 70))} 8000 0000 60${pad(index)} ${String(12000000 + index * 791).slice(-8)}`,
  trusted: index < 18 || index % 4 !== 0,
  lastUsed: isoDaysAgo(index % 76),
  initials: `${firstNames[index % firstNames.length][0]}${lastNames[Math.floor(index / firstNames.length) % lastNames.length][0]}`,
}));

const billSeed = [
  ["Atlas Energy", "أطلس للطاقة", "Electricity"],
  ["Nebula Telecom", "نيبيولا للاتصالات", "Mobile"],
  ["Clearwater Utility", "كليرووتر للخدمات", "Water"],
  ["Horizon Internet", "هورايزن للإنترنت", "Internet"],
  ["Cedar Residence", "سيدر ريزيدنس", "Housing"],
];

export const bills = Array.from({ length: 120 }, (_, index) => {
  const provider = billSeed[index % billSeed.length];
  const status = index < 3 ? "Due soon" : index % 8 === 0 ? "Overdue" : index % 3 === 0 ? "Scheduled" : "Paid";
  return {
    id: `INV-${20260000 + index + 1}`,
    provider: provider[0],
    providerAr: provider[1],
    type: provider[2],
    amount: Number((95 + ((index * 83) % 1340) + (index % 3) * 0.45).toFixed(2)),
    currency: "SAR",
    dueDate: isoDaysAgo(index < 3 ? -index - 2 : index - 14),
    status,
    autopay: index % 4 === 0,
    accountId: accounts[index % 2].id,
  };
});

export const notifications = Array.from({ length: 120 }, (_, index) => {
  const types = ["security", "payment", "transfer", "insight"];
  const type = types[index % types.length];
  const content = {
    security: ["New sign-in verified", "تم التحقق من تسجيل دخول جديد"],
    payment: ["Card purchase completed", "اكتملت عملية شراء بالبطاقة"],
    transfer: ["Transfer status updated", "تم تحديث حالة الحوالة"],
    insight: ["Your weekly spending insight is ready", "ملخص إنفاقك الأسبوعي جاهز"],
  }[type];
  return {
    id: `NTF-${String(index + 1).padStart(4, "0")}`,
    type,
    title: content[0],
    titleAr: content[1],
    detail: type === "payment" ? `${merchants[index % merchants.length].name} · SAR ${(42 + index * 3.17).toFixed(2)}` : `Reference NBL-${8500 + index}`,
    timestamp: isoDaysAgo(Math.floor(index / 4), 7 + (index % 11)),
    read: index > 5,
  };
});

export const cashflow = [
  ["Aug", 19800, 12100], ["Sep", 20700, 13600], ["Oct", 22400, 12800], ["Nov", 21600, 14900],
  ["Dec", 24800, 17200], ["Jan", 23200, 15300], ["Feb", 25800, 14100], ["Mar", 24600, 16400],
  ["Apr", 27100, 15200], ["May", 26400, 13900], ["Jun", 28200, 15800], ["Jul", 29400, 14640],
].map(([month, income, spending]) => ({ month, income, spending }));

export const spendingByCategory = [
  { name: "Shopping", nameAr: "التسوق", value: 3980, color: "#7467f2" },
  { name: "Groceries", nameAr: "البقالة", value: 2850, color: "#16c7b7" },
  { name: "Dining", nameAr: "المطاعم", value: 1960, color: "#f5a958" },
  { name: "Utilities", nameAr: "الخدمات", value: 1680, color: "#4f9cf9" },
  { name: "Transport", nameAr: "التنقل", value: 1190, color: "#f0648e" },
];

export const loginActivity = Array.from({ length: 12 }, (_, index) => ({
  id: `LOGIN-${index + 1}`,
  device: index === 0 ? "Windows · Edge" : index % 3 === 0 ? "iPhone · Mobile app" : "Windows · Chrome",
  location: index % 4 === 0 ? "Riyadh, SA" : "Jeddah, SA",
  ip: `192.0.2.${34 + index}`,
  timestamp: isoDaysAgo(index * 3, 10),
  status: index === 8 ? "Blocked" : "Verified",
}));

export function formatMoney(value, currency = "SAR", locale = "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value, locale = "en", withTime = false) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}
