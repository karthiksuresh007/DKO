"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Query, Response as QueryResponse } from "@dko/shared";
import { ArrowLeft, ArrowRight, CheckCircle2, Leaf, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api";

const responseImage =
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=80&auto=format&fit=crop";

export default function FarmerResponsePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { appUser, loading } = useAuth();
  const [query, setQuery] = useState<Query | null>(null);
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !appUser) {
      router.replace("/farmer/login");
    }
  }, [appUser, loading, router]);

  useEffect(() => {
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
          };
        }>(`/queries/${params.id}`);

        setQuery(result.data.data.query);
        setResponses(result.data.data.responses);
      } catch (loadError) {
        console.error(loadError);
        setError("Failed to load the response.");
      } finally {
        setFetching(false);
      }
    }

    void loadQuery();
  }, [appUser, params.id]);

  if (loading || !appUser || fetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5 text-center text-[#6B7280]">
        Loading response...
      </main>
    );
  }

  const latestResponse = responses[responses.length - 1];

  return (
    <main className="min-h-screen bg-white text-[#0A0A0A]">
      <section className="border-b border-[#E5E7EB] px-5 py-8 md:px-8 md:py-10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <a className="inline-flex items-center text-sm font-semibold text-[#0A0A0A]" href="/farmer/query/text">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ask another question
          </a>
          <div className="inline-flex items-center rounded-full border border-[#C8E6C9] bg-[#F1F8E9] px-4 py-2 text-[12px] font-medium uppercase tracking-[0.22em] text-[#2E7D32]">
            <Sparkles className="mr-2 h-4 w-4" /> AI response ready
          </div>
        </div>
      </section>

      <section className="px-5 py-8 md:px-8 md:py-12">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(10,10,10,0.06)]">
            <div
              className="h-[220px] w-full"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.08) 0%, rgba(10,10,10,0.52) 100%), url('${responseImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32]">
                <Leaf className="h-4 w-4" /> Query summary
              </div>
              <h1
                className="mt-4 text-[36px] font-bold leading-[1.06] tracking-[-1.2px] md:text-[48px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your Advisory Has Been Generated.
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#6B7280]">
                Review the original question, read the recommended actions, and continue with another prompt if you need a second answer.
              </p>

              <div className="mt-8 rounded-[24px] bg-[#F9FAFB] p-5">
                <div className="text-[12px] uppercase tracking-[0.22em] text-[#6B7280]">Original question</div>
                <p className="mt-3 text-sm leading-7 text-[#0A0A0A]">{query?.content}</p>
              </div>
            </div>
          </div>

          <motion.div
            className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_30px_70px_rgba(10,10,10,0.08)] md:p-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[12px] uppercase tracking-[0.24em] text-[#6B7280]">Advice</div>
                <h2
                  className="mt-3 text-[34px] font-bold leading-[1.08] tracking-[-1px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Field-ready recommendations.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestResponse?.confidence ? (
                  <div className="rounded-full border border-[#C8E6C9] bg-[#F1F8E9] px-4 py-2 text-xs font-semibold text-[#2E7D32]">
                    Confidence {latestResponse.confidence}%
                  </div>
                ) : null}
                <div className="rounded-full border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#6B7280]">
                  Source {latestResponse?.generatedBy ?? "unknown"}
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-[28px] border border-[#E5E7EB] bg-[#FCFCFB] p-5 md:p-6">
              <p className="whitespace-pre-line text-[15px] leading-8 text-[#0A0A0A]">
                {latestResponse?.content ?? "No response yet."}
              </p>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-[#6B7280]">
              {[
                "Use this response as initial guidance, not a pesticide prescription.",
                "For rapidly spreading disease or crop loss, escalate to a human agricultural officer.",
                "Ask a follow-up with more detail if symptoms change after treatment."
              ].map((line) => (
                <div key={line} className="inline-flex items-start gap-3 rounded-2xl bg-[#F9FAFB] px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2E7D32]" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex h-12 items-center justify-center rounded-full bg-[#0A0A0A] px-6 text-base font-semibold text-white" href="/farmer/query/text">
                Ask Another Question <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a className="inline-flex h-12 items-center justify-center rounded-full border border-[#E5E7EB] px-6 text-base font-semibold text-[#0A0A0A]" href="/farmer/query">
                Back to Workspace
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
