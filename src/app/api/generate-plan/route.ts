import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type GeneratedPlanDay = {
  dayNumber: number;
  title: string;
  focus: string;
  tasks: string[];
};

function cleanJsonText(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}
function getAiPlanDayCount(duration: string) {
  if (duration === "7 Days") return 7;
  if (duration === "30 Days") return 30;

  return 30;
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
      duration,
      dailyTime,
      currentLevel,
      targetResult,
    } = body;

    if (!goalName || !category || !dailyTime || !currentLevel || !targetResult) {
      return NextResponse.json(
        { error: "Missing required goal details." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const aiPlanDayCount = getAiPlanDayCount(duration);

    const prompt = `
You are GoalNow AI, a realistic goal planning mentor.

Create a practical daily plan for this goal.

Goal Name: ${goalName}
Category: ${category}
Duration: ${duration}
Daily Available Time: ${dailyTime}
Current Level: ${currentLevel}
Target Result: ${targetResult}

Rules:
- Return only valid JSON.
- No markdown.
- No explanation outside JSON.
- Create exactly ${aiPlanDayCount} days only.
- Each day must have exactly 4 tasks.
- Tasks must be realistic for the user's current level.
- Do not make impossible plans.
- The plan must be unique to the goal name, current level, and target result.
- If goal says "level up", make it beginner-to-intermediate.
- If goal says "mastery", make it advanced and professional.
- If the goal is Google SWE preparation, include web development, DSA, revision, Git/GitHub, test, and project practice.
- If the goal is English, include speaking, grammar, vocabulary, writing, listening, confidence, and weekly test.
- If the user misses a day, the next day should continue from the same active day, so each day must be complete and independent.

Return JSON in this exact shape:
{
  "planDays": [
    {
      "dayNumber": 1,
      "title": "Day title",
      "focus": "Main focus of the day",
      "tasks": [
        "Task 1",
        "Task 2",
        "Task 3",
        "Task 4"
      ]
    }
  ]
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
    console.warn(`${modelName} failed. Trying next model...`, error);
    lastError = error;
  }
}

if (!text) {
  console.error("All Gemini models failed:", lastError);

  return NextResponse.json(
    { error: "All Gemini models are currently unavailable. Local fallback plan will be used." },
    { status: 503 }
  );
}

console.log(`Gemini plan generated with model: ${usedModel}`);
    

    let parsed: { planDays: GeneratedPlanDay[] };

    try {
      parsed = JSON.parse(cleanJsonText(text));
    } catch {
      return NextResponse.json(
        {
          error: "Gemini response was not valid JSON.",
          raw: text,
        },
        { status: 500 }
      );
    }

    if (!parsed.planDays || !Array.isArray(parsed.planDays)) {
      return NextResponse.json(
        { error: "Gemini plan format is incorrect." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Gemini plan generation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the Gemini plan." },
      { status: 500 }
    );
  }
}