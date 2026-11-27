# Copilot Instructions for へんしん！いきものタマゴ

## 1. プロジェクト概要
5歳児向けのスマホ用PWA育成ゲーム「へんしん！いきものタマゴ」。
日々のお世話（ごはん・あそぶ・なでる・おそうじ）によって、全14種類の生き物（水族館の魚・動物・恐竜・妖精など）へ進化する。
詳細なデータ構造・API仕様・進化ロジックは `docs/DESIGN.md` を必ず参照すること。

## 2. 技術スタック
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + `vite-plugin-pwa`
- **Backend**: AWS Lambda (Python 3.12) + Amazon API Gateway (REST API) + Amazon DynamoDB (`boto3`)
- **Hosting**: Amazon S3 + CloudFront
- **Testing**: Vitest (Frontend) / pytest (Backend)

## 3. UI / UX ルール（最重要）
- **文字表記**: 子どもが遊ぶ通常画面のテキストは、すべて**やさしいひらがな・カタカナ**にすること（漢字は絶対に使わない）。
  - 例外：右上の歯車アイコンから開く「おとなよう（設定・デバッグ）」モーダル内のみ漢字を使用してよい。
- **スマホ最優先**: スマホ縦画面（幅 375px〜430px / `100dvh`）でスクロールせずに1画面に収まるレイアウトを基本とする。PC表示時は中央にスマホ枠（最大幅 430px）で表示する。
- **操作性**: 5歳児が誤タップしにくいよう、アクションボタンは最小 `60px x 60px` 以上のサイズを確保し、角丸は大きめ（`rounded-2xl` 〜 `rounded-3xl`）にする。
- **世界観**: 「絵本・水彩パステル調」の温かみのある配色を維持する。原色や暗い背景は避ける。
- **死なない設計**: 放置しても死亡・お墓などの悲しい表現は作らない。空腹時は「おなかぺこぺこ」の吹き出しとアニメーションのみ表示する。

## 4. フロントエンド（React / TypeScript）開発ルール
- **コンポーネント設計**: 関数コンポーネント + Hooks を使用し、1ファイル1責務を意識して小さく分割する。
- **型定義**: `src/types/pet.ts` にDynamoDBのモデルと一致する型定義を集約し、`any` 型の使用を禁止する。
- **ストレージの抽象化**: データの読み書きは `src/services/petRepository.ts` に抽象化する。
  - Phase 1（オフライン版）では `localStorage` 実装を使う。
  - Phase 3?AWS?????????? `VITE_API_BASE_URL` ???? `fetch`?API Gateway?????????????????
- **画像アセットとフォールバック**:
  - キャラクター画像は `/assets/characters/{speciesId}.png`、背景画像は `/assets/backgrounds/{theme}.png` を参照する。
  - 画像の読み込みに失敗した場合（未作成時など）は、壊れた画像アイコンを表示せず、仮のSVGまたは絵文字＋キャラ名でフォールバック表示すること。
- **アニメーション**: 待機時のふわふわ浮遊・ぷにぷに伸縮、タップ時のジャンプ・ハートエフェクトなどは軽量なCSSアニメーション（Tailwindのカスタムkeyframes）で実装する。
- **PWA対応**: `vite-plugin-pwa` を使用し、スマホの「ホーム画面に追加」でスタンドアロン起動できるように `manifest` を設定する。

## 5. バックエンド（AWS Lambda / Python）開発ルール
- **コーディング規約**: Python 3.12 を前提とし、すべての関数に型ヒント（Type Hints）を付与する。
- **ロジックの分離**: 時間経過による遅延評価・進化判定ロジックは `backend/evolution.py` に純粋関数（副作用なし）として実装し、Lambdaハンドラ（`backend/handler.py`）から分離する。
- **DynamoDBの注意点**:
  - `boto3` の `Decimal` 型とJSONの `int` / `float` の変換エラーを防ぐため、専用のシリアライザ／デシリアライザを用意すること。
  - 定期バッチは使わず、リクエスト時の `now - lastUpdatedAt` による遅延評価でステータスを更新すること。
- **CORS??**: API Gateway ? CORS ???????????????????????Lambda ??????????????CORS??????????

## 6. テスト・品質ルール
- `backend/evolution.py` の時間経過・進化分岐（全14種）については、必ず `pytest` で網羅的なユニットテストを書くこと。
- フロントエンドの進化計算（localStorage版で使う場合）も同様に `Vitest` でテスト可能な純粋関数として切り出すこと。
- コミット前やPR作成前に、TypeScriptの型チェック（`tsc --noEmit`）とテストが通ることを確認すること。