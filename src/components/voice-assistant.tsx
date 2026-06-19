"use client";
// Speech-to-text learning assistant (M3): ask by voice or text; answers are grounded in this
// course's material (RAG) with citations. Voice path: record -> upload -> transcribe -> ask.
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Send, Loader2, Bot, User, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import { useAiJob } from "@/hooks/useAiJob";
import {
  askAssistant,
  ingestCourse,
  transcriptSchema,
  uploadVoice,
  AiApiError,
  type Citation,
} from "@/lib/ai-api";

type Msg = { role: "USER" | "ASSISTANT"; content: string; citations?: Citation[] };

export function VoiceAssistant({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [tts, setTts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Make sure this course's lessons are indexed for retrieval (idempotent, fire-and-forget).
  useEffect(() => {
    void ingestCourse(courseId);
  }, [courseId]);

  const speak = useCallback(
    (text: string) => {
      if (!tts || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    },
    [tts],
  );

  const ask = useCallback(
    async (question: string, sourceAudioId?: string | null) => {
      const q = question.trim();
      if (!q || busy) return;
      setBusy(true);
      setError(null);
      setMessages((m) => [...m, { role: "USER", content: q }]);
      try {
        const res = await askAssistant(courseId, q, conversationId, sourceAudioId);
        setConversationId(res.conversationId);
        setMessages((m) => [...m, { role: "ASSISTANT", content: res.answer, citations: res.citations }]);
        speak(res.answer);
      } catch (e) {
        setError(e instanceof AiApiError ? e.message : "Could not get an answer");
      } finally {
        setBusy(false);
      }
    },
    [courseId, conversationId, busy, speak],
  );

  // Transcription job → ask with the transcript.
  useAiJob(jobId, {
    onReady: (job) => {
      setJobId(null);
      const parsed = transcriptSchema.safeParse(job.result);
      const transcript = parsed.success ? parsed.data.transcript : null;
      if (transcript) void ask(transcript, job.resultId ?? null);
      else setError("Could not transcribe the audio");
    },
    onFailed: (message) => {
      setJobId(null);
      setError(message || "Transcription failed");
    },
  });

  const startRecording = useCallback(async () => {
    setMicError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("Microphone not available — type your question instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          setBusy(true);
          const job = await uploadVoice(courseId, blob, conversationId);
          setJobId(job.jobId);
        } catch (e) {
          setError(e instanceof AiApiError ? e.message : "Upload failed");
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMicError("Microphone permission denied — type your question instead.");
    }
  }, [courseId, conversationId]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const transcribing = jobId !== null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="text-emerald-600" size={20} />
          <h2 className="text-xl font-semibold">Learning assistant</h2>
          <Badge tone="green">Course Q&amp;A</Badge>
        </div>
        <button
          onClick={() => setTts((v) => !v)}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          aria-pressed={tts}
        >
          {tts ? <Volume2 size={16} /> : <VolumeX size={16} />} {tts ? "Voice on" : "Voice off"}
        </button>
      </div>

      <p className="mt-2 text-sm text-zinc-500">
        Ask about this course. Answers are grounded only in this course&apos;s lessons, with citations.
      </p>

      <div className="mt-4 space-y-3" aria-live="polite">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-400">No questions yet — ask one below.</p>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className="flex gap-2">
            <span className="mt-0.5">
              {m.role === "USER" ? <User size={16} className="text-cyan-600" /> : <Bot size={16} className="text-emerald-600" />}
            </span>
            <div className="flex-1">
              <p className="text-sm text-zinc-800 dark:text-zinc-100">{m.content}</p>
              {m.citations && m.citations.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.citations.map((c, j) => (
                    <span
                      key={j}
                      className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      title={`relevance ${(c.score * 100).toFixed(0)}%`}
                    >
                      {c.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {(busy || transcribing) ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={16} />
            {transcribing ? "Transcribing…" : "Thinking…"}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
          <AlertTriangle size={16} /> {error}
        </p>
      ) : null}
      {micError ? <p className="mt-2 text-sm text-amber-600">{micError}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = input;
          setInput("");
          void ask(q);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          disabled={busy || recording}
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Square size={16} /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={busy}
            aria-label="Record a question"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-zinc-700"
          >
            <Mic size={16} /> Speak
          </button>
        )}
        <button
          type="submit"
          disabled={busy || recording || !input.trim()}
          aria-label="Send question"
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950"
        >
          <Send size={16} />
        </button>
      </form>
    </Panel>
  );
}
