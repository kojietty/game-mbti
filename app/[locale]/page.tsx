import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ResumeBanner } from "@/components/ui/ResumeBanner";

export default function Landing() {
  const t = useTranslations("landing");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6">
      <ResumeBanner />

      {/* Title */}
      <h1
        className="text-4xl sm:text-6xl font-black tracking-widest neon-primary"
        style={{ fontFamily: "var(--font-orbitron, sans-serif)" }}
      >
        {t("title")}
      </h1>

      {/* Catchphrase */}
      <p className="text-xl sm:text-3xl font-bold text-zinc-100 max-w-lg">
        {t("catchphrase")}
      </p>

      {/* Intro */}
      <p className="text-sm text-[var(--color-muted)] max-w-md">
        {t("intro")}
      </p>

      {/* CTA */}
      <Link href="/intro">
        <button
          type="button"
          className="mt-4 px-10 py-4 rounded-full bg-[var(--color-primary)] text-black font-black text-lg tracking-widest hover:bg-cyan-300 active:scale-95 transition-all"
          style={{ fontFamily: "var(--font-orbitron, sans-serif)" }}
        >
          {t("cta")}
        </button>
      </Link>
    </main>
  );
}
