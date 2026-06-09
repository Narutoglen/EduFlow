"use client";
// Flashcard study (M2): generate a deck, then review due cards with SM-2 grading.
// States: loading / empty / generating / studying / done / error. Keyboard: space=flip, 1-4=grade.
import { useCallback, useEffect, useState } from "react";
import { Loader2, Layers, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import { useAiJob } from "@/hooks/useAiJob";
import {
  AiApiError,
  flashcardsListSchema,
  generateFlashcards,
  getDeck,
  getDueCards,
  reviewCard,
  type Card,
} from "@/lib/ai-api";

type Phase = "loading" | "empty" | "generating" | "studying" | "done" | "error";

// label, SM-2 grade
const GRADES: [string, number, "red" | "amber" | "blue" | "green"][] = [
  ["Again", 1, "red"],
  ["Hard", 3, "amber"],
  ["Good", 4, "blue"],
  ["Easy", 5, "green"],
];

export function FlashcardStudy({ lessonId }: { lessonId: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = queue[index];

  const startStudy = useCallback(async () => {
    const due = await getDueCards(lessonId, 50);
    setQueue(due);
    setIndex(0);
    setFlipped(false);
    setPhase(due.length === 0 ? "done" : "studying");
  }, [lessonId]);

  useAiJob(jobId, {
    onReady: async (job) => {
      const parsed = flashcardsListSchema.safeParse(job.result);
      setJobId(null);
      if (!parsed.success) {
        setError("Deck generated but could not be read");
        setPhase("error");
        return;
      }
      await startStudy();
    },
    onFailed: (message) => {
      setJobId(null);
      setError(message || "Flashcard generation failed");
      setPhase("error");
    },
  });

  // Initial: is there already a deck?
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deck = await getDeck(lessonId);
        if (cancelled) return;
        if (deck) await startStudy();
        else setPhase("empty");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof AiApiError ? e.message : "Failed to load flashcards");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, startStudy]);

  const onGenerate = useCallback(async () => {
    setPhase("generating");
    setError(null);
    try {
      const res = await generateFlashcards(lessonId, count);
      if (res.kind === "list") await startStudy();
      else setJobId(res.job.jobId);
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : "Could not start generation");
      setPhase("error");
    }
  }, [lessonId, count, startStudy]);

  const onGrade = useCallback(
    async (grade: number) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        await reviewCard(current.id, grade);
        const next = index + 1;
        if (next >= queue.length) setPhase("done");
        else {
          setIndex(next);
          setFlipped(false);
        }
      } catch (e) {
        setError(e instanceof AiApiError ? e.message : "Could not save review");
        setPhase("error");
      } finally {
        setBusy(false);
      }
    },
    [current, busy, index, queue.length],
  );

  // Keyboard shortcuts during study
  useEffect(() => {
    if (phase !== "studying") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) {
        const g = GRADES[Number(e.code.slice(-1)) - 1];
        if (g) void onGrade(g[1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, flipped, onGrade]);

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="text-cyan-600" size={20} />
          <h2 className="text-xl font-semibold">Flashcards</h2>
          <Badge tone="blue">SRS</Badge>
        </div>
        {phase === "studying" ? (
          <span className="text-sm text-zinc-500">
            {index + 1} / {queue.length}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {phase === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={16} /> Loading flashcards…
          </p>
        ) : null}

        {phase === "empty" ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Generate spaced-repetition flashcards from this lesson.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">
                Cards{" "}
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="ml-1 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={onGenerate}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
              >
                <Layers size={16} /> Generate flashcards
              </button>
            </div>
          </div>
        ) : null}

        {phase === "generating" ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={16} /> Generating flashcards…
          </p>
        ) : null}

        {phase === "error" ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-rose-600">
              <AlertTriangle size={16} /> {error}
            </p>
            <button
              onClick={onGenerate}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
            >
              <RotateCcw size={16} /> Try again
            </button>
          </div>
        ) : null}

        {phase === "done" ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 size={18} /> You&apos;re all caught up — no cards due right now.
          </div>
        ) : null}

        {phase === "studying" && current ? (
          <div className="space-y-4">
            <button
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? "Show question" : "Reveal answer"}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-lg border border-zinc-200 bg-stone-50 p-6 text-center transition hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                {flipped ? "Answer" : "Question"}
              </span>
              <span className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {flipped ? current.back : current.front}
              </span>
              {flipped && current.hint ? (
                <span className="mt-2 text-sm text-zinc-500">Hint: {current.hint}</span>
              ) : null}
            </button>

            {flipped ? (
              <div className="flex flex-wrap gap-2">
                {GRADES.map(([label, grade, tone]) => (
                  <button
                    key={label}
                    disabled={busy}
                    onClick={() => onGrade(grade)}
                    className={tone === "red"
                      ? "rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50"
                      : tone === "amber"
                        ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                        : tone === "blue"
                          ? "rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 disabled:opacity-50"
                          : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50"}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setFlipped(true)}
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
              >
                Reveal answer
              </button>
            )}
            <p className="text-xs text-zinc-400">Space flips · keys 1–4 grade after reveal</p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
