const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hug",
    aliases: ["hugs"],
    version: "3.0",
    author: "Saif → Upgraded by Mikasa Bby",
    countDown: 3,
    role: 0,
    shortDescription: "Send anime-style hug",
    category: "love",
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 300;
      const sender = event.senderID;

      // ===== BALANCE CHECK =====
      let user = await usersData.get(sender);
      let balance = user.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `🥺 Senpai… you need **${COST} coins** for a warm hug.\n💳 Balance: ${balance} coins`,
          event.threadID,
          event.messageID
        );
      }

      // Deduct and update
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      let target;
      let targetName;

      // ======== RANDOM MODE ========
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const info = await api.getThreadInfo(event.threadID);
        const list = info.participantIDs.filter(
          id => id !== sender && id !== api.getCurrentUserID()
        );
        if (list.length === 0)
          return api.sendMessage("Nyaa~ No one found for random hug!", event.threadID);

        target = list[Math.floor(Math.random() * list.length)];
        targetName = await usersData.getName(target);
      }

      // ======== TAG MODE ========
      else if (Object.keys(event.mentions)[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      }

      // ======== REPLY MODE ========
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      }

      // ======== LAST ACTIVE USER FALLBACK ========
      else {
        const info = await api.getThreadInfo(event.threadID);
        const msgs = await api.getThreadMessages(event.threadID, 40);

        for (let msg of msgs) {
          if (msg.senderID !== sender && msg.senderID !== api.getCurrentUserID()) {
            target = msg.senderID;
            targetName = await usersData.getName(target);
            break;
          }
        }

        if (!target)
          return api.sendMessage("No one available to hug right now~ 💗", event.threadID);
      }

      // Self-block
      if (target === sender)
        return api.sendMessage("Ara ara~ you can't hug yourself b-baka! (>///<)", event.threadID);

      // ======== GET USER NAMES ========
      const senderName = await usersData.getName(sender);

      // ======== FETCH GIF ========
      const res = await axios.get("https://nekos.best/api/v2/hug?amount=1");
      const gifUrl = res.data.results[0].url;
      const gif = await axios.get(gifUrl, { responseType: "arraybuffer" });

      // TEMP PATH
      const filePath = path.join(__dirname, `${sender}_${target}_hug.gif`);
      fs.writeFileSync(filePath, Buffer.from(gif.data));

      // RANDOM REPLIES
      const replies = [
        `💞 ${senderName} hugged ${targetName}!`,
        `🤗 ${senderName} gave a warm hug to ${targetName}!`,
        `✨ ${targetName} received a cozy hug from ${senderName}!`,
        `UwU~ ${senderName} wrapped ${targetName} in a soft hug!`,
        `💗 ${targetName} got hugged tightly by ${senderName}!`,
        `(>///<) ${senderName} hugged ${targetName} gently…`
      ];

      const chosen = replies[Math.floor(Math.random() * replies.length)];

      // SEND
      await api.sendMessage(
        {
          body: `${chosen}\n\n💸 **${COST} coins deducted**\n💳 Remaining: ${remaining}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );

    } catch (e) {
      console.log(e);
      return api.sendMessage("Uwuuu~ something broke while hugging (>_<)💦", event.threadID);
    }
  }
};
