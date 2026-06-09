"use client";
// AI Summary panel for a lesson (M1). Handles loading / empty / generating / error / ready states.
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import { useAiJob } from "@/hooks/useAiJob";
import {
  generateSummary,
  getSummary,
  summarySchema,
  AiApiError,
  type Summary,
} from "@/lib/ai-api";

type Phase = "loading" | "empty" | "generating" | "ready" | "error";

export function AiSummaryPanel({ lessonId }: { lessonId: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Polling hook reports completion via callbacks (keeps setState out of effect bodies).
  useAiJob(jobId, {
    onReady: (job) => {
      const parsed = summarySchema.safeParse(job.result);
      if (parsed.success) {
        setSummary(parsed.data);
        setPhase("ready");
      } else {
        setError("Summary completed but could not be read");
        setPhase("error");
      }
      setJobId(null);
    },
    onFailed: (message) => {
      setError(message || "Summary generation failed");
      setPhase("error");
      setJobId(null);
    },
  });

  // Initial load: is there a cached summary?
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await getSummary(lessonId);
        if (cancelled) return;
        if (existing && existing.status === "READY") {
          setSummary(existing);
          setPhase("ready");
        } else {
          setPhase("empty");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof AiApiError ? e.message : "Failed to load summary");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  async function onGenerate() {
    setPhase("generating");
    setError(null);
    try {
      const res = await generateSummary(lessonId);
      if (res.kind === "summary") {
        setSummary(res.summary);
        setPhase("ready");
      } else {
        setJobId(res.job.jobId); // hand off to the polling hook
      }
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : "Could not start generation");
      setPhase("error");
    }
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-600" size={20} />
          <h2 className="text-xl font-semibold">AI summary</h2>
          <Badge tone="violet">Beta</Badge>
        </div>
        {phase === "ready" && summary?.readingSeconds ? (
          <Badge tone="green">
            <Clock size={13} /> ~{Math.max(1, Math.round(summary.readingSeconds / 60))} min saved
          </Badge>
        ) : null}
      </div>

      <div className="mt-4">
        {phase === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={16} /> Checking for a summary…
          </p>
        ) : null}

        {phase === "empty" ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Generate a concise AI summary and key takeaways for this lesson.
            </p>
            <button
              onClick={onGenerate}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
            >
              <Sparkles size={16} /> Generate summary
            </button>
          </div>
        ) : null}

        {phase === "generating" ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={16} /> Generating summary… this runs locally and may
            take a moment.
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
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        ) : null}

        {phase === "ready" && summary ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{summary.summary}</p>
            {summary.keyPoints.length > 0 ? (
              <div>
                <p className="text-sm font-semibold">Key takeaways</p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-violet-500">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-zinc-400">
              Generated by {summary.model} · {summary.promptVersion}
            </p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
