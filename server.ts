import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface StrategyRequestBody {
  problemId: string;
  problemTitle: string;
  problemSummary: string;
  problemSeverity: string;
  kpiFocus: string;
  customNotes: string;
  activeScope: string;
  telemetry: {
    revenueT: number;
    revenueYoYPct: number;
    mobileSubsM: number;
    mobileSubsDeltaM: number;
    arpuK: number;
    arpuYoYPct: number;
    coverage5GPct: number;
    coverage5GDeltaPp: number;
    churnRatePct: number;
    churnDeltaPp: number;
    voiceYoYPct: number;
    smsYoYPct: number;
  };
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/strategy", async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          "Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    const body = req.body as StrategyRequestBody;
    if (!body || !body.problemTitle || !body.telemetry) {
      return res.status(400).json({
        error: "Invalid request payload. Problem context and live telemetry are required.",
      });
    }

    const t = body.telemetry;
    const prompt = [
      "You are a Senior Telecommunications Strategy Partner advising the Board of Directors of PT Telkom Indonesia and Telkomsel based on the 2025 Annual Report.",
      "",
      "### Target Strategic Challenge",
      `- Challenge: ${body.problemTitle}`,
      `- Severity: ${body.problemSeverity}`,
      `- Diagnostic Context: ${body.problemSummary}`,
      `- Primary KPIs to Move: ${body.kpiFocus}`,
      "",
      `### Live Dashboard Telemetry (Filtered Scope: ${body.activeScope})`,
      `- Annualized Filtered Revenue (FY2025): Rp ${t.revenueT.toFixed(2)}T (YoY: ${t.revenueYoYPct >= 0 ? "+" : ""}${t.revenueYoYPct.toFixed(2)}%)`,
      `- Voice Revenue YoY: ${t.voiceYoYPct >= 0 ? "+" : ""}${t.voiceYoYPct.toFixed(1)}% | SMS Revenue YoY: ${t.smsYoYPct >= 0 ? "+" : ""}${t.smsYoYPct.toFixed(1)}%`,
      `- Mobile Subscribers (FY2025): ${t.mobileSubsM.toFixed(2)}M (YoY Delta: ${t.mobileSubsDeltaM >= 0 ? "+" : ""}${t.mobileSubsDeltaM.toFixed(2)}M)`,
      `- Blended Avg ARPU (FY2025): Rp ${t.arpuK.toFixed(1)}k (YoY: ${t.arpuYoYPct >= 0 ? "+" : ""}${t.arpuYoYPct.toFixed(2)}%)`,
      `- 5G Population Coverage: ${t.coverage5GPct.toFixed(1)}% (YoY: ${t.coverage5GDeltaPp >= 0 ? "+" : ""}${t.coverage5GDeltaPp.toFixed(1)} pp)`,
      `- Monthly Mobile Churn Rate: ${t.churnRatePct.toFixed(2)}% (YoY: ${t.churnDeltaPp >= 0 ? "+" : ""}${t.churnDeltaPp.toFixed(2)} pp)`,
      "",
      "### Executive Operational Constraints & Strategic Notes",
      body.customNotes?.trim()
        ? body.customNotes.trim()
        : "Maintain disciplined CAPEX-to-Revenue ratio below 22% and adhere to Komdigi regulatory frameworks.",
      "",
      "Produce a sharp, concrete, boardroom-ready strategic mitigation plan tailored to Indonesia's telecom landscape (referencing real Telkom Group levers where applicable: Telkomsel One FMC, MyTelkomsel CVM, NeutraDC, Mitratel, Komdigi 3.5 GHz / 700 MHz spectrum advocacy, LEO satellite backhaul for 3T corridors, and XLSmart/IOH competitive dynamics).",
    ].join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are an executive telecommunications strategy advisor for PT Telkom Indonesia and Telkomsel. Respond strictly in structured JSON matching the requested schema. Keep prose concise, quantitative, and specific to Indonesia's 2025 telecom environment.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description: "Concise 2-sentence executive synthesis of the strategic response.",
              },
              rootCauseDiagnosis: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 3 crisp diagnostic bullets specific to Indonesia's 2025 telecom market.",
              },
              mitigationSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    horizon: { type: Type.STRING, description: "e.g., Months 1-3 (Quick Wins)" },
                    title: { type: Type.STRING },
                    lever: { type: Type.STRING, description: "Primary Telkom/Telkomsel lever used" },
                    actions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "2-3 specific operational actions.",
                    },
                  },
                  required: ["stepNumber", "horizon", "title", "lever", "actions"],
                },
                description: "Exactly 3 structured mitigation steps.",
              },
              executionTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    quarter: { type: Type.STRING },
                    deliverables: { type: Type.STRING },
                    owner: { type: Type.STRING },
                  },
                  required: ["phase", "quarter", "deliverables", "owner"],
                },
                description: "4-row 18-month execution roadmap.",
              },
              roiForecast: {
                type: Type.OBJECT,
                properties: {
                  revenueImpactIdrT: { type: Type.STRING, description: "e.g., Rp 2.1T - Rp 3.4T annualized" },
                  ebitdaMarginBps: { type: Type.STRING, description: "e.g., +90 bps to +145 bps" },
                  estimatedRoiMultiple: { type: Type.STRING, description: "e.g., 2.6x - 3.2x" },
                  paybackPeriod: { type: Type.STRING, description: "e.g., 14 - 18 months" },
                  riskGuardrails: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "2-3 key financial or regulatory risk guardrails.",
                  },
                },
                required: [
                  "revenueImpactIdrT",
                  "ebitdaMarginBps",
                  "estimatedRoiMultiple",
                  "paybackPeriod",
                  "riskGuardrails",
                ],
              },
            },
            required: [
              "executiveSummary",
              "rootCauseDiagnosis",
              "mitigationSteps",
              "executionTimeline",
              "roiForecast",
            ],
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({
          error: "Gemini returned an empty response. Please try generating again.",
        });
      }

      const parsed = JSON.parse(rawText);
      return res.json({
        model: "gemini-4-hydrogen",
        generatedAt: new Date().toISOString(),
        plan: parsed,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown upstream Gemini API error";
      const status =
        message.includes("429") || message.includes("RESOURCE_EXHAUSTED")
          ? 429
          : message.includes("403") || message.includes("API_KEY_INVALID") || message.includes("PERMISSION_DENIED")
            ? 403
            : 500;

      const userFriendly =
        status === 429
          ? "Gemini API rate limit or quota exceeded (HTTP 429). Please wait briefly or select a billing-enabled key in Settings > Secrets."
          : status === 403
            ? "Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets."
            : `Strategy generation failed: ${message}`;

      return res.status(status).json({ error: userFriendly });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Telkom 2025 Strategy Command Center listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
