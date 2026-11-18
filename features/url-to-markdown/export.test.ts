import { expect, test } from "vitest";

import { buildClipboardText, buildFilename } from "./export";

test("프롬프트가 있으면 프롬프트, 빈 줄, 본문 순서로 붙인다", () => {
  expect(buildClipboardText("요약해줘", "# 본문")).toBe("요약해줘\n\n# 본문");
});

test("프롬프트가 비어 있으면 본문만 돌려준다", () => {
  expect(buildClipboardText("  ", "# 본문")).toBe("# 본문");
});

test("파일명은 제목에서 만들고 금지 문자를 걸러낸다", () => {
  expect(buildFilename('a/b: "c"?')).toBe("a b c.md");
});

test("제목이 없으면 기본 이름을 쓴다", () => {
  expect(buildFilename("")).toBe("page.md");
});
