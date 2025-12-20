const fs = require("fs");

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "pend", "pe"],
    version: "1.7",
    author: "♡ SAIF ♡",
    countDown: 5,
    role: 1,
    shortDescription: "Handle pending requests kawaii style",
    longDescription: "Approve or reject pending users/groups in fun anime style",
    category: "utility",
  },

  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    if (body.trim().toLowerCase() === "c") {
      try {
        await api.unsendMessage(messageID);
        return api.sendMessage(`❌ Nyaa~ Operation canceled! 🐇`, threadID);
      } catch {
        return;
      }
    }

    const indexes = body.split(/\s+/).map(Number);

    if (isNaN(indexes[0])) {
      return api.sendMessage(`⚠ Baka! Invalid input! Try again 🦋`, threadID);
    }

    let count = 0;

    for (const idx of indexes) {
      if (idx <= 0 || idx > pending.length) continue;
      const group = pending[idx - 1];

      try {
        await api.sendMessage(
          `✅ Sugoi~ Group approved by Senpai! 🐇💌\n✨ Enjoy your new adventure! 🦄`,
          group.threadID
        );

        await api.changeNickname(
          `${global.GoatBot.config.nickNameBot || "🦋SAIF✨"}`,
          group.threadID,
          api.getCurrentUserID()
        );

        count++;
      } catch {
        count++;
      }
    }

    for (const idx of indexes.sort((a, b) => b - a)) {
      if (idx > 0 && idx <= pending.length) {
        pending.splice(idx - 1, 1);
      }
    }

    return api.sendMessage(
      `🎉 Nyaa~ Successfully approved ${count} group(s)/user(s)! 🐇💖`,
      threadID
    );
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;
    const adminBot = global.GoatBot.config.adminBot;

    if (!adminBot.includes(event.senderID)) {
      return api.sendMessage(`⚠ Nyaa~ You have no permission baka! 🐇`, threadID);
    }

    const type = args[0]?.toLowerCase();
    if (!type) {
      return api.sendMessage(`Usage: pending [user/thread/all] 🦋`, threadID);
    }

    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
      if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
      if (type === "all") filteredList = list;

      let msg = "";
      let index = 1;
      for (const single of filteredList) {
        const name =
          single.name || (await usersData.getName(single.threadID)) || "Unknown";
        msg += `[${index}] ${name}\n`;
        index++;
      }

      msg += `\n✨ Reply with the correct number(s) to approve kawaii~ 🐇\n`;
      msg += `❌ Reply with "c" to cancel, senpai 💌`;

      return api.sendMessage(
        `🎀 Pending Groups & Users (${type.toUpperCase()}) List 🎀\n\n${msg}`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            pending: filteredList,
          });
        },
        messageID
      );
    } catch (error) {
      return api.sendMessage(`⚠ Failed to retrieve pending list! Baka 🐇`, threadID);
    }
  },
};
