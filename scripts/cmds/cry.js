const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const cooldowns = {};

module.exports = {
  config: {
    name: "cry",
    version: "1.2",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Make someone cry anime style with coins & cooldown",
    longDescription: "Generates crying image for target, anime style, coin deduction, 20s cooldown",
    category: "fun",
    guide: "{pn}cry [@mention | reply | r | rnd | random]",
  },

  onStart: async function({ event, message, usersData, api, args }) {
    const COST = 500;
    const senderID = event.senderID;
    const now = Date.now();

    // ---- Cooldown ----
    if (cooldowns[senderID] && now - cooldowns[senderID] < 20000) {
      const remaining = Math.ceil((20000 - (now - cooldowns[senderID])) / 1000);
      return message.reply(`⏳ Baka! Wait ${remaining}s before crying again, senpai~`);
    }
    cooldowns[senderID] = now;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`🌸 You need **${COST} coins**! Your balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remainingBalance = balance - COST;

    // ---- Determine target ----
    let uid;
    const mention = Object.keys(event.mentions || {});

    if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());
      if (!participants.length) return message.reply("❌ No one to pick randomly, baka!");
      uid = participants[Math.floor(Math.random() * participants.length)];
    } else if (mention.length > 0) {
      uid = mention[0];
    } else if (event.type === "message_reply" && event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      uid = senderID;
    }

    if (uid === senderID) return message.reply("ara ara~ you can't cry yourself baka (>///<)");

    // ---- Fetch target info ----
    const userInfo = await api.getUserInfo([uid]);
    const nameTarget = Object.values(userInfo)[0].name;

    // ---- Countdown message ----
    const animeWords = ["nyaa~", "baka!", "senpai~", "sugoi!", "ara ara~"];
    let countdownMsg = await message.reply(`⏳ ${nameTarget} will cry in 3 seconds… ${animeWords[Math.floor(Math.random() * animeWords.length)]}`);
    for (let i = 2; i > 0; i--) {
      await new Promise(res => setTimeout(res, 1000));
      const word = animeWords[Math.floor(Math.random() * animeWords.length)];
      await api.editMessage(`⏳ ${nameTarget} will cry in ${i} seconds… ${word}`, countdownMsg.messageID);
    }
    await new Promise(res => setTimeout(res, 1000));
    await api.editMessage(`😭 Making ${nameTarget} cry now… ${animeWords[Math.floor(Math.random() * animeWords.length)]}`, countdownMsg.messageID);

    // ---- Fetch FB avatar as Buffer ----
    const avatarBuffer = await getFbAvatarBuffer(uid);

    // ---- Generate crying image ----
    const imgBuffer = await new DIG.Mikkelsen().getImage(avatarBuffer);
    const tmpDir = path.join(__dirname, "tmp");
    fs.ensureDirSync(tmpDir);
    const tmpFinalPath = path.join(tmpDir, `cry_${uid}_${Date.now()}.png`);
    fs.writeFileSync(tmpFinalPath, Buffer.from(imgBuffer));

    // ---- Final anime-style message ----
    const finalReplies = [
      `Nyaa~ ${nameTarget} is crying! 😢`,
      `Baka! ${nameTarget} made me cry too! 💦`,
      `Senpai~ tears incoming for ${nameTarget}… 😭`,
      `Ara ara… look at ${nameTarget} cry 😿`,
      `Sugoi~ ${nameTarget} crying like a true anime character! 🌸`
    ];
    const finalReply = finalReplies[Math.floor(Math.random() * finalReplies.length)];

    // ---- Send message ----
    await message.reply({
      body: `${finalReply}\n💸 Deducted: ${COST} coins\n💳 Remaining: ${remainingBalance}`,
      mentions: [{ tag: nameTarget, id: uid }],
      attachment: fs.createReadStream(tmpFinalPath)
    }, () => fs.unlinkSync(tmpFinalPath));
  }
};

// ---- Helper to get FB avatar as buffer ----
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
