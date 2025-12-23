const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "buttslap",
    aliases: ["spank", "slapbutt"],
    version: "4.9",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Anime-style buttslap with coins",
    category: "fun",
  },

  onStart: async function ({ message, event, args, usersData }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      // Balance check
      const user = await usersData.get(sender) || {};
      const balance = user.money || 0;
      if (balance < COST)
        return message.reply(`Senpai… you need ${COST} coins to use this!\nYour balance: ${balance} coins`);

      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // Target detection
      let target, targetName;
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await message.api.getThreadInfo(event.threadID);
        const candidates = threadInfo.participantIDs.filter(id => id !== sender && id !== message.api.getCurrentUserID());
        if (!candidates.length) return message.reply("No one to slap!");
        target = candidates[Math.floor(Math.random() * candidates.length)];
        targetName = await usersData.getName(target);
      } else if (Object.keys(event.mentions || {})[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      } else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      } else {
        target = sender; // fallback self
        targetName = await usersData.getName(sender);
      }

      if (target === sender) return message.reply("You can't slap yourself!");

      // Fetch avatars
      const avatarSender = await getFbAvatarBuffer(sender);
      const avatarTarget = await getFbAvatarBuffer(target);

      // Generate image
      const img = await new DIG.Spank().getImage(avatarSender, avatarTarget);
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
      const filePath = path.join(tmpDir, `${sender}_${target}_slap.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // Anime replies
      const animeReplies = [
        `I just slapped ${targetName}!`,
        `Gave ${targetName} a super effective slap!`,
        `Smacked ${targetName} really hard`,
        `Used SLAP on ${targetName}!`,
        `Delivered a spicy slap to ${targetName}!`,
        `${targetName} didn’t dodge my slap`
      ];
      const reply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      // Send reply to sender
      await message.reply({
        body: `${reply}\n\nCoins deducted: ${COST}\nRemaining balance: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error(err);
      return message.reply("Something went wrong");
    }
  }
};

// Helper: FB avatar buffer
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
