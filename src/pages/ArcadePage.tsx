import { GameTile } from "@ui";
import { registry } from "../app/registry/loadGames";
import { EXAMPLE_GAME_ID, issueUrl, ownerLabel } from "../app/registry/harnessConfig";
import { gameHref } from "../app/router";
import styles from "./ArcadePage.module.css";

/** ゲーム選択画面。ゲームは src/games/<id>/index.ts から自動で集まる。 */
export function ArcadePage() {
  const participantGames = registry.games.filter((game) => game.manifest.id !== EXAMPLE_GAME_ID);
  const exampleGames = registry.games.filter((game) => game.manifest.id === EXAMPLE_GAME_ID);
  const readyCount = participantGames.filter((game) => game.manifest.status === "ready").length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>CARD ARCADE</h1>
        <p className={styles.lead}>
          みんなでつくるカードゲーム集 — 公開中 {readyCount} / {participantGames.length} ゲーム
        </p>
      </header>

      {registry.problems.length > 0 ? (
        <section className={styles.problems}>
          <p className={styles.problemsTitle}>読み込めなかったゲームがあります</p>
          {registry.problems.map((problem) => (
            <div key={problem.folder} className={styles.problemItem}>
              <span className={styles.folder}>src/games/{problem.folder}/index.ts</span>
              <ul>
                {problem.messages.map((message) => (
                  <li key={message}>・{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <h2 className={styles.sectionTitle}>参加者のゲーム</h2>
        <div className={styles.grid}>
          {participantGames.map(({ manifest }) => (
            <GameTile
              key={manifest.id}
              manifest={manifest}
              href={gameHref(manifest.id)}
              issueUrl={issueUrl(manifest.issueNumber)}
              ownerLabel={ownerLabel(manifest.owner)}
            />
          ))}
        </div>
      </section>

      {exampleGames.length > 0 ? (
        <section>
          <h2 className={styles.sectionTitle}>お手本（運営が用意した参照実装）</h2>
          <div className={styles.grid}>
            {exampleGames.map(({ manifest }) => (
              <GameTile
                key={manifest.id}
                manifest={manifest}
                href={gameHref(manifest.id)}
                ownerLabel={ownerLabel(manifest.owner)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        Pull Request がマージされるたびに、ここに新しいゲームが増えます。
      </footer>
    </div>
  );
}
