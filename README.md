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

## 🛠️ バックエンド開発

```bash
pip install -r backend/requirements-dev.txt
python -m pytest backend -q   # 進化ロジックのユニットテスト
```

`backend/evolution.py` はフロントエンドの `frontend/src/services/evolution.ts` と同一仕様の純粋関数です。

## 🛠️ フロントエンド開発

```bash
cd frontend
npm install
npm run dev        # 開発サーバー
npm test           # Vitest（進化ロジックのユニットテスト）
npm run typecheck  # tsc --noEmit
npm run lint       # oxlint
npm run build      # 本番ビルド（PWA: Service Worker / manifest 生成）
npm run preview    # ビルド成果物のプレビュー
```

Phase 1 は `localStorage` に保存します。`VITE_API_BASE_URL` を設定すると Phase 3 の Lambda Function URL 実装へ切り替わります。

## 🚀 デプロイ（GitHub Actions → AWS）

`main` ブランチへマージ（push）すると、GitHub Actions が自動で AWS へデプロイします。

- ワークフロー: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- インフラ定義（AWS SAM）: [infra/template.yaml](infra/template.yaml)
- バックエンド（Lambda + DynamoDB）: [backend/](backend/)

### デプロイされるもの
| リソース | 内容 |
| :--- | :--- |
| DynamoDB `HenshinTamagoTable` | Provisioned 1 RCU / 1 WCU、PITR 無効（無料枠内） |
| Lambda `henshin-tamago-api-prod` | Python 3.12、Lambda Function URL（CORS 有効） |
| S3 バケット | フロントエンドの静的ホスティング（非公開・OAC 経由のみ） |
| CloudFront | HTTPS 配信、403/404 → `index.html`（SPA フォールバック） |

### 初回セットアップ（1回だけ手動）

1. **AWS 側に OIDC プロバイダとデプロイ用 IAM ロールを作成**
   - IAM → ID プロバイダ → `token.actions.githubusercontent.com` を追加（Audience: `sts.amazonaws.com`）
   - 以下の信頼ポリシーを持つ IAM ロールを作成（`<ACCOUNT_ID>` と `<OWNER>/<REPO>` を置き換え）:

     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
           "Action": "sts:AssumeRoleWithWebIdentity",
           "Condition": {
             "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
             "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<OWNER>/<REPO>:*" }
           }
         }
       ]
     }
     ```
   - ロールには SAM デプロイに必要な権限を付与します（初回は `AdministratorAccess` が簡単です。絞る場合は CloudFormation / Lambda / DynamoDB / S3 / CloudFront / IAM（`CAPABILITY_IAM` 用）/ Logs の作成・更新権限が必要です）。

2. **GitHub リポジトリの Settings → Secrets and variables → Actions → Variables** に以下を登録:
   | 変数名 | 例 | 説明 |
   | :--- | :--- | :--- |
   | `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-deploy` | 上記で作成したロールの ARN（**必須**） |
   | `AWS_REGION` | `ap-northeast-1` | デプロイ先リージョン（省略時 `ap-northeast-1`） |
   | `SAM_STACK_NAME` | `henshin-tamago` | CloudFormation スタック名（省略時 `henshin-tamago`） |
   | `DOMAIN_NAME` | `henshin-tamago.fens77.com` | 独自ドメイン（省略時は CloudFront のデフォルトドメイン） |
   | `ACM_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:123456789012:certificate/xxxx` | `DOMAIN_NAME` を設定する場合は必須（**us-east-1** の証明書） |

3. **GitHub の `production` Environment は不要です**（このワークフローは Environment を使いません）。承認ルールを付けたい場合は、`deploy.yml` の `deploy` ジョブに `environment: production` を追加し、IAM ロールの信頼条件を `repo:TokitsuKotaro/Tamagocchi-like-game:environment:production` に変更してください。

4. `main` へマージすると自動デプロイされます。手動実行は Actions タブ → `Deploy to AWS` → `Run workflow`。

### 独自ドメイン（例: `henshin-tamago.fens77.com`）を使う場合

CloudFront で独自ドメインを使うには、**us-east-1 リージョンの ACM 証明書**が必要です（CloudFront の仕様）。DNS は ConoHa WING のものをそのまま使えます。

1. **ACM 証明書を作成（us-east-1）**
   - AWS コンソール右上のリージョンを **バージニア北部 (us-east-1)** に切り替える
   - ACM → 証明書をリクエスト → パブリック証明書 → ドメイン名に `henshin-tamago.fens77.com` を入力
   - 検証方法は **DNS 検証** を選択
   - 発行された CNAME レコード（`_xxxx.henshin-tamago.fens77.com` → `_yyyy.acm-validations.aws`）を ConoHa WING の DNS に追加
   - ステータスが「発行済み」になるまで待つ（通常数分〜30分）

2. **GitHub の Variables に登録**
   - `DOMAIN_NAME` = `henshin-tamago.fens77.com`
   - `ACM_CERTIFICATE_ARN` = 上記証明書の ARN（`arn:aws:acm:us-east-1:...`）

3. **`main` へマージ**すると、CloudFront に `Aliases` と `ViewerCertificate` が設定されます。

4. **ConoHa WING の DNS に CNAME レコードを追加**
   - ホスト名: `henshin-tamago`
   - タイプ: `CNAME`
   - 値: デプロイ後の CloudFront ドメイン名（例: `d155laa9n9bzlj.cloudfront.net`）
   - ※ CloudFront のドメイン名は Actions の Summary、または CloudFormation スタックの `CloudFrontDomainName` 出力で確認できます

5. 数分〜数十分で `https://henshin-tamago.fens77.com` でアクセスできるようになります。

> **注意**: `DOMAIN_NAME` を設定したのに `ACM_CERTIFICATE_ARN` が空、または証明書が us-east-1 以外にある場合、CloudFront の更新が失敗します。

### デプロイの流れ
1. `test` ジョブ: フロントエンド（typecheck / lint / Vitest / build 用依存）とバックエンド（pytest）を検証
2. `deploy` ジョブ: OIDC で AWS 認証 → `sam build` / `sam deploy` → スタック出力から `VITE_API_BASE_URL` を取得してフロントエンドをビルド → S3 へ同期 → CloudFront キャッシュを無効化

### ローカルから手動デプロイする場合
```bash
aws configure   # デプロイ権限のある認証情報を設定
sam build --template infra/template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml --capabilities CAPABILITY_IAM
# 出力された ApiFunctionUrl を使ってフロントエンドをビルド
cd frontend
VITE_API_BASE_URL=<ApiFunctionUrl> npm run build
aws s3 sync dist s3://<FrontendBucketName> --delete
aws cloudfront create-invalidation --distribution-id <CloudFrontDistributionId> --paths '/*'
```

## 🚀 開発の進め方（ロードマップ）
- [x] 要件定義・キャラクター進化ツリー設計
- [x] Phase 1: フロントエンド単体（localStorage版）の構築・PWA化
- [ ] Phase 2: キャラクター画像（14種）＋背景画像（3種）の差し替え
- [x] Phase 3: AWSバックエンド（Lambda + DynamoDB）構築・API連携
- [x] Phase 4: S3 + CloudFront デプロイ（GitHub Actions + SAM、`main` マージで自動デプロイ）