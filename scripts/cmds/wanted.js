const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "wanted",
    version: "2.1",
    author: "KSHITIZ + Senpai Upgrade",
    countDown: 3,
    role: 0,
    shortDescription: "Wanted poster with anime-style text & coins",
    category: "fun",
    guide: "{pn} (tag/reply/random/leave_blank)"
  },

  onStart: async function ({ event, message, api, usersData, args }) {
    try {
      const COST = 300;
      const sender = event.senderID;

      // ==== Balance check ====
      const user = (await usersData.get(sender)) || { money: 0 };
      if (user.money < COST) {
        return message.reply(`💸 Senpai… you need ${COST} coins!\n💰 Your balance: ${user.money} coins`);
      }

      // Deduct coins
      await usersData.set(sender, { ...user, money: user.money - COST });
      const remaining = user.money - COST;

      // ==== Target selection ====
      let target;

      if (event.messageReply?.senderID) target = event.messageReply.senderID;
      else if (Object.keys(event.mentions || {})[0]) target = Object.keys(event.mentions)[0];
      else if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const ids = (threadInfo.participantIDs || []).filter(id => id !== sender && id !== (api.getCurrentUserID?.() || null));
        if (!ids.length) return message.reply("No one found for random mode~");
        target = ids[Math.floor(Math.random() * ids.length)];
      } else {
        target = sender; // blank = self
      }

      const targetName = await usersData.getName(target) || "Someone";

      // ==== Fetch avatar via FB token ====
      const avatarBuf = await getFbAvatarBuffer(target);

      // ==== Generate wanted image ====
      const img = await new DIG.Wanted().getImage(avatarBuf);

      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `wanted_${target}.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // ==== Anime-style lines ====
      const animeLines = [
        `⚠️ ${targetName} is now officially WANTED!`,
        `🔥 ${targetName} has a bounty on their head!`,
        `🚨 Alert! ${targetName} is the most wanted person!`,
        `💥 ${targetName} has been marked dangerous!`,
        `🌪️ ${targetName} just got a WANTED poster!`
      ];

      const replyText = `${animeLines[Math.floor(Math.random() * animeLines.length)]}\n\n💸 ${COST} coins deducted\n💳 Remaining: ${remaining} coins`;

      // ==== Send message ====
      await message.reply({
        body: replyText,
        attachment: fs.createReadStream(filePath)
      }, () => {
        try { fs.unlinkSync(filePath); } catch {}
      });

    } catch (err) {
      console.log("WANTED COMMAND ERROR:", err);
      message.reply("Something went wrong while generating wanted poster.");
    }
  }
};

// Helper: fetch avatar buffer via FB token
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
