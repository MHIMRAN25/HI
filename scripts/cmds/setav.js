const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "setav",
    version: "1.0",
    author: "SAIF",
    countDown: 5,
    role: 2, // admin only
    shortDescription: "Change bot's profile picture",
    longDescription: "Change the bot ID's profile picture using a photo reply or image URL.",
    category: "admin",
    guide: "Reply to a photo or use an image URL"
  },

  onStart: async function ({ api, event, args }) {
    let imageUrl;
    const threadID = event.threadID;
    const messageID = event.messageID;

    // If user replied to a photo
    if (event.type === "message_reply" && event.messageReply.attachments.length > 0) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === "photo") {
        imageUrl = attachment.url;
      }
    }

    // Or direct image URL provided
    if (args[0] && args[0].startsWith("http")) {
      imageUrl = args[0];
    }

    if (!imageUrl) {
      return api.sendMessage("📸 Reply to a photo or give a direct image URL.", threadID, messageID);
    }

    try {
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, "avatar.jpg");
      fs.writeFileSync(filePath, res.data);

      await api.changeAvatar(fs.createReadStream(filePath));
      api.sendMessage("✅ Bot-er profile picture successfully changed!", threadID, messageID);
      fs.unlinkSync(filePath); // cleanup
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Profile pic change failed.", threadID, messageID);
    }
  }
};
