import type { Goal } from "@/types/goal";

export type SmartDayProgress = {
  date: string;
  scheduledDayNumber: number;
  scheduledTaskCount: number;
  completedTaskUnits: number;
  percentage: number;
  ownTaskCount: number;
  catchUpTaskCount: number;
  futureTaskCount: number;
  ownDayNumbers: number[];
  catchUpDayNumbers: number[];
  futureDayNumbers: number[];
  isSkipped: boolean;
};

export function formatDateToYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateOnly(value: string | Date) {
  return formatDateToYMD(new Date(value));
}

export function getTodayYMD() {
  return formatDateToYMD(new Date());
}

export function getGoalStartDate(goal: Goal) {
  const startDate = new Date(goal.createdAt);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

export function getScheduledDayNumber(goal: Goal, dateInput: string | Date) {
  const startDate = getGoalStartDate(goal);
  const targetDate = new Date(dateInput);
  targetDate.setHours(0, 0, 0, 0);

  const difference = targetDate.getTime() - startDate.getTime();
  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
}

export function getWeekStartMonday(dateInput: Date) {
  const date = new Date(dateInput);
  const day = date.getDay();
  const differenceToMonday = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + differenceToMonday);
  date.setHours(0, 0, 0, 0);

  return date;
}

export function addDays(dateInput: Date, amount: number) {
  const date = new Date(dateInput);
  date.setDate(date.getDate() + amount);
  return date;
}

export function calculateSmartDayProgress(
  goal: Goal,
  dateInput: string | Date
): SmartDayProgress {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);

  const dateKey = formatDateToYMD(date);
  const todayKey = getTodayYMD();

  const planDays = goal.complexPlanDays || [];

  const scheduledDayNumber = getScheduledDayNumber(goal, date);

  const scheduledDay = planDays.find(
    (day) => day.dayNumber === scheduledDayNumber
  );

  const scheduledTaskCount = scheduledDay?.tasks.length || 0;

  let completedTaskUnits = 0;
  let ownTaskCount = 0;
  let catchUpTaskCount = 0;
  let futureTaskCount = 0;

  const ownDayNumbers = new Set<number>();
  const catchUpDayNumbers = new Set<number>();
  const futureDayNumbers = new Set<number>();

  for (const planDay of planDays) {
    for (const task of planDay.tasks) {
      if (!task.completedAt) continue;

      const completedDate = getDateOnly(task.completedAt);

      if (completedDate !== dateKey) continue;

      completedTaskUnits += 1;

      if (planDay.dayNumber === scheduledDayNumber) {
        ownTaskCount += 1;
        ownDayNumbers.add(planDay.dayNumber);
      } else if (planDay.dayNumber < scheduledDayNumber) {
        catchUpTaskCount += 1;
        catchUpDayNumbers.add(planDay.dayNumber);
      } else {
        futureTaskCount += 1;
        futureDayNumbers.add(planDay.dayNumber);
      }
    }
  }

  const baseTaskCount = scheduledTaskCount > 0 ? scheduledTaskCount : 1;

  const percentage = Math.round((completedTaskUnits / baseTaskCount) * 100);

  const isSkipped =
    dateKey < todayKey &&
    scheduledTaskCount > 0 &&
    ownTaskCount === 0;

  return {
    date: dateKey,
    scheduledDayNumber,
    scheduledTaskCount,
    completedTaskUnits,
    percentage,
    ownTaskCount,
    catchUpTaskCount,
    futureTaskCount,
    ownDayNumbers: Array.from(ownDayNumbers).sort((a, b) => a - b),
    catchUpDayNumbers: Array.from(catchUpDayNumbers).sort((a, b) => a - b),
    futureDayNumbers: Array.from(futureDayNumbers).sort((a, b) => a - b),
    isSkipped,
  };
}

export function calculateSmartWeekProgress(goal: Goal, weekStartDate: Date) {
  return Array.from({ length: 7 }, (_, index) =>
    calculateSmartDayProgress(goal, addDays(weekStartDate, index))
  );
}

export function canGoToPreviousWeek(goal: Goal, weekStartDate: Date) {
  const previousWeekStart = addDays(weekStartDate, -7);
  const previousWeekEnd = addDays(previousWeekStart, 6);

  return previousWeekEnd >= getGoalStartDate(goal);
}