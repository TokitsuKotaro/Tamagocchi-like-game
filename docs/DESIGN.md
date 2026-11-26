# 設計ドキュメント（DESIGN.md）

## 1. システム構成とコスト方針
- API Gatewayは使用せず、**Lambda Function URLs**（CORS設定あり）でフロントエンドと通信する。
- DynamoDBは永続無料枠（25 RCU / 25 WCU）に収めるため、**Provisioned Mode（RCU: 1, WCU: 1〜5）**、PITR無効で作成する。
- 認証は簡易化のため、`userId`（例: `daughter-01`）をURLクエリまたはlocalStorageで保持し、リクエストヘッダ等で送信する。

---

## 2. DynamoDB テーブル設計
- **Table Name**: `HenshinTamagoTable`
- **Partition Key**: `userId` (String)

```json
{
  "userId": "daughter-01",
  "currentPet": {
    "name": "ぷにちゃん",
    "stage": "baby",
    "speciesId": "baby_01",
    "hunger": 4,
    "happiness": 5,
    "poopCount": 0,
    "points": {
      "sea": 3,
      "land": 1,
      "magic": 0,
      "active": 2,
      "gentle": 4
    },
    "bornAt": 1795380000,
    "lastUpdatedAt": 1795382820
  },
  "encyclopedia": [
    "adult_sea_fish",
    "adult_land_trex"
  ]
}
```

---

## 3. API 仕様（Lambda Function URL）

| Method | Path | 概要 |
| :--- | :--- | :--- |
| `GET` | `/pet?userId={id}` | 現在の状態を取得。取得時に `now - lastUpdatedAt` から遅延評価を実行し、更新があればDB保存して返す。 |
| `POST` | `/pet/action` | お世話アクションを実行。Body: `{ "userId": "...", "action": "feed_sea" \| "feed_land" \| "feed_magic" \| "play" \| "pet" \| "clean" }` |
| `POST` | `/pet/reset` | 新しいタマゴ（`egg_01`）からやり直す。`encyclopedia` は維持する。 |

---

## 4. 遅延評価ロジック（時間経過）
アプリ起動時・アクション実行時に `elapsedHours = (now - lastUpdatedAt) / 3600` を計算する。

- **空腹度（`hunger`: 0〜5）**：2時間ごとに `-1`（下限 0）
- **ごきげん（`happiness`: 0〜5）**：3時間ごとに `-1`（下限 0）
- **うんち（`poopCount`: 0〜3）**：4時間ごとに `+1`（上限 3）
- **死亡判定**：なし（`hunger == 0` の場合は「おなかぺこぺこ」のアニメーション・吹き出しを表示するのみ）

---

## 5. 進化ルール（全14種）

| Stage | 進化条件 | 分岐ルール |
| :--- | :--- | :--- |
| `egg` → `baby` | タマゴを3回なでる（`gentle >= 3`）または10分経過 | 固定：`baby_01`（ぷにっこ） |
| `baby` → `child` | 誕生から12時間経過 | `sea` / `land` / `magic` の最大値で分岐<br>・`child_sea`（しずくっこ）<br>・`child_land`（もふっこ）<br>・`child_magic`（ほしっこ） |
| `child` → `adult` | 誕生から36時間経過 | 系統ごとに `active` vs `gentle` の差分で分岐（後述） |

### おとな（adult）分岐詳細
- **うみ系統 (`child_sea`)**
  - `gentle - active >= 2`: `adult_sea_fish`（ニジイロさかな）
  - `active - gentle >= 2`: `adult_sea_shark`（かっこいいサメ）
  - それ以外（バランス）: `adult_sea_seal`（にこにこアザラシ）
- **りく系統 (`child_land`)**
  - `gentle - active >= 2`: `adult_land_panda`（もふもふレッサーパンダ）
  - `active - gentle >= 2`: `adult_land_trex`（ガオガオきょうりゅう）
  - それ以外（バランス）: `adult_land_tricera`（ツノツノトリケラ）
- **ふしぎ系統 (`child_magic`)**
  - `gentle - active >= 2`: `adult_magic_fairy`（プリンセスようせい）
  - `active - gentle >= 2`: `adult_magic_dragon`（そらとぶドラゴン）
  - それ以外（のんびり）: `adult_magic_ghost`（ねむねむおばけ）