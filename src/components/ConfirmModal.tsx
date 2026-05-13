"use client";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  tone?: "danger" | "info" | "success";
  icon?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  tone = "danger",
  icon = "!",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const toneClasses = {
    danger: {
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(248,113,113,0.22),transparent_45%)]",
      icon: "bg-red-400/10 text-red-200 shadow-red-500/10",
      button:
        "bg-gradient-to-br from-red-400/25 to-red-500/25 text-red-50 hover:from-red-400/35 hover:to-red-500/35 shadow-red-500/10",
    },
    info: {
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.22),transparent_45%)]",
      icon: "bg-cyan-400/10 text-cyan-200 shadow-cyan-500/10",
      button:
        "bg-gradient-to-br from-cyan-300 to-blue-400 text-slate-950 hover:from-cyan-200 hover:to-blue-300 shadow-cyan-500/20",
    },
    success: {
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.22),transparent_45%)]",
      icon: "bg-emerald-400/10 text-emerald-200 shadow-emerald-500/10",
      button:
        "bg-gradient-to-br from-emerald-300 to-cyan-300 text-slate-950 hover:from-emerald-200 hover:to-cyan-200 shadow-emerald-500/20",
    },
  };

  const selectedTone = toneClasses[tone];

  return (
    <div className="goalnow-confirm-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 text-white backdrop-blur-md">
      <div className="goalnow-confirm-card w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black">
        <div className="relative p-6">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-32 ${selectedTone.glow}`}
          />

          <div className="relative">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-lg ${selectedTone.icon}`}
            >
              {icon}
            </div>

            <h2 className="mt-5 text-center text-2xl font-black">{title}</h2>

            <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-400">
              {message}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${selectedTone.button}`}
              >
                {isLoading ? "Please wait..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .goalnow-confirm-backdrop {
          animation: goalnowConfirmFade 0.25s ease both;
        }

        .goalnow-confirm-card {
          animation: goalnowConfirmPop 0.32s cubic-bezier(0.2, 0.9, 0.2, 1.1)
            both;
        }

        @keyframes goalnowConfirmFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes goalnowConfirmPop {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}