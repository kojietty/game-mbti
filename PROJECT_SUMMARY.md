# Player Type Lab — プロジェクト全体サマリー

> 別セッションで引き継ぐ際にこのファイルを最初に読んで状況を把握してください。

---

## 概要

8〜12 個のミニゲームをプレイして「ゲームスタイルタイプ」を診断する Web アプリ。  
MBTI 的な 4 軸×独自 16 タイプだが、**「性格診断」ではなく「ゲームスタイル診断」** として位置づけている。

| 項目 | 内容 |
|---|---|
| リポジトリ | `https://github.com/kojietty/game-mbti.git` (Private) |
| 本番 URL | `https://game-mbti.pagudaruma.workers.dev` |
| デプロイ | Cloudflare Workers + GitHub 自動デプロイ（main push で自動ビルド） |
| D1 DB ID | `33a8af67-6b99-4896-91bf-2560626cc79d` |
| サービス名 | Player Type Lab（仮） |
| キャッチコピー | JA: 「君のプレイヤータイプを暴け」/ EN: "Reveal your true player type." |

---

## 技術スタック

| カテゴリ | 採用 |
|---|---|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| スタイリング | Tailwind CSS v4（ゲーミングダーク / シアン+マゼンタ） |
| アニメーション | Framer Motion |
| 状態管理 | Zustand + persist middleware（localStorage 自動保存） |
| i18n | next-intl（ja/en。初回は常に `/ja`） |
| グラフ | Recharts |
| 画像生成 | html-to-image（シェア PNG） |
| サウンド | zzfx（SE のみ: tap/success/fail） |
| デプロイ | `@opennextjs/cloudflare` + Cloudflare Workers |
| データ収集 | Cloudflare D1（匿名プレイデータ保存、24 ヶ月で自動削除） |
| フォント | Orbitron（見出し）、Press Start 2P（型コード）、Inter（本文） |

### カラーパレット

| ロール | カラー |
|---|---|
| 背景 | `#0a0a0f` |
| サーフェス | `#15151f` |
| Primary（シアン） | `#22d3ee` |
| Secondary（マゼンタ） | `#f0abfc` |
| 成功 | `#4ade80` |
| 警告 | `#fb923c` |

---

## 4 軸の設計

独自軸名を使い、MBTI コードは UI に出さない。  
型コードは 4 文字（例: `VDLP`）で 16 通り。8 文字すべて重複なし（V,S,O,D,L,H,P,I）。

| 軸 | Positive | Negative | ゲームスタイル的意味 |
|---|---|---|---|
| **VS** | V = Vanguard（前衛） | S = Scout（斥候） | 速さで仕掛ける vs 観察から入る |
| **OD** | O = Observer（観察派） | D = Dreamer（構想派） | 細部を正確に記憶 vs 全体パターンを直感 |
| **LH** | L = Logic（論理派） | H = Heart（共感派） | 効率・結果優先 vs チーム・感情優先 |
| **PI** | P = Planner（計画派） | I = Improviser（即興派） | 計画してから実行 vs 試しながら適応 |

### 型判定ロジック

```ts
// 軸スコア (-50〜+50) で判定
VS >= 0 ? 'V' : 'S'
OD >= 0 ? 'O' : 'D'
LH >= 0 ? 'L' : 'H'
PI >= 0 ? 'P' : 'I'

// |score| < 10 は境界型 → 「もう一つの可能性」をUIに表示
// |score| >= 25 → high confidence
// 10〜25     → medium confidence
```

---

## 16 タイプ一覧

