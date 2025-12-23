const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "train",
    version: "3.2",
    author: "milan-says",
    countDown: 5,
    role: 0,
    shortDescription: "Send someone on the Thomas train",
    longDescription: "Supports tag, reply, random mode & balance deduct",
    category: "fun",
    guide: {
      en: "{pn} @tag | reply | r/random"
    }
  },

  onStart: async function ({ event, message, usersData, threadsData }) {
    try {
      const args = event.body.split(/\s+/);
      let targetUID = null;

      // 1️⃣ Reply mode
      if (event.messageReply?.senderID) targetUID = event.messageReply.senderID;

      // 2️⃣ Mention mode
      if (!targetUID) {
        const tag = Object.keys(event.mentions || {})[0];
        if (tag) targetUID = tag;
      }

      // 3️⃣ Random mode
      if (!targetUID && ["r", "rnd", "random"].includes(args[1]?.toLowerCase())) {
        const info = await threadsData.get(event.threadID);
        const members = (info.members || []).map(m => m.userID);
        const filtered = members.filter(id => id !== event.senderID);
        if (!filtered.length) return message.reply("No one available to send on the train!");
        targetUID = filtered[Math.floor(Math.random() * filtered.length)];
      }

      // 4️⃣ Blank => self
      if (!targetUID) targetUID = event.senderID;

      // 5️⃣ Names
      const targetName = await usersData.getName(targetUID) || "Someone";
      const senderName = await usersData.getName(event.senderID) || "Senpai";

      // 6️⃣ Balance check
      const COST = 500;
      const userData = (await usersData.get(event.senderID)) || { money: 0 };
      if (!userData.money || userData.money < COST) {
        return message.reply(`Ayy senpai… You need ${COST} coins to send someone on the train!`);
      }

      // Deduct coins
      await usersData.set(event.senderID, { ...userData, money: userData.money - COST });
      const remaining = userData.money - COST;

      // 7️⃣ Fetch avatar via FB token
      const avatarBuf = await getFbAvatarBuffer(targetUID);

      // 8️⃣ Generate Thomas train image
      const img = await new DIG.Thomas().getImage(avatarBuf);

      // 9️⃣ Save temp
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `train_${targetUID}.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // 10️⃣ Anime-style text
      const text = `🚂💨 Mikasa Express Departure!

${senderName} just sent ${targetName} flying on the train~  
Hold tight, baka! 😼💗

💸 ${COST} coins deducted  
💳 Remaining: ${remaining}`;

      // 11️⃣ Send reply
      await message.reply({
        body: text,
        attachment: fs.createReadStream(filePath)
      }, () => {
        try { fs.unlinkSync(filePath); } catch {}
      });

    } catch (err) {
      console.log("TRAIN COMMAND ERROR:", err);
      message.reply("Something went wrong while generating the train image.");
    }
  }
};

// Helper: fetch avatar buffer via FB token
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
