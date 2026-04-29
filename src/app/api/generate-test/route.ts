import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type GeneratedTestQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
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
      currentLevel,
      targetResult,
      activeDayTitle,
      activeDayFocus,
      completedDays,
      totalDays,
    } = body;

    if (!goalName || !category) {
      return NextResponse.json(
        { error: "Missing required goal details." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are GoalNow AI. Create a realistic weekly test for this user's goal.

Goal Name: ${goalName}
Category: ${category}
Current Level: ${currentLevel || "Not provided"}
Target Result: ${targetResult || "Not provided"}
Current Active Day Title: ${activeDayTitle || "Not provided"}
Current Active Day Focus: ${activeDayFocus || "Not provided"}
Completed Plan Days: ${completedDays}/${totalDays}

Rules:
- Return only valid JSON.
- No markdown.
- No explanation outside JSON.
- Create exactly 5 multiple-choice questions.
- Each question must have exactly 4 options.
- The questions must be realistic for the user's current level.
- If this is Google SWE/coding/DSA/web development, include practical coding, concept, debugging, or workflow questions.
- If this is English, include grammar, speaking, vocabulary, communication, and sentence correction.
- If this is fitness, include routine, food, recovery, and consistency.
- If this is business, include customer handling, service process, money tracking, and practical workflow.
- correctAnswer must exactly match one of the options.
- explanation should be short and beginner-friendly.

Return JSON in this exact shape:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Short explanation"
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
        console.warn(`${modelName} failed for test. Trying next model...`, error);
        lastError = error;
      }
    }

    if (!text) {
      console.error("All Gemini models failed for test:", lastError);

      return NextResponse.json(
        {
          error:
            "All Gemini models are currently unavailable. Local fallback test will be used.",
        },
        { status: 503 }
      );
    }

    console.log(`Gemini weekly test generated with model: ${usedModel}`);

    let parsed: { questions: GeneratedTestQuestion[] };

    try {
      parsed = JSON.parse(cleanJsonText(text));
    } catch {
      return NextResponse.json(
        {
          error: "Gemini test response was not valid JSON.",
          raw: text,
        },
        { status: 500 }
      );
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return NextResponse.json(
        { error: "Gemini test format is incorrect." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Gemini test generation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the Gemini test." },
      { status: 500 }
    );
  }
}