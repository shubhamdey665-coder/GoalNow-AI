export type TrackerType = "normal" | "complex";

export type GoalStatus = "active" | "completed" | "paused";

export type NormalCheckIn = {
  date: string;
  completed: boolean;
  note?: string;
  editedAt?: string;
};

export type ComplexTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type ComplexPlanDay = {
  dayNumber: number;
  title: string;
  focus: string;
  tasks: ComplexTask[];
  completed: boolean;
  assignedDate?: string;
  completedAt?: string;
  missedDates: string[];
};

export type Goal = {
  id: string;
  name: string;
  category: string;
  trackerType: TrackerType;

  duration: string;
  priority?: string;
  targetDate?: string;

  dailyTime?: string;
  currentLevel?: string;
  targetResult?: string;

  normalTarget?: string;
  normalFrequency?: "daily" | "weekly";
  normalCheckIns?: NormalCheckIn[];

  complexPlanDays?: ComplexPlanDay[];
  activeDayNumber?: number;

  createdAt: string;
  updatedAt?: string;

  latestTestResult?: string;
  latestTestDate?: string;

  mentorMessages?: {
    role: "user" | "mentor";
    text: string;
  }[];

  status: GoalStatus;
};