import { ConvertError, convertUrl } from "@/features/url-to-markdown/convert";

const STATUS = { invalid_url: 400, fetch_failed: 502, empty: 422 } as const;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
  } | null;
  try {
    const result = await convertUrl(typeof body?.url === "string" ? body.url : "");
    return Response.json(result);
  } catch (e) {
    if (e instanceof ConvertError) {
      return Response.json(
        { code: e.code, message: e.message },
        { status: STATUS[e.code] },
      );
    }
    return Response.json(
      { code: "fetch_failed", message: "변환 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
