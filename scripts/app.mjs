#!/usr/bin/env node
// scripts/app.mjs
// Terminal 2: opens Tiwa Gold inside Expo Go on the running emulator.
// Run with:  npm run app
//
// Pre-condition: scripts/dev.mjs is running in another terminal (emulator + Metro up).

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ANDROID_HOME = process.env.ANDROID_HOME
  || process.env.ANDROID_SDK_ROOT
  || "C:\\Users\\segun\\AppData\\Local\\Android\\Sdk";

const adb = join(ANDROID_HOME, "platform-tools", "adb.exe");

if (!existsSync(adb)) {
  console.error(`adb not found at ${adb}`);
  process.exit(1);
}

function log(step, msg) {
  console.log(`[36m[${step}][0m ${msg}`);
}

function run(args, opts = {}) {
  const r = spawnSync(adb, args, { stdio: "pipe", encoding: "utf8", ...opts });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
}

const devices = run(["devices"]).out;
if (!/\bemulator-\d+\s+device\b/.test(devices)) {
  console.error("No emulator attached. Run `npm run dev` in another terminal first.");
  process.exit(1);
}

log("adb", "reverse tcp:8081 tcp:8081");
run(["reverse", "tcp:8081", "tcp:8081"]);

log("intent", "exp://127.0.0.1:8081");
const result = run(["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "exp://127.0.0.1:8081"]);
process.stdout.write(result.out);

if (result.code !== 0) {
  console.error("Intent failed.");
  process.exit(result.code);
}

log("done", "app launching in Expo Go. Run tests with `npm run e2e:smoke` next.");
