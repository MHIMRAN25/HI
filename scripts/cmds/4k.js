const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "4k",
    version: "2.1",
    role: 0,
    author: "Saif",
    countDown: 5,
    longDescription: "Upscale images to 4K resolution!! ",
    category: "image",
    guide: {
      en: "{pn} reply to an image to upscale it (default: type=2, level=low)."
    }
  },

  onStart: async function ({ message, event, args }) {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("⚠ Please reply to an image to upscale it.");
    }

    const originalUrl = event.messageReply.attachments[0].url;
    const type = args[0] && !isNaN(args[0]) ? args[0] : 2; // default method 2
    const level = args[1] && ["low", "medium", "high"].includes(args[1].toLowerCase()) ? args[1].toLowerCase() : "low";

    const apiUrl = `https://arychauhann.onrender.com/api/ihancer?url=${encodeURIComponent(originalUrl)}&type=${type}&level=${level}`;

    message.reply("🔄 Processing your image with iHancer AI... Please wait.", async (err, info) => {
      try {
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        const filePath = path.join(__dirname, `ihancer_${Date.now()}.png`);
        fs.writeFileSync(filePath, Buffer.from(response.data));

        await message.reply({
          body: `✅ Here is your enhanced image (type=${type}, level=${level})`,
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);

        message.unsend(info.messageID);
      } catch (error) {
        console.error("4k.onStart error:", error?.response?.data || error.message);
        message.reply("❌ There was an error processing your image. Please try again later.");
      }
    });
  }
};
