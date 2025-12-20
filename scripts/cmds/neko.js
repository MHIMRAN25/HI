const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "neko",
    version: "1.1",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Send a cute neko girl image 💸" },
    longDescription: { en: "Sends a random cute neko girl image from API with coins system" },
    category: "fun",
    guide: { en: "+neko" }
  },

  onStart: async function({ message, usersData, event }) {
    const COST = 500;
    const senderID = event.senderID;

    // 1️⃣ Money check
    const userData = await usersData.get(senderID) || {};
    const money = userData.money || 0;
    if (money < COST) return message.reply(`💸 Baka! You need ${COST} coins to get a neko 😅\nYour balance: ${money}`);

    // Deduct coins
    await usersData.set(senderID, { ...userData, money: money - COST });
    const remaining = money - COST;

    try {
      // 2️⃣ Fetch neko image
      const res = await axios.get("https://api.waifu.pics/sfw/neko");
      if (!res.data || !res.data.url) throw new Error("Failed to fetch neko image");

      const imgUrl = res.data.url;

      // 3️⃣ Save to temp file
      const tmpDir = path.join(__dirname, "cache");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `neko_${Date.now()}.jpg`);
      const imgData = await axios.get(imgUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(imgData.data));

      // 4️⃣ Anime-style text lines
      const animeLines = [
        `Nyaa~ Senpai, a cute neko appeared! 😸`,
        `Baka! ${money} coins spent for this neko 💥`,
        `Ara ara~ Enjoy your neko, senpai! 🐱`,
        `Senpai noticed your neko request 💫`,
        `Nya~ Look at this neko, baka! 💌`
      ];
      const finalLine = animeLines[Math.floor(Math.random() * animeLines.length)];

      // 5️⃣ Send message
      await message.reply({
        body: `${finalLine}\n💳 Coins deducted: ${COST}\n💰 Remaining: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error("NEKO CMD ERROR:", err.stack || err.message);
      message.reply("Oops! Something went wrong fetching the neko 😅");
    }
  }
};
