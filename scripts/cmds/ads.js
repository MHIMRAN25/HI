const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "ads",
    version: "1.2",
    author: "SAIF",
    countDown: 1,
    role: 0,
    shortDescription: "Advertisement!",
    category: "fun",
    guide: "{pn} [mention|leave blank]",
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      // Determine target: reply > mention > self
      let uid;
      const mention = Object.keys(event.mentions || {});
      if (event.type === "message_reply" && event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      } else if (mention.length > 0) {
        uid = mention[0];
      } else {
        uid = event.senderID;
      }

      // Get avatar via FB token
      const avatarBuf = await getFbAvatarBuffer(uid);

      // Generate ads image
      const imgBuffer = await new DIG.Ad().getImage(avatarBuf);

      // Save temporary image
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `ads_${uid}.png`);
      fs.writeFileSync(filePath, Buffer.from(imgBuffer));

      // Body text
      const body = "Latest Brand In The Market 🥳";

      // Send image as reply
      message.reply({
        body,
        attachment: fs.createReadStream(filePath),
      }, () => {
        try { fs.unlinkSync(filePath); } catch {}
      });

    } catch (err) {
      console.log("ADS COMMAND ERROR:", err);
      message.reply("Something went wrong while generating advertisement image.");
    }
  }
};

// Helper: fetch avatar buffer via Facebook token
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
