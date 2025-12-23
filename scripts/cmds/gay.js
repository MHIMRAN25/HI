const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gay",
    aliases: ["rainbow", "lgbt", "lesbian", "lsbn"],
    version: "2.2",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Fancy anime-style gay / lesbian detector",
    category: "fun",
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 500;
      const sender = event.senderID;
      const messageID = event.messageID; // <-- reply target

      // ===== Balance Check =====
      const user = await usersData.get(sender);
      const balance = user?.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `🌸 𝘚𝘦𝘯𝘱𝘢𝘪… 𝘠𝘰𝘶 𝘯𝘦𝘦𝘥 ${COST} 𝘤𝘰𝘪𝘯𝘴!\n💰 𝘠𝘰𝘶𝘳 𝘉𝘢𝘭𝘢𝘯𝘤𝘦: ${balance}`,
          event.threadID,
          event.messageID
        );
      }

      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // ===== Target Detect =====
      let target;
      let targetName;

      if (Object.keys(event.mentions)[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      } 
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      } 
      else {
        const info = await api.getThreadInfo(event.threadID);
        const list = info.participantIDs.filter(
          id => id !== sender && id !== api.getCurrentUserID()
        );
        if (!list.length)
          return api.sendMessage("🌈 𝘕𝘺𝘢𝘢~ 𝘕𝘰 𝘰𝘯𝘦 𝘵𝘰 𝘤𝘩𝘦𝘤𝘬!", event.threadID, messageID);

        target = list[Math.floor(Math.random() * list.length)];
        targetName = await usersData.getName(target);
      }

      if (target === sender)
        return api.sendMessage(
          "😳 𝘈𝘳𝘢 𝘢𝘳𝘢~ 𝘠𝘰𝘶 𝘤𝘢𝘯’𝘵 𝘤𝘩𝘦𝘤𝘬 𝘺𝘰𝘶𝘳𝘴𝘦𝘭𝘧!",
          event.threadID,
          messageID
        );

      // ===== Avatar URL =====
      const uid = target;
      const avatar = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // ===== Image API (SAFE) =====
      const apiUrl = `https://some-random-api.com/canvas/gay?avatar=${encodeURIComponent(avatar)}`;
      const img = (await axios.get(apiUrl, { responseType: "arraybuffer" })).data;

      // ===== Save Temp =====
      const tmp = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

      const filePath = path.join(tmp, `${Date.now()}_gay.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // ===== Fancy Reply =====
      const senderName = await usersData.getName(sender);
      const replies = [
        `🌈 𝘕𝘺𝘢𝘢~ ${senderName} 𝘥𝘦𝘵𝘦𝘤𝘵𝘦𝘥 ${targetName} 𝘢𝘴 𝘧𝘶𝘭𝘭 𝘳𝘢𝘪𝘯𝘣𝘰𝘸!`,
        `✨ 𝘈𝘳𝘢 𝘢𝘳𝘢~ ${targetName} 𝘪𝘴 𝘴𝘱𝘢𝘳𝘬𝘭𝘪𝘯𝘨 𝘵𝘰𝘥𝘢𝘺!`,
        `💖 𝘚𝘶𝘨𝘰𝘪𝘪𝘪~ ${targetName} 𝘩𝘢𝘴 𝘳𝘢𝘪𝘯𝘣𝘰𝘸 𝘷𝘪𝘣𝘦𝘴!`,
        `😼 𝘉𝘢𝘬𝘢~ ${targetName} 𝘪𝘴 𝘴𝘩𝘪𝘯𝘪𝘯𝘨 𝘸𝘪𝘵𝘩 𝘭𝘰𝘷𝘦!`
      ];

      const text = replies[Math.floor(Math.random() * replies.length)];

      // ===== Send AS REPLY =====
      await api.sendMessage(
        {
          body: `${text}\n\n💸 𝘊𝘰𝘪𝘯𝘴 𝘥𝘦𝘥𝘶𝘤𝘵𝘦𝘥: ${COST}\n💳 𝘙𝘦𝘮𝘢𝘪𝘯𝘪𝘯𝘨: ${remaining}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        messageID // <--- reply to sender's message
      );

    } catch (err) {
      console.log(err);
      api.sendMessage(
        "💦 𝘜𝘸𝘶𝘶~ 𝘚𝘰𝘮𝘦𝘵𝘩𝘪𝘯𝘨 𝘸𝘦𝘯𝘵 𝘸𝘳𝘰𝘯𝘨!",
        event.threadID,
        event.messageID
      );
    }
  },
};
