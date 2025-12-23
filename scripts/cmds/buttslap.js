const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "buttslap",
    aliases: ["spank", "slapbutt"],
    version: "4.7",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Anime-style buttslap with coins",
    category: "fun",
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      /* ===== Balance check ===== */
      const user = await usersData.get(sender) || {};
      const balance = user.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `🌸 Senpai… you need **${COST} coins** to use this!\n💰 Your balance: ${balance} coins`,
          event.threadID,
          event.messageID
        );
      }

      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      /* ===== Target detection ===== */
      let target, targetName;

      // Random
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const candidates = threadInfo.participantIDs.filter(
          id => id !== sender && id !== api.getCurrentUserID()
        );
        if (!candidates.length)
          return api.sendMessage("Nyaa~ No one to slap!", event.threadID);

        target = candidates[Math.floor(Math.random() * candidates.length)];
        targetName = await usersData.getName(target);
      }
      // Mention
      else if (Object.keys(event.mentions || {})[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      }
      // Reply
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      }
      // Fallback
      else {
        const messages = await api.getThreadMessages(event.threadID, 50);
        for (const msg of messages) {
          if (msg.senderID !== sender && msg.senderID !== api.getCurrentUserID()) {
            target = msg.senderID;
            targetName = await usersData.getName(target);
            break;
          }
        }
        if (!target)
          return api.sendMessage("Nyaa~ No one to slap!", event.threadID);
      }

      if (target === sender)
        return api.sendMessage(
          "Ara ara… you can't slap yourself! baka~ (>///<)",
          event.threadID
        );

      /* ===== FB avatar → buffer ===== */
      const avatarSender = await getFbAvatarBuffer(sender);
      const avatarTarget = await getFbAvatarBuffer(target);

      /* ===== Generate image ===== */
      const img = await new DIG.Spank().getImage(avatarSender, avatarTarget);
      if (!img)
        return api.sendMessage("❌ Failed to generate image", event.threadID);

      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
      const filePath = path.join(tmpDir, `${sender}_${target}_slap.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      /* ===== Sender-POV replies ===== */
      const senderName = await usersData.getName(sender);

      const animeReplies = [
        `Nyaa~ I just slapped ${targetName}! ✨`,
        `Hehe~ I gave ${targetName} a super effective slap! 💥`,
        `Baka! I smacked ${targetName} really hard 😼`,
        `Sugoiii~ I used SLAP on ${targetName}! ⚡`,
        `Ara ara~ I delivered a spicy slap to ${targetName}! 🔥`,
        `Heh~ ${targetName} didn’t dodge my slap 💫`
      ];

      const reply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      /* ===== Send ===== */
      await api.sendMessage(
        {
          body: `${reply}\n\n💸 500 coins deducted!\n💳 Remaining balance: ${remaining} coins`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("Uwuuu~ Something went wrong (>_<)💦", event.threadID);
    }
  }
};

/* ========= Helper ========= */
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
