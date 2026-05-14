import { useTranslations } from "next-intl";

export default function Landing() {
  const t = useTranslations("landing");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl sm:text-6xl font-black tracking-widest">
        {t("title")}
      </h1>
      <p className="mt-6 text-lg sm:text-2xl text-zinc-300 max-w-xl">
        {t("catchphrase")}
      </p>
      <p className="mt-3 text-sm text-zinc-500 max-w-md">{t("intro")}</p>
      <button
        type="button"
        className="mt-10 rounded-full bg-cyan-400 px-8 py-3 text-base font-bold text-black hover:bg-cyan-300 transition-colors"
      >
        {t("cta")}
      </button>
    </main>
  );
}
