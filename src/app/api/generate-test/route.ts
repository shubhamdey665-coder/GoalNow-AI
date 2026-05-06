import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type GeneratedTestQuestion = {
  type: "mcq" | "saq";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

function cleanJsonText(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function isValidQuestionCount(value: unknown): value is 5 | 10 | 20 {
  return value === 5 || value === 10 || value === 20;
}

function isValidQuestionType(value: unknown): value is "mcq" | "saq" {
  return value === "mcq" || value === "saq";
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
      questionType,
      questionCount,
      goalName,
      category,
      currentLevel,
      targetResult,
      dailyTime,
      activeDayNumber,
      activeDayTitle,
      activeDayFocus,
      activeDayTasks,
      completedDays,
      totalDays,
    } = body;

    if (!goalName || !category) {
      return NextResponse.json(
        { error: "Missing required goal details." },
        { status: 400 }
      );
    }

    const safeQuestionType: "mcq" | "saq" = isValidQuestionType(questionType)
      ? questionType
      : "mcq";

    const safeQuestionCount: 5 | 10 | 20 = isValidQuestionCount(questionCount)
      ? questionCount
      : 5;

    const safeActiveDayTasks = Array.isArray(activeDayTasks)
      ? activeDayTasks
      : [];

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are GoalNow-AI Weekly Test Generator.

Create a realistic weekly test for this user's saved goal.

Test settings:
- Question type: ${safeQuestionType}
- Number of questions: ${safeQuestionCount}

Goal context:
- Goal name: ${goalName}
- Category: ${category}
- Current level: ${currentLevel || "Not provided"}
- Target result: ${targetResult || "Not provided"}
- Daily time: ${dailyTime || "Not provided"}
- Active day number: ${activeDayNumber || "Not provided"}
- Active day title: ${activeDayTitle || "Not provided"}
- Active day focus: ${activeDayFocus || "Not provided"}
- Active day tasks: ${safeActiveDayTasks.join(", ") || "Not provided"}
- Completed plan days: ${completedDays || 0}/${totalDays || 0}

Important rules:
- Return only valid JSON.
- No markdown.
- No explanation outside JSON.
- Create exactly ${safeQuestionCount} questions.
- Questions must test the current active day, current focus, recent tasks, and goal context.
- Avoid generic questions.
- Questions should match the user's current level.
- Explanations must be short and beginner-friendly.
- If the goal is coding / Google SWE / DSA / web development, ask about DSA, debugging, Git/GitHub, web development, code workflow, and project practice.
- If the goal is English, ask about grammar, speaking, vocabulary, sentence correction, listening, and communication.
- If the goal is fitness, ask only safe general routine, recovery, consistency, and healthy habit questions.
- If the goal is business, ask about service process, customer handling, records, pricing, and practice.

Format rules:
${
  safeQuestionType === "mcq"
    ? `
For MCQ:
- Every question must have type: "mcq"
- Every question must have exactly 4 options.
- correctAnswer must exactly match one of the options.
`
    : `
For SAQ:
- Every question must have type: "saq"
- Do not include options.
- correctAnswer should be a short expected answer.
`
}

Return JSON in this exact shape:
{
  "questions": [
    {
      "type": "${safeQuestionType}",
      "question": "Question text",
      ${
        safeQuestionType === "mcq"
          ? `"options": ["Option A", "Option B", "Option C", "Option D"],`
          : ""
      }
      "correctAnswer": "Correct answer text",
      "explanation": "Short explanation"
    }
  ]
}
`;

    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.0-flash"];

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

    const cleanQuestions = parsed.questions
      .slice(0, safeQuestionCount)
      .map((question) => {
        if (safeQuestionType === "mcq") {
          return {
            type: "mcq" as const,
            question: question.question,
            options:
              Array.isArray(question.options) && question.options.length >= 4
                ? question.options.slice(0, 4)
                : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          };
        }

        return {
          type: "saq" as const,
          question: question.question,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        };
      });

    if (cleanQuestions.length !== safeQuestionCount) {
      return NextResponse.json(
        { error: "Gemini did not return the requested number of questions." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: cleanQuestions,
    });
  } catch (error) {
    console.error("Gemini test generation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the Gemini test." },
      { status: 500 }
    );
  }
}