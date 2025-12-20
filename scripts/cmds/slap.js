const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    version: "3.4",
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
      activating: "👊 𝐀𝐜𝐭𝐢𝐯𝐚𝐭𝐢𝐧𝐠 𝐑𝐚𝐧𝐝𝐨𝐦 𝐒𝐥𝐚𝐩 𝐌𝐨𝐝𝐞...",
      done: "boom  😵‍💫😵",
      lowBalance: "🌸 Senpai… you need **500 coins** to slap! 💰 Your balance: "
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang, api }) {
    try {
      const COST = 500;
      const uid1 = event.senderID;
      const botApi = global.api || api || message.api;

      // load user safely
      let user = (await usersData.get(uid1)) || { money: 0 };
      if (user.money < COST)
        return message.reply(`${getLang("lowBalance")}${user.money} coins`);

      // determine target first (tag / reply / random)
      let uid2 = null;
      const content = args.join(" ").trim();

      // --- Reply mode ---
      if (event.messageReply?.senderID) {
        uid2 = event.messageReply.senderID;
      }
      // --- Mention mode ---
      else if (Object.keys(event.mentions || {}).length > 0) {
        uid2 = Object.keys(event.mentions)[0];
      }
      // --- Random mode ---
      else if (/^(r|rnd|random|rndm)$/i.test(content)) {
        // show activating message and wait
        await message.reply(getLang("activating"));

        // get api object
        if (!botApi) return message.reply("⚠️ Bot API not available for random mode.");

        // fetch thread info safely
        let info = {};
        try {
          info = await botApi.getThreadInfo(event.threadID);
        } catch (err) {
          console.log("getThreadInfo failed:", err);
          return message.reply("Nyaa~ I can't read group members here. Make sure bot has permission.");
        }

        const members = (info.participantIDs || []).filter(id => id !== uid1 && id !== (botApi.getCurrentUserID ? botApi.getCurrentUserID() : null));
        if (!members.length) return message.reply("Nyaa~ No one available to slap!");

        // pick random
        uid2 = members[Math.floor(Math.random() * members.length)];
      }

      if (!uid2) return message.reply(getLang("noTarget"));
      if (uid2 === uid1) return message.reply("Ara ara… you can't slap yourself! baka~ (>///<)");

      // At this point target is confirmed — deduct coins
      await usersData.set(uid1, { ...user, money: user.money - COST });
      const remaining = user.money - COST;

      // Ensure tmp folder exists
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      // Generate image safely (with fallbacks)
      let avatarURL1 = "";
      let avatarURL2 = "";
      try { avatarURL1 = (await usersData.getAvatarUrl(uid1)) || ""; } catch (err) { console.log("avatar1 fetch failed:", err); }
      try { avatarURL2 = (await usersData.getAvatarUrl(uid2)) || ""; } catch (err) { console.log("avatar2 fetch failed:", err); }

      let img;
      try {
        img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
      } catch (err) {
        console.log("DIG.Batslap error:", err);
        // refund user if generation fails
        await usersData.set(uid1, { ...user, money: user.money }); // refund
        return message.reply("Uwuuu~ Image generation failed, coins refunded. Try again later.");
      }

      const pathSave = path.join(tmpDir, `${uid1}_${uid2}_Batslap.png`);
      try {
        fs.writeFileSync(pathSave, Buffer.from(img));
      } catch (err) {
        console.log("writeFileSync failed:", err);
        await usersData.set(uid1, { ...user, money: user.money }); // refund
        return message.reply("Uwuuu~ Could not save image, coins refunded. Try again later.");
      }

      // Anime-style replies
      let senderName = "Senpai";
      let targetName = "Baka";
      try { senderName = (await usersData.getName(uid1)) || senderName; } catch {}
      try { targetName = (await usersData.getName(uid2)) || targetName; } catch {}

      const animeReplies = [
        `Nyaa~ ${senderName}-chan just slapped ${targetName}! ✨`,
        `${targetName}-san got smacked by ${senderName}-kun 😼`,
        `Baka! ${senderName} used BATSLLAP! ${targetName} is stunned! 💫`,
        `Sugoi~ ${senderName}-chan’s slap hits ${targetName}! ⚡`
      ];
      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      // send reply (reply to command message)
      return message.reply({
        body: `${chosenReply}\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
        attachment: fs.createReadStream(pathSave)
      }, () => {
        try { fs.unlinkSync(pathSave); } catch (e) {}
      });

    } catch (err) {
      console.log("SLAP COMMAND ERROR:", err);
      return message.reply("Uwuuu~ Something went wrong (>_<)💦");
    }
  }
};