| コード | JA 名 | EN 名 | キャッチ（JA） |
|---|---|---|---|
| SDLP | ストラテジスト | The Strategist | 盤面の 10 手先を読む |
| SDLI | デバッガー | The Debugger | 仮説と検証を繰り返す |
| VDLP | コマンダー | The Commander | 戦場で迷わず指揮を執る |
| VDLI | レイドリーダー | The Raid Leader | 議論を制し、新しいルールを作る |
| SDHP | ロアキーパー | The Lorekeeper | 世界の物語を誰よりも深く知る |
| SDHI | ロールプレイヤー | The Roleplayer | 自分の物語を自分で紡ぐ |
| VDHP | ギルドマスター | The Guildmaster | 全員が輝けるステージを作る |
| VDHI | アドベンチャラー | The Adventurer | どこへでも。誰とでも。今すぐ |
| SOLP | スピードランナー | The Speedrunner | 最速・最短で目標を達成する |
| SOHP | ヒーラー | The Healer | 誰かが倒れそうな時、そこにいる |
| VOLP | キャプテン | The Captain | チームを動かし、目標に走る |
| VOHP | サポーター | The Supporter | みんなが笑顔のパーティを作る |
| SOLI | スナイパー | The Sniper | 一発必中。無駄は省く |
| SOHI | クラフター | The Crafter | 自分のペースで一品物を |
| VOLI | アサルター | The Assaulter | 先頭を走る。考えるのは後で |
| VOHI | パフォーマー | The Performer | 舞台は世界。君が主役だ |

### ゲームロール（bestRoles）

| コード | ゲームロール |
|---|---|
| SDLP | ストラテジスト / スナイパー |
| SDLI | テックサポート / デバッファー |
| VDLP | コマンダー / ショットコーラー |
| VDLI | レイドリーダー / ブレイカー |
| SDHP | バッファー / サポーター |
| SDHI | ソロハンター / クリエイター |
| VDHP | ヒールリーダー / バッファー |
| VDHI | エクスプローラー / フレックス |
| SOLP | スピードランナー / オペレーター |
| SOHP | ヒーラー / サポーター |
| VOLP | タンク / コマンダー |
| VOHP | サポーター / ヒーラー |
| SOLI | スナイパー / アサシン |
| SOHI | クラフター / ソロプレイ |
| VOLI | アタッカー / アサシン |
| VOHI | フレックス / ハイプマン |

---

## 12 ゲームの構成

| Stage | GameId | 軸 (weight) | 概要 | 所要 |
|---|---|---|---|---|
| 1 | `quick-react` | VS 1.0 | 緑になったらタップ。5 試行、平均反応速度 | ~1.5分 |
| 2 | `quick-stop` | VS 1.0 | 振れるバーを緑ゾーンで止める。10 ラウンド | ~1.5分 |
| 3 | `sequence-memory` | OD 1.0 | Simon Says。光る順番を覚えて再現 | ~2分 |
| 4 | `mission-brief` | OD 1.0 | 報告文 5 秒読み→詳細 Q&A 3 問×5 ラウンド | ~2.5分 |
| 5 | `target-hunter` | VS 0.5, PI 0.5 | 30 秒ターゲット叩き、フェイク回避 | ~1分 |
| 6 | `pattern-predictor` | OD 1.0 | Flash Sense: ドット数を直感で当てる | ~2分 |
| 7 | `single-stroke` | PI 1.0 | 一筆書きパズル 3 問。思考時間+リスタート数 | ~3分 |
| 8 | `quest-select` | PI 1.0 | 6 クエストから 10 ターン内最大報酬を選択 | ~1分 |
| 9 | `code-breaker` | PI 0.8 | 4 桁 Mastermind、8 回以内 | ~2分 |
| 10 | `rpg-crossroads` | LH 1.0 | 5 つの RPG シナリオで Logic/Heart/中立を選択 | ~2分 |
| 11 | `loot-allocation` | LH 1.0 | 1000G を 4 人に分配（3 ラウンド） | ~2分 |
| 12 | `party-pick` | LH 0.8 | 6 NPC から 3 人選択（Combat vs Teamwork） | ~1分 |

**合計所要時間**: 約 18 分  
**軸別合計 weight**: VS=2.5 / OD=3.0 / LH=2.8 / PI=3.1

---

## スコアリング設計（重要な校正値）

### Quick React（`lib/scoring.ts: scoreQuickReact`）
```
score   = linearScore(avgMs, 200, 600) - flyingPenalty
vsDelta = linearScore(avgMs, 180, 450) - 50 - flyingCount * 8
// 中立点 ~300ms（ゲーマー向けに調整済み）
```

### Quick Stop（`scoreQuickStop`）
```
vsDelta = -(avgEarlyTapMs / 200) * 25 + (0.5 - avgAccuracy) * 40
// V=早打ち（earlyTapMs 小）、S=タイミング待ち（earlyTapMs 大）
```

### Sequence Memory（`scoreSequenceMemory`）
```
odDelta = (reached - 6) * 12   // 中立: 6段、±12/段
```

