const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const cooldowns = {};

module.exports = {
  config: {
    name: "cry",
    version: "2.0",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Make sender cry looking at target DP with coins",
    longDescription: "Sender sees target profile pic and cries. Coins deduction and cooldown included.",
    category: "fun",
    guide: "{pn}cry [@tag | reply | r | rnd | random]",
  },

  onStart: async function({ event, message, usersData, api, args }) {
    try {
      const COST = 500;
      const senderID = event.senderID;
      const now = Date.now();

      // ---- Cooldown 20s ----
      if (cooldowns[senderID] && now - cooldowns[senderID] < 20000) {
        const remaining = Math.ceil((20000 - (now - cooldowns[senderID])) / 1000);
        return message.reply(`⏳ Baka! Wait ${remaining}s before crying again, senpai~`);
      }
      cooldowns[senderID] = now;

      // ---- Check balance ----
      let user = await usersData.get(senderID);
      let balance = user.money || 0;
      if (balance < COST) return message.reply(`🌸 You need ${COST} coins! Your balance: ${balance} coins`);

      await usersData.set(senderID, { ...user, money: balance - COST });
      const remainingBalance = balance - COST;

      // ---- Determine target ----
      let targetID;
      const mentions = Object.keys(event.mentions);

      if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const participants = threadInfo.participantIDs.filter(id => id != senderID);
        if (!participants.length) return message.reply("❌ No one to pick randomly, baka!");
        targetID = participants[Math.floor(Math.random() * participants.length)];
      } else if (mentions.length > 0) {
        targetID = mentions[0];
      } else if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
      } else {
        targetID = senderID;
      }

      // ---- Fetch names ----
      const senderInfo = await api.getUserInfo([senderID]);
      const nameSender = Object.values(senderInfo)[0].name;

      const targetInfo = await api.getUserInfo([targetID]);
      const nameTarget = Object.values(targetInfo)[0].name;

      if (targetID === senderID) return message.reply(`Ara ara… you can't cry at yourself baka (>///<)`);

      // ---- Fetch target avatar ----
      const avatarURL = `https://graph.facebook.com/${targetID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
      const avatarBuffer = Buffer.from(res.data);

      // ---- Generate crying image ----
      const imgBuffer = await new DIG.Mikkelsen().getImage(avatarBuffer);
      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);
      const filePath = path.join(tmpDir, `cry_${targetID}_${Date.now()}.png`);
      fs.writeFileSync(filePath, imgBuffer);

      // ---- RIP style text ----
      const finalReplies = [
        `😢 ${nameSender} is crying after seeing ${nameTarget}'s profile picture…`,
        `💔 ${nameSender} couldn't stop crying after looking at ${nameTarget}'s DP…`,
        `😭 ${nameSender} saw ${nameTarget}'s profile picture and broke down in tears…`,
        `🥀 After seeing ${nameTarget}'s photo, ${nameSender} is crying silently…`,
        `😿 ${nameSender} is crying badly just by looking at ${nameTarget}'s profile picture…`,
      ];
      const chosenReply = finalReplies[Math.floor(Math.random() * finalReplies.length)];

      // ---- Send message ----
      await message.reply({
        body: `${chosenReply}\n💸 Deducted: ${COST} coins\n💳 Remaining: ${remainingBalance}`,
        mentions: [{ tag: nameTarget, id: targetID }],
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      return message.reply("Uwuuu~ Something went wrong (>_<)💦");
    }
  }
};
