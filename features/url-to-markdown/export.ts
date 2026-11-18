export const PROMPT_PRESETS = [
  "요약해줘",
  "한국어로 번역해줘",
  "쉽게 설명해줘",
] as const;

export const LLM_TARGETS = {
  ChatGPT: "https://chatgpt.com/",
  Claude: "https://claude.ai/new",
} as const;

/** 프롬프트가 있으면 "프롬프트 + 빈 줄 + 본문", 없으면 본문만. */
export function buildClipboardText(prompt: string, markdown: string): string {
  const p = prompt.trim();
  return p ? `${p}\n\n${markdown}` : markdown;
}

export function buildFilename(title: string): string {
  const base = title
    .replace(/[\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .trim();
  return `${base || "page"}.md`;
}
