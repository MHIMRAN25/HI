const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anya",
    aliases: [],
    author: "kshitiz",
    version: "2.1",
    cooldowns: 5,
    role: 0,
    shortDescription: {
      en: "Japanese Anya text to speech with coins & anime style"
    },
    longDescription: {
      en: "Generate Anya TTS and spend coins"
    },
    category: "anime",
    guide: {
      en: "{p}{n} <text> or reply to a message"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 150; // coins to use command
      const senderID = event.senderID;

      // Check balance
      let user = await usersData.get(senderID);
      let balance = user.money || 0;

      if (balance < COST) {
        return api.sendMessage(
          `🌸 ꜱᴇɴᴘᴀɪ… ʏᴏᴜ ɴᴇᴇᴅ ${COST} ᴄᴏɪɴꜱ! ᴛᴏ ᴜꜱᴇ ᴀɴʏᴀ-ᴄʜᴀɴ!  
💰 ʏᴏᴜʀ ʙᴀʟᴀɴᴄᴇ: ${balance} ᴄᴏɪɴꜱ!`,
          event.threadID, event.messageID
        );
      }

      // Deduct coins
      await usersData.set(senderID, { ...user, money: balance - COST });
      const remaining = balance - COST;

      const { createReadStream, unlinkSync } = fs;
      const { resolve } = path;
      const { threadID, messageID } = event;

      // Determine text input
      let textInput = args.join(" ");
      if (event.type === "message_reply" && event.messageReply.body) {
        textInput = event.messageReply.body;
      }

      if (!textInput) {
        const greetings = ["ᴋᴏɴɪᴄʜɪᴡᴀ ꜱᴇɴᴘᴀɪ~ 💖", "ɴʏᴀᴀ~ ʙᴀᴋᴀ~ 🤫", "ɴʏᴀᴀ~ ʙᴀᴋᴀ~ 😳"];
        return api.sendMessage(greetings[Math.floor(Math.random() * greetings.length)], threadID, messageID);
      }

      const encodedText = encodeURIComponent(textInput);
      const audioPath = resolve(__dirname, 'cache', `${threadID}_${senderID}.wav`);

      // TTS API call
      const audioApi = await axios.get(`https://api.tts.quest/v3/voicevox/synthesis?text=${encodedText}&speaker=3`);
      const audioUrl = audioApi.data.mp3StreamingUrl;

      await global.utils.downloadFile(audioUrl, audioPath);
      const att = createReadStream(audioPath);

      // Anime-style reply with remaining balance
      const animeReplies = [
        `ɴʏᴀᴀ~ ᴀɴʏᴀ-ᴄʜᴀɴ ꜱᴀʏꜱ: "${textInput}" \n💸 ᴄᴏɪɴꜱ! ꜱᴘᴇɴᴅ : ${COST}\n💳 ʀᴇᴍᴀɪɴɪɴɢ: ${remaining} ᴄᴏɪɴꜱ!`,
        `ꜱᴜɢᴏɪ~ ꜱᴇɴᴘᴀɪ! ᴀɴʏᴀ-ᴄʜᴀɴ ᴡʜɪꜱᴘᴇʀꜱ: "${textInput}" 💖\n💸 ${COST} ᴄᴏɪɴꜱ ᴜꜱᴇᴅ, ${remaining} ʟᴇꜰᴛ`,
        `ʙᴀᴋᴀ! ʟɪꜱᴛᴇɴ: "${textInput}" ᴜᴡᴜ \n💰 ᴄᴏɪɴꜱ! ʟᴇꜰᴛ: ${remaining}`,
      ];
      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      api.sendMessage({
        body: chosenReply,
        attachment: att
      }, threadID, () => unlinkSync(audioPath));

    } catch (error) {
      console.error(error);
      api.sendMessage("🥹 ᴜᴡᴜᴜᴜ~ ᴛᴛꜱ ɢᴇɴᴇʀᴀᴛɪᴏɴ ꜰᴀɪʟᴇᴅ!!", event.threadID, event.messageID);
    }
  }
};
