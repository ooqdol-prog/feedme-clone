"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircleIcon, CopyIcon, DownloadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LLM_TARGETS,
  PROMPT_PRESETS,
  buildClipboardText,
  buildFilename,
} from "./export";

type Result = { title: string; author: string; markdown: string };
type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: Result }
  | { kind: "error"; message: string };

const CUSTOM = "__custom";

export function Converter() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [choice, setChoice] = useState<string>("");
  const [custom, setCustom] = useState("");

  const prompt = choice === CUSTOM ? custom.trim() : choice;
  const loading = status.kind === "loading";

  function reset() {
    setUrl("");
    setUrlError("");
    setStatus({ kind: "idle" });
    setChoice("");
    setCustom("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    let valid = false;
    try {
      const p = new URL(url.trim()).protocol;
      valid = p === "http:" || p === "https:";
    } catch {}
    if (!valid) {
      setUrlError("올바른 http(s) 주소를 입력해 주세요.");
      return;
    }
    setUrlError("");
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.message ?? "변환에 실패했습니다.",
        });
        return;
      }
      setStatus({ kind: "success", result: data });
    } catch {
      setStatus({ kind: "error", message: "서버에 연결하지 못했습니다." });
    }
  }

  async function copyToClipboard(markdown: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(buildClipboardText(prompt, markdown));
      return true;
    } catch {
      toast.error("클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.");
      return false;
    }
  }

  async function onCopy(markdown: string) {
    if (await copyToClipboard(markdown)) toast.success("복사했습니다.");
  }

  function onDownload(result: Result) {
    const blob = new Blob([result.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = buildFilename(result.title);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onOpen(name: keyof typeof LLM_TARGETS, markdown: string) {
    // 새 탭이 포커스를 가져가면 클립보드 쓰기가 막히므로 복사를 먼저 한다.
    if (await copyToClipboard(markdown)) {
      toast.success(`복사했습니다. ${name}에 붙여넣기만 하면 됩니다.`);
    }
    window.open(LLM_TARGETS[name], "_blank", "noopener");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <Field data-invalid={!!urlError}>
              <FieldLabel htmlFor="url">웹 페이지 URL</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    id="url"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="https://example.com/article"
                    value={url}
                    aria-invalid={!!urlError}
                    className={url ? "pr-9" : undefined}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  {url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="지우기"
                      className="absolute top-1/2 right-1 -translate-y-1/2"
                      onClick={reset}
                    >
                      <XIcon />
                    </Button>
                  )}
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "변환 중…" : "변환하기"}
                </Button>
              </div>
              {urlError && <FieldError>{urlError}</FieldError>}
            </Field>
          </form>
        </CardContent>
      </Card>

      {status.kind === "error" && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>변환하지 못했습니다</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card aria-busy="true">
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Separator />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/5" />
          </CardContent>
        </Card>
      )}

      {status.kind === "success" && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 border-b pb-4">
                <h2 className="font-heading text-xl font-semibold text-balance">
                  {status.result.title || "(제목 없음)"}
                </h2>
                {status.result.author && (
                  <p className="text-sm text-muted-foreground">
                    저자{" "}
                    <b className="font-medium text-foreground">
                      {status.result.author}
                    </b>
                  </p>
                )}
              </div>
              <div
                className="md max-h-96 overflow-y-auto pr-2"
                tabIndex={0}
                aria-label="변환된 본문"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {status.result.markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <Card aria-label="내보내기">
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel>
                  프롬프트{" "}
                  <span className="font-normal text-muted-foreground">
                    (선택)
                  </span>
                </FieldLabel>
                <ToggleGroup
                  variant="outline"
                  spacing={2}
                  className="flex-wrap"
                  aria-label="프롬프트"
                  value={choice ? [choice] : []}
                  onValueChange={(v) => setChoice(v[0] ?? "")}
                >
                  {PROMPT_PRESETS.map((p) => (
                    <ToggleGroupItem key={p} value={p}>
                      {p}
                    </ToggleGroupItem>
                  ))}
                  <ToggleGroupItem value={CUSTOM}>직접 입력</ToggleGroupItem>
                </ToggleGroup>
                {choice === CUSTOM && (
                  <Input
                    aria-label="직접 입력한 프롬프트"
                    placeholder="예: 핵심 수치만 표로 정리해줘"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                  />
                )}
                <FieldDescription>
                  고른 프롬프트는 본문 앞에 붙습니다. .md 다운로드에는 포함되지
                  않습니다.
                </FieldDescription>
              </Field>
              <Separator />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  variant="outline"
                  onClick={() => onCopy(status.result.markdown)}
                >
                  <CopyIcon data-icon="inline-start" />
                  복사하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDownload(status.result)}
                >
                  <DownloadIcon data-icon="inline-start" />
                  .md 다운로드
                </Button>
                <Button onClick={() => onOpen("ChatGPT", status.result.markdown)}>
                  ChatGPT로 열기
                </Button>
                <Button onClick={() => onOpen("Claude", status.result.markdown)}>
                  Claude로 열기
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
