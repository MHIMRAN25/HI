const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "v2a",
    aliases: ["convert"],
    description: "Convert Video to audio",
    version: "1.3",
    author: "dipto + saif",
    countDown: 20,
    description: {
      en: "Reply to a video"
    },
    category: "media",
    guide: {
      en: "{p}{n}"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    try {

      // ===================== BALANCE SYSTEM =====================
      const COST = 500;
      const sender = event.senderID;

      let user = await usersData.get(sender);
      let balance = user.money || 0;

      if (balance < COST) {
        return message.reply(
          `❌ You need at least ${COST} coins!\n💰 Your balance: ${balance} coins`
        );
      }

      // Deduct the coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;
      // ===========================================================


      if (
        !event.messageReply ||
        !event.messageReply.attachments ||
        event.messageReply.attachments.length === 0
      ) {
        return message.reply("Please reply to a video message to convert it to audio.");
      }

      const dipto = event.messageReply.attachments[0];
      if (dipto.type !== "video") {
        return message.reply("The replied content must be a video.");
      }

      const { data } = await axios.get(dipto.url, {
        method: "GET",
        responseType: "arraybuffer"
      });

      const path = __dirname + `/cache/dvia.m4a`;
      if (!fs.existsSync(__dirname + "/cache")) {
        fs.mkdirSync(__dirname + "/cache");
      }

      fs.writeFileSync(path, Buffer.from(data, "utf-8"));

      const audioReadStream = fs.createReadStream(path);

      api.sendMessage(
        {
          body: `🎧 Video converted to Audio!\n💳 500 coins deducted!\n💰 Remaining: ${remaining} coins`,
          attachment: [audioReadStream]
        },
        event.threadID,
        event.messageID
      );

    } catch (e) {
      console.log(e);
      message.reply(e.message);
    }
  }
};
