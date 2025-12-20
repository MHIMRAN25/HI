const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pikachu",
    version: "1.1",
    author: "saif",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate a Pikachu image with custom text"
    },
    description: {
      en: "Creates a cute Pikachu image with the text you provide"
    },
    category: "fun",
    guide: {
      en: "{p}pikachu <text>\nExample: {p}pikachu hello"
    }
  },

  langs: {
    en: {
      missing: "❌ | Please provide text to put on the Pikachu image.",
      error: "❌ | Failed to generate Pikachu image."
    }
  },

  onStart: async function ({ message, args, getLang, usersData, event }) {
    const COST = 300;
    const senderID = event.senderID;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`❌ Senpai, you need **${COST} coins** to generate a Pikachu image! 💸\nYour balance: ${balance}`);

    // ---- Deduct coins ----
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    if (!args.length) return message.reply(getLang("missing"));

    const text = encodeURIComponent(args.join(" "));

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/pikachu?text=${text}`, {
        responseType: "arraybuffer"
      });

      const filePath = path.join(__dirname, "cache", `pikachu_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      message.reply({
        body: `⚡ Nyaa~ Here's your Pikachu image!\n💸 Coins deducted: ${COST}\n💳 Remaining: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));
    } catch (err) {
      console.error(err);
      message.reply(getLang("error"));
    }
  }
};
