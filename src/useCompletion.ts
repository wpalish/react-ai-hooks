import { useState, useRef, useCallback } from 'react';

interface UseCompletionOptions {
  api?: string;
  initialInput?: string;
  onFinish?: (completion: string) => void;
  onError?: (error: Error) => void;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

interface UseCompletionReturn {
  completion: string;
  input: string;
  isLoading: boolean;
  error: Error | null;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  complete: (prompt: string, opts?: { headers?: Record<string, string> }) => Promise<string | null>;
  stop: () => void;
}

export function useCompletion({
  api = '/api/completion',
  initialInput = '',
  onFinish,
  onError,
  headers: defaultHeaders,
  body: defaultBody,
}: UseCompletionOptions = {}): UseCompletionReturn {
  const [completion, setCompletion] = useState('');
  const [input, setInput] = useState(initialInput);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const complete = useCallback(
    async (prompt: string, opts?: { headers?: Record<string, string> }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setCompletion('');

      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...defaultHeaders,
            ...opts?.headers,
          },
          body: JSON.stringify({ prompt, ...defaultBody }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(`Request failed ${res.status}: ${text}`);
        }

        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setCompletion(full);
        }

        onFinish?.(full);
        return full;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return null;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [api, defaultHeaders, defaultBody, onFinish, onError]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;
      complete(trimmed);
    },
    [input, isLoading, complete]
  );

  return {
    completion,
    input,
    isLoading,
    error,
    setInput,
    handleInputChange,
    handleSubmit,
    complete,
    stop,
  };
}
