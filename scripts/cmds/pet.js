const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pet",
    version: "1.1",
    author: "saif",
    countDown: 10,
    role: 0,
    shortDescription: "Add pet paw effect to profile picture",
    description: "Adds a cute pet paw effect to your or mentioned user's profile picture",
    category: "fun",
    guide: "{pn} [@mention | reply | r | rnd | random]\nIf no mention or reply, uses your profile picture."
  },

  onStart: async function({ api, event, message, usersData, args }) {
    const COST = 500; // Cost per use
    const senderID = event.senderID;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`❌ Senpai, you need **${COST} coins** to use this command! 💸\nYour balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    // ---- Determine target ----
    let uid;
    const mention = Object.keys(event.mentions);
    if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
      const allUsers = await api.getThreadInfo(event.threadID)
        .then(res => res.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID()));
      if (!allUsers.length) return message.reply("Nyaa~ No one to add pet paw! 🐾");
      uid = allUsers[Math.floor(Math.random() * allUsers.length)];
    } else if (mention.length > 0) {
      uid = mention[0];
    } else if (event.type === "message_reply" && event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      uid = senderID; // Default to sender
    }

    // ---- Fetch avatar and generate ----
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/pet?image=${encodeURIComponent(avatarURL)}`, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, "cache", `pet_${uid}_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      const senderName = (await usersData.get(senderID)).name || "Senpai";
      const targetName = (await usersData.get(uid)).name || "Bby";

      message.reply({
        body: `🐾 Nyaa~ ${senderName} added a pet paw effect to ${targetName}! 🐰🦋\n💸 Coins deducted: ${COST}\n💳 Remaining: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to generate pet paw image!");
    }
  }
};
