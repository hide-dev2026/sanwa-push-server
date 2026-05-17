// ========================================
// 📦 モジュール
// ========================================
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');

// ========================================
// 🚀 初期設定
// ========================================
const app = express();
app.use(cors());
app.use(express.json());

// ========================================
// 🔐 VAPIDキー（あなたの値）
// ========================================
const vapidKeys = {
  publicKey: 'BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM',
  privateKey: '1_5iexGfhO4BVOrA336S8Z7fIADtiHLezDe0PXN-dPs'
};

webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ========================================
// 🌐 GAS API URL
// ========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxdYXKQ1GD08gOcPpc116UHdzuRMd4_MiGSZ4dpw02HwLCZkvBlUoowVkcuh6V18f6M/exec";

// ========================================
// 📡 Push送信API（全員配信）
// ========================================
// ========================================
// 📡 Push送信API（全員配信）
// ========================================
app.post('/send', async (req, res) => {
  try {
    console.log("📨 Push送信開始");

    const { title, body } = req.body;

    // 👇 fallback（未入力時だけGAS使う）
    let sendTitle = title;
    let sendBody = body;

    if (!sendTitle || !sendBody) {
      const newsRes = await fetch(`${GAS_URL}?action=news`);
      const newsJson = await newsRes.json();
      const newsList = newsJson.data.news;

      if (!newsList || newsList.length === 0) {
        return res.json({ success: false, message: "newsが空です" });
      }

      const latest = newsList[0];
      sendTitle = latest.title;
      sendBody = latest.body;
    }

    const payload = JSON.stringify({
      title: sendTitle || "お知らせ",
      body: sendBody || "内容がありません",
      url: "/sanwa-super/index.html"
    });

    // ----------------------------------------
    // ② 購読者取得
    // ----------------------------------------
    const subRes = await fetch(`${GAS_URL}?action=subscriptions`);
    const subJson = await subRes.json();

    console.log("RAW RESPONSE:", JSON.stringify(subJson, null, 2));

    const raw = subJson?.data?.subscriptions ?? subJson?.subscriptions ?? [];

    const subscriptions = Array.isArray(raw) ? raw : raw ? [raw] : [];

    if (subscriptions.length === 0) {
      return res.json({ success: false, message: "購読者がいません" });
    }

    console.log(`👥 配信対象: ${subscriptions.length}件`);

    // ----------------------------------------
    // ③ 全員に【一斉・並列】送信（ここを大改造）
    // ----------------------------------------
    // 全員分の送信処理（Promise）を配列にまとめる
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await sendWithRetry(sub, payload, 1); // リトライ1回
        return { success: true };
      } catch (err) {
        console.error("❌ 送信失敗:", err.statusCode);

        // 無効な購読（410/404）はバックグラウンドでGASに報告（全体の送信速度を落とさない）
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log("⚠️ 無効なsubscription（削除候補）");
          // awaitをあえて外すか、独立させて全体の処理を巻き込まないようにする
          markAsInvalid(sub.endpoint, err.statusCode).catch(e => console.error("GAS報告エラー:", e));
        }
        return { success: false };
      }
    });

    // Promise.all で全員分を一斉に並列実行！
    const results = await Promise.all(pushPromises);

    // 結果を集計する
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount === 0) {
      return res.json({
        success: false,
        message: "有効な購読者がいません"
      });
    }

    // ----------------------------------------
    // 結果返却
    // ----------------------------------------
    res.json({
      success: true,
      total: subscriptions.length,
      successCount,
      failCount
    });

  } catch (err) {
    console.error("🔥 全体エラー:", err);
    res.json({ success: false, error: err.toString() });
  }
});

// ========================================
// ⚠️ GASに無効な購読を報告する関数
// ========================================
async function markAsInvalid(endpoint, statusCode) {
  try {
    // GAS側で実装した markInvalid を叩く
    // action=mark_invalid はGAS側で新しく定義する必要があります
    const url = `${GAS_URL}?action=mark_invalid&endpoint=${encodeURIComponent(endpoint)}&code=${statusCode}`;
    await fetch(url);
    console.log(`✅ GASへ報告完了 (Code: ${statusCode}, Endpoint: ${endpoint})`);
  } catch (error) {
    console.error("❌ GASへの報告に失敗:", error);
  }
}

async function sendWithRetry(sub, payload, retry = 1) {
  try {
    await webpush.sendNotification(sub, payload);
    return true;
  } catch (err) {
    console.log("❌ 送信失敗:", err.statusCode);

    if (retry > 0) {
      console.log("🔁 リトライ...");
      return await sendWithRetry(sub, payload, retry - 1);
    }

    throw err;
  }
}

// ========================================
// 🧪 テスト用（手動送信）
// ========================================
app.get('/test', async (req, res) => {
  const payload = JSON.stringify({
    title: "テスト通知",
    body: "これはテストです"
  });

  res.json({ message: "POST /send を使ってください" });
});

// ========================================
// ▶ 起動
// ========================================
app.listen(3000, () => {
  console.log("🚀 server start http://localhost:3000");
});
