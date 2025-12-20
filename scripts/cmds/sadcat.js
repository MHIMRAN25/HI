const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sadcat",
    version: "4.5",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Generate a sad cat meme with coins",
    category: "fun",
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 500; // coin cost
      const sender = event.senderID;

      // --- Balance Check ---
      let user = await usersData.get(sender);
      let balance = user.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `😿 Senpai… sadcat banate **${COST} coins** lagbe!  
💰 Your balance: ${balance} coins`,
          event.threadID,
          event.messageID
        );
      }

      if (!args[0]) {
        return api.sendMessage("❌ Baka! Text dao nyaa~", event.threadID);
      }

      const text = encodeURIComponent(args.join(" "));

      // Deduct coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // Anime reactions
      const senderName = await usersData.getName(sender);
      const animeReplies = [
        `😿 ${senderName}-kun made a sad cat... ara ara~`,
        `💔 ${senderName} is feeling emotional... here's your sad cat!`,
        `Nyaa~ 😭 ${senderName}-chan summoned sadness!`,
        `Baka! 😿 ${senderName} made the cat cry...`,
        `Uwuuu~ someone is sad... here’s your cat 💙`,
        `${senderName} used SADNESS! It was super effective 😭`
      ];

      const chosen = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      // Process image
      const res = await axios.get(
        `https://api.popcat.xyz/v2/sadcat?text=${text}`,
        { responseType: "arraybuffer" }
      );

      const savePath = path.join(__dirname, "tmp");
      if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

      const filePath = path.join(savePath, `sadcat_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, res.data);

      // Send message
      api.sendMessage(
        {
          body: `${chosen}\n\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );

    } catch (err) {
      console.log(err);
      api.sendMessage("❌ Uwuuu~ Sadcat e problm hoye gese (>_<)", event.threadID);
    }
  }
};
