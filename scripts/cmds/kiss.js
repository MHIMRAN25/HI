const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss",
    version: "7.0",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Send a kiss image 💋",
    longDescription: "Random, reply or mention kiss with correct gender orientation and anime lines",
    category: "love",
    guide: "{pn} [@tag/reply/rnd]"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const senderID = event.senderID;
    const mention = Object.keys(event.mentions || {});
    let receiverID;

    // 1️⃣ Determine receiver
    if (args[0] && ["rnd", "random", "r"].includes(args[0].toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      let allMembers = (threadInfo.userInfo || []).filter(u => u.id != senderID);
      if (!allMembers.length) return message.reply("No one found to kiss 😅");
      const pick = allMembers[Math.floor(Math.random() * allMembers.length)];
      receiverID = pick.id;
    } 
    else if (event.type === "message_reply") {
      receiverID = event.messageReply.senderID;
    } 
    else if (mention.length === 1) {
      receiverID = mention[0];
    } 
    else {
      return message.reply("Please reply, mention or use 'rnd' to kiss someone 😘");
    }

    // 2️⃣ Get user data safely
    const senderName = (await safeGetName(usersData, senderID)) || "Someone";
    const receiverName = (await safeGetName(usersData, receiverID)) || "Someone";

    const senderGender = String((await safeGet(usersData, senderID)).gender || "male").toLowerCase();
    const receiverGender = String((await safeGet(usersData, receiverID)).gender || "female").toLowerCase();

    // 3️⃣ Countdown 3 → 2 → 1
    let msg = await message.reply("⏳ Kissing in 3…");
    await wait(1000); await api.editMessage("⏳ Kissing in 2…", msg.messageID);
    await wait(1000); await api.editMessage("⏳ Kissing in 1…", msg.messageID);
    await wait(1000); await api.editMessage("💋 Sending kiss…", msg.messageID);

    // 4️⃣ Get avatars safely
    const fallbackAvatar = "https://i.imgur.com/AfFp7pu.png";
    const avatarSender = (await safeGetAvatarUrl(usersData, senderID)) || fallbackAvatar;
    const avatarReceiver = (await safeGetAvatarUrl(usersData, receiverID)) || fallbackAvatar;

    // 5️⃣ DIG image generation with orientation
    let imgBuffer;
    if (senderGender === "male") {
      imgBuffer = await new DIG.Kiss().getImage(avatarSender, avatarReceiver);
    } else {
      imgBuffer = await new DIG.Kiss().getImage(avatarReceiver, avatarSender);
    }
    if (!imgBuffer) return message.reply("Failed to generate kiss image 😅");

    // 6️⃣ Save & send
    const filePath = path.join(tmpDir, `kiss_${senderID}_${receiverID}.png`);
    fs.writeFileSync(filePath, Buffer.from(imgBuffer));

    // 7️⃣ Random anime-style lines
    const animeLines = [
      `Nyaa~ ${senderName} kissed ${receiverName}! 😘`,
      `${receiverName}-san got a sweet kiss from ${senderName} 💖`,
      `Ara ara… ${senderName}-chan sneaked a kiss on ${receiverName}! ✨`,
      `${senderName} planted a gentle kiss on ${receiverName}'s cheek 💋`,
      `Baka! ${receiverName}-kun can't resist ${senderName}'s charm 😳`
    ];
    const line = animeLines[Math.floor(Math.random() * animeLines.length)];

    message.reply(
      {
        body: line,
        mentions: [
          { tag: `@${senderName}`, id: senderID },
          { tag: `@${receiverName}`, id: receiverID }
        ],
        attachment: fs.createReadStream(filePath)
      },
      () => fs.unlinkSync(filePath)
    );
  }
};

/* ---------- Helper functions ---------- */
async function safeGet(usersData, userId) {
  try {
    if (!usersData || typeof usersData.get !== "function") return {};
    return await usersData.get(userId) || {};
  } catch { return {}; }
}
async function safeGetName(usersData, userId) {
  try {
    if (!usersData || typeof usersData.getName !== "function") return null;
    return await usersData.getName(userId);
  } catch { return null; }
}
async function safeGetAvatarUrl(usersData, userId) {
  try {
    if (!usersData || typeof usersData.getAvatarUrl !== "function") return null;
    return await usersData.getAvatarUrl(userId);
  } catch { return null; }
}
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
