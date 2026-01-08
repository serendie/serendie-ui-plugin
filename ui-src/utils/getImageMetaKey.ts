import { SelectionImageItem } from '../hooks/useSelectionImages'

/**
 * 画像メタ情報のキーを生成する
 * @param messageIndex メッセージのインデックス
 * @param imageIndex メッセージ内の画像インデックス
 */
export function getImageMetaKey(
  messageIndex: number,
  imageIndex: number
): string {
  return `${messageIndex}-${imageIndex}`
}

/** 画像メタ情報の型 */
export type ImageMetas = Record<string, SelectionImageItem>
