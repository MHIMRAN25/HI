const axios = require("axios");

module.exports = {
  config: {
    name: "pickupline",
    aliases: ["pickup"],
    version: "1.1",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "Get pickup lines",
    longDescription: {
      en: "Get random pickup lines.",
    },
    category: "fun",
    guide: {
      en: "{prefix}pickuplines",
    },
  },

  onStart: async function ({ api, event, usersData }) {
    const COST = 500;
    const senderID = event.senderID;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return api.sendMessage(`❌ Senpai, you need **${COST} coins** to get a pickup line! 💸\nYour balance: ${balance}`, event.threadID);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    // ---- Fetch pickup line ----
    try {
      const response = await axios.get("https://api.popcat.xyz/pickuplines");
      const { pickupline } = response.data;
      const message = `💘 Nyaa~ ${pickupline}\n💸 Coins deducted: ${COST}\n💳 Remaining: ${remaining}`;
      return api.sendMessage(message, event.threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Failed to fetch pickup line!", event.threadID);
    }
  },
};
