import type { Goal } from "@/types/goal";

function escapeHtml(value: string | undefined | null) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString?: string) {
  if (!dateString) return "Not set";

  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Not set";
  }
}

function getSafeFileName(goalName: string) {
  const safeName = goalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return safeName || "goal-plan";
}

export function downloadComplexPlanPdf(goal: Goal) {
  if (goal.trackerType !== "complex") {
    alert("PDF download is only available for complex AI trackers.");
    return;
  }

  const planDays = goal.complexPlanDays || [];
  const fileName = `goalnow-ai-${getSafeFileName(goal.name)}-plan`;

  const planHtml = planDays
    .map((day) => {
      const tasks = day.tasks || [];

      const taskHtml = tasks
        .map(
          (task) => `
            <li class="task-row">
              <span class="box">${task.completed ? "✓" : ""}</span>
              <span class="task-text">${escapeHtml(task.title)}</span>
            </li>
          `
        )
        .join("");

      return `
        <section class="day-row">
          <div class="day-content">
            <div class="day-title-row">
              <span class="day-number">Day ${day.dayNumber}</span>
              <span class="day-title">${escapeHtml(day.title)}</span>
            </div>

            <p class="focus">${escapeHtml(day.focus)}</p>

            <ul class="task-list">
              ${taskHtml || "<li class='task-row'><span class='box'></span><span>No tasks found.</span></li>"}
            </ul>
          </div>
        </section>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(fileName)}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.35;
    }

    .print-button {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 999;
      border: none;
      background: #06b6d4;
      color: #020617;
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.25);
    }

    /*
      Layer system:
      - Card backgrounds stay in the normal layer.
      - Watermark sits above card backgrounds.
      - Text content sits above the watermark.
    */
    .page-watermark {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 128px;
      line-height: 1;
      font-weight: 900;
      color: rgba(30, 64, 175, 0.16);
      transform: rotate(-30deg);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 20;
      letter-spacing: 0.03em;
    }

    .page {
      position: relative;
      padding: 16mm 13mm;
    }

    .cover {
      min-height: 260mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #7dd3fc;
      border-radius: 24px;
      padding: 30px;
      background: linear-gradient(135deg, #020617 0%, #0f172a 45%, #082f49 100%);
      color: #ffffff;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .cover::before {
      content: "";
      position: absolute;
      right: -70px;
      top: -70px;
      width: 260px;
      height: 260px;
      border-radius: 999px;
      background: rgba(34, 211, 238, 0.28);
      filter: blur(36px);
    }

    .cover::after {
      content: "";
      position: absolute;
      left: -90px;
      bottom: -90px;
      width: 280px;
      height: 280px;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.18);
      filter: blur(40px);
    }

    .cover-content {
      position: relative;
      z-index: 30;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 32px;
    }

    .brand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
    }

    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 900;
      font-size: 18px;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: #22d3ee;
      color: #020617;
      font-weight: 900;
    }

    .brand-pill {
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      padding: 8px 12px;
      color: #bae6fd;
      font-size: 11px;
      font-weight: 800;
    }

    .eyebrow {
      margin: 0 0 10px;
      color: #67e8f9;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.22em;
    }

    .cover h1 {
      margin: 0;
      max-width: 780px;
      font-size: 54px;
      line-height: 1.02;
      letter-spacing: -0.05em;
      color: #ffffff;
    }

    .subtitle {
      margin-top: 18px;
      max-width: 700px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 30px;
    }

    .detail-card {
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 14px;
      backdrop-filter: blur(4px);
    }

    .detail-card span {
      display: block;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .detail-card strong {
      display: block;
      margin-top: 5px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    .target-box {
      margin-top: 14px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 15px;
      backdrop-filter: blur(4px);
    }

    .target-box span {
      display: block;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .target-box p {
      margin: 7px 0 0;
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.5;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: #94a3b8;
      font-size: 11px;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 14px;
      border: 1px solid rgba(148, 163, 184, 0.45);
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.88);
    }

    .plan-text-layer {
      position: relative;
      z-index: 30;
    }

    .plan-header h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.2;
      color: #0f172a;
    }

    .plan-header p {
      margin: 2px 0 0;
      color: #64748b;
      font-size: 10px;
    }

    .pdf-brand {
      font-size: 11px;
      font-weight: 900;
      color: #0891b2;
      white-space: nowrap;
    }

    .day-row {
      position: relative;
      page-break-inside: avoid;
      border: 1px solid rgba(148, 163, 184, 0.55);
      border-radius: 10px;
      padding: 8px 9px;
      margin-bottom: 7px;
      background: rgba(255, 255, 255, 0.88);
      overflow: hidden;
    }

    .day-content {
      position: relative;
      z-index: 30;
    }

    .day-title-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 4px;
    }

    .day-number {
      flex: 0 0 auto;
      border-radius: 999px;
      background: #0f172a;
      color: #ffffff;
      padding: 3px 7px;
      font-size: 9px;
      font-weight: 900;
    }

    .day-title {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      overflow-wrap: anywhere;
    }

    .focus {
      margin: 0 0 5px;
      color: #475569;
      font-size: 10px;
      line-height: 1.35;
    }

    .task-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 3px;
    }

    .task-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      color: #0f172a;
      font-size: 10px;
      line-height: 1.3;
      min-height: 16px;
      padding: 2px 0;
    }

    .box {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 11px;
      height: 11px;
      border: 1.4px solid #0f172a;
      margin-top: 1px;
      font-size: 8px;
      font-weight: 900;
      line-height: 1;
      background: rgba(255, 255, 255, 0.4);
    }

    .task-text {
      overflow-wrap: anywhere;
    }

    .footer-note {
      position: relative;
      z-index: 30;
      margin-top: 10px;
      border-top: 1px solid rgba(148, 163, 184, 0.5);
      padding-top: 7px;
      color: #475569;
      text-align: center;
      font-size: 9px;
      background: rgba(255, 255, 255, 0.72);
      border-radius: 8px;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .print-button {
        display: none;
      }

      .page {
        padding: 0;
      }

      .page-watermark {
        color: rgba(30, 64, 175, 0.17);
      }

      @page {
        size: A4;
        margin: 9mm;
      }
    }
  </style>
</head>

<body>
  <div class="page-watermark">GoalNow-AI</div>

  <button class="print-button" onclick="window.print()">Download / Save PDF</button>

  <main class="page">
    <section class="cover">
      <div class="cover-content">
        <div class="brand">
          <div class="brand-left">
            <span class="brand-mark">G</span>
            <span>GoalNow-AI</span>
          </div>

          <span class="brand-pill">Goal Details</span>
        </div>

        <div class="cover-main">
          <p class="eyebrow">Goal Plan Export</p>
          <h1>${escapeHtml(goal.name)}</h1>

          <p class="subtitle">
            This PDF contains your goal details and the complete plan checklist.
            Use it for offline study, revision, planning, and printing.
          </p>

          <div class="details-grid">
            <div class="detail-card">
              <span>Category</span>
              <strong>${escapeHtml(goal.category)}</strong>
            </div>

            <div class="detail-card">
              <span>Duration</span>
              <strong>${escapeHtml(goal.duration)}</strong>
            </div>

            <div class="detail-card">
              <span>Priority</span>
              <strong>${escapeHtml(goal.priority || "Medium")}</strong>
            </div>

            <div class="detail-card">
              <span>Target Date</span>
              <strong>${formatDate(goal.targetDate)}</strong>
            </div>

            <div class="detail-card">
              <span>Daily Time</span>
              <strong>${escapeHtml(goal.dailyTime || "Not provided")}</strong>
            </div>

            <div class="detail-card">
              <span>Created</span>
              <strong>${formatDate(goal.createdAt)}</strong>
            </div>
          </div>

          <div class="target-box">
            <span>Current Level</span>
            <p>${escapeHtml(goal.currentLevel || "Not provided")}</p>
          </div>

          <div class="target-box">
            <span>Target Result</span>
            <p>${escapeHtml(goal.targetResult || "Not provided")}</p>
          </div>
        </div>

        <div class="cover-footer">
          <span>© 2026 Powered by GoalNow-AI</span>
          <span>Generated from your GoalNow-AI tracker</span>
        </div>
      </div>
    </section>

    <section>
      <div class="plan-header plan-text-layer">
        <div>
          <h2>Full Plan Checklist</h2>
          <p>Each task includes a tickbox for offline tracking.</p>
        </div>

        <div class="pdf-brand">GoalNow-AI</div>
      </div>

      ${planHtml || "<p>No plan days found.</p>"}

      <div class="footer-note">
        © 2026 Powered by GoalNow-AI - Full Plan Checklist
      </div>
    </section>
  </main>

  <script>
    document.title = "${escapeHtml(fileName)}";
    setTimeout(() => {
      window.print();
    }, 500);
  </script>
</body>
</html>
`;

  const printWindow = window.open("", "_blank", "width=1100,height=900");

  if (!printWindow) {
    alert("Popup blocked. Please allow popups to download the PDF.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}