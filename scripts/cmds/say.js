const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "say",
    version: "1.8",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "media",
    guide: "{pn} <text> (or reply/tag someone)",
  },

  onStart: async function ({ api, message, args, event, usersData }) {
    try {
      const COST = 200; // coin cost
      const senderID = event.senderID;
      let user = await usersData.get(senderID);
      let balance = user.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `🌸 Senpai… you need **${COST} coins** to use this!\n💰 Your balance: ${balance} coins`,
          event.threadID, event.messageID
        );
      }

      // Deduct coins
      await usersData.set(senderID, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // Get text input
      let text = args.join(" ");
      if (event.type === "message_reply" && event.messageReply.body) {
        text = event.messageReply.body;
      }
      if (!text) {
        return message.reply("⚠️ দয়া করে কিছু লিখুন বা একটি মেসেজে রিপ্লাই দিন!");
      }

      // API call
      const baseUrl = await baseApiUrl();
      const response = await axios.get(`${baseUrl}/api/say`, {
        params: { text },
        headers: { "Author": module.exports.config.author },
        responseType: "stream",
      });

      // Anime-style reply messages
      const animeReplies = [
        `Senpai~ ${text} uwu~ ✨`,
        `Baka! Look, Senpai says: "${text}" 😳`,
        `Nyaa~ Senpai whispers: "${text}" 💫`,
        `Sugoi~ ${text} 💖 just for you!`,
      ];
      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      message.reply({
        body: `${chosenReply}\n💸 Coins spent: ${COST}\n💳 Remaining balance: ${remaining} coins`,
        attachment: response.data
      });

    } catch (e) {
      console.error("TTS Error:", e.response?.data || e.message);
      message.reply("🥹 Uwuuu~ TTS generation failed!");
    }
  }
};