### Flash Sense / Pattern Predictor（`PatternPredictor.tsx` 内部で計算）
```
odDelta = -(avgAcc * speedFactor * 70) + (1 - avgAcc) * 20
// 高精度+速い→D、低精度→O
```

### Mission Brief（`scoreMissionBrief`）
```
odDelta = (accuracy - 0.5) * 80 + speedBonus
// 正解率高い→O（細部記憶）、低い→D（全体把握のみ）
```

### Single Stroke（`scoreSingleStroke`）
```
restartBase = clamp(30 - restarts * 10, -30, 30)
thinkMod    = clamp((avgThinkMs - 4000) / 500, -8, 8)  // 15s キャップ済み
piDelta = restartBase + thinkMod
```

### Quest Select（`scoreQuestSelect`）
```
// クエスト設計: A(3t,180G) B(2t,130G) C(1t,70G) D(4t,220G) E(5t,310G) F(3t,170G)
// 予算10ターン, optimal=620G (A+B+E), greedy=600G
efficiency = userReward / 620
piDelta = clamp((efficiency - 0.6)*50 + (decisionMs - 10000)/2000*12, -50, 50)
```

### Loot Allocation（`scoreLootAllocation`）
```
lhDelta = Pearson相関(貢献度配列, 配分配列) * 50
// 貢献度通り→L、均等/逆転→H
```

### RPG Crossroads（`scoreRpgCrossroads`）
```
lhDelta = (logicCount - heartCount) * 10
```

### Party Pick（`scorePartyPick`）
```
// A(95/20) B(92/25) C(70/75) D(65/85) E(40/90) F(45/80)
lhDelta = (combatSum - teamworkSum) / 137 * 50
```

---

## ディレクトリ構成

```
app/[locale]/
  page.tsx               ランディング（Resume バナー付き）
  intro/page.tsx         同意 + 所要時間 + Start（12 ゲーム予告）
  play/page.tsx          12 ゲームの state machine
                         (stage-intro → game → bridge → compiling → /result)
  result/page.tsx        結果画面（型・軸ガイド・16 タイプ一覧・スコア等）
  privacy/page.tsx       プライバシーポリシー（未実装）

components/
  flow/
    StageIntro.tsx       STAGE N / 8 のルール説明画面
    StageBridge.tsx      STAGE N COMPLETE（スコア + 進捗バー）
    CompilingResults.tsx 全ゲーム後の集計演出
  games/
    QuickReact.tsx
    QuickStop.tsx
    SequenceMemory.tsx
    MissionBrief.tsx
    TargetHunter.tsx
    PatternPredictor.tsx  (Flash Sense)
    SingleStroke.tsx
    QuestSelect.tsx
    CodeBreaker.tsx
    RpgCrossroads.tsx
    LootAllocation.tsx
    PartyPick.tsx
    GameShell.tsx         タブ離脱検出・一時停止ダイアログ
  ui/
    Button.tsx, ProgressBar.tsx, ResumeBanner.tsx

lib/
  types.ts               GameId / TypeCode / AxisKey / GameResult / FinalResult
  store.ts               Zustand store（GAME_COUNT=12、persist）
  scoring.ts             12 ゲーム分のスコアリング関数 + aggregateAxisScores
  type-code.ts           軸偏差→コード変換、TYPE_NAMES、getGameGenres、buildFinalResult
  compatibility.ts       bestMatch(4 軸反転) / similar(VS 軸反転)
  game-config.ts         GAME_ORDER(12) + GAME_META(icon/axis/formatMetric)
  game-config.ts         stageNum 1-12
  single-stroke-puzzles.ts  3 パズル定義（Easy/Medium-H型/Hard-Grid）
  sound.ts               zzfx ラッパー（tap/success/fail）
  submit.ts              /api/submit への fetch（サイレント失敗）
  a11y.ts                prefers-reduced-motion 検出
  visibility.ts          Page Visibility API ヘルパー

messages/
  ja.json                landing / intro / stages(12) / types(16型フルコピー)
  en.json                同上 英語版

db/
  schema.sql             D1 results テーブル定義
  migrations/
    0001_create_results.sql  適用済み（ローカル + 本番）

wrangler.jsonc           name: game-mbti / D1 binding / cron trigger
open-next.config.ts      cloudflare-node wrapper 設定
```

