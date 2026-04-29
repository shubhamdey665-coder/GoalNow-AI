import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type GeneratedReport = {
  summary: string;
  progressFeedback: string;
  weakAreas: string[];
  nextActions: string[];
  weeklyRecommendation: string;
};

function cleanJsonText(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      goalName,
      category,
      trackerType,
      duration,
      dailyTime,
      currentLevel,
      targetResult,
      progressPercentage,
      completed,
      total,
      activeDayText,
      latestTestResult,
    } = body;

    if (!goalName || !category || !trackerType) {
      return NextResponse.json(
        { error: "Missing required report details." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are GoalNow AI Progress Reporter.

Create a useful progress report for this goal.

Goal Name: ${goalName}
Category: ${category}
Tracker Type: ${trackerType}
Duration: ${duration || "Not provided"}
Daily Time: ${dailyTime || "Not provided"}
Current Level: ${currentLevel || "Not provided"}
Target Result: ${targetResult || "Not provided"}
Progress: ${progressPercentage || 0}%
Completed: ${completed || 0}/${total || 0}
Active Plan: ${activeDayText || "Not provided"}
Latest Test Result: ${latestTestResult || "Not available"}

Rules:
- Return only valid JSON.
- No markdown.
- No explanation outside JSON.
- Use simple English.
- Be realistic, not fake-motivational.
- If progress is low, give small practical steps.
- If progress is high, suggest slightly harder next steps.
- If user missed days, recommend continuing from active day, not skipping.
- For coding/Google SWE goals, mention DSA, web development, debugging, revision, Git/GitHub, and project practice.
- For English goals, mention speaking, grammar, vocabulary, writing, listening, and correction.
- For fitness goals, give general safe routine advice only. No extreme dieting or over-exercise.
- For business goals, mention customer handling, service workflow, records, and pricing.

Return JSON in this exact shape:
{
  "summary": "Short report summary",
  "progressFeedback": "Detailed feedback",
  "weakAreas": ["Weak area 1", "Weak area 2", "Weak area 3"],
  "nextActions": ["Action 1", "Action 2", "Action 3"],
  "weeklyRecommendation": "Recommendation for next week"
}
`;

    const modelsToTry = [
      
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
    ];

    let text = "";
    let usedModel = "";
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        if (response.text) {
          text = response.text;
          usedModel = modelName;
          break;
        }
      } catch (error) {
        console.warn(`${modelName} failed for report. Trying next model...`, error);
        lastError = error;
      }
    }

    if (!text) {
      console.error("All Gemini models failed for report:", lastError);

      return NextResponse.json(
        {
          error:
            "All Gemini report models are currently unavailable. Local fallback report will be used.",
        },
        { status: 503 }
      );
    }

    console.log(`Gemini progress report generated with model: ${usedModel}`);

    let parsed: GeneratedReport;

    try {
      parsed = JSON.parse(cleanJsonText(text));
    } catch {
      return NextResponse.json(
        {
          error: "Gemini report response was not valid JSON.",
          raw: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report: parsed,
      model: usedModel,
    });
  } catch (error) {
    console.error("Gemini report generation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the Gemini report." },
      { status: 500 }
    );
  }
}