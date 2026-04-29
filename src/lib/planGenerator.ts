import { ComplexPlanDay } from "@/types/goal";
type AiPlanDay = {
  dayNumber: number;
  title: string;
  focus: string;
  tasks: string[];
};

export function convertAiPlanToComplexPlanDays(
  aiPlanDays: AiPlanDay[]
): ComplexPlanDay[] {
  return aiPlanDays.map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title,
    focus: day.focus,
    completed: false,
    missedDates: [],
    tasks: day.tasks.map((task) => ({
      id: crypto.randomUUID(),
      title: task,
      completed: false,
    })),
  }));
}

function createTask(title: string) {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
  };
}

function createDay(
  dayNumber: number,
  title: string,
  focus: string,
  tasks: string[]
): ComplexPlanDay {
  return {
    dayNumber,
    title,
    focus,
    completed: false,
    missedDates: [],
    tasks: tasks.map((task) => createTask(task)),
  };
}

export function generateComplexStarterPlan(
  goalName: string,
  category: string,
  dailyTime: string,
  currentLevel: string,
  targetResult: string
): ComplexPlanDay[] {
  const lowerGoal = `${goalName} ${category} ${targetResult}`.toLowerCase();

  if (
    lowerGoal.includes("google") ||
    lowerGoal.includes("software") ||
    lowerGoal.includes("swe") ||
    lowerGoal.includes("coding") ||
    lowerGoal.includes("dsa")
  ) {
    return generateGoogleJobPlan(dailyTime, currentLevel, targetResult);
  }

  if (
    lowerGoal.includes("fitness") ||
    lowerGoal.includes("fat") ||
    lowerGoal.includes("weight") ||
    lowerGoal.includes("gym")
  ) {
    return generateFitnessPlan(dailyTime, currentLevel, targetResult);
  }

  if (
    lowerGoal.includes("english") ||
    lowerGoal.includes("communication") ||
    lowerGoal.includes("grammar") ||
    lowerGoal.includes("speaking")
  ) {
    return generateEnglishPlan(goalName,dailyTime, currentLevel, targetResult);
  }

  if (
    lowerGoal.includes("business") ||
    lowerGoal.includes("money") ||
    lowerGoal.includes("shop") ||
    lowerGoal.includes("service")
  ) {
    return generateBusinessPlan(dailyTime, currentLevel, targetResult);
  }

  return generateGeneralComplexPlan(goalName, dailyTime, currentLevel, targetResult);
}

function generateGoogleJobPlan(
  dailyTime: string,
  currentLevel: string,
  targetResult: string
): ComplexPlanDay[] {
  return [
    createDay(1, "Setup + Web Foundation", "Start with HTML structure and project setup.", [
      `Study for ${dailyTime || "your available time"} with full focus.`,
      "Revise HTML tags: html, head, body, h1, p, a, div, button.",
      "Create a simple personal goal card using HTML.",
      "Write what you already know and what is weak.",
    ]),

    createDay(2, "CSS Layout Basics", "Learn styling, spacing, color, and card layout.", [
      "Revise CSS selectors, class, id, color, background, margin, padding.",
      "Create 3 cards using CSS.",
      "Fix one CSS mistake by debugging.",
      "Write 5 notes about CSS box model.",
    ]),

    createDay(3, "Flexbox Practice", "Build layout using flexbox.", [
      "Learn display flex, justify-content, align-items, gap.",
      "Create a navbar and 3-column card section.",
      "Make hover effect on cards.",
      "Revise yesterday's CSS for 15 minutes.",
    ]),

    createDay(4, "JavaScript Basics", "Start logic building.", [
      "Learn variables, string, number, boolean.",
      "Practice if-else with 5 examples.",
      "Make a simple button click counter.",
      "Write mistakes in a small debugging note.",
    ]),

    createDay(5, "Loops + Arrays", "Start problem-solving thinking.", [
      "Learn for loop and while loop.",
      "Practice array basics.",
      "Solve 5 beginner problems: sum, even/odd, max number, count items, reverse text.",
      "Revise all wrong answers.",
    ]),

    createDay(6, "DSA Foundation", "Understand what DSA means and why it matters.", [
      "Learn array, string, loop, function meaning.",
      "Solve 3 array problems.",
      "Solve 3 string problems.",
      "Mark the hardest problem and revise it.",
    ]),

    createDay(7, "Weekly Test + Review", "Check your first week honestly.", [
      "Take a 30-minute test from HTML, CSS, JS basics.",
      "Write your score honestly.",
      "List 3 weak topics.",
      "Plan what to revise next week.",
    ]),

    createDay(8, "Functions in JavaScript", "Understand reusable logic.", [
      "Learn function declaration and parameters.",
      "Write 5 small functions.",
      "Convert old problems into functions.",
      "Revise loops for 15 minutes.",
    ]),

    createDay(9, "DOM Basics", "Connect JavaScript with webpage.", [
      "Learn getElementById and querySelector.",
      "Change text using button click.",
      "Show/hide a box using JavaScript.",
      "Write 3 notes about DOM.",
    ]),

    createDay(10, "Mini Project 1", "Build a small tracker UI.", [
      "Create a simple habit tracker card.",
      "Add tick button using JavaScript.",
      "Save one value in localStorage.",
      "Test and fix at least one bug.",
    ]),

    createDay(11, "Problem Solving Day", "Build DSA confidence.", [
      "Solve 5 beginner loop problems.",
      "Solve 3 array problems.",
      "Explain one solution in your own words.",
      "Revise mistakes.",
    ]),

    createDay(12, "Git + GitHub Practice", "Learn real developer workflow.", [
      "Run git status, git add, git commit.",
      "Push one small project to GitHub.",
      "Read your own commit message.",
      "Write what git push means.",
    ]),

    createDay(13, "React / Next.js Concept", "Understand component-based UI.", [
      "Learn what a component is.",
      "Create one simple component.",
      "Pass text using props.",
      "Revise previous mini project.",
    ]),

    createDay(14, "Weekly Review + Test", "Check web + coding basics.", [
      "Take a 45-minute weekly test.",
      "Write score and weak areas.",
      "Improve one previous project section.",
      "Prepare next week focus.",
    ]),
  ];
}

function generateFitnessPlan(
  dailyTime: string,
  currentLevel: string,
  targetResult: string
): ComplexPlanDay[] {
  return [
    createDay(1, "Fitness Baseline", "Understand your current routine and target.", [
      "Write your current weight, target weight, and daily routine.",
      "Walk or do light cardio for 20 minutes.",
      "Drink enough water today.",
      "Avoid one unnecessary junk item.",
    ]),

    createDay(2, "Simple Workout Start", "Start with easy consistent movement.", [
      "Do warm-up for 5 minutes.",
      "Do beginner workout or gym session.",
      "Eat protein with breakfast or lunch.",
      "Write what felt difficult.",
    ]),

    createDay(3, "Food Tracking", "Understand calorie intake simply.", [
      "Write everything you ate today.",
      "Reduce sugar or fried food once.",
      "Walk 20-30 minutes.",
      "Sleep on time.",
    ]),

    createDay(4, "Strength + Habit", "Build body routine.", [
      "Do strength training or bodyweight exercise.",
      "Eat controlled portions.",
      "Drink water regularly.",
      "Write today's energy level.",
    ]),

    createDay(5, "Cardio Day", "Improve stamina.", [
      "Do cardio/walking/cycling for 25-30 minutes.",
      "Avoid overeating at night.",
      "Add fruit or curd if possible.",
      "Track completion honestly.",
    ]),

    createDay(6, "Recovery + Stretching", "Avoid burnout.", [
      "Do stretching for 10 minutes.",
      "Take light walk.",
      "Review food mistakes.",
      "Prepare next week's routine.",
    ]),

    createDay(7, "Weekly Fitness Review", "Check progress.", [
      "Check weight or body feeling.",
      "Write completed workout days.",
      "Find one food mistake.",
      "Set next week's target.",
    ]),
  ];
}

