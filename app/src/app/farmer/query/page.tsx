"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Leaf, LogOut, Mic, MessageSquareText } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

const heroImage =
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1400&q=80&auto=format&fit=crop";

const queryModes = [
  {
    title: "Text Advisory",
    description: "Ask about diseases, nutrient issues, irrigation, or treatment steps and get a structured answer instantly.",
    href: "/farmer/query/text",
    icon: MessageSquareText,
    active: true
  },
  {
    title: "Voice Advisory",
    description: "Voice-first query capture for field use. The premium UI is ready and the processing flow is next in line.",
    href: "#",
    icon: Mic,
    active: false
  },
  {
    title: "Image Advisory",
    description: "Capture crop images for disease analysis and treatment guidance. The upload pipeline is the next milestone.",
    href: "#",
    icon: Camera,
    active: false
  }
];

export default function FarmerQueryPage() {
  const router = useRouter();
  const { appUser, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !appUser) {
      router.replace("/farmer/login");
    }
  }, [appUser, loading, router]);

  if (loading || !appUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5 text-center text-[#6B7280]">
        Loading your farmer workspace...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#0A0A0A]">
      <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-8 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:py-12">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#6B7280]">
              Farmer workspace
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#2E7D32]">
              <Leaf className="h-4 w-4" /> Welcome back, {appUser.name}
            </div>
            <h1
              className="mt-4 max-w-[620px] text-[42px] font-bold leading-[1.03] tracking-[-1.5px] md:text-[60px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Choose How You Want To Ask For Advice.
            </h1>
            <p className="mt-5 max-w-[560px] text-base leading-8 text-[#6B7280]">
              Your session is active and your advisory history is tied to this account. Start with the text flow today, then extend into voice and image once those pipelines are enabled.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-[#E5E7EB] px-4 py-2 text-[#6B7280]">Email verified</span>
              <span className="rounded-full border border-[#E5E7EB] px-4 py-2 text-[#6B7280]">Backend synced</span>
              <span className="rounded-full border border-[#C8E6C9] bg-[#F1F8E9] px-4 py-2 text-[#2E7D32]">Text AI live</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] min-h-[320px]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.08) 0%, rgba(10,10,10,0.58) 100%), url('${heroImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
            <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between p-6 text-white md:p-8">
              <div className="inline-flex w-fit rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/75">
                Active farmer session
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">Signed in as</p>
                <p className="mt-3 text-2xl font-semibold">{appUser.email ?? appUser.userId}</p>
                <button
                  className="mt-6 inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  onClick={() => {
                    void logout().then(() => {
                      window.location.href = "/farmer/login";
                    });
                  }}
                  type="button"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-3">
          {queryModes.map((mode, index) => {
            const Icon = mode.icon;
            const cardBody = (
              <motion.div
                className={`flex h-full flex-col rounded-[32px] border p-6 md:p-7 ${mode.active ? "border-[#0A0A0A] bg-[#0A0A0A] text-white" : "border-[#E5E7EB] bg-white text-[#0A0A0A]"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${mode.active ? "bg-white/12 text-white" : "bg-[#F1F8E9] text-[#2E7D32]"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-8 text-[12px] uppercase tracking-[0.24em] text-inherit opacity-60">
                  {mode.active ? "Live now" : "Coming next"}
                </div>
                <h2
                  className="mt-3 text-[30px] font-bold leading-[1.08] tracking-[-1px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {mode.title}
                </h2>
                <p className={`mt-4 flex-1 text-sm leading-7 ${mode.active ? "text-white/78" : "text-[#6B7280]"}`}>
                  {mode.description}
                </p>
                <div className="mt-8 inline-flex items-center text-sm font-semibold">
                  {mode.active ? "Open flow" : "Reserved for Day 4"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </motion.div>
            );

            return mode.active ? (
              <a key={mode.title} href={mode.href}>
                {cardBody}
              </a>
            ) : (
              <div key={mode.title}>{cardBody}</div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
