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
  endpoint: "https://fcm.googleapis.com/fcm/send/e-IZTeJdK8w:APA91bFVeOaVrAkRHBhT46tWF8BGuSQH_LOgz-oUKkG527Lxrx0M8j6A_OkqMstJfFNX88dbyOZTZKrRsjnmV62vUP83xBtcRogNJC_TrYxXj8nGKAQyTWScNY7hdt69PExvAg3IXtyL",
  keys: {
    p256dh: "BEZI1esgfIiIsoB_9VpzB_DcPbggnygykkGI6iHPGpHHl88g0Kc8468Mu5GD1zI6J4GcnJauW8J71A7Pa9rWTsU",
    auth: "iTdkF70GrIPgomNjTSEC-g"
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