# react-ai-hooks

> Lightweight React hooks for AI interactions — works with Claude, OpenAI, and any LLM provider.

[![npm](https://img.shields.io/npm/v/react-ai-hooks?style=flat-square)](https://npmjs.com/package/react-ai-hooks)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

## Installation

```bash
npm install react-ai-hooks
```

## Hooks

### `useChat`

```tsx
import { useChat } from 'react-ai-hooks';

function ChatComponent() {
  const { messages, sendMessage, isLoading, error } = useChat({
    endpoint: '/api/chat',
    initialMessages: [],
    onError: (err) => console.error(err),
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id} className={m.role}>
          {m.content}
        </div>
      ))}
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') sendMessage(e.currentTarget.value);
      }} />
      {isLoading && <span>Thinking...</span>}
    </div>
  );
}
```

### `useCompletion`

```tsx
import { useCompletion } from 'react-ai-hooks';

function CompletionComponent() {
  const { completion, complete, isLoading } = useCompletion({
    endpoint: '/api/complete',
  });

  return (
    <div>
      <button onClick={() => complete('Write a poem about Kazakhstan')}>
        Generate
      </button>
      <pre>{completion}</pre>
    </div>
  );
}
```

### `useStream`

```tsx
import { useStream } from 'react-ai-hooks';

function StreamComponent() {
  const { text, start, stop, status } = useStream({
    url: '/api/stream',
    body: { prompt: 'Hello' },
  });

  return (
    <div>
      <button onClick={start} disabled={status === 'streaming'}>Start</button>
      <button onClick={stop}>Stop</button>
      <p>{text}</p>
    </div>
  );
}
```

## API Reference

| Hook | Description |
|------|-------------|
| `useChat` | Multi-turn conversation with message history |
| `useCompletion` | Single-turn text completion |
| `useStream` | Raw SSE stream consumer |

## License

MIT