---

## 結果画面の構成（上から順）

1. **Hero Card** (シェア PNG 対象)
   - コード（Press Start 2P）、型名（Orbitron）、キャッチフレーズ
   - 5 スキル mini-bar（Reaction/Memory/Logic/Empathy/Planning）
2. **境界型ヒント**（|axisScore| < 10 の軸がある場合のみ表示）
3. **STYLE AXES** — 4 軸のユーザースコアと信頼度バー
4. **型詳細** — 説明文・強み 3・弱み 2
5. **GAMING PROFILE** — ゲームロール・活きる場面・向いているジャンル
6. **GAME SCORES** — 12 ゲームのスコア一覧
7. **ALL AXES** — 4 軸の両側比較（← YOU ハイライト）
8. **ALL 16 TYPES** — 4×4 グリッド、タップで展開、自分の型はネオングロー
9. **COMPATIBILITY** — Best Match + Similar
10. **アクション** — シェア URL コピー / もう一度プレイ

---

## Cloudflare 設定

```jsonc
// wrangler.jsonc（抜粋）
{
  "name": "game-mbti",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "game-mbti-results",
    "database_id": "33a8af67-6b99-4896-91bf-2560626cc79d"
  }],
  "triggers": { "crons": ["0 4 1 * *"] }
}
```

### D1 テーブル構造
```sql
results (
  id TEXT PRIMARY KEY,
  created_at INTEGER,
  code TEXT,                    -- "VDLP" 等
  vs, od, lh, pi INTEGER,       -- 軸スコア [-50, 50]
  skill_reaction/memory/logic/empathy/planning INTEGER,
  per_game TEXT,                -- JSON
  locale TEXT,
  ua_class TEXT,
  country TEXT,
  app_version TEXT,
  consented INTEGER DEFAULT 1,
  borderline_axes TEXT,
  confidence_min TEXT
)
```

---

## 主なコマンド

```bash
pnpm dev                          # ローカル開発サーバー (localhost:3000)
pnpm typecheck                    # TypeScript チェック
git push                          # Cloudflare が自動ビルド & デプロイ

# D1 確認
pnpm exec wrangler d1 execute game-mbti-results --local \
  --command "SELECT COUNT(*) FROM results"
```

---

## 残っている主な作業

| 優先度 | 内容 | 備考 |
|---|---|---|
| 🔴 高 | `/api/submit` に D1 書き込み実装 | 現在はログのみのスタブ |
| 🔴 高 | シェア画像（html-to-image で Hero Card を PNG 化） | clipboard API + ダウンロード fallback |
| 🟡 中 | intro 画面のゲーム数「8 ゲーム」→「12 ゲーム」に更新 | `messages/ja.json intro.gamesCount` |
| 🟡 中 | `/ja/privacy` ページ作成 | 短文 1 ページ |
| 🟡 中 | カスタムドメイン取得・接続 | Cloudflare Workers Custom Domain |
| 🟢 低 | EN コピーの品質確認 | 機械翻訳的な部分の修正 |
| 🟢 低 | 身内テスト後の閾値チューニング | D1 集計を見て調整 |
| 🟢 低 | OGP 画像 16 種 | テンプレ + コード差し替えで OK |

---

## 注意事項・設計上の決定事項

- **ゲームスタイル診断であって性格診断ではない** — コピーに「性格」は使わない
- **MBTI コードは UI に出さない** — 独自 4 文字コードのみ表示
- **VS 軸はゲームスキルの影響が大きい** — 反応速度はゲーム経験で変わる。身内テストで V 偏りが出たら閾値を再調整
- **Single Stroke の思考時間は 15s キャップ済み** — タブ切り替えや通知による誤検知を防ぐ
- **Quest Select の最適解は 620G (A+B+E)** — greedy は 600G。クエスト構成は変更禁止（バランス設計済み）
- **ローカルビルドは Windows で symlink エラー** — `pnpm cf:build` はローカルでは実行しない。GitHub push → Cloudflare ビルド のルートを使う
- **pnpm-workspace.yaml は削除済み** — monorepo ではないため不要（Cloudflare ビルドが誤認識していた）

---

*最終更新: 2026-05-14*
