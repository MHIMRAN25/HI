const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "trigger",
    version: "4.2",
    author: "Saif + Senpai Upgrade",
    countDown: 3,
    role: 0,
    shortDescription: "Anime-style triggered GIF with coins",
    category: "fun"
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      // Balance check
      let user = (await usersData.get(sender)) || { money: 0 };
      if (user.money < COST) {
        return message.reply(`Senpai… you need ${COST} coins to trigger someone!\nYour balance: ${user.money} coins`);
      }

      // Deduct coins
      await usersData.set(sender, { ...user, money: user.money - COST });
      const remaining = user.money - COST;

      // Determine target: reply > mention > random > self
      let target, targetName;

      if (event.messageReply?.senderID) {
        target = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        target = Object.keys(event.mentions)[0];
      } else if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const candidates = (threadInfo.participantIDs || []).filter(id => id !== sender && id !== (api.getCurrentUserID?.() || null));
        if (!candidates.length) return message.reply("No one available to trigger!");
        target = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        target = sender;
      }

      targetName = await usersData.getName(target) || "Someone";
      const senderName = await usersData.getName(sender) || "Senpai";

      // Fetch avatar via FB token
      const avatarBuf = await getFbAvatarBuffer(target);

      // Generate triggered GIF
      const img = await new DIG.Triggered().getImage(avatarBuf);

      // Save temp
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `trigger_${sender}_${target}.gif`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // Anime replies
      const replies = [
        `${senderName} just triggered ${targetName}!`,
        `${targetName} got ULTRA TRIGGERED by ${senderName}!`,
        `${senderName} used Trigger no Jutsu on ${targetName}!`,
        `${targetName} couldn't dodge ${senderName}'s trigger!`
      ];
      const chosen = replies[Math.floor(Math.random() * replies.length)];

      // Send reply
      await message.reply({
        body: `${chosen}\n\n${COST} coins deducted\nRemaining: ${remaining} coins`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        try { fs.unlinkSync(filePath); } catch {}
      });

    } catch (err) {
      console.log("TRIGGER COMMAND ERROR:", err);
      return message.reply("Something went wrong while generating triggered GIF.");
    }
  }
};

// Helper: FB token avatar
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
