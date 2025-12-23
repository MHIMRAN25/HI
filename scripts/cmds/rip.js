const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "rip",
    version: "4.8",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "RIP image with anime-style effects & coins",
    category: "fun",
  },

  onStart: async function ({ api, event, args, usersData }) {
    const COST = 300;
    const sender = event.senderID;

    const replyText = (txt) => api.sendMessage(txt, event.threadID, event.messageID);

    try {
      const user = (await usersData.get(sender)) || { money: 0 };
      const balance = user.money || 0;

      if (balance < COST) {
        return replyText(`Senpai… RIP costs ${COST} coins!\nYour balance: ${balance} coins`);
      }

      // Determine target
      let target = null;
      let targetName = "Someone";

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        target = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        target = Object.keys(event.mentions)[0];
      } else if (["r", "rnd", "random"].includes((args[0] || "").toLowerCase())) {
        const info = await api.getThreadInfo(event.threadID);
        const candidates = (info.participantIDs || []).filter(id => id !== api.getCurrentUserID());
        if (!candidates.length) return replyText("No one available to RIP!");
        target = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        target = sender;
      }

      try { targetName = (await usersData.getName(target)) || targetName; } catch {}
      let senderName = "Someone";
      try { senderName = (await usersData.getName(sender)) || senderName; } catch {}

      // Deduct coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // Avatar buffer
      let avatarBuf;
      try {
        avatarBuf = await getFbAvatarBuffer(target);
      } catch (e) {
        await usersData.set(sender, { ...user, money: balance });
        return replyText("Failed to load avatar. Coins refunded.");
      }

      // Generate RIP image
      let img;
      try {
        img = await new DIG.Rip().getImage(avatarBuf);
      } catch (e) {
        await usersData.set(sender, { ...user, money: balance });
        return replyText("RIP image generation failed. Coins refunded.");
      }

      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `${sender}_${target}_rip.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // Replies
      const repliesSelf = [
        `${senderName} RIP’d themselves…`,
        `${senderName} couldn’t handle it anymore…`,
        `${senderName} used RIP on self!`
      ];

      const repliesOther = [
        `${senderName} sent ${targetName} straight to the grave!`,
        `${targetName} has been RIP’d by ${senderName}!`,
        `${senderName} used RIP on ${targetName}!`
      ];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const body = (target === sender ? pick(repliesSelf) : pick(repliesOther)) +
        `\n\n${COST} coins deducted\nRemaining balance: ${remaining} coins`;

      return api.sendMessage(
        {
          body,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => {
          try { fs.unlinkSync(filePath); } catch {}
        },
        event.messageID
      );

    } catch (err) {
      console.log("RIP COMMAND ERROR:", err);
      return replyText("Something went wrong while generating RIP.");
    }
  },
};

async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
