#!/usr/bin/env node
// scripts/dev.mjs
// Terminal 1: boots Pixel_6a emulator (detached) + waits for boot + starts Metro on localhost.
// Run with:  npm run dev
//
// Cross-shell: works in PowerShell, Bash, cmd. Keep this terminal open.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ANDROID_HOME = process.env.ANDROID_HOME
  || process.env.ANDROID_SDK_ROOT
  || "C:\\Users\\segun\\AppData\\Local\\Android\\Sdk";

const adb = join(ANDROID_HOME, "platform-tools", "adb.exe");
const emulator = join(ANDROID_HOME, "emulator", "emulator.exe");
const avd = process.env.AVD_NAME || "Pixel_6a";

if (!existsSync(adb) || !existsSync(emulator)) {
  console.error(`Android SDK not found at ${ANDROID_HOME}.`);
  console.error(`Set ANDROID_HOME or install platform-tools + emulator.`);
  process.exit(1);
}

function log(step, msg) {
  console.log(`[36m[${step}][0m ${msg}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "pipe", encoding: "utf8", ...opts });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
}

const devicesFirst = run(adb, ["devices"]).out;
const alreadyAttached = /\bemulator-\d+\s+device\b/.test(devicesFirst);

if (!alreadyAttached) {
  log("emu", `booting ${avd} ...`);
  const proc = spawn(emulator, ["-avd", avd, "-no-snapshot-save"], {
    detached: true,
    stdio: "ignore",
  });
  proc.unref();
} else {
  log("emu", "emulator already attached, skipping boot");
}

log("adb", "waiting for device ...");
run(adb, ["wait-for-device"]);

let booted = "";
const start = Date.now();
while (Date.now() - start < 180_000) {
  booted = run(adb, ["shell", "getprop", "sys.boot_completed"]).out.trim();
  if (booted === "1") break;
  await new Promise((r) => setTimeout(r, 2000));
}
if (booted !== "1") {
  console.error("Emulator failed to boot in 3 minutes.");
  process.exit(1);
}
log("adb", "boot complete");

log("adb", "reverse tcp:8081 tcp:8081");
run(adb, ["reverse", "tcp:8081", "tcp:8081"]);

log("metro", "starting (offline, localhost) — keep this terminal open");
const metro = spawn(
  "npx",
  ["expo", "start", "--localhost"],
  {
    stdio: "inherit",
    env: { ...process.env, EXPO_OFFLINE: "1" },
    shell: true,
  },
);

const stop = () => {
  if (!metro.killed) metro.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
metro.on("exit", (code) => process.exit(code ?? 0));
