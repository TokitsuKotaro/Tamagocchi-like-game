
# リポジトリ構成
Tamagocchi-like-game/
├── .github/
│   ├── copilot-instructions.md   # Copilot向けの開発ルール・前提知識
│   └── workflows/
│       └── deploy.yml            # main マージで AWS へ自動デプロイ
├── docs/
│   ├── DESIGN.md                 # 詳細設計書（DB・API・進化ロジック）
│   └── images/
│       └── screen_mockup.png     # 画面イメージ
├── frontend/                     # PWA（Vite + React または Vanilla JS）
│   ├── public/
│   │   ├── manifest.json
│   │   └── assets/               # キャラ透過PNG・背景画像
│   └── src/
├── backend/                      # AWS Lambda (Python 3.12)
?   ??? handler.py                # API Gateway ?????/pet, /pet/action, /pet/reset?
│   ├── evolution.py              # 進化・遅延評価ロジック（純粋関数）
│   ├── test_evolution.py         # pytest
│   ├── requirements.txt
│   └── requirements-dev.txt
├── infra/                        # AWS SAM (IaC)
?   ??? template.yaml             # DynamoDB / Lambda + API Gateway / S3 / CloudFront
├── .github/
│   └── workflows/
│       └── deploy.yml            # main マージで AWS へ自動デプロイ
└── README.md

# FrontendはReactを使う
frontend/
├── public/
│   └── assets/
│       ├── characters/        # egg_01.png, baby_01.png ... (全14種)
│       └── backgrounds/       # sea.png, land.png, magic.png
├── src/
│   ├── components/
│   │   ├── StatusBar.tsx      # 上部：おにぎり・ハート・おとなよう歯車
│   │   ├── PetStage.tsx       # 中央：背景・キャラ表示・なでる判定・エフェクト
│   │   ├── ActionBar.tsx      # 下部：ごはん・あそぶ・おそうじ・ずかん
│   │   ├── FoodModal.tsx      # ごはん選択（うみゼリー・おにく・ほしこんぺいとう）
│   │   ├── EncyclopediaModal.tsx # ずかん一覧
│   │   └── AdminModal.tsx     # おとなよう（デバッグ・進化テスト・リセット）
│   ├── constants/
│   │   └── species.ts         # 全14キャラの名前・系統・説明文マスター
│   ├── hooks/
│   │   └── usePetGame.ts      # ゲーム状態管理・アクション実行フック
│   ├── services/
│   │   ├── evolution.ts       # 時間経過・進化判定（Phase 1用・バックエンドと同一仕様）
│   │   └── petRepository.ts   # localStorage / AWS API 切り替え層
│   ├── types/
│   │   └── pet.ts             # PetData, ActionType などの型定義
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts             # vite-plugin-pwa 設定含む