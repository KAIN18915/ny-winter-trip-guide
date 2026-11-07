# NY/LA year-end guide v2 research handoff

確認日時は各JSONの checked_at（PST）。営業時間は施設現地時間（NY EST / LA PST）。
既存 research.md / research_summary.md / chatgpt_plan.md / fares.md を先に読み、既存の検証済み情報は再調査せず継承。ChatGPTの未検証の予算レンジ・宿泊相場は実売額として転載していない。予約・送信・公開・外部変更なし。

## Deliverables
- lodging.json: 43候補（NY圏30 / LA13）。公式URL、種別、エリア、出典、取得状況、指定日の価格null、注意点。座標34件。最寄駅は公式本文で確認できた3件のみ記入、その他null。
- options.json: 75候補。美術館・博物館、無料散策、展望台、演劇、ホリデー市場・照明、リンク、年越し、食事、鉄道・バス日帰り、LA、空港比較。地図座標43件。
- date_scenarios.json: 49提案。NYのみ3/4/5/6/7/8/10/12/14泊、LA2–5泊→NY3/5/7/10泊の組合せ。12/19以降出発・12/31と1/1NY滞在・1/2または1/3SEA帰着制約をプログラム検証。全て未予約、料金未確認。夜行便の場合は到着日と泊数を再計算。
- img/: 54枚、全て200KB以下のWebP。Commons41枚＋物件公式公開OG13枚。
- credits.json / all_credits.json: 全54枚、出典ページ・作者・ライセンス・加工・確認日時。`freely_licensed`でフィルタすること。
- commons_credits.json: 自由ライセンス41枚のみ。公開サイトでの既定採用はこちら。
- lodging_photo_credits.json: 物件公式公開OG13枚。自由ライセンスではなく再掲載権は未確認。**権利確認前に公開サイトへコピーしない**。OG写真と物件同一性も公開前に確認。
- map_points.json: 写真対象45件の出典付き地図座標・写真対応。
- price_attempts.json: 日付指定の宿検索6試行の結果（HI公式2、Pod39 SynXis2、Booking1、Hostelworld1）。
- evidence/: 公式ページから取得したテキスト。引用・追検証用、サイトへ丸ごと公開しない。
- manifest.json: 件数、取得制限、要レビュー候補と残課題。
- contact-sheet.jpg: Commons写真の目視QA用（Rockefellerの非写真代表画像は採用から除外）。

## Particularly useful verified additions
- AMNH：州外一般$37、学生$30、有効な学生証なら全年齢学生対象。NY州居住者向けPWYWはUW学生というだけでは使えない。閉館前最後の1時間来館者は免除対象、無料でも券必要。12/26–30は9–20時、1/2は10–20時。指定券総額ではなく通常公式料金。
- Whitney：大人$30、学生$24、25歳以下毎日無料。金曜17–22時無料は通常規則、元日適用は未確認。
- MoMI：大人$20、18歳以上学生$12、オンライン手数料$1.50。12/31は12–16時、1/1休館が公式年末カレンダーに掲載。12/28–30は12–18時。
- Bryant Park：2026–27年版日程確認。Rinkは2/28まで、Holiday Shopsは1/3まで・祝日も営業。ピーク期間11/19–1/3はリンク8時–翌0時。入場無料でも貸靴$18.72–64.48（管理料込・税別）＋荷物預り別。古い2025–26券説明が混在するため、確定日付のある記述のみ使用。
- 展望台の公式一般from価格：ESB86階$46、Edge$42＋$2処理料、One World$39＋$3.50＋税。**年末指定日の料金ではない**。
- Academy Museum：大人$25、学生$15、16:30以降の現地割引は大人$18・学生$10。Angels Flight片道$1.50、TAP Stored Valueで$0.75。
各項目の引用出典はoptions.jsonのsources / source_url。

## Important unknowns / blocked sources
- 全43宿の12/28–1/3・大晦日1泊の税込実売額、空室、年齢条件、取消条件は未確認（nullは無料ではない）。HI予約画面はJSシェル、Pod39は正しい日付・1名まで表示するが部屋価格なし。Bookingは202/JSのbot確認。Hostelworld数値IDは別都市HI Kelownaに転送されたため不採用、NY宿の情報には使わない。
- Met/MoMAは今回WebFetchタイムアウト、curl制限。AMNHはWebFetch成功。Guggenheim・Universal・DisneylandカレンダーはJS依存。Top of the Rock / Rockefeller・一部宿は403/429やDNS/SSL取得エラー。詳細はmanifest。
- Union Square/Columbus Circle旧Urbanspace URLは無関係なフードホールへ転送。2026開催日・終了日未確認、年末も営業と書かない。
- The Jane旧URLはWest Village Eurohostelへ転送。Blue Moon公式はNapa Valleyのテンプレート文混在。citizenMの旧物件URLはブランドトップへ転送。営業・同一物件・予約先は要再確認。
- SUMMITページは混在券種/古い催事があり料金を採用しない。Broadway抽選・rush、Rockettes、NYE船、鉄道/バス3都市への年末指定日実売は未確認。FlixBus一般from $7.48を各都市への料金に流用しない。
- EE342/482個人期末、Times Square2026→27入場規制、各施設の特別営業は既存の未確認事項を維持。
- parallel-cliはcommand not found。検索できたかのように装っていない。/parallel-setupが必要（本作業は公開公式URLの直接取得とWikimedia/OSM公開データで実施）。

## Implementation cautions
JSON配列をそのままDBとして読み込める。`notes`の提案と未確認を断定文に変えない。`source_status`が未確認の候補はグレー表示し、営業・価格・空室保証と混同しない。from価格と指定日総額を別表示。座標nullの物件は地図に仮のピンを置かない。最寄駅nullを推測で補わない。publicサイトに個人名・予約番号・旅券・連絡先を入れない。
