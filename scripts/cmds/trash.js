const fs = require("fs");
const path = require("path");
const DIG = require("discord-image-generation");

module.exports = {
  config: {
    name: "trash",
    version: "3.0",
    author: "NIB + Senpai Upgrade",
    countDown: 5,
    role: 0,
    shortDescription: "Trash image (anime style)",
    longDescription: "Trash effect with group-random + balance deduct + reply mode",
    category: "image",
  },

  onStart: async function ({ api, event, message, usersData, args }) {

    const senderID = event.senderID;
    let targetID;

    const randomWords = ["r", "rnd", "random"];

    // ==== RANDOM MODE (Group Members Only) ====
    if (randomWords.includes(args[0]?.toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);

      let members = threadInfo.participantIDs;

      // sender & bot remove
      members = members.filter(id => id !== senderID && id !== api.getCurrentUserID());

      if (members.length === 0) {
        return message.reply("Nyaa~ no one available for trashing 😿");
      }

      targetID = members[Math.floor(Math.random() * members.length)];
    }

    // ==== REPLY MODE ====
    else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }

    // ==== TAG MODE ====
    else if (Object.keys(event.mentions)[0]) {
      targetID = Object.keys(event.mentions)[0];
    }

    // ==== DEFAULT (Self) ====
    else {
      targetID = senderID;
    }

    // ==== COIN SYSTEM ====
    const cost = 500;
    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;

    if (balance < cost) {
      return message.reply(
        `💸 Senpai needs **${cost} coins** but only has **${balance}** 😿`
      );
    }

    await usersData.set(senderID, { money: balance - cost });
    const remaining = balance - cost;

    try {
      const avatar = await usersData.getAvatarUrl(targetID);
      const img = await new DIG.Trash().getImage(avatar);

      const filePath = path.join(__dirname, "tmp", `${targetID}_trash.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      const targetName = await usersData.getName(targetID);

      await message.reply({
        body:
`🗑️✨ **Trash Mode Activated!**
Senpai threw **${targetName}** straight into the trash bin 😼🖤
💰 Coins Deducted: **${cost}**
💳 Remaining Balance: **${remaining}**`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      console.log(err);
      message.reply("Uwu~ could not generate trash image 😿");
    }
  }
};
