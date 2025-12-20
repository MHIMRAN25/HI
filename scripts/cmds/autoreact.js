module.exports = {
  config: {
    name: "autoreact",
    version: "1.0",
    author: "Mesbah++siyam",
    countDown: 5,
    role: 1,
    description: {
      en: "Auto react to all messages"
    },
    category: "box chat",
    guide: {
      en: "{pn} <on/off>"
    }
  },

  langs: {
    en: {
      turnedOn: "✅ Autoreact is now ON in this thread.",
      turnedOff: "❌ Autoreact is now OFF in this thread."
    }
  },
  
  onChat: async function ({ message, event, threadsData }) {
    const isOn = await threadsData.get(event.threadID, "data.autoreact");

    if (!isOn) return;

    const reacts = [
      "🐇","👻","🤭","🥺","😶","😝","🥤","🤓","💔","👄","😾","😒","😏","🤍","🍼",
      "☺️","😴","🤝","😑","🤔","🤯","😦","❤️‍🩹","😇","🗣️","🙆","💌","🔥","💋",
      "😎","🍂","🐤","👀","🌊","🌼","🌻","🌪️","🦋","🍓","⚠️","😻","🥳","😭"
    ];

    const emoji = reacts[Math.floor(Math.random() * reacts.length)];

    return message.reaction(emoji, event.messageID);
  },

  onStart: async function ({ message, event, args, threadsData, getLang }) {

    if (!args[0])
      return message.reply(getLang("error"));

    if (args[0].toLowerCase() === "on") {
      await threadsData.set(event.threadID, true, "data.autoreact");
      return message.reply(getLang("turnedOn"));
    }

    if (args[0].toLowerCase() === "off") {
      await threadsData.set(event.threadID, false, "data.autoreact");
      return message.reply(getLang("turnedOff"));
    }

    return message.SyntaxError();
  }
};
