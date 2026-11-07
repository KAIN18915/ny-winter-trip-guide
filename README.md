# 年末年始ニューヨーク旅行ガイド 2026–27

静的サイト（GitHub Pages）。シアトル発・学生1人向けの **案A（NYのみ）** と **案B（LA経由）** を、公式ソース付きで比較します。

- 公開URL（カスタム）: http://www.kainel18915.f5.si/ny-winter-trip-guide/
- GitHub Pages: https://kain18915.github.io/ny-winter-trip-guide/（上記へリダイレクト）

## ページ一覧

| ファイル | 内容 |
|---------|------|
| `index.html` | 結論・2案比較・日程カレンダー・費用目安 |
| `plan-a.html` | 案A 日別行程 |
| `plan-b.html` | 案B 日別行程 |
| `nye.html` | 年越し（Times Square / Prospect Park / NYRR） |
| `practical.html` | 空港アクセス・OMNY・休館・天気・書類 |
| `fares.html` | Google Flights 実運賃（確認日時付き） |

## データとビルド

事実・目安・未確認は `data/*.json` に分離しています。HTML は **JS なし** で閲覧できるよう、ビルド時に埋め込みます。

```bash
node scripts/build.mjs
```

JSON を編集したら上記を再実行してください。

## 確認日

- 調査・施設・交通・年越し: **2026-11-06（PST）**
- Google Flights 運賃: **2026-11-06 23:44（PST）**

## 主な出典（公式）

- UW 学事暦: https://www.washington.edu/students/reg/2627cal.html
- MTA 運賃・OMNY: https://www.mta.info/fares-tolls/subway-bus / https://www.mta.info/fares-tolls/subway-bus/tap-and-ride
- JFK AirTrain: https://www.jfkairport.com/transportation/airtrain
- LGA アクセス: https://www.mta.info/guides/airports/laguardia/lga-to-nyc
- EWR NJ TRANSIT: https://www.njtransit.com/destinations/newark-liberty-international-airport-ewr-start-your-trip-out-right-taking-nj-transit
- Times Square NYE: https://www.timessquarenyc.org/nye/nye-faq / https://www.timessquarenyc.org/nye/nye-landing
- Prospect Park NYE: https://www.prospectpark.org/events/category/holiday/
- NYRR Midnight Run: https://events.nyrr.org/nyrr-midnight-run
- Met / MoMA / AMNH 等: 各 `plan-your-visit` ページ（`data/practical.json` 参照）
- NOAA NYC 12月平年値: https://www.weather.gov/media/okx/Climate/Almanacs/nyc/nycdec.pdf
- LA Metro / LAX: https://www.metro.net/fares/ / https://www.metro.net/destinations/lax/
- FlyAway: https://www.flylax.com/flyaway-bus/fares-tickets
- UW ISS（国内旅行・書類）: https://iss.washington.edu/travel/in-the-us/
- Google Flights: https://www.google.com/travel/flights

## 免責

本リポジトリの内容は旅行計画の参考であり、**航空券・宿泊・イベントは一切予約済みではありません**。料金・時刻・休館日は変動します。購入・出発前に必ず公式情報で再確認してください。個人を特定する情報（氏名・住所・予約番号等）は掲載しません。

草案参考: リポジトリ外の ChatGPT 行程メモ（事実は `uploads` 調査メモと公式URLで上書き検証）。
