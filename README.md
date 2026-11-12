# 年末年始 NY / LA / ベイエリア旅行ガイド 2026–27（v2）

GitHub Pages 静的サイト。ホームは未予約の暫定プラン（2026-12-27夜 SEA発、2027-01-02 NY発、宿泊5泊）。案A（NYのみ）・案B（LA経由）・案C（友人宅・可否未確認）は代替。日付可変プランナー、宿泊、地図、Commons写真付き。

- https://www.kainel18915.f5.si/ny-winter-trip-guide/
- https://kain18915.github.io/ny-winter-trip-guide/（リダイレクト）

## ページ

| ファイル | 内容 |
|---------|------|
| `index.html` | 現行の暫定プラン（12/27夜–1/2・未予約）と、代替の3案 |
| `planner.html` | 日付可変試算・ヒートマップ（JS）／シナリオ表（no-JS） |
| `plan-a.html` / `plan-b.html` / `plan-c.html` | 固定行程案 |
| `stays.html` | 宿泊候補カード（Google Hotels 目安価格） |
| `options.html` | 観光・食事・イベント75件 |
| `map.html` | 宿122件の地図と Times Square までの所要時間 |
| `credits.html` | Wikimedia Commons 41枚のクレジット |
| `nye.html` / `practical.html` / `fares.html` | 年越し・実務・運賃カレンダー |

## データ

`data/` に JSON。`assets/img/` に Commons 由来 WebP のみ掲載（物件 OG 画像は未掲載）。

## ビルド

```bash
node scripts/ingest-v2.mjs   # fare/hotel md → JSON、lodging 価格マッチ
node scripts/build.mjs       # HTML 生成
```

## 確認日

- 調査・options/lodging: **2026-11-06〜07（PST）**
- 片道運賃カレンダー・Google Hotels: **2026-11-07（PST）**
- 現行暫定（直行の参考帯・Expedia 5泊）: **2026-11-11（PT）**。直行だけの再検索と航空会社公式の確認は途中。

## 免責

**予約なし。** 目安・未確認を区別。個人情報なし。購入前に公式で再確認。

主な出典は v1 README および `data/manifest.json` の `blocked_or_unverified_sources` を参照。
