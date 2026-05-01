const express = require('express');
const webpush = require('web-push');

const app = express();
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
  endpoint: "https://fcm.googleapis.com/fcm/send/fkvy9_PS9oA:APA91bHQD8gCQOCI0YZ-lERF4HnkJwMk59tfm6H5HhwEroTCkOnVHFdDf7-OIM86nUBaswu0Ll30ev6lsla9TrJMyzGPaUAJnq86rQC6AA-PfeeOhr7kDDNVZZz60qmyRQIWeFFpyl0c",
  keys: {
    p256dh: "BE3WncdPnPr4d72NovP0sE7ZHBIrkK3vJCCDSdkxD-RUOGxbhcclFR79Yzghc99TGverCNTpJwJDJdI2TYLmJPg",
    auth: "s68goP8yADSD759NWonOig"
  }
};

app.post('/send', async (req, res) => {
  const { title, body } = req.body;

  const payload = JSON.stringify({ title, body });

  try {
    await webpush.sendNotification(subscription, payload);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log("server start"));