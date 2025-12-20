const axios = require("axios");

const baseApi = async () => {
  const res = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return res.data.mahmud;
};

module.exports = {
  config: {
    name: "blur",
    version: "2.0",
    author: "Saif",
    countDown: 5,
    role: 0,
    category: "image",
    guide: {
      en: "{pn} [reply image / image link] [1–100]"
    }
  },

  onStart: async function ({ api, args, message, event }) {
    try {
      let imageUrl;
      let blurLevel = 50;

      // reply image
      if (
        event.type === "message_reply" &&
        event.messageReply.attachments?.length > 0
      ) {
        imageUrl = event.messageReply.attachments[0].url;
        if (!isNaN(args[0])) {
          const lv = Number(args[0]);
          if (lv < 1 || lv > 100)
            return message.reply("❌ 𝐁𝐋𝐔𝐑 𝐋𝐄𝐕𝐄𝐋 𝐌𝐔𝐒𝐓 𝐁𝐄 𝟏–𝟏𝟎𝟎");
          blurLevel = lv;
        }
      }

      // image link
      else if (args[0]?.startsWith("http")) {
        imageUrl = args[0];
        if (!isNaN(args[1])) {
          const lv = Number(args[1]);
          if (lv < 1 || lv > 100)
            return message.reply("❌ 𝐁𝐋𝐔𝐑 𝐋𝐄𝐕𝐄𝐋 𝐌𝐔𝐒𝐓 𝐁𝐄 𝟏–𝟏𝟎𝟎");
          blurLevel = lv;
        }
      }

      else {
        return message.reply(
          "📸 𝐏𝐋𝐄𝐀𝐒𝐄 𝐑𝐄𝐏𝐋𝐘 𝐓𝐎 𝐀𝐍 𝐈𝐌𝐀𝐆𝐄 𝐎𝐑 𝐏𝐑𝐎𝐕𝐈𝐃𝐄 𝐀 𝐋𝐈𝐍𝐊"
        );
      }

      api.setMessageReaction("🎀", event.messageID, () => {}, true);
      const wait = await message.reply(
        "🎐 𝐌𝐈𝐊𝐀𝐒𝐀 𝐈𝐒 𝐁𝐋𝐔𝐑𝐑𝐈𝐍𝐆 𝐘𝐎𝐔𝐑 𝐈𝐌𝐀𝐆𝐄..."
      );

      const apiUrl = await baseApi();
      const finalUrl = `${apiUrl}/api/blur/mahmud?url=${encodeURIComponent(
        imageUrl
      )}&blurLevel=${blurLevel}`;

      message.unsend(wait.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      message.reply({
        body: `🖼️ 𝐁𝐋𝐔𝐑 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄𝐃\n🎚️ 𝐋𝐄𝐕𝐄𝐋 : ${blurLevel}%\n\n💖 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐌𝐈𝐊𝐀𝐒𝐀`,
        attachment: await global.utils.getStreamFromURL(finalUrl)
      });
    } catch (e) {
      console.error(e);
      message.reply("🥹 𝐄𝐑𝐑𝐎𝐑 | 𝐂𝐎𝐍𝐓𝐀𝐂𝐓 𝐀𝐃𝐌𝐈𝐍");
    }
  }
};
