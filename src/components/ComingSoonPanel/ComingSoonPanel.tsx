import type { GameManifest } from "@core";
import { Card } from "../Card/Card";
import styles from "./ComingSoonPanel.module.css";

export type ComingSoonPanelProps = {
  manifest: GameManifest;
  issueUrl?: string;
};

/**
 * スケルトンのゲームが描画する中身。
 * COMING SOON を「分岐」ではなく「データ」にしておくことで、
 * 一覧側のコードパスが1本のままになり、研修開始時点でもテストが全部緑になる。
 */
export function ComingSoonPanel({ manifest, issueUrl }: ComingSoonPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.cards} aria-hidden="true">
        <Card face="down" size="sm" />
        <Card face="down" size="sm" />
        <Card face="down" size="sm" />
      </div>
      <p className={styles.mark}>[ COMING SOON ]</p>
      <p className={styles.lead}>このゲームはまだ実装されていません。</p>
      <p className={styles.note}>
        担当チームが実装して Pull Request がマージされると、ここが実際のゲームに変わります。
      </p>
      {issueUrl && manifest.issueNumber ? (
        <a className={styles.link} href={issueUrl} target="_blank" rel="noreferrer">
          担当 Issue #{manifest.issueNumber} を見る
        </a>
      ) : null}
    </div>
  );
}
