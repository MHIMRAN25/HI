const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "meme",
    aliases: ["funnymeme", "memepic"],
    version: "1.1",
    author: "Saif",
    role: 0,
    category: "fun",
    shortDescription: { en: "Sends a random meme image 💸" },
    guide: { en: "{pn} [search term]" }
  },

  onStart: async function({ api, event, args, usersData }) {
    const COST = 500; // coins to use this command
    const senderID = event.senderID;

    // 1️⃣ Check user balance
    const userData = await usersData.get(senderID) || {};
    const money = userData.money || 0;
    if (money < COST) return api.sendMessage(`💸 Baka! You need ${COST} coins to get a meme 😅\nYour balance: ${money}`, event.threadID);

    // Deduct coins
    await usersData.set(senderID, { ...userData, money: money - COST });
    const remaining = money - COST;

    try {
      // 2️⃣ Get meme
      let url = "https://api.imgflip.com/get_memes";
      let memeText = "";
      if (args.length > 0) {
        memeText = args.join(" ");
        // Example: use caption_image API if you want
        url = `https://api.imgflip.com/caption_image?template_id=181913649&text0=${encodeURIComponent(memeText)}`;
      }

      const response = await axios.get(url);
      if (response.status !== 200 || !response.data || !response.data.success) {
        throw new Error("Invalid API response");
      }

      let imageURL;
      if (args.length > 0) {
        imageURL = response.data.data.url;
      } else {
        const memes = response.data.data.memes;
        const meme = memes[Math.floor(Math.random() * memes.length)];
        imageURL = meme.url;
      }

      // 3️⃣ Download image to temp
      const tmpDir = path.join(__dirname, "cache");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `meme_${Date.now()}.jpg`);
      const imgRes = await axios.get(imageURL, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(imgRes.data));

      // 4️⃣ Anime-style text lines
      const animeLines = [
        `Nyaa~ Senpai shared a meme! 😸`,
        `Baka! ${money} coins spent for this meme 💥`,
        `Ara ara~ Look at this meme baka! 😂`,
        `Senpai noticed your meme request 💫`,
        `Nya~ Enjoy your meme, baka! 💌`
      ];
      const finalLine = animeLines[Math.floor(Math.random() * animeLines.length)];

      // 5️⃣ Send meme with attachment
      await api.sendMessage({
        body: `${finalLine}\n💳 Coins deducted: ${COST}\n💰 Remaining: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error("MEME CMD ERROR:", err.stack || err.message);
      api.sendMessage("Oops! Something went wrong fetching the meme 😅", event.threadID);
    }
  }
};
