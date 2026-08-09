import { writeFile } from "node:fs/promises";

const endpoint = process.argv[2] ?? "http://127.0.0.1:9223";
const output = process.argv[3] ?? "nabilo-fintech-dashboard.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 1000);
const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = pages.find((page) => page.type === "page");

if (!target) throw new Error("No debuggable browser page was found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 760 });
await command("Page.navigate", { url: "http://127.0.0.1:5173/" });
await wait(900);
await command("Runtime.evaluate", {
  expression: `sessionStorage.setItem("finova-demo-session", JSON.stringify(${JSON.stringify({ password: "Nabilo!Demo-2026", role: "customer", name: "Layla Haddad", email: "layla.haddad@finova-demo.local" })}))`,
});
await command("Page.reload", { ignoreCache: true });
await wait(1500);
const capture = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(output, Buffer.from(capture.data, "base64"));
socket.close();
