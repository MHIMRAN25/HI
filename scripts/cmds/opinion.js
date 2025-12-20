const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "opinion",
    version: "1.1",
    author: "saif",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate opinion meme with custom text"
    },
    category: "fun",
    guide: "{pn} <text> [@mention | r | rnd | random | reply]"
  },

  onStart: async function({ api, event, message, args, usersData }) {
    const COST = 500;
    const senderID = event.senderID;

    // 1️⃣ Check balance
    let data = await usersData.get(senderID);
    let balance = data.money || 0;
    if (balance < COST) return message.reply(`💸 Nyaa~ @${(await getName(senderID, api, usersData))} you need **${COST} coins**, baka! Your balance: ${balance}`);

    await usersData.set(senderID, { ...data, money: balance - COST });
    const remaining = balance - COST;

    // 2️⃣ Determine target user
    let targetID;
    const mentions = Object.keys(event.mentions || {});
    if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const allMembers = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());
      targetID = allMembers[Math.floor(Math.random() * allMembers.length)];
    } else if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    } else if (mentions.length > 0) {
      targetID = mentions[0];
    } else {
      targetID = senderID; // default to self
    }

    if (targetID === senderID) return message.reply("Ara ara~ You can't send an opinion to yourself baka (>///<)");

    const text = encodeURIComponent(args.join(" ").replace(Object.keys(event.mentions || {})[0] || "", ""));

    // 3️⃣ Fetch sender & target names
    const senderName = await getName(senderID, api, usersData);
    const targetName = await getName(targetID, api, usersData);

    // 4️⃣ Generate opinion image
    const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    let res;
    try {
      res = await axios.get(`https://api.popcat.xyz/v2/opinion?image=${encodeURIComponent(avatarURL)}&text=${text}`, {
        responseType: "arraybuffer"
      });
    } catch (err) {
      console.error(err);
      return message.reply("❌ | Failed to generate opinion meme.");
    }

    const filePath = path.join(__dirname, "cache", `opinion_${targetID}_${Date.now()}.png`);
    fs.writeFileSync(filePath, res.data);

    // 5️⃣ Anime style message
    const animeLines = [
      `Nyaa~ @${senderName}-san shared an opinion to @${targetName}-chan! 💫`,
      `Baka! @${senderName}-kun gave their thoughts to @${targetName}-san 📝`,
      `Senpai noticed! @${targetName}-chan got an opinion from @${senderName}-chan 😼`,
      `Ara ara… @${senderName}-senpai commented on @${targetName}-kun nya~ 💌`
    ];
    const line = animeLines[Math.floor(Math.random() * animeLines.length)];

    // 6️⃣ Send message
    message.reply({
      body: `${line}\n\n💸 Deducted: ${COST}\n💳 Remaining: ${remaining}`,
      mentions: [
        { tag: `@${senderName}`, id: senderID },
        { tag: `@${targetName}`, id: targetID }
      ],
      attachment: fs.createReadStream(filePath)
    }, () => fs.unlinkSync(filePath));
  }
};

// Helper function to get user name
async function getName(uid, api, usersData) {
  try {
    const info = await api.getUserInfo([uid]);
    return info[uid]?.name || "Someone";
  } catch {
    return "Someone";
  }
}
