export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function body<T extends Record<string, unknown>>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('Yêu cầu không hợp lệ');
  return await request.json() as T;
}
export function safeError(error: unknown) {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || new URL(origin).origin === new URL(request.url).origin;
}