function generateEnglishPlan(
  goalName: string,
  dailyTime: string,
  currentLevel: string,
  targetResult: string
): ComplexPlanDay[] {
  const lowerGoal = `${goalName} ${currentLevel} ${targetResult}`.toLowerCase();

  const isMasteryGoal =
    lowerGoal.includes("mastery") ||
    lowerGoal.includes("advanced") ||
    lowerGoal.includes("fluent") ||
    lowerGoal.includes("fluency") ||
    lowerGoal.includes("professional") ||
    lowerGoal.includes("interview");

  if (isMasteryGoal) {
    return [
      createDay(1, "Advanced Speaking Baseline", "Check your current fluency and confidence.", [
        `Speak for ${dailyTime || "20 minutes"} on your life goal without stopping.`,
        "Record your speaking and note hesitation points.",
        "Write 10 advanced sentences about your goal.",
        "Find 5 grammar or fluency mistakes from your recording.",
      ]),

      createDay(2, "Fluency Improvement", "Reduce pauses and speak naturally.", [
        "Speak for 5 minutes on a random topic.",
        "Practice linking words: however, therefore, although, because.",
        "Rewrite 10 simple sentences into better professional sentences.",
        "Record again and compare with yesterday.",
      ]),

      createDay(3, "Advanced Grammar in Speech", "Use correct grammar while speaking.", [
        "Revise tense accuracy in spoken English.",
        "Speak 10 sentences using past, present, and future tense.",
        "Correct 5 wrong sentences.",
        "Write a short paragraph and speak it aloud.",
      ]),

      createDay(4, "Presentation Practice", "Speak like a confident presenter.", [
        "Prepare a 2-minute presentation about your career goal.",
        "Practice opening line, main points, and closing line.",
        "Record the presentation.",
        "Improve voice clarity and confidence.",
      ]),

      createDay(5, "Interview Communication", "Prepare professional answers.", [
        "Practice: Tell me about yourself.",
        "Practice: Why should we select you?",
        "Practice: What are your strengths and weaknesses?",
        "Write better versions of your answers.",
      ]),

      createDay(6, "Debate and Opinion Speaking", "Build strong expression power.", [
        "Choose one topic and speak both for and against it.",
        "Use phrases like: I believe, In my opinion, I disagree because.",
        "Write 10 opinion sentences.",
        "Record and check confidence.",
      ]),

      createDay(7, "Mastery Weekly Test", "Check fluency, grammar, and confidence.", [
        "Speak for 7 minutes without long pauses.",
        "Write a 200-word paragraph.",
        "Correct your top 5 repeated mistakes.",
        "Make next week's advanced speaking target.",
      ]),
    ];
  }

  return [
    createDay(1, "Speaking Baseline", "Start speaking without fear.", [
      `Practice for ${dailyTime || "20 minutes"} today.`,
      "Speak for 2 minutes about yourself.",
      "Write 5 sentences about your daily routine.",
      "Learn subject + verb + object sentence structure.",
    ]),

    createDay(2, "Basic Grammar", "Build sentence clarity.", [
      "Revise noun, pronoun, verb, adjective.",
      "Make 10 simple sentences.",
      "Speak 2 minutes about your family or work.",
      "Correct 3 mistakes.",
    ]),

    createDay(3, "Simple Present Tense", "Use daily life English correctly.", [
      "Learn simple present tense.",
      "Write 10 daily life sentences.",
      "Speak for 3 minutes using simple present.",
      "Revise yesterday's mistakes.",
    ]),

    createDay(4, "Useful Vocabulary", "Improve daily speaking words.", [
      "Learn 10 useful daily words.",
      "Use each word in a sentence.",
      "Speak about your goal for 3 minutes.",
      "Write 5 correction notes.",
    ]),

    createDay(5, "Communication Practice", "Speak more naturally.", [
      "Practice self-introduction.",
      "Practice asking 5 questions.",
      "Practice answering 5 questions.",
      "Record and listen once.",
    ]),

    createDay(6, "Writing Practice", "Improve written English.", [
      "Write one short paragraph.",
      "Check grammar mistakes.",
      "Rewrite the paragraph better.",
      "Speak the paragraph aloud.",
    ]),

    createDay(7, "Weekly English Test", "Check improvement.", [
      "Speak for 5 minutes.",
      "Write 15 sentences.",
      "Revise grammar mistakes.",
      "Plan next week.",
    ]),
  ];
}
function generateBusinessPlan(
  dailyTime: string,
  currentLevel: string,
  targetResult: string
): ComplexPlanDay[] {
  return [
    createDay(1, "Business Goal Setup", "Clarify your service or income goal.", [
      "Write what service or business you want to improve.",
      "List required tools and documents.",
      "Study one competitor or similar shop/service.",
      "Write today's learning summary.",
    ]),

    createDay(2, "Customer Understanding", "Know what customers need.", [
      "Write 5 customer problems.",
      "Write your solution for each problem.",
      "Learn basic pricing or commission idea.",
      "Prepare one simple service script.",
    ]),

    createDay(3, "Service Practice", "Practice one real service flow.", [
      "Choose one service and learn full steps.",
      "Practice the process safely without real customer risk.",
      "Write required documents.",
      "Write common mistakes.",
    ]),

    createDay(4, "Digital Tools Day", "Use computer/Mac for business work.", [
      "Practice PDF, print, scan, upload, or form fill workflow.",
      "Create one sample document.",
      "Organize files into folders.",
      "Write shortcuts you used.",
    ]),

    createDay(5, "Money + Record Keeping", "Track money clearly.", [
      "Create simple income-expense note.",
      "Write cost, selling price, margin.",
      "Track one sample transaction.",
      "Review mistakes.",
    ]),

    createDay(6, "Customer Handling", "Improve trust and communication.", [
      "Write greeting and explanation lines.",
      "Practice explaining price clearly.",
      "Write refund/problem handling rule.",
      "Prepare next week's service list.",
    ]),

    createDay(7, "Weekly Business Review", "Check readiness.", [
      "Review completed service learning.",
      "Find weak process.",
      "Create next week target.",
      "Write one improvement idea.",
    ]),
  ];
}

