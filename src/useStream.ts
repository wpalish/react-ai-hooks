import { useCallback, useRef } from 'react';

type ChunkHandler = (chunk: string) => void;
type DoneHandler = (full: string) => void;

interface StreamOptions {
  onChunk?: ChunkHandler;
  onDone?: DoneHandler;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export async function readStream(
  response: Response,
  { onChunk, onDone, onError }: StreamOptions = {}
): Promise<string> {
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    const err = new Error(`HTTP ${response.status}: ${text}`);
    onError?.(err);
    throw err;
  }

  if (!response.body) {
    const err = new Error('Response has no body');
    onError?.(err);
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      onChunk?.(chunk);
    }
    onDone?.(accumulated);
    return accumulated;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    if (e.name !== 'AbortError') onError?.(e);
    throw e;
  } finally {
    reader.releaseLock();
  }
}

export function useStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      options: Omit<StreamOptions, 'signal'> & {
        headers?: Record<string, string>;
      } = {}
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const { headers, ...streamOpts } = options;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      return readStream(response, { ...streamOpts, signal: controller.signal });
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { stream, abort };
}
