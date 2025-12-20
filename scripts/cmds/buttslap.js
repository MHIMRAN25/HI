const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "buttslap",
    aliases: ["spank", "slapbutt"],
    version: "4.5",
    author: "Saif",
    countDown: 3,
    role: 0,
    shortDescription: "Anime-style buttslap with coins",
    category: "fun",
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    try {
      const COST = 500;
      const sender = event.senderID;

      // ==== Check balance ====
      let user = await usersData.get(sender);
      let balance = user.money || 0;
      if (balance < COST) {
        return api.sendMessage(
          `🌸 Senpai… you need **${COST} coins** to use this!  
💰 Your balance: ${balance} coins`,
          event.threadID, event.messageID
        );
      }

      // Deduct coins
      await usersData.set(sender, { ...user, money: balance - COST });
      const remaining = balance - COST;

      // ==== Determine target ====
      let target;
      let targetName;

      // --- Random mode ---
      if (["r", "rnd", "random"].includes(args[0]?.toLowerCase())) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        let candidates = threadInfo.participantIDs.filter(id => id !== sender && id !== api.getCurrentUserID());
        if (candidates.length === 0) return api.sendMessage("Nyaa~ No one to slap!", event.threadID);
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
      // --- All-time last sender fallback ---
      else {
        const threadInfo = await api.getThreadInfo(event.threadID);
        let messages = await api.getThreadMessages(event.threadID, 50); // fetch last 50 messages
        for (let msg of messages) {
          if (msg.senderID !== sender && msg.senderID !== api.getCurrentUserID()) {
            target = msg.senderID;
            targetName = await usersData.getName(target);
            break;
          }
        }

        if (!target) return api.sendMessage("Nyaa~ No one to slap!", event.threadID);
      }

      if (target === sender) return api.sendMessage("Ara ara… you can't slap yourself! baka~ (>///<)", event.threadID);

      // ==== Get avatar URLs ====
      const avatarSender = await usersData.getAvatarUrl(sender);
      const avatarTarget = await usersData.getAvatarUrl(target);

      // ==== Generate image ====
      const img = await new DIG.Spank().getImage(avatarSender, avatarTarget);

      // TMP path
      const tmpPath = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);
      const filePath = path.join(tmpPath, `${sender}_${target}_slap.png`);
      fs.writeFileSync(filePath, Buffer.from(img));

      // ==== Anime-style replies ====
      const senderName = await usersData.getName(sender);

      const animeReplies = [
        `Nyaa~ ${senderName}-kun just slapped ${targetName}! ✨`,
        `${targetName}-san took a super effective senpai slap! 💥`,
        `Baka! ${targetName} got smacked by ${senderName}-chan 😼`,
        `Sugoiii~ ${senderName} used SLAP! ${targetName} is stunned! ⚡`,
        `${targetName}-kun didn’t dodge… *SLAPPPP!* 💫`,
        `Ara ara~ ${senderName} delivered a spicy slap to ${targetName}! 🔥`
      ];

      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      // ==== Send message with attachment & remaining balance ====
      await api.sendMessage({
        body: `${chosenReply}\n\n💸 500 coins deducted!\n💳 Remaining: ${remaining} coins`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.log(err);
      return api.sendMessage("Uwuuu~ Something went wrong (>_<)💦", event.threadID);
    }
  }
};
