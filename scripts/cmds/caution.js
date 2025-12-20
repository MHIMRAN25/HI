const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "caution",
    version: "1.2",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Create a caution image with coins & anime style",
    longDescription: "Generates a caution meme with custom text, coin deduction, and anime flavor",
    category: "fun",
    guide: {
      en: "{p}caution <text>\nExample: {p}caution Be careful!"
    }
  },

  onStart: async function({ message, args, usersData, api, event }) {
    const COST = 500;
    const senderID = event.senderID;

    if (!args.length) return message.reply("❌ | Please provide text for the caution image, baka~");

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`🌸 Senpai… you need **${COST} coins**!\n💰 Your balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    const text = encodeURIComponent(args.join(" "));

    // ---- Countdown ----
    let countdownMsg = await message.reply(`⏳ Generating caution image in 3 seconds… nyaa~`);
    for (let i = 2; i > 0; i--) {
      await new Promise(res => setTimeout(res, 1000));
      await api.editMessage(`⏳ Generating caution image in ${i} seconds… baka!`, countdownMsg.messageID);
    }
    await new Promise(res => setTimeout(res, 1000));
    await api.editMessage("⚠️ Creating caution image now… senpai noticed! ✨", countdownMsg.messageID);

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/caution?text=${text}`, { responseType: "arraybuffer" });

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `caution_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      // ---- Anime-style final message ----
      const animeReplies = [
        `Nyaa~ caution image ready for you, senpai! ⚠️`,
        `Baka! Here's your warning, don't ignore it! 💥`,
        `Sugoi~ caution generated successfully ✨`,
        `Ara ara… careful now senpai~ 💫`,
        `Senpai, your caution image is complete! ⚡`
      ];
      const finalReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      await message.reply({
        body: `${finalReply}\n💸 Deducted: ${COST} coins\n💳 Remaining: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      return message.reply("❌ | Failed to generate caution image… baka!");
    }
  }
};