function generateGeneralComplexPlan(
  goalName: string,
  dailyTime: string,
  currentLevel: string,
  targetResult: string
): ComplexPlanDay[] {
  return [
    createDay(1, "Goal Setup", `Understand your goal: ${goalName}`, [
      "Write your exact goal clearly.",
      "Write your current level honestly.",
      "Write your target result.",
      `Work for ${dailyTime || "your available time"} with full focus.`,
    ]),

    createDay(2, "Foundation Learning", "Learn the first core topic.", [
      "Study the most basic topic of this goal.",
      "Make short notes.",
      "Complete one small practice task.",
      "Revise for 15 minutes.",
    ]),

    createDay(3, "Practice Day", "Apply what you learned.", [
      "Complete one practical task.",
      "Write mistakes.",
      "Fix one weak point.",
      "Prepare tomorrow's focus.",
    ]),

    createDay(4, "Revision Day", "Strengthen previous learning.", [
      "Revise Day 1 to Day 3.",
      "Redo one difficult task.",
      "Write 3 weak points.",
      "Ask mentor what to improve.",
    ]),

    createDay(5, "Mini Project / Real Work", "Create something practical.", [
      "Complete one real-use task.",
      "Improve quality.",
      "Check mistakes.",
      "Save progress.",
    ]),

    createDay(6, "Test Day", "Check understanding.", [
      "Take a small self-test.",
      "Check wrong answers.",
      "Revise weak areas.",
      "Write score honestly.",
    ]),

    createDay(7, "Weekly Review", "Review and plan next week.", [
      "Check completed days.",
      "Check missed days.",
      "Write progress summary.",
      "Prepare next week plan.",
    ]),
  ];
}