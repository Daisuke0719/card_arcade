import { useState } from "react";
import type { GameComponentProps } from "@core";
import styles from "./GameModePage.module.css";

type Mode = "choose" | "cpu";

/** manifest.online を登録したゲームだけが通る、CPU/オンラインの入口。 */
export function GameModePage({ manifest, onExit }: GameComponentProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const GameComponent = manifest.component;

  if (mode === "cpu") {
    return <GameComponent manifest={manifest} onExit={onExit} />;
  }

  const title = `${manifest.icon ?? ""} ${manifest.name}`.trim();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>{title}</p>
        <h1>遊び方を選んでください</h1>
        <p className={styles.lead}>1人でCPUと遊ぶか、ルームを作って友だちと対戦できます。</p>
        <div className={styles.options}>
          <button className={styles.option} onClick={() => setMode("cpu")}>
            <strong>CPU対戦</strong>
            <span>すぐに1人で遊ぶ</span>
          </button>
          <a className={styles.option} href={"#/online/" + manifest.id}>
            <strong>オンライン対戦</strong>
            <span>ルームを作る、または参加する</span>
          </a>
        </div>
        <button className={styles.back} onClick={onExit}>ゲーム一覧へ戻る</button>
      </div>
    </main>
  );
}
