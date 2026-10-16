export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.length;
    if (size > 4096) { await reader.cancel(); throw new HttpError(413, '送信内容が大きすぎます'); }
    chunks.push(part.value);
  }
  const data = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  try {
    const result: unknown = JSON.parse(new TextDecoder().decode(data));
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result as Record<string, unknown>;
  } catch { throw new HttpError(400, 'JSON形式が正しくありません'); }
}
