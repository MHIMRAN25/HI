const Canvas = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "pregnant",
    version: "3.3",
    author: "♡—͟͞͞ᴛꫝ֟፝ؖ۬ᴍɪᴍ ⸙",//Author cannot be changed
    countDown: 5,
    role: 0,
    shortDescription: "Pregnancy meme generator",
    category: "fun",
    guide: {
      en: "{pn} @tag or reply to someone"
    }
  },

  onStart: async function ({ event, message, usersData, api }) {
    let pathSave;
    const { senderID, mentions, messageReply } = event;

    try {
      // Author check logic
      if (this.config.author !== "♡—͟͞͞ᴛꫝ֟፝ؖ۬ᴍɪᴍ ⸙") {
        return message.reply("❌ The author of this command cannot be changed!");
      }

      let uid2;
      if (Object.keys(mentions).length > 0) {
        uid2 = Object.keys(mentions)[0];
      } else if (messageReply) {
        uid2 = messageReply.senderID;
      }

      if (!uid2) return message.reply("⚠️ You must tag or reply to someone!");

      const wait = await message.reply("🏥 𝐃𝐨𝐜𝐭𝐨𝐫 𝐢𝐬 𝐜𝐡𝐞𝐜𝐤𝐢𝐧𝐠 𝐭𝐡𝐞 𝐫𝐞𝐩𝐨𝐫𝐭... 𝐩𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭.");

      const userName = await usersData.getName(uid2);
      
      // Load Background Template
      const templateURL = "https://i.postimg.cc/pTCyMNHq/1000002108-50.jpg";
      const template = await Canvas.loadImage(templateURL);

      // Fetch high-quality Avatar via Axios
      const avatarURL = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=${FB_TOKEN}`;
      const response = await axios.get(avatarURL, { responseType: 'arraybuffer' });
      const avatar = await Canvas.loadImage(Buffer.from(response.data));

      const canvas = Canvas.createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      // Draw Template
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

      // Positioning for Circle Avatar
      const avatarX = 134;
      const avatarY = 152;
      const avatarWidth = 239;
      const avatarHeight = 242;
      const radius = avatarWidth / 2;

      // Draw Circular Avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
      ctx.restore();

      // Ensure tmp folder exists
      const tmpPath = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);
      
      pathSave = path.join(tmpPath, `${uid2}_preg.png`);
      fs.writeFileSync(pathSave, canvas.toBuffer());

      const funnyTexts = [
        `🤰 অভিনন্দন ${userName}, তোমার রিপোর্ট পজিটিভ এসেছে!`,
        `😂 ওহ না… ${userName} এখন মা হতে যাচ্ছে! প্রস্তুত হও…`,
        `😳 ডাক্তার বলছে ${userName} এর টেস্ট রেজাল্ট পজিটিভ! মিষ্টি খাওয়াও!`,
        `🤰 Congratulations ${userName}, your test came out positive! 👶`
      ];

      const finalText = funnyTexts[Math.floor(Math.random() * funnyTexts.length)];

      // Send Result
      await api.unsendMessage(wait.messageID);
      await message.reply({
        body: finalText,
        attachment: fs.createReadStream(pathSave),
        mentions: [{ tag: userName, id: uid2 }]
      });

    } catch (err) {
      console.error("❌ ERROR:", err);
      message.reply("❌ Network error or Invalid link!");
    } finally {
      if (pathSave && fs.existsSync(pathSave)) {
        setTimeout(() => fs.unlinkSync(pathSave), 5000);
      }
    }
  }
};
