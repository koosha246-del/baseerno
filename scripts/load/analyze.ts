/**
 * CLI analyzer for k6 load-test results.
 *
 * Reads scripts/load/result.json (written by the k6 handleSummary in
 * scripts/load/k6-script.js) and evaluates the "Large" gates:
 *   browse p95<400ms · search p95<500ms · dashboard p95<600ms · errors<1%
 *
 * Usage:
 *   npm run analyze:load                 # uses scripts/load/result.json
 *   npx tsx scripts/load/analyze.ts <path>  # custom result file
 *
 * Exit code: 0 when all gates pass, 1 when any gate fails (CI-friendly).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  analyzeLoad,
  type LoadResult,
} from "../../src/lib/load-analysis";

const defaultPath = resolve(process.cwd(), "scripts/load/result.json");
const filePath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPath;

function main(): number {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    console.error(`❌ result.json پیدا نشد: ${filePath}`);
    console.error("اول load test را اجرا کن (با -e): k6 run -e K6_BASE_URL=... -e K6_EMAIL=... -e K6_PASSWORD=... -e LOAD_VUS=50 scripts/load/k6-script.js");
    return 2;
  }

  let result: LoadResult;
  try {
    result = JSON.parse(raw) as LoadResult;
  } catch {
    console.error("❌ result.json قابل parse نیست (JSON نامعتبر).");
    return 2;
  }

  const { verdicts, pass, suggestions } = analyzeLoad(result);

  console.log("");
  console.log("══════════ Gates ی Large (k6) ══════════");
  console.log(`baseUrl: ${result.baseUrl ?? "?"}   vus: ${result.vus ?? "?"}`);
  console.log("───────────────────────────────────────");

  for (const v of verdicts) {
    if (v.skipped) {
      console.log(` ⏭ ${v.scenario} ${v.metric}: اجرا نشد (skip)`);
      continue;
    }
    const mark = v.pass ? "✅" : "❌";
    const unit = v.metric === "p95" ? "ms" : "%";
    const actual = `${v.actual}${unit}`;
    console.log(` ${mark} ${v.scenario} ${v.metric}: ${actual} (حد ${v.limit}${unit})`);
  }

  console.log("───────────────────────────────────────");
  if (result.cacheSMaxageHits !== undefined) {
    console.log(`cache hits (s-maxage): ${result.cacheSMaxageHits}`);
  }
  console.log("");

  if (pass) {
    console.log("✅ همه گیت‌ها پاس شدند — سایت آماده‌ی پذیرش ترافیک Large است.");
  } else {
    console.log("❌ برخی گیت‌ها رد شدند — پیشنهادها:");
    for (const s of suggestions) console.log(`   • ${s}`);
  }
  console.log("");

  return pass ? 0 : 1;
}

process.exitCode = main();
