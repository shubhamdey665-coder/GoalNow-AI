import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

function cleanText(text: string) {
  return text.trim();
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
      userName,
      goalName,
      category,
      currentLevel,
      targetResult,
      dailyTime,
      activeDayText,
      nextAction,
      progress,
      completed,
      total,
      userMessage,
    } = body;

    if (!goalName || !category || !userMessage) {
      return NextResponse.json(
        { error: "Missing required mentor details." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are GoalNow AI Mentor.

The user is building progress toward a goal. Reply like a helpful mentor.

User name: ${userName || "the user"}
Goal Name: ${goalName}
Category: ${category}
Daily Available Time: ${dailyTime || "Not provided"}
Current Level: ${currentLevel || "Not provided"}
Target Result: ${targetResult || "Not provided"}
Active Plan: ${activeDayText || "Not provided"}
Next Best Action: ${nextAction || "Not provided"}
Progress: ${progress || 0}%
Completed Days: ${completed || 0}/${total || 0}

User message:
${userMessage}

Reply like a helpful personal mentor.

Use the user's first name naturally sometimes, especially at the start of important guidance. Do not repeat the name in every sentence.
Do not answer like a general chatbot. Answer like a mentor who knows the user's goal progress and today's active task.

Before replying, understand the user's intent:
- If the user asks "what to do", give the next practical step.
- If the user asks about progress, explain progress honestly.
- If the user asks about weakness, point to likely weak area and how to fix it.
- If the user asks about missed days, tell them to continue from the current active day, not skip ahead.
- If the user asks a subject doubt, explain clearly but still connect it to the goal.
- If the question is outside the goal, answer briefly and bring the user back to the goal.

Use this reply style:
1. Start with a short personal sentence.
2. Give the main answer clearly.
3. Mention the next best action.
4. End with one clear action for today.

Rules:
- Reply in simple, clear English.
- Keep answer short: 4 to 8 lines maximum.
- Give practical next action.
- Use the saved goal details: goal name, category, current level, target result, daily time, active day, next action, progress, completed days.
- Do not give generic motivation only. Always give specific useful guidance.
- If the goal is coding/Google SWE, talk about DSA, web development, revision, debugging, Git/GitHub, and projects.
- If the goal is English, talk about speaking, grammar, vocabulary, writing, listening, recording voice, and correction.
- If the goal is fitness, give general safe routine advice only. Do not suggest extreme dieting, unsafe supplements, or over-exercise.
- If the goal is business, focus on service process, customer handling, records, pricing, and practice.
- Do not claim you are a doctor, lawyer, or financial advisor.
- Do not give dangerous instructions.
- End with one clear action for today.
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
          text = cleanText(response.text);
          usedModel = modelName;
          break;
        }
      } catch (error) {
        console.warn(`${modelName} failed for mentor. Trying next model...`, error);
        lastError = error;
      }
    }

    if (!text) {
      console.error("All Gemini models failed for mentor:", lastError);

      return NextResponse.json(
        {
          error:
            "All Gemini mentor models are currently unavailable. Local fallback mentor reply will be used.",
        },
        { status: 503 }
      );
    }

    console.log(`Gemini mentor reply generated with model: ${usedModel}`);

    return NextResponse.json({
      reply: text,
      model: usedModel,
    });
  } catch (error) {
    console.error("Gemini mentor reply error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating mentor reply." },
      { status: 500 }
    );
  }
}