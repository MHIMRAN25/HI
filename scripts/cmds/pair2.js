const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pair2",
    version: "1.7",
    author: "MahMUD",
    category: "love",
    guide: "{prefix}pair"
  },

  onStart: async function ({ event, threadsData, message, usersData, api }) {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.\n", event.threadID, event.messageID);
    }

    try {
      const uidI = event.senderID;
      const name1 = await usersData.getName(uidI);
      const avatarUrl1 = (typeof usersData.getAvatarUrl === "function") ? await usersData.getAvatarUrl(uidI) : null;
      const threadData = await threadsData.get(event.threadID);
      if (!threadData || !Array.isArray(threadData.members)) return api.sendMessage("❌ Could not fetch thread members.", event.threadID, event.messageID);

      const senderInfo = threadData.members.find(mem => (mem.userID == uidI || mem.id == uidI));
      const gender1 = senderInfo?.gender;
      if (!gender1 || (gender1 !== "MALE" && gender1 !== "FEMALE")) return api.sendMessage("❌ Couldn't determine your gender. Please update your profile.", event.threadID, event.messageID);

      const oppositeGender = gender1 === "MALE" ? "FEMALE" : "MALE";
      const candidates = threadData.members.filter(member => {
        const memGender = member.gender;
        const memId = member.userID ?? member.id;
        const inGroup = ("inGroup" in member) ? !!member.inGroup : true;
        return memGender === oppositeGender && inGroup && memId != uidI;
      });

      if (candidates.length === 0) return api.sendMessage(`❌ No ${oppositeGender.toLowerCase()} members found in this group.`, event.threadID, event.messageID);

      const matched = candidates[Math.floor(Math.random() * candidates.length)];
      const matchedId = matched.userID ?? matched.id;
      const name2 = await usersData.getName(matchedId);
      const avatarUrl2 = (typeof usersData.getAvatarUrl === "function") ? await usersData.getAvatarUrl(matchedId) : null;

      const lovePercent = Math.floor(Math.random() * 36) + 65;
      const compatibility = Math.floor(Math.random() * 36) + 65;

      function toBoldUnicode(name) {
        const boldAlphabet = {
          "a": "𝐚","b": "𝐛","c": "𝐜","d": "𝐝","e": "𝐞","f": "𝐟","g": "𝐠","h": "𝐡","i": "𝐢","j": "𝐣",
          "k": "𝐤","l": "𝐥","m": "𝐦","n": "𝐧","o": "𝐨","p": "𝐩","q": "𝐪","r": "𝐫","s": "𝐬","t": "𝐭",
          "u": "𝐮","v": "𝐯","w": "𝐰","x": "𝐱","y": "𝐲","z": "𝐳","A": "𝐀","B": "𝐁","C": "𝐂","D": "𝐃",
          "E": "𝐄","F": "𝐅","G": "𝐆","H": "𝐇","I": "𝐈","J": "𝐉","K": "𝐊","L": "𝐋","M": "𝐌","N": "𝐍",
          "O": "𝐎","P": "𝐏","Q": "𝐐","R": "𝐑","S": "𝐒","T": "𝐓","U": "𝐔","V": "𝐕","W": "𝐖","X": "𝐗",
          "Y": "𝐘","Z": "𝐙","0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
          " ":" ","'":"'"," ,":",",".":".","-":"-","!":"!","?":"?"
        };
        return String(name || "").split('').map(char => boldAlphabet[char] || char).join('');
      }

      const styledName1 = toBoldUnicode(name1 || "Unknown");
      const styledName2 = toBoldUnicode(name2 || "Unknown");

      const styledMessage = `
💖✨ 𝗡𝗲𝘄 𝗣𝗮𝗶𝗿 𝗔𝗹𝗲𝗿𝘁! ✨💖

🎉 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞, 𝐥𝐞𝐭'𝐬 𝐜𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐞 𝐨𝐮𝐫 𝐥𝐨𝐯𝐞𝐥𝐲 𝐧𝐞𝐰 𝐜𝐨𝐮𝐩𝐥𝐞

• ${styledName1}  
• ${styledName2}

❤  𝐋𝐨𝐯𝐞 𝐏𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: ${lovePercent}%  
🌟 𝐂𝐨𝐦𝐩𝐚𝐭𝐢𝐛𝐢𝐥𝐢𝐭𝐲: ${compatibility}%

💍 𝐌𝐚𝐲 𝐲𝐨𝐮𝐫 𝐥𝐨𝐯𝐞 𝐛𝐥𝐨𝐨𝐦 𝐟𝐨𝐫𝐞𝐯𝐞𝐫`;

      const attachments = [];
      try {
        if (avatarUrl1) {
          const s1 = await getStreamFromURL(avatarUrl1).catch(() => null);
          if (s1) attachments.push(s1);
        }
        if (avatarUrl2) {
          const s2 = await getStreamFromURL(avatarUrl2).catch(() => null);
          if (s2) attachments.push(s2);
        }
      } catch {}

      if (attachments.length > 0)
        return api.sendMessage({ body: styledMessage, attachment: attachments }, event.threadID, event.messageID);
      else
        return api.sendMessage(styledMessage, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ An unexpected error occurred.", event.threadID, event.messageID);
    }
  }
};
