const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "kiss",
    version: "7.1",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Send a kiss image 💋",
    longDescription: "Random, reply or mention kiss with correct gender orientation and anime-style lines",
    category: "love",
    guide: "{pn} [@tag/reply/rnd]"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const senderID = event.senderID;
    const mention = Object.keys(event.mentions || {});
    let receiverID;

    /* 1️⃣ Determine receiver */
    if (args[0] && ["rnd", "random", "r"].includes(args[0].toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = (threadInfo.userInfo || []).filter(u => u.id !== senderID);
      if (!members.length) return message.reply("No one found to kiss 😅");
      receiverID = members[Math.floor(Math.random() * members.length)].id;
    } 
    else if (event.type === "message_reply") {
      receiverID = event.messageReply.senderID;
    } 
    else if (mention.length === 1) {
      receiverID = mention[0];
    } 
    else {
      return message.reply("Please reply, mention, or use `rnd`");
    }

    /* 2️⃣ Get names & genders */
    const senderName = (await safeGetName(usersData, senderID)) || "Someone";
    const receiverName = (await safeGetName(usersData, receiverID)) || "Someone";

    const senderGender = String((await safeGet(usersData, senderID)).gender || "male").toLowerCase();
    const receiverGender = String((await safeGet(usersData, receiverID)).gender || "female").toLowerCase();

    /* 3️⃣ Countdown */
    let msg = await message.reply("⏳ Kissing in 3…");
    await wait(1000); await api.editMessage("⏳ Kissing in 2…", msg.messageID);
    await wait(1000); await api.editMessage("⏳ Kissing in 1…", msg.messageID);
    await wait(1000); await api.editMessage("💋 Sending kiss…", msg.messageID);

    /* 4️⃣ Facebook avatar → BUFFER */
    let avatarSender, avatarReceiver;
    try {
      avatarSender = await getFbAvatarBuffer(senderID);
      avatarReceiver = await getFbAvatarBuffer(receiverID);
    } catch {
      return message.reply("Failed to load profile pictures");
    }

    /* 5️⃣ Generate image */
    let imgBuffer;
    if (senderGender === "male") {
      imgBuffer = await new DIG.Kiss().getImage(avatarSender, avatarReceiver);
    } else {
      imgBuffer = await new DIG.Kiss().getImage(avatarReceiver, avatarSender);
    }

    if (!imgBuffer) return message.reply("Failed to generate kiss image");

    /* 6️⃣ Save image */
    const filePath = path.join(tmpDir, `kiss_${senderID}_${receiverID}.png`);
    fs.writeFileSync(filePath, Buffer.from(imgBuffer));

    /* 7️⃣ Anime-style lines */
    const animeLines = [
      `Nyaa~ ${senderName} kissed ${receiverName}! 😘`,
      `${receiverName}-san received a sweet kiss from ${senderName} 💖`,
      `Ara ara… ${senderName}-chan sneaked a kiss on ${receiverName}! ✨`,
      `${senderName} planted a gentle kiss on ${receiverName}'s cheek 💋`,
      `Baka! ${receiverName}-kun couldn't resist 😳`
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

/* ================= Helper Functions ================= */

async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

async function safeGet(usersData, uid) {
  try {
    if (!usersData || typeof usersData.get !== "function") return {};
    return await usersData.get(uid) || {};
  } catch {
    return {};
  }
}

async function safeGetName(usersData, uid) {
  try {
    if (!usersData || typeof usersData.getName !== "function") return null;
    return await usersData.getName(uid);
  } catch {
    return null;
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
