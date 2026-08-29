import type { OwnerId } from "@core";
import { PARTICIPANTS } from "./harnessConfig";

/**
 * アーケードに並べる順番。harness/config.json の並び順がそのまま画面の順番になる。
 * manifest に order フィールドを持たせない（自分のタイルを先頭にする改変を不可能にする）。
 * お手本（core）は別枠で表示するので最後に置く。
 */
const ORDER: readonly OwnerId[] = [...PARTICIPANTS.map((item) => item.participant), "core"];

export function ownerRank(owner: OwnerId): number {
  const index = ORDER.indexOf(owner);
  return index < 0 ? ORDER.length : index;
}
