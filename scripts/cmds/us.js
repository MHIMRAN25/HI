const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "us",
    aliases: ["us"],
    version: "2.1",
    author: "sandy + saif",
    countDown: 5,
    role: 0,
    shortDescription: "we together (with balance + gender logic)",
    longDescription: "",
    category: "love",
    guide: {
      en: "{pn} [@tag] | {pn} random"
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      // ---- Balance check ----
      const user = await usersData.get(sender);
      const balance = user.money || 0;

      if (balance < COST) {
        return message.reply(
          `🌸 Senpai… you need **${COST} coins** to use this command!\n💰 Your balance: ${balance} coins`
        );
      }

      // ---- Deduct coins ----
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // ---- Determine target ----
      let target;
      let targetName;

      // === RANDOM MODE ===
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const info = await api.getThreadInfo(event.threadID);
        const botID = api.getCurrentUserID();

        const senderInfo = info.userInfo.find(u => u.id === sender);
        const genderSender = senderInfo?.gender || null;

        // All available users except sender & bot
        let candidates = info.userInfo.filter(
          u => u.id !== sender && u.id !== botID
        );

        // Gender-based matching
        if (genderSender === "MALE") {
          candidates = candidates.filter(u => u.gender === "FEMALE");
        } else if (genderSender === "FEMALE") {
          candidates = candidates.filter(u => u.gender === "MALE");
        } else {
          // Unknown gender = no restriction
        }

        if (candidates.length === 0) {
          return message.reply("Nyaa~ No suitable partner found for random mode 😿");
        }

        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        target = chosen.id;
        targetName = await usersData.getName(target);
      }

      // === MENTION MODE ===
      else if (Object.keys(event.mentions)[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      }

      // === REPLY MODE ===
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      }

      else {
        return message.reply("Please mention someone or use random mode~ 💗");
      }

      if (target === sender) {
        return message.reply("Ara ara… you can’t choose yourself senpai~ (>///<)");
      }

      // ---- Generate image ----
      const imgPath = await loveImage(sender, target);

      const senderName = await usersData.getName(sender);

      // Anime-style replies
      const animeLines = [
        `Nyaa~ ${senderName}-kun & ${targetName}-chan look so cute together! 💞`,
        `${senderName}-san just created a perfect moment with ${targetName} ✨`,
        `Sugoi~ ${senderName} & ${targetName} are now a love duo 💗`,
        `Kyaa~ ${targetName}-chan blushing with ${senderName}-kun ❤️`,
        `${senderName} + ${targetName} = true love desu~ 💘`
      ];

      const line = animeLines[Math.floor(Math.random() * animeLines.length)];

      await message.reply({
        body: `${line}

💸 300 coins deducted!
💳 Remaining Balance: ${remaining} coins`,
        attachment: fs.createReadStream(imgPath)
      });

      fs.unlinkSync(imgPath);

    } catch (err) {
      console.log(err);
      message.reply("Uwuuu~ Something went wrong (>_<)💦");
    }
  }
};


// =======================================
//      IMAGE GENERATOR (JIMP)
// =======================================

async function loveImage(one, two) {
  const av1 = await jimp.read(
    `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  av1.circle();

  const av2 = await jimp.read(
    `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  av2.circle();

  const base = await jimp.read("https://i.imgur.com/ReWuiwU.jpg");
  base.resize(466, 659)
      .composite(av1.resize(110, 110), 150, 76)
      .composite(av2.resize(100, 100), 245, 305);

  const pth = `us_${one}_${two}.png`;
  await base.writeAsync(pth);
  return pth;
}
