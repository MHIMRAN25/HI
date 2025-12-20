const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "wanted",
    version: "2.0",
    author: "KSHITIZ + Senpai Upgrade",
    countDown: 3,
    role: 0,
    shortDescription: "Wanted poster with anime-style text",
    longDescription: "",
    category: "fun",
    guide: "{pn} (tag/reply/random)"
  },

  onStart: async function ({ event, message, api, usersData, args }) {

    const COST = 300; // cost
    const sender = event.senderID;

    // ==== CHECK BALANCE ====
    let user = await usersData.get(sender);
    let balance = user.money || 0;

    if (balance < COST) {
      return message.reply(
        `💸 Senpai… you need **${COST} coins**!\n` +
        `💰 Your balance: ${balance} coins`
      );
    }

    // Deduct money
    await usersData.set(sender, { ...user, money: balance - COST });
    const remaining = balance - COST;

    // ==== TARGET SELECTION ====
    let target;

    // random mode
    if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const ids = threadInfo.participantIDs.filter(id => id !== sender && id !== api.getCurrentUserID());
      if (ids.length === 0) return message.reply("No one found for random mode~");

      target = ids[Math.floor(Math.random() * ids.length)];
    }
    // reply
    else if (event.type === "message_reply") {
      target = event.messageReply.senderID;
    }
    // tag
    else if (Object.keys(event.mentions)[0]) {
      target = Object.keys(event.mentions)[0];
    }
    // fallback
    else {
      target = sender;
    }

    // ==== Generate wanted image ====
    let avatar = await usersData.getAvatarUrl(target);
    let img = await new DIG.Wanted().getImage(avatar);

    const pathSave = `${__dirname}/tmp/wanted_${target}.png`;
    fs.writeFileSync(pathSave, Buffer.from(img));

    const targetName = await usersData.getName(target);

    // ==== Anime style text ====
    const animeLines = [
      `⚠️ ${targetName} is now officially **WANTED**!`,
      `🔥 ${targetName} has a bounty on their head!`,
      `🚨 Alert! ${targetName} is the most wanted person!`,
      `💥 ${targetName} has been marked *dangerous*!`,
      `🌪️ ${targetName} just got a WANTED poster!`
    ];

    const replyText =
      `${animeLines[Math.floor(Math.random() * animeLines.length)]}\n\n` +
      `💸 **${COST} coins deducted**\n` +
      `💳 Remaining: **${remaining} coins**`;

    // ==== Send message ====
    return message.reply(
      {
        body: replyText,
        attachment: fs.createReadStream(pathSave)
      },
      () => fs.unlinkSync(pathSave)
    );
  }
};
