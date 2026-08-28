// @scaffold:untouched
/**
 * 七並べ の画面。
 *
 * ここは「見た目」と「時間」だけを担当します。
 * 勝ち負けの判断やルールは logic.ts に書いてください
 * （そうしておくと、テストが setTimeout を使わずに書けます）。
 *
 * お手本: src/games/example-game/ExampleGame.tsx
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { ComingSoonPanel, GameShell } from "@ui";
import { createInitialState, pendingDelayMs, reduce } from "./logic";

export function ShichinarabeGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  // pendingDelayMs が数値を返している間だけタイマーが動く
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  return (
    <GameShell manifest={manifest} onExit={onExit} onReset={() => dispatch({ type: "reset" })}>
      {/* TODO: この ComingSoonPanel を消して、ここにゲーム画面を作ってください。
          @ui の Card / Hand / DeckPile / Button / ScoreBoard などが使えます。 */}
      <ComingSoonPanel manifest={manifest} />
      <p>（雛形）山札の残り: {state.deck.length}枚</p>
    </GameShell>
  );
}
