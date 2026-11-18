import { Converter } from "@/features/url-to-markdown/converter";
import { ThemeToggle } from "@/features/url-to-markdown/theme-toggle";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            URL → Markdown
          </h1>
          <p className="text-sm text-muted-foreground">
            웹 페이지를 Markdown으로 바꿔 LLM에 바로 넘기세요.
          </p>
        </div>
        <ThemeToggle />
      </header>
      <Converter />
    </main>
  );
}
