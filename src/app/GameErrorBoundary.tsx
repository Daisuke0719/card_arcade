import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Props = {
  gameName: string;
  onExit: () => void;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * 1つのゲームで起きた実行時エラーを、そのゲームの中に閉じ込める。
 * 研修当日は6本の新品コードを本番デモで動かすので、
 * 1ゲームの例外でアーケード全体が白画面になる事故を必ず防ぐ。
 */
export class GameErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[card-arcade] ゲームの実行中にエラーが発生しました", error, info);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 12 }}>{this.props.gameName} でエラーが発生しました</h1>
        <p style={{ color: "var(--ca-text-muted)", marginBottom: 16 }}>
          このゲームだけを停止しました。他のゲームはそのまま遊べます。
        </p>
        <pre
          style={{
            background: "var(--ca-surface)",
            border: "1px solid var(--ca-border)",
            borderRadius: 8,
            padding: 12,
            overflowX: "auto",
            fontSize: 13,
          }}
        >
          {error.message}
        </pre>
        <button
          type="button"
          onClick={this.props.onExit}
          style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
        >
          アーケードへ戻る
        </button>
      </div>
    );
  }
}
