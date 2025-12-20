const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "gray",
    version: "1.3",
    author: "Chitron Bhattacharjee",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Convert profile picture to greyscale with coins and anime-style reply" },
    description: { en: "Turns your or mentioned user's profile picture into a greyscale image" },
    category: "fun",
    guide: { en: "{p}greyscale [@mention or reply | r/random]\nIf no mention, reply, or random, uses your profile picture." }
  },

  onStart: async function ({ api, event, message, usersData, args }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      // ==== Check balance ====
      let user = await usersData.get(sender);
      let balance = user.money || 0;
      if (balance < COST) {
        return message.reply(`🌸 Senpai… you need **${COST} coins** to use this command!\n💰 Your balance: ${balance} coins`);
      }

      // Deduct coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // ==== Determine target user ====
      let uid;
      let targetName;

      // Random mode
      if (args[0] && ["r","rnd","random"].includes(args[0].toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        let candidates = threadInfo.participantIDs.filter(id => id !== sender && id !== api.getCurrentUserID());
        if (candidates.length === 0) return message.reply("Nyaa~ No one to convert! ⚫");
        uid = candidates[Math.floor(Math.random() * candidates.length)];
        targetName = await usersData.getName(uid);
      }
      // Tag mode
      else if (Object.keys(event.mentions)[0]) {
        uid = Object.keys(event.mentions)[0];
        targetName = event.mentions[uid];
      }
      // Reply mode
      else if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
        targetName = await usersData.getName(uid);
      }
      // Fallback to self
      else {
        uid = sender;
        targetName = await usersData.getName(uid);
      }

      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

      // ==== Fetch greyscale image ====
      const res = await axios.get(`https://api.popcat.xyz/v2/greyscale?image=${encodeURIComponent(avatarURL)}`, { responseType: "arraybuffer" });

      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      const filePath = path.join(cachePath, `greyscale_${uid}_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      // ==== Anime-style replies ====
      const senderName = await usersData.getName(sender);
      const animeReplies = [
        `Nyaa~ ${senderName}-kun converted ${targetName}-san to greyscale! ⚫`,
        `Baka! ${targetName}-kun is now a shadow of their former self… 🌑`,
        `Sugoiii~ ${senderName}-chan made ${targetName}-san look stylishly monochrome! ✨`,
        `Ara ara~ ${targetName} is feeling artsy now! 🎨`,
        `Nyaa~ ${senderName} sprinkled some grayscale magic on ${targetName}-kun! 🌸`
      ];
      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      message.reply({
        body: `${chosenReply}\n\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      message.reply("❌ | Failed to generate greyscale image.");
    }
  }
};
