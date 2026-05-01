const express = require('express');
const webpush = require('web-push');

const app = express();

const cors = require('cors');
app.use(cors());

app.use(express.json());

// ★ あなたのVAPIDキーに変更
const vapidKeys = {
  publicKey: 'BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM',
  privateKey: '1_5iexGfhO4BVOrA336S8Z7fIADtiHLezDe0PXN-dPs'
};

webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ★ ここにとりあえず1件だけ入れる（あとで改善）
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/dLKxw2v1AYw:APA91bEd17wmCim498Bq8nPadF66ca1iOIIFv-0qqEdtS491kXq9ULu9fn6MkPaWIYkXtmlkWqCM6g1ZgNU96L8Tqs42buA3orp78vQCZm7yibRB5nymTGdi81OgHr0KdkoGHzGlkmrC",
  keys: {
    p256dh: "BE8e90wGPda3HrFBDjl7AyH9rTpFpYAQQCMgaKt1cOkX5wbGXqHCAthugNqjPsJv6KatLd8jBga3vHPaR5FwxC0",
    auth: "D2a1tLlp4rVWW7xU8R9rAg"
  }
};

app.post('/send', async (req, res) => {
  const { title, body } = req.body;

  const payload = JSON.stringify({ title, body });

  try {
    await webpush.sendNotification(subscription, payload);
    res.json({ success: true });
  } catch (err) {
    console.error("Push送信エラー:", err);

    res.json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
      body: err.body
    });
  }
});

app.listen(3000, () => console.log("server start"));