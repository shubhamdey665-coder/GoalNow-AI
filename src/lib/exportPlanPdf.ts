import { jsPDF } from "jspdf";
import type { Goal } from "@/types/goal";

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

export function downloadComplexPlanPdf(goal: Goal) {
  if (goal.trackerType !== "complex") {
    alert("PDF plan download is only available for complex AI trackers.");
    return;
  }

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  y = addWrappedText(doc, "GoalNow AI - Complex Plan", margin, y, maxWidth, 9);

  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  y = addWrappedText(doc, goal.name, margin, y, maxWidth, 8);

  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const basicInfo = [
    `Category: ${goal.category}`,
    `Duration: ${goal.duration}`,
    `Priority: ${goal.priority || "Medium"}`,
    `Target Date: ${
      goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "Not set"
    }`,
    `Daily Time: ${goal.dailyTime || "Not set"}`,
    `Active Day: Day ${goal.activeDayNumber || 1}`,
    `Created: ${new Date(goal.createdAt).toLocaleDateString()}`,
  ];

  basicInfo.forEach((line) => {
    y = checkPageSpace(doc, y);
    doc.text(line, margin, y);
    y += 7;
  });

  y += 4;

  if (goal.currentLevel) {
    y = checkPageSpace(doc, y, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Current Level", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, goal.currentLevel, margin, y, maxWidth, 6);
    y += 4;
  }

  if (goal.targetResult) {
    y = checkPageSpace(doc, y, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Target Result", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, goal.targetResult, margin, y, maxWidth, 6);
    y += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  y = checkPageSpace(doc, y, 20);
  doc.text("Daily Plan", margin, y);
  y += 9;

  doc.setFontSize(11);

  const planDays = goal.complexPlanDays || [];

  if (planDays.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text("No plan days found.", margin, y);
  }

  planDays.forEach((day) => {
    y = checkPageSpace(doc, y, 35);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    y = addWrappedText(
      doc,
      `Day ${day.dayNumber}: ${day.title}`,
      margin,
      y,
      maxWidth,
      7
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    y = addWrappedText(doc, `Focus: ${day.focus}`, margin, y, maxWidth, 6);
    y += 2;

    day.tasks.forEach((task, taskIndex) => {
      y = checkPageSpace(doc, y, 12);

      const status = task.completed ? "[Done]" : "[Pending]";
      const taskText = `${taskIndex + 1}. ${status} ${task.title}`;

      y = addWrappedText(doc, taskText, margin + 4, y, maxWidth - 4, 6);
    });

    if (day.completedAt) {
      y = checkPageSpace(doc, y, 10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Completed on: ${new Date(day.completedAt).toLocaleDateString()}`,
        margin + 4,
        y
      );
      doc.setFont("helvetica", "normal");
      y += 6;
    }

    y += 5;
  });

  const fileName = `${safeFileName(goal.name)}-complex-plan.pdf`;
  doc.save(fileName);
}