import { afterEach, expect, test, vi } from "vitest";

import { ConvertError, convertUrl, parseHttpUrl } from "./convert";

afterEach(() => vi.unstubAllGlobals());

test("http(s)가 아닌 주소는 거부한다", () => {
  expect(parseHttpUrl("ftp://a.com")).toBeNull();
  expect(parseHttpUrl("not a url")).toBeNull();
  expect(parseHttpUrl("https://a.com/x")?.hostname).toBe("a.com");
});

test("잘못된 URL은 invalid_url 오류를 던진다", async () => {
  await expect(convertUrl("nope")).rejects.toMatchObject({ code: "invalid_url" });
});

test("HTTP 오류 응답은 fetch_failed 오류가 된다", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
  await expect(convertUrl("https://a.com")).rejects.toBeInstanceOf(ConvertError);
});

test("한국어 HTML에서 제목과 본문 Markdown을 추출한다", async () => {
  const html = `<html lang="ko"><head><title>안녕 세상</title><meta name="author" content="홍길동"></head>
  <body><article><h1>안녕 세상</h1><p>${"한글 본문 문장입니다. ".repeat(30)}</p></article></body></html>`;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })),
  );
  const r = await convertUrl("https://a.com/post");
  expect(r.title).toContain("안녕 세상");
  expect(r.markdown).toContain("한글 본문 문장입니다.");
});
