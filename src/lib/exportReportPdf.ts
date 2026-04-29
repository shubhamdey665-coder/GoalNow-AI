import { jsPDF } from "jspdf";
import type { Goal } from "@/types/goal";

type ReportData = {
  total: number;
  completed: number;
  pending: number;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
};

type AiReport = {
  summary: string;
  progressFeedback: string;
  weakAreas: string[];
  nextActions: string[];
  weeklyRecommendation: string;
};

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];

  lines.forEach((line) => {
    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
}

function checkPageSpace(doc: jsPDF, y: number, neededSpace = 20) {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + neededSpace > pageHeight - 20) {
    doc.addPage();
    return 20;
  }

  return y;
}

export function downloadReportPdf(
  goal: Goal,
  reportData: ReportData,
  aiReport: AiReport | null,
  reportSource: "gemini" | "fallback"
) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  y = addWrappedText(doc, "GoalNow AI - Progress Report", margin, y, maxWidth, 9);

  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  y = addWrappedText(doc, goal.name, margin, y, maxWidth, 8);

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const basicInfo = [
    `Tracker Type: ${
      goal.trackerType === "normal" ? "Normal Tracker" : "Complex AI Tracker"
    }`,
    `Report Source: ${
      reportSource === "gemini" ? "Gemini-generated report" : "Fallback report"
    }`,
    `Category: ${goal.category}`,
    `Duration: ${goal.duration}`,
    `Priority: ${goal.priority || "Medium"}`,
    `Target Date: ${
      goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "Not set"
    }`,
    `Created: ${new Date(goal.createdAt).toLocaleDateString()}`,
    `Last Updated: ${
      goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString() : "Not updated"
    }`,
  ];

  basicInfo.forEach((line) => {
    y = checkPageSpace(doc, y);
    doc.text(line, margin, y);
    y += 7;
  });

  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  y = checkPageSpace(doc, y, 20);
  doc.text("Progress Stats", margin, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const stats = [
    `Progress: ${reportData.progressPercentage}%`,
    `Completed: ${reportData.completed}`,
    `Pending: ${reportData.pending}`,
    `Total: ${reportData.total}`,
    `Completed Tasks: ${reportData.completedTasks}/${reportData.totalTasks}`,
  ];

  stats.forEach((line) => {
    y = checkPageSpace(doc, y);
    doc.text(line, margin, y);
    y += 7;
  });

  if (goal.trackerType === "complex") {
    y += 4;

    doc.setFont("helvetica", "bold");
    y = checkPageSpace(doc, y, 20);
    doc.text("Complex Tracker Details", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");

    const complexInfo = [
      `Active Day: Day ${goal.activeDayNumber || 1}`,
      `Daily Time: ${goal.dailyTime || "Not set"}`,
      `Current Level: ${goal.currentLevel || "Not set"}`,
      `Target Result: ${goal.targetResult || "Not set"}`,
    ];

    complexInfo.forEach((line) => {
      y = checkPageSpace(doc, y, 15);
      y = addWrappedText(doc, line, margin, y, maxWidth, 6);
      y += 2;
    });
  }

  if (goal.trackerType === "normal") {
    y += 4;

    doc.setFont("helvetica", "bold");
    y = checkPageSpace(doc, y, 20);
    doc.text("Normal Tracker Details", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");

    const normalInfo = [
      `Target: ${goal.normalTarget || goal.name}`,
      `Frequency: ${goal.normalFrequency || "daily"}`,
    ];

    normalInfo.forEach((line) => {
      y = checkPageSpace(doc, y);
      doc.text(line, margin, y);
      y += 7;
    });
  }

  if (aiReport) {
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    y = checkPageSpace(doc, y, 20);
    doc.text("AI Report Summary", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y = addWrappedText(doc, aiReport.summary, margin, y, maxWidth, 6);

    y += 5;

    doc.setFont("helvetica", "bold");
    y = checkPageSpace(doc, y, 20);
    doc.text("Progress Feedback", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, aiReport.progressFeedback, margin, y, maxWidth, 6);

    y += 5;

    doc.setFont("helvetica", "bold");
    y = checkPageSpace(doc, y, 20);
    doc.text("Weak Areas", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");

    aiReport.weakAreas.forEach((area, index) => {
      y = checkPageSpace(doc, y, 12);
      y = addWrappedText(doc, `${index + 1}. ${area}`, margin, y, maxWidth, 6);
    });

    y += 5;

    doc.setFont("helvetica", "bold");
    y = checkPageSpace(doc, y, 20);
    doc.text("Next Actions", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");

    aiReport.nextActions.forEach((action, index) => {
      y = checkPageSpace(doc, y, 12);
      y = addWrappedText(doc, `${index + 1}. ${action}`, margin, y, maxWidth, 6);
    });

    y += 5;

    doc.setFont("helvetica", "bold");
    y = checkPageSpace(doc, y, 20);
    doc.text("Weekly Recommendation", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    y = addWrappedText(
      doc,
      aiReport.weeklyRecommendation,
      margin,
      y,
      maxWidth,
      6
    );
  }

  if (goal.latestTestResult) {
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    y = checkPageSpace(doc, y, 20);
    doc.text("Latest Weekly Test Result", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y = addWrappedText(doc, goal.latestTestResult, margin, y, maxWidth, 6);

    if (goal.latestTestDate) {
      y += 3;
      y = checkPageSpace(doc, y, 10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Saved on: ${new Date(goal.latestTestDate).toLocaleDateString()}`,
        margin,
        y
      );
    }
  }

  const fileName = `${safeFileName(goal.name)}-progress-report.pdf`;
  doc.save(fileName);
}