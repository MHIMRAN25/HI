const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "trigger",
    version: "4.1",
    author: "Saif + Senpai Upgrade",
    countDown: 3,
    role: 0,
    shortDescription: "Anime-style triggered GIF with coins",
    category: "fun"
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      // Balance check
      let user = await usersData.get(sender);
      let balance = user.money || 0;

      if (balance < COST) {
        return message.reply(
          `🌸 Senpai… you need **${COST} coins** to use this!  
💰 Your balance: ${balance} coins`
        );
      }

      // Deduct coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // Determine target
      let target, targetName;

      // Random mode
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        let candidates = threadInfo.participantIDs.filter(
          id => id !== sender && id !== api.getCurrentUserID()
        );

        if (candidates.length === 0)
          return message.reply("Nyaa~ No one found to trigger 😿");

        target = candidates[Math.floor(Math.random() * candidates.length)];
        targetName = await usersData.getName(target);
      }

      // Tag mode
      else if (Object.keys(event.mentions)[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      }

      // Reply mode
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      }

      // Self mode
      else {
        target = sender;
        targetName = await usersData.getName(sender);
      }

      // Avatar fetch
      const avatar = await usersData.getAvatarUrl(target);

      // Generate image
      const img = await new DIG.Triggered().getImage(avatar);

      const tmpPath = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);

      const filePath = path.join(tmpPath, `${sender}_${target}_trigger.gif`);
      fs.writeFileSync(filePath, Buffer.from(img));

      const senderName = await usersData.getName(sender);

      // Anime replies
      const replies = [
        `Kyaa~ ${senderName}-kun just triggered ${targetName}! 😳🔥`,
        `Ara ara~ ${targetName}-san is shaking after senpai's trigger 😼💥`,
        `Nyaa~ ${targetName} got *ULTRA TRIGGERED* by ${senderName}! ⚡`,
        `${senderName}-kun used Trigger no Jutsu on ${targetName} 💫`,
        `${targetName}-chan couldn't dodge senpai's trigger attack 😳💥`
      ];

      const chosen = replies[Math.floor(Math.random() * replies.length)];

      // Send reply
      await message.reply({
        body: `${chosen}\n\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      console.log(err);
      return message.reply("Uwuuu~ Something went wrong (>_<)💦");
    }
  }
};
