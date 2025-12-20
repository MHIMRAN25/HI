const axios = require("axios");
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "wholesome",
    aliases: ["ws"],
    version: "2.0",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortdescription: "wholesome",
    longDescription: "wholesome avatar for crush/lover",
    category: "fun",
    guide: ""
  },

  onStart: async function ({ api, event, args, message, usersData }) {

    const COST = 500;
    const sender = event.senderID;

    // ==== Balance check ====
    let user = await usersData.get(sender);
    let balance = user?.money || 0;

    if (balance < COST) {
      return message.reply(
        `🌸 Senpai… you need **${COST} coins**!\n💰 Your balance: ${balance} coins`
      );
    }

    // Deduct coins
    await usersData.set(sender, { ...user, money: balance - COST });
    const remaining = balance - COST;

    let target;
    let targetName;

    // ====== RANDOM MODE (gender logic) ======
    if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const all = threadInfo.userInfo;

      // get sender gender
      let gender1;
      for (const u of all) if (u.id == sender) gender1 = u.gender;

      const botID = api.getCurrentUserID();
      let candidates = [];

      for (const u of all) {
        if (u.id !== sender && u.id !== botID) {
          if (gender1 === "MALE" && u.gender === "FEMALE") candidates.push(u.id);
          else if (gender1 === "FEMALE" && u.gender === "MALE") candidates.push(u.id);
          else if (!gender1 || gender1 === "UNKNOWN") candidates.push(u.id);
        }
      }

      if (candidates.length === 0)
        return message.reply("❌ No suitable person found!");

      target = candidates[Math.floor(Math.random() * candidates.length)];
      targetName = await usersData.getName(target);
    }

    // ====== TAG MODE ======
    else if (Object.keys(event.mentions)?.length > 0) {
      target = Object.keys(event.mentions)[0];
      targetName = event.mentions[target];
    }

    // ====== REPLY MODE ======
    else if (event.type === "message_reply") {
      target = event.messageReply.senderID;
      targetName = await usersData.getName(target);
    }

    // ====== If nothing selected ======
    else {
      return message.reply("Tag someone or use random mode (r).");
    }

    // Self-block
    if (target === sender)
      return message.reply("Ara ara~ You can't wholesome yourself (>///<)");

    try {
      const imagePath = await createImage(target);

      const replyLines = [
        `Nyaa~ ${targetName} looks so cute in this wholesome vibe! 💗`,
        `${targetName} got a wholesome blessing~ ✨`,
        `Sugoiii~ wholesome mode activated for ${targetName}! ❤️`,
        `${targetName} received pure wholesome energy! 🌸`,
        `Aww~ ${targetName} deserves this wholesome moment 💕`
      ];

      const msg = replyLines[Math.floor(Math.random() * replyLines.length)];

      await message.reply({
        body: `${msg}\n\n💸 500 coins deducted!\n💳 Remaining: ${remaining} coins`,
        attachment: fs.createReadStream(imagePath)
      });

      fs.unlinkSync(imagePath);

    } catch (err) {
      console.log(err);
      message.reply("Uwuu~ Something went wrong!");
    }
  }
};

// ===== IMAGE FUNCTION =====
async function createImage(uid) {
  const avatar = await jimp.read(
    `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );

  const base = await jimp.read("https://i.imgur.com/BnWiVXT.jpg");
  base.resize(512, 512).composite(avatar.resize(173, 173), 70, 186);

  const out = `wholesome_${uid}.png`;
  await base.writeAsync(out);
  return out;
}
