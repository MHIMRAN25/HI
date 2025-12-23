const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "slap",
    version: "3.5",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Batslap image with coins",
    longDescription: "Create Batslap meme with tagged, replied or random user",
    category: "fun",
    guide: {
      en: "{pn} @tag\n{pn} r | rnd | random | rndm\nOr reply to a user's message"
    }
  },

  langs: {
    en: {
      noTarget: "You must tag, reply, or use random to choose someone 😼",
      activating: "👊 Activating random slap mode...",
      lowBalance: "🌸 Senpai… you need **500 coins** to slap! 💰 Your balance: "
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang, api }) {
    try {
      const COST = 500;
      const senderID = event.senderID;

      /* ===== Balance check ===== */
      const user = (await usersData.get(senderID)) || { money: 0 };
      if (user.money < COST)
        return message.reply(`${getLang("lowBalance")}${user.money} coins`);

      /* ===== Target detection ===== */
      let targetID = null;
      const content = args.join(" ").trim();

      // Reply
      if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      }
      // Mention
      else if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // Random
      else if (/^(r|rnd|random|rndm)$/i.test(content)) {
        await message.reply(getLang("activating"));

        let info;
        try {
          info = await api.getThreadInfo(event.threadID);
        } catch {
          return message.reply("⚠️ Cannot read group members here.");
        }

        const members = (info.participantIDs || []).filter(
          id => id !== senderID && id !== api.getCurrentUserID()
        );
        if (!members.length)
          return message.reply("Nyaa~ No one available to slap!");

        targetID = members[Math.floor(Math.random() * members.length)];
      }

      if (!targetID) return message.reply(getLang("noTarget"));
      if (targetID === senderID)
        return message.reply("Ara ara… you can't slap yourself! baka~ (>///<)");

      /* ===== Deduct coins AFTER target confirmed ===== */
      await usersData.set(senderID, { ...user, money: user.money - COST });
      const remaining = user.money - COST;

      /* ===== Prepare tmp folder ===== */
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      /* ===== Facebook avatar → BUFFER ===== */
      let avatar1, avatar2;
      try {
        avatar1 = await getFbAvatarBuffer(senderID);
        avatar2 = await getFbAvatarBuffer(targetID);
      } catch (err) {
        await usersData.set(senderID, { ...user, money: user.money }); // refund
        return message.reply("❌ Failed to load avatars. Coins refunded.");
      }

      /* ===== Generate image ===== */
      let img;
      try {
        img = await new DIG.Batslap().getImage(avatar1, avatar2);
      } catch (err) {
        await usersData.set(senderID, { ...user, money: user.money }); // refund
        return message.reply("❌ Image generation failed. Coins refunded.");
      }

      const filePath = path.join(tmpDir, `${senderID}_${targetID}_batslap.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      /* ===== Names ===== */
      let senderName = "Senpai";
      let targetName = "Baka";
      try { senderName = await usersData.getName(senderID); } catch {}
      try { targetName = await usersData.getName(targetID); } catch {}

      /* ===== Sender-POV replies ===== */
      const animeReplies = [
        `Nyaa~ I just slapped ${targetName}! ✨`,
        `Hehe~ I smashed ${targetName} with a batslap 😼`,
        `Baka! I used BATSLAAP on ${targetName}! 💥`,
        `Sugoi~ My slap landed perfectly on ${targetName}! ⚡`
      ];
      const reply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      /* ===== Send ===== */
      return message.reply(
        {
          body: `${reply}\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
          attachment: fs.createReadStream(filePath)
        },
        () => {
          try { fs.unlinkSync(filePath); } catch {}
        }
      );

    } catch (err) {
      console.error("SLAP COMMAND ERROR:", err);
      return message.reply("Uwuuu~ Something went wrong (>_<)💦");
    }
  }
};

/* ========= Helper ========= */
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
