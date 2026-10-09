// Keyfiyyət testi: briefləri AI-yə göndərir, nəticəni gözləntilərlə müqayisə edir və results.md yazır.
import fs from "node:fs";
import { analyzeBrief } from "../routes/ai.js";

const briefs = JSON.parse(fs.readFileSync(new URL("./briefs.json", import.meta.url)));
const rows = [];
let pass = 0, inTok = 0, outTok = 0;

for (const b of briefs) {
  try {
    const { result, usage } = await analyzeBrief(b.brief);
    inTok += usage.input_tokens; outTok += usage.output_tokens;
    const hasRisk = (result.risk_flags || []).length > 0;
    const riskOk = b.expect_risk ? hasRisk : true;
    const missingOk = (result.missing_info || []).length >= b.expect_min_missing;
    const priceOk = result.price_azn && result.price_azn.max >= result.price_azn.min && result.price_azn.max > 0;
    const ok = riskOk && missingOk && priceOk;
    if (ok) pass++;
    rows.push(`| ${b.id} | ${b.type} | ${riskOk ? "✅" : "❌ risk tutulmadı"} | ${missingOk ? "✅" : "❌ az sual"} | ${priceOk ? "✅" : "❌ qiymət"} | ${result.price_azn?.min}-${result.price_azn?.max} |`);
  } catch (e) {
    rows.push(`| ${b.id} | ${b.type} | ❌ xəta: ${String(e.message).slice(0, 60)} | | | |`);
  }
}

const md = `# Keyfiyyət testi nəticələri\n\nKeçdi: ${pass}/${briefs.length}\n\n| # | Növ | Risk | Çatışmayan sual | Qiymət | AZN |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n\nToken: giriş ${inTok}, çıxış ${outTok}. Orta: ${Math.round((inTok + outTok) / briefs.length)} token/brief.\n\n> Qeyd: ❌ olan sətirlər dürüst uğursuzluq nümunələridir, onları pitch-ə və formaya daxil edin.\n`;
fs.writeFileSync(new URL("./results.md", import.meta.url), md);
console.log(md);
