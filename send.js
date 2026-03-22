const webpush = require("web-push");
const fs = require("fs");

// ファイル読み込み
const subs = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
const notify = JSON.parse(fs.readFileSync("notify.json", "utf8"));

// Secrets から取得
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:example@example.com",
  vapidPublicKey,
  vapidPrivateKey
);

async function sendAll() {
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        s,
        JSON.stringify({
          title: notify.title,
          body: notify.body
        })
      );
      console.log("Sent to:", s.endpoint);
    } catch (err) {
      console.error("Error sending to:", s.endpoint, err);
    }
  }
}

sendAll();
