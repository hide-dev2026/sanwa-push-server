// ========================================
// 📦 モジュール
// ========================================
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const fetch = require('node-fetch');

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
const GAS_URL = "https://script.google.com/macros/s/AKfycbymQE2iZfO0S9nlvUYT03UfBTjAVg2eugBJZ6CWoKtQLvVyuThMoOEqiUDBtfaxoXZ7/exec";

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

    const subscriptions = subJson.data.subscriptions;

    if (!subscriptions || subscriptions.length === 0) {
      return res.json({ success: false, message: "購読者がいません" });
    }

    console.log(`👥 配信対象: ${subscriptions.length}件`);

    // ----------------------------------------
    // ③ 全員に送信
    // ----------------------------------------
    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err) {
        failCount++;

        console.error("❌ 送信失敗:", err.statusCode);

        // 無効な購読（410/404）は削除対象
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log("⚠️ 無効なsubscription（削除候補）");
        }
      }
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
