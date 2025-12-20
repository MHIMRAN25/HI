const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "info",
    version: "1.0",
    author: "NTKhang",
    countDown: 20,
    role: 0,
    shortDescription: { vi: "", en: "" },
    longDescription: { vi: "", en: "" },
    category: "information",
    guide: { en: "" },
    envConfig: {}
  },

  onStart: async function ({ message }) {
    const authorName = "SAIF";
    const ownAge = "20+";
    const messenger = "https://m.me/61567256940629";
    const authorFB = "https://www.facebook.com/61567256940629";
    const authorNumber = "01823772045";
    const status = "Broken";

    const urls = [
      "https://files.catbox.moe/ree9su.mp4",
      "https://files.catbox.moe/ree9su.mp4",
      "https://files.catbox.moe/ree9su.mp4",
      "https://files.catbox.moe/ree9su.mp4"
    ];
    const link = urls[Math.floor(Math.random() * urls.length)];

    const now = moment().tz('Asia/Jakarta');
    const date = now.format('MMMM Do YYYY');
    const time = now.format('h:mm:ss A');

    const uptime = process.uptime();
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));
    const uptimeString = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;

    message.reply({
      body: `=== Bot and Owner Information ===

Bot Name       : ${global.GoatBot.config.nickNameBot}
Bot Prefix     : ${global.GoatBot.config.prefix}
Owner Name     : ${authorName}
Age            : ${ownAge}
Relationship   : ${status}
WhatsApp       : ${authorNumber}
Facebook       : ${authorFB}
Date           : ${date}
Current Time   : ${time}
Messenger Link : ${messenger}
Bot Uptime     : ${uptimeString}

Telegram       : https://t.me/@S41FUL0
Instagram      : https://www.instagram.com/saiful-404-st
CapCut         : sorry>³
TikTok         : heartless_saif1
YouTube        : unpossible     ===============================`,
      attachment: await global.utils.getStreamFromURL(link)
    });
  },

  onChat: async function ({ event, message }) {
    if (event.body && event.body.toLowerCase() === "info") {
      this.onStart({ message });
    }
  }
};
