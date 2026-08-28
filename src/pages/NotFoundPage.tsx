import { Button } from "@ui";

export type NotFoundPageProps = {
  message?: string;
  onExit: () => void;
};

export function NotFoundPage({ message = "ページが見つかりませんでした。", onExit }: NotFoundPageProps) {
  return (
    <div style={{ padding: 48, textAlign: "center", display: "grid", gap: 16, justifyItems: "center" }}>
      <h1>404</h1>
      <p style={{ color: "var(--ca-text-muted)" }}>{message}</p>
      <Button onClick={onExit}>アーケードへ戻る</Button>
    </div>
  );
}
