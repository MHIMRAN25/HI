const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "rip",
    version: "4.5",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "RIP image with anime-style effects & coins",
    category: "fun",
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 300; // rip cost
      const sender = event.senderID;

      // ==== Balance Check ====
      let user = await usersData.get(sender);
      let balance = user.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `💀 Senpai… RIP use korte **${COST} coins** lagbe!  
💰 Your balance: ${balance} coins`,
          event.threadID,
          event.messageID
        );
      }

      // Deduct coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // ==== Determine Target ====
      let target;
      let targetName;

      // --- Random mode ---
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        let candidates = threadInfo.participantIDs.filter(
          id => id !== sender && id !== api.getCurrentUserID()
        );

        if (candidates.length === 0)
          return api.sendMessage("Nyaa~ RIP korar moto keu nai!", event.threadID);

        target = candidates[Math.floor(Math.random() * candidates.length)];
        targetName = await usersData.getName(target);
      }

      // --- Tag mode ---
      else if (Object.keys(event.mentions)[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      }

      // --- Reply mode ---
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      }

      // --- Last active user (fallback) ---
      else {
        const messages = await api.getThreadMessages(event.threadID, 30);
        for (let msg of messages) {
          if (msg.senderID !== sender && msg.senderID !== api.getCurrentUserID()) {
            target = msg.senderID;
            targetName = await usersData.getName(target);
            break;
          }
        }

        if (!target)
          return api.sendMessage("Ara ara~ RIP korar jonno keu pelam na!", event.threadID);
      }

      if (target === sender)
        return api.sendMessage(
          "Baka! Nijeke RIP korte chao? (>///<)",
          event.threadID
        );

      // ==== Get Avatar ====
      const avatar = await usersData.getAvatarUrl(target);

      // ==== Generate RIP Image ====
      const img = await new DIG.Rip().getImage(avatar);

      const tmp = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
      const filePath = path.join(tmp, `${target}_rip.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // ==== Anime-style replies ====
      const senderName = await usersData.getName(sender);
      const animeReplies = [
        `💀 ${senderName} just sent ${targetName} straight to the grave!`,
        `🪦 ${targetName}-kun… rest in pieces 😭`,
        `😼 ${senderName}-chan made a RIP for ${targetName}!`,
        `⚰️ ${targetName} couldn’t escape their fate…`,
        `🖤 ${senderName} used RIP! It was super effective!`,
        `😈 ${targetName} has been RIP’d by ${senderName}…`
      ];

      const reply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      // ==== Send Message ====
      api.sendMessage(
        {
          body: `${reply}\n\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );

    } catch (e) {
      console.log(e);
      api.sendMessage("Uwuuu~ something went wrong (>_<)💦", event.threadID);
    }
  },
};
