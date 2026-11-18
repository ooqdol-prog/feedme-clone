import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";

export type ConvertResult = {
  title: string;
  author: string;
  markdown: string;
};

export type ConvertErrorCode = "invalid_url" | "fetch_failed" | "empty";

export class ConvertError extends Error {
  constructor(
    readonly code: ConvertErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const FETCH_TIMEOUT_MS = 15_000;

export function parseHttpUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function detectCharset(contentType: string | null, head: string): string {
  const fromHeader = contentType?.match(/charset=["']?([\w-]+)/i)?.[1];
  const fromMeta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  return (fromHeader ?? fromMeta ?? "utf-8").toLowerCase();
}

async function fetchHtml(url: URL): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; UrlToMarkdown/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    throw new ConvertError(
      "fetch_failed",
      timedOut
        ? "페이지 응답이 너무 늦어 시간 초과로 가져오지 못했습니다."
        : "페이지에 접속하지 못했습니다. 주소를 확인해 주세요.",
    );
  }
  if (!res.ok) {
    throw new ConvertError(
      "fetch_failed",
      `페이지가 오류를 돌려줬습니다 (HTTP ${res.status}).`,
    );
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const head = new TextDecoder("latin1").decode(bytes.slice(0, 2048));
  const charset = detectCharset(res.headers.get("content-type"), head);
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export async function convertUrl(rawUrl: string): Promise<ConvertResult> {
  const url = parseHttpUrl(rawUrl);
  if (!url) {
    throw new ConvertError("invalid_url", "올바른 http(s) 주소를 입력해 주세요.");
  }
  const html = await fetchHtml(url);
  const { document } = parseHTML(html);
  const result = await Defuddle(document as unknown as Document, url.href, {
    markdown: true,
  });
  const markdown = (result.content ?? "").trim();
  if (!markdown) {
    throw new ConvertError("empty", "페이지에서 본문을 추출하지 못했습니다.");
  }
  return {
    title: (result.title ?? "").trim(),
    author: (result.author ?? "").trim(),
    markdown,
  };
}
