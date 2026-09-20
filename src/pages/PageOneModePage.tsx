import { useState } from "react";
import type { GameComponentProps } from "@core";
import { PageOneGame } from "../games/pageone/PageOneGame";
import styles from "./PageOneModePage.module.css";

type Mode = "choose" | "cpu";

/** ページワンだけが持つ、CPU/オンラインの入口。 */
export function PageOneModePage({ manifest, onExit }: GameComponentProps) {
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "cpu") {
    return <PageOneGame manifest={manifest} onExit={onExit} />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>1️⃣ ページワン</p>
        <h1>遊び方を選んでください</h1>
        <p className={styles.lead}>1人でCPUと遊ぶか、ルームを作って友だちと対戦できます。</p>
        <div className={styles.options}>
          <button className={styles.option} onClick={() => setMode("cpu")}>
            <strong>CPU対戦</strong>
            <span>すぐに1人で遊ぶ</span>
          </button>
          <a className={styles.option} href="#/online/pageone">
            <strong>オンライン対戦</strong>
            <span>ルームを作る、または参加する</span>
          </a>
        </div>
        <button className={styles.back} onClick={onExit}>ゲーム一覧へ戻る</button>
      </div>
    </main>
  );
}
