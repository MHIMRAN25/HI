const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

// 🔒 author protection
const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); // MahMUD

module.exports = {
  config: {
    name: "waifugame",
    aliases: ["waifu"],
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn}"
    }
  },

  // ==================== ON REPLY ====================
  onReply: async function ({ api, event, Reply, usersData }) {
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "You are not authorized to change the author name.",
        event.threadID,
        event.messageID
      );
    }

    const { waifu, author, messageID } = Reply;
    const getCoin = 500;
    const getExp = 121;

    if (event.senderID !== author) {
      return api.sendMessage(
        "𝐓𝐡𝐢𝐬 𝐢𝐬 𝐧𝐨𝐭 𝐲𝐨𝐮𝐫 𝐪𝐮𝐢𝐳 𝐛𝐚𝐛𝐲 🐸",
        event.threadID,
        event.messageID
      );
    }

    const reply = String(event.body).trim().toLowerCase();
    const correct = String(waifu).trim().toLowerCase();

    const userData = await usersData.get(event.senderID);

    if (reply === correct) {
      await api.unsendMessage(messageID);
      await usersData.set(event.senderID, {
        money: userData.money + getCoin,
        exp: userData.exp + getExp
      });

      return api.sendMessage(
        `✅ | Correct answer baby\n💰 +${getCoin} coins\n✨ +${getExp} exp`,
        event.threadID,
        event.messageID
      );
    } else {
      await api.unsendMessage(messageID);
      return api.sendMessage(
        `❌ | Wrong Answer\n✅ Correct answer was: ${waifu}`,
        event.threadID,
        event.messageID
      );
    }
  },

  // ==================== ON START ====================
  onStart: async function ({ api, event }) {
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "You are not authorized to change the author name.",
        event.threadID,
        event.messageID
      );
    }

    try {
      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/waifu`);

      let { name, imgurLink } = response.data.waifu;

      // 🔧 name normalize (array / object / string safe)
      let waifuName = name;

      if (Array.isArray(waifuName)) {
        waifuName = waifuName[0];
      }

      if (typeof waifuName === "object") {
        waifuName =
          waifuName.name ||
          waifuName.en ||
          Object.values(waifuName)[0];
      }

      waifuName = String(waifuName);

      const imageStream = await axios({
        url: imgurLink,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      api.sendMessage(
        {
          body: "🎮 A random waifu has appeared!\n💬 Guess the waifu name.",
          attachment: imageStream.data
        },
        event.threadID,
        (err, info) => {
          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            waifu: waifuName
          });

          // ⏳ auto unsend after 40s
          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 40000);
        },
        event.messageID
      );
    } catch (error) {
      console.error("WaifuGame Error:", error);
      api.sendMessage(
        "🥹 Error occurred, contact Admin .",
        event.threadID,
        event.messageID
      );
    }
  }
};
