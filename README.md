# 🥚 へんしん！いきものタマゴ

5歳の子ども向けに設計した、絵本・ゆるふわイラスト風の育成ゲーム（PWA）です。
日々のお世話や遊び方によって、水族館の魚・動物・恐竜・妖精など全14種類の姿へ進化します。

![画面イメージ](docs/images/screen_mockup.png)

## ✨ コンセプト
- **死なない・悲しすぎない**：放置してもお墓にならず、お腹が空いてふて寝するだけの安心設計。
- **直感的な操作**：ひらがなと大きなアイコン中心のUI。キャラを直接タップして「なでる」ことが可能。
- **図鑑コンプリート**：おとなに進化すると図鑑に登録され、いつでも新しいタマゴから再スタート可能。

## 🏗️ アーキテクチャ（AWS サーバーレス最安構成）
個人・家族利用で月額ほぼ0円（AWS永続無料枠内）で運用する構成です。

- **Frontend**: PWA (HTML/CSS/JS or React) hosted on **Amazon S3 + CloudFront**
- **Backend**: **AWS Lambda (Python 3.12)** + **Lambda Function URLs**
- **Database**: **Amazon DynamoDB** (Provisioned Capacity: 無料枠内)
- **時間経過処理**: 定期バッチを使わず、APIアクセス時のタイムスタンプ差分による**遅延評価**で計算。

詳細は [docs/DESIGN.md](docs/DESIGN.md) を参照してください。

## 🚀 開発の進め方（ロードマップ）
- [x] 要件定義・キャラクター進化ツリー設計
- [ ] Phase 1: フロントエンド単体（localStorage版）の構築・PWA化
- [ ] Phase 2: キャラクター画像（14種）＋背景画像（3種）の差し替え
- [ ] Phase 3: AWSバックエンド（Lambda + DynamoDB）構築・API連携
- [ ] Phase 4: S3 + CloudFront デプロイ