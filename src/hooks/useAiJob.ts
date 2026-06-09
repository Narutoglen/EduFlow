"use client";
// Polls an AI job until terminal, invoking handlers on completion. See /contracts/api_contracts.md §6.
// setState happens only inside async callbacks (never synchronously in an effect body).
import { useEffect, useRef, useState } from "react";
import { getJob, type Job } from "@/lib/ai-api";

export type JobHandlers = {
  onReady?: (job: Job) => void;
  onFailed?: (message: string) => void;
};

export function useAiJob(jobId: string | null, handlers?: JobHandlers) {
  const [status, setStatus] = useState<Job["status"] | "IDLE">("IDLE");
  const handlersRef = useRef<JobHandlers | undefined>(handlers);

  // Keep the latest handlers without re-subscribing the polling effect.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const job = await getJob(jobId);
        if (cancelled) return;
        setStatus(job.status);
        if (job.status === "PENDING" || job.status === "RUNNING") {
          attempt += 1;
          timer = setTimeout(poll, Math.min(1000 + attempt * 500, 4000)); // backoff, cap 4s
        } else if (job.status === "READY") {
          handlersRef.current?.onReady?.(job);
        } else {
          handlersRef.current?.onFailed?.(job.error ?? "Job did not complete");
        }
      } catch (e) {
        if (cancelled) return;
        setStatus("FAILED");
        handlersRef.current?.onFailed?.(e instanceof Error ? e.message : "Polling failed");
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  return { status };
}
