# ルール設定 YAML の書き方

## 全体構造

```yaml
players: ...        # プレイヤー定義（必須）
tiles: ...          # 使用する牌（必須）
initialHandCount: 13  # 最初に配る枚数（必須）
dora: ...           # ドラの位置（省略可、デフォルト: なし）
scoreUnits: ...     # 点数の単位（必須）
initialScore: ...   # 各プレイヤーの初期点数（必須）
tableStates: ...    # 卓状態の定義（省略可）
declarations: ...   # 発声の定義（省略可）
```

---

## players

ゲームに参加するプレイヤーを定義します。最低2人必要です。

```yaml
players:
  - id: p1       # 一意な識別子
    name: 東家   # 表示名
  - id: p2
    name: 南家
```

---

## tiles

使用する牌を定義します。`suits`（スート付き数牌）と `honors`（個別の牌）の2種類があります。

### suits（数牌）

数字の連続する牌（萬子・筒子・索子など）をまとめて定義します。

**`range` で連続した数字を指定する場合:**

```yaml
suits:
  - prefix: man    # 牌 ID のプレフィックス（例: man1, man2, ...）
    label: 萬      # 牌 ID のサフィックス（例: 1萬, 2萬, ...）
    range: [1, 9]  # 1 から 9 まで生成
    count: 4       # 各牌の枚数
```

生成される牌: `man1`〜`man9`（それぞれ 4 枚）

**`numbers` で飛び飛びの数字を指定する場合:**

```yaml
suits:
  - prefix: man
    label: 萬
    numbers: [1, 9]  # 1 と 9 だけ
    count: 4
```

生成される牌: `man1`、`man9`（それぞれ 4 枚）  
3人麻雀で萬子の 2〜8 を使わない場合などに使います。

> `range` と `numbers` はどちらか一方のみ指定してください。両方または両方なしはエラーになります。

**`tiles` で特定の数字だけ設定を上書きする場合:**

```yaml
suits:
  - prefix: man
    label: 萬
    range: [1, 9]
    count: 4
    tiles:
      5:              # 5だけ上書き
        count: 6      # 枚数を変更（省略するとスートの count を引き継ぐ）
        variants:     # バリアントを追加（省略可）
          red: 2
```

`count` と `variants` はそれぞれ独立して省略できます。書かなかった項目はスートのデフォルト値を引き継ぎます。

### honors（字牌・その他の牌）

スートを持たない牌を1枚ずつ定義します。

```yaml
honors:
  - id: east     # 牌 ID（一意な識別子）
    label: 東    # 表示名
    count: 4     # 枚数
```

`variants` を指定することもできます（後述）。

### variants（バリアント）

同じ牌でも外見が異なるものがある場合に使います。  
`variants` には「バリアント名: 枚数」の形式で複数指定できます。  
`count` のうち `variants` の合計を引いた枚数が通常版（バリアントなし）になります。

```yaml
# 例: 5萬が 4 枚、うち 1 枚が赤
tiles:
  suits:
    - prefix: man
      label: 萬
      range: [1, 9]
      count: 4
      tiles:
        5:
          variants:
            red: 1      # 赤 1 枚、通常 3 枚（4 - 1）

# 例: 北が 7 枚、バリアントが複数
honors:
  - id: north
    label: 北
    count: 7
    variants:
      gold: 2     # 金 2 枚
      silver: 2   # 銀 2 枚
      rainbow: 1  # 虹 1 枚
                  # 通常 2 枚（7 - 2 - 2 - 1）
```

---

## initialHandCount

最初に各プレイヤーに配る手牌の枚数です。

```yaml
initialHandCount: 13
```

---

## dora

牌山の後ろから数えた位置の牌を最初から表にします。複数指定できます。

```yaml
dora:
  - positionFromBack: 5   # 後ろから 5 枚目
  - positionFromBack: 3   # 後ろから 3 枚目（2 つ目のドラ）
```

ドラ不使用の場合は省略してください（デフォルトはなし）。

---

## scoreUnits / initialScore

点数の単位と、各プレイヤーの初期点数を定義します。単位は複数持てます。

```yaml
# 点棒のみ
scoreUnits:
  - id: points
    label: 点

initialScore:
  points: 25000

# 点棒 + チップの場合
scoreUnits:
  - id: points
    label: 点
  - id: chips
    label: 枚

initialScore:
  points: 25000
  chips: 20
```

`scoreUnits` の `id` と `initialScore` のキーを一致させてください。

---

## tableStates

卓の状態を定義します。省略可（デフォルトはなし）。

`kind` に応じて3種類あります。

| kind | 説明 | 例 |
|---|---|---|
| `exclusive` | プレイヤーの誰か1人に付与される | 親 |
| `per-player` | 各プレイヤーが独立して持つ | 焼き鳥 |
| `global` | 場そのものの状態 | 東場・本場 |

```yaml
tableStates:
  - id: dealer
    label: 親
    kind: exclusive          # 誰が親かを示す

  - id: round
    label: 場
    kind: global
    values: [東, 南, 西, 北] # 取りうる値（省略可）

  - id: honba
    label: 本場
    kind: global             # values 省略時は自由な文字列

  - id: tobi
    label: 飛び
    kind: per-player         # 各プレイヤー独立
    values: [通常, 飛び]
```

---

## declarations

プレイヤーが行える発声を定義します。省略可（デフォルトはなし）。

```yaml
declarations:
  - id: pon
    label: ポン
  - id: ron
    label: ロン
```

---

## サンプルファイル

| ファイル | 内容 |
|---|---|
| [standard.yaml](./standard.yaml) | 標準的な4人麻雀（赤ドラあり） |
| [three_standard.yaml](./three_standard.yaml) | 3人麻雀 |
