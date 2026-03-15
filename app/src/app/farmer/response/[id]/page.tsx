"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Escalation, Query, Response as QueryResponse } from "@dko/shared";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Languages,
  Leaf,
  MessageSquareText,
  Mic,
  Sparkles,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AIResponseRenderer } from "@/components/farmer/ai-response-renderer";
import { apiClient } from "@/lib/api";

const responseImage =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop";

type ResponseLanguage = "en" | "hi" | "ml";

const languageOptions: Array<{ value: ResponseLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ml", label: "Malayalam" }
];

const queryTypeMeta = {
  text: {
    label: "Text advisory",
    askHref: "/farmer/query/text",
    askLabel: "Ask Another Text Question",
    icon: MessageSquareText
  },
  voice: {
    label: "Voice advisory",
    askHref: "/farmer/query/voice",
    askLabel: "Send Another Voice Note",
    icon: Mic
  },
  image: {
    label: "Image advisory",
    askHref: "/farmer/query/image",
    askLabel: "Analyze Another Image",
    icon: Camera
  }
} as const;

export default function FarmerResponsePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { appUser, loading } = useAuth();
  const [query, setQuery] = useState<Query | null>(null);
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<"idle" | "helpful" | "not_helpful">("idle");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<ResponseLanguage>("en");
  const [translationCache, setTranslationCache] = useState<Partial<Record<ResponseLanguage, string>>>({});
  const [translationLoading, setTranslationLoading] = useState<ResponseLanguage | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !appUser) {
      router.replace("/farmer/login");
    }
  }, [appUser, loading, router]);

  async function loadQuery() {
    if (!params.id || !appUser) {
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const result = await apiClient.get<{
        success: true;
        data: {
          query: Query;
          responses: QueryResponse[];
          escalation: Escalation | null;
        };
      }>(`/queries/${params.id}`);

      setQuery(result.data.data.query);
      setResponses(result.data.data.responses);
      setEscalation(result.data.data.escalation);
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load the response.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    void loadQuery();
  }, [appUser, params.id]);

  const latestResponse = responses[responses.length - 1];
  const meta = useMemo(() => {
    if (!query) {
      return queryTypeMeta.text;
    }

    return queryTypeMeta[query.type];
  }, [query]);
  const QueryIcon = meta.icon;
  const sourceLabel =
    latestResponse?.type === "officer"
      ? latestResponse.officerName ?? "Officer review"
      : latestResponse?.generatedBy ?? "Gemini";
  const displayedContent =
    selectedLanguage === "en"
      ? latestResponse?.content ?? "No response yet."
      : translationCache[selectedLanguage] ?? latestResponse?.content ?? "No response yet.";

  useEffect(() => {
    setSelectedLanguage("en");
    setTranslationLoading(null);
    setTranslationError(null);
    setTranslationCache(latestResponse?.content ? { en: latestResponse.content } : {});
  }, [latestResponse?.responseId, latestResponse?.content]);

  async function handleLanguageChange(language: ResponseLanguage) {
    if (!query || !latestResponse) {
      return;
    }

    if (language === "en") {
      setSelectedLanguage("en");
      setTranslationError(null);
      return;
    }

    if (translationCache[language]) {
      setSelectedLanguage(language);
      setTranslationError(null);
      return;
    }

    setTranslationLoading(language);
    setTranslationError(null);

    try {
      const result = await apiClient.post<{
        success: true;
        data: {
          language: ResponseLanguage;
          content: string;
          translated: boolean;
          modelUsed: string;
        };
      }>(`/queries/${query.queryId}/translate`, {
        responseId: latestResponse.responseId,
        language
      });

      if (!result.data.data.translated) {
        setSelectedLanguage("en");
        setTranslationError(`Translation to ${language === "hi" ? "Hindi" : "Malayalam"} is unavailable right now.`);
        return;
      }

      setTranslationCache((current) => ({
        ...current,
        [language]: result.data.data.content
      }));
      setSelectedLanguage(language);
    } catch (translationRequestError) {
      console.error(translationRequestError);
      setSelectedLanguage("en");
      setTranslationError("Failed to translate the advisory right now. Showing English instead.");
    } finally {
      setTranslationLoading(null);
    }
  }

  async function sendFeedback(rating: "helpful" | "not_helpful") {
    if (!query || !latestResponse) {
      return;
    }

    setFeedbackLoading(true);
    setError(null);

    try {
      const result = await apiClient.post<{
        success: true;
        data: {
          escalation: Escalation | null;
        };
      }>(`/queries/${query.queryId}/feedback`, {
        rating,
        responseId: latestResponse.responseId
      });

      setFeedbackState(rating);
      if (result.data.data.escalation) {
        setEscalation(result.data.data.escalation);
      }
      await loadQuery();
    } catch (feedbackError) {
      console.error(feedbackError);
      setError("Failed to submit feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  if (loading || !appUser || fetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 text-center text-neutral-500">
        Loading response...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="border-b border-neutral-200 bg-white/80 px-5 py-8 backdrop-blur md:px-8 md:py-10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <a className="inline-flex items-center text-sm font-semibold text-neutral-900" href={meta.askHref}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {meta.label.toLowerCase()}
          </a>
          <div className="inline-flex items-center rounded-full border border-[#C8E6C9] bg-[#F1F8E9] px-4 py-2 text-[12px] font-medium uppercase tracking-[0.22em] text-[#2E7D32]">
            <Sparkles className="mr-2 h-4 w-4" /> {escalation ? "Escalated advisory" : "AI response ready"}
          </div>
        </div>
      </section>

      <section className="px-5 py-8 md:px-8 md:py-12">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
            <div
              className="h-[220px] w-full"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.08) 0%, rgba(10,10,10,0.52) 100%), url('${query?.imageUrl ?? responseImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32]">
                <Leaf className="h-4 w-4" /> Query summary
              </div>
              <h1
                className="mt-4 text-[34px] font-bold leading-[1.06] tracking-[-1.2px] text-neutral-950 md:text-[46px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your Advisory Has Been Generated.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600">
                Review the interpreted context and recommendations before taking the next step in the field.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600">
                  <QueryIcon className="mr-2 h-4 w-4" /> {meta.label}
                </div>
                {query?.confidence ? (
                  <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Confidence {query.confidence}%
                  </div>
                ) : null}
                {escalation ? (
                  <div className="inline-flex items-center rounded-full border border-[#FFE0B2] bg-[#FFF3E0] px-4 py-2 text-xs font-semibold text-[#C2410C]">
                    <Clock3 className="mr-2 h-4 w-4" /> Officer review {escalation.status.replace("_", " ")}
                  </div>
                ) : null}
              </div>

              {query?.type === "text" ? (
                <div className="mt-8 rounded-[24px] bg-neutral-50 p-5">
                  <div className="text-[12px] uppercase tracking-[0.22em] text-neutral-500">Original question</div>
                  <p className="mt-3 text-sm leading-7 text-neutral-900">{query.content}</p>
                </div>
              ) : null}

              {query?.type === "voice" ? (
                <div className="mt-8 space-y-4">
                  {query.audioUrl ? <audio className="w-full" controls src={query.audioUrl} /> : null}
                  <div className="rounded-[24px] bg-neutral-50 p-5">
                    <div className="text-[12px] uppercase tracking-[0.22em] text-neutral-500">Transcript</div>
                    <p className="mt-3 text-sm leading-7 text-neutral-900">
                      {query.transcribedText ?? query.description ?? "Transcript unavailable."}
                    </p>
                  </div>
                </div>
              ) : null}

              {query?.type === "image" ? (
                <div className="mt-8 space-y-4">
                  {query.imageUrl ? (
                    <img alt="Uploaded crop" className="h-[220px] w-full rounded-[24px] object-cover" src={query.imageUrl} />
                  ) : null}
                  <div className="rounded-[24px] bg-neutral-50 p-5">
                    <div className="text-[12px] uppercase tracking-[0.22em] text-neutral-500">Detected issue</div>
                    <p className="mt-3 text-sm leading-7 text-neutral-900">{query.detectedDisease ?? "Visible crop stress"}</p>
                    {query.description ? (
                      <p className="mt-3 text-sm leading-7 text-neutral-600">Farmer note: {query.description}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <motion.div
            className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[12px] uppercase tracking-[0.24em] text-neutral-500">Advisory</div>
                <h2
                  className="mt-3 text-[32px] font-bold leading-[1.08] tracking-[-1px] text-neutral-950 md:text-[38px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Field-ready recommendations.
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {latestResponse?.confidence ? (
                  <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Confidence {latestResponse.confidence}%
                  </div>
                ) : null}
                <div className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
                  Source {sourceLabel}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Languages className="h-4 w-4 text-neutral-500" /> View this advisory in
              </div>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-neutral-200 bg-white p-1">
                {languageOptions.map((option) => {
                  const isActive = selectedLanguage === option.value;
                  const isLoading = translationLoading === option.value;

                  return (
                    <button
                      key={option.value}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-neutral-950 text-white shadow-sm"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                      disabled={Boolean(translationLoading)}
                      onClick={() => {
                        void handleLanguageChange(option.value);
                      }}
                      type="button"
                    >
                      {isLoading ? `Translating ${option.label}...` : option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {translationError ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {translationError}
              </div>
            ) : null}

            {selectedLanguage !== "en" && translationCache[selectedLanguage] ? (
              <div className="mt-4 text-sm text-neutral-500">
                Showing translated advisory in {selectedLanguage === "hi" ? "Hindi" : "Malayalam"}.
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              <AIResponseRenderer content={displayedContent} />
            </div>

            {latestResponse?.type !== "officer" ? (
              <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-5">
                <div className="text-sm font-semibold text-neutral-900">Was this helpful?</div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 px-5 text-sm font-semibold text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={feedbackLoading}
                    onClick={() => {
                      void sendFeedback("helpful");
                    }}
                    type="button"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" /> {feedbackState === "helpful" ? "Marked helpful" : "Helpful"}
                  </button>
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
                    disabled={feedbackLoading || Boolean(escalation)}
                    onClick={() => {
                      void sendFeedback("not_helpful");
                    }}
                    type="button"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" /> {escalation ? "Officer review requested" : "Need officer review"}
                  </button>
                </div>
              </div>
            ) : null}

            {escalation ? (
              <div className="mt-6 rounded-[24px] border border-[#FFE0B2] bg-[#FFF8F1] p-5">
                <div className="text-[12px] uppercase tracking-[0.22em] text-[#C2410C]">Escalation status</div>
                <p className="mt-3 text-sm leading-7 text-[#7C2D12]">
                  Your query has been sent to an agricultural officer for human review. Status: <span className="font-semibold">{escalation.status.replace("_", " ")}</span>.
                </p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 text-sm text-neutral-600">
              {[
                latestResponse?.type === "officer"
                  ? "This answer was provided by a human officer after reviewing your case."
                  : "Use this response as initial guidance, not a pesticide prescription.",
                "For rapidly spreading disease or crop loss, escalate to a human agricultural officer.",
                query?.type === "voice"
                  ? "Replay the audio and verify the transcript if the symptom wording looks off."
                  : query?.type === "image"
                    ? "Upload one close-up and one full-plant image if you need a stronger follow-up diagnosis."
                    : "Ask a follow-up with more detail if symptoms change after treatment."
              ].map((line) => (
                <div key={line} className="inline-flex items-start gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2E7D32]" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-base font-semibold text-white" href={meta.askHref}>
                {meta.askLabel} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-base font-semibold text-neutral-900" href="/farmer/query">
                Back to Workspace
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
