const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "xl",
    version: "1.0",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate images using XL AI" },
    longDescription: { en: "Send a text prompt and the bot will generate an image using the XL AI API." },
    category: "ai",
    guide: { en: "{pn} <prompt>\n\nExample:\n{pn} cute cat sitting on a tree" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0]) return api.sendMessage("❌ Please provide a prompt for XL.", event.threadID, event.messageID);

    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    const prompt = args.join(" ");
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiUrl = `https://uniapis.onrender.com/api/xl?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl, { timeout: 30000 });
      const imageUrl = res.data?.url;

      if (!imageUrl) {
        return api.sendMessage("❌ Failed to generate XL image.", event.threadID, event.messageID);
      }

      const fileRes = await axios.get(imageUrl, { responseType: "stream" });
      const filename = `xl_${Date.now()}.png`;
      const filepath = path.join(CACHE_DIR, filename);
      const writer = fs.createWriteStream(filepath);

      fileRes.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `✨ XL image generated for prompt: "${prompt}"`,
          attachment: fs.createReadStream(filepath)
        }, event.threadID, () => { 
          try { fs.unlinkSync(filepath); } catch {} 
        }, event.messageID);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

      writer.on("error", (err) => {
        console.error("❌ File write error:", err.message);
        api.sendMessage("❌ Error saving the XL image.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("❌ Error generating XL image:", err.message);
      api.sendMessage("❌ Failed to generate XL image.", event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
