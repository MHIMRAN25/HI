const axios = require("axios");

// Global stats object (বট চলাকালীন ডাটা থাকবে)
if (!global.quizStats) {
  global.quizStats = {};
}

const sessions = new Map();
const cooldowns = new Map();

const QUIZ_URL = "https://raw.githubusercontent.com/SAIFUL-404-ST/quiz-api/main/quizzes.json";

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz", "qzlist", "quizlist"],
    version: "6.5",
    author: "Saif",
    countDown: 5,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} -> Start quiz\n{pn} list -> Show rankings"
    }
  },

  onStart: async function ({ api, event, usersData, args }) {
    const { threadID, messageID, senderID } = event;
    const now = Date.now();

    // 📊 Fixed Ranking List
    if (args[0] === "list" || args[0] === "rank") {
      const entries = Object.entries(global.quizStats);
      if (entries.length === 0) return api.sendMessage("No one has played the quiz yet Baby 🥹", threadID, messageID);

      // Sorting by Won count (Descending)
      entries.sort((a, b) => b[1].won - a[1].won);
      
      let listMsg = "📊 𝑸𝑼𝑰𝒀 𝑹𝑨𝑵𝑲𝑰𝑵𝑮𝑺\n" + "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n";
      
      for (let i = 0; i < Math.min(entries.length, 10); i++) {
        const [uid, st] = entries[i];
        const name = await usersData.getName(uid) || "Baby";
        listMsg += `${i + 1}. ${name} — 🏆 ${st.won} (🎮 ${st.played})\n`;
      }
      return api.sendMessage(listMsg, threadID, messageID);
    }

    // Cooldown Check
    if (cooldowns.has(senderID) && now - cooldowns.get(senderID) < 5000) return;
    cooldowns.set(senderID, now);

    try {
      const res = await axios.get(QUIZ_URL);
      const quizzes = res.data;
      const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const q = randomQuiz.questions[Math.floor(Math.random() * randomQuiz.questions.length)];

      let optionsMsg = "";
      ["a", "b", "c", "d"].forEach(l => {
        if (q.options[l]) optionsMsg += `\n${l.toUpperCase()}. ${q.options[l]}`;
      });

      const quizMsg = `╔═══════════════╗\n      𝑸 𝑼 𝑰 𝒁\n╚═══════════════╝\n\n${q.text}\n${optionsMsg}\n\n𝑹𝒆𝒑𝒍𝒚 → 𝒂𝒏𝒔𝒘𝒆𝒓 <𝒂|𝒃|𝒄|𝒅>`;

      api.sendMessage(quizMsg, threadID, (err, info) => {
        if (err) return;

        sessions.set(senderID, { 
          correctAnswer: q.answer.toLowerCase(), 
          messageID: info.messageID 
        });

        // Initialize user stats in global object
        if (!global.quizStats[senderID]) {
          global.quizStats[senderID] = { played: 0, won: 0 };
        }
        global.quizStats[senderID].played += 1;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          messageID: info.messageID
        });

        // 1 Minute Silent Auto Delete
        setTimeout(() => {
          if (sessions.has(senderID)) {
            api.unsendMessage(info.messageID);
            sessions.delete(senderID);
          }
        }, 60000);
      }, messageID);

    } catch (e) {
      console.error(e);
    }
  },

  onReply: async function ({ event, api, Reply, usersData }) {
    const { senderID, body, threadID, messageID } = event;
    const { author, messageID: quizMsgID } = Reply;

    if (senderID !== author) {
      return api.sendMessage("𝑻𝒉𝒊𝒔 𝒊𝒔 𝒏𝒐𝒕 𝒚𝒐𝒖𝒓 𝒒𝒖𝒊𝒛 𝑩𝒂𝒃𝒚 🐸", threadID, messageID);
    }

    const session = sessions.get(senderID);
    if (!session) return;

    let userAnswer = body.trim().toLowerCase();
    if (userAnswer.startsWith("answer ")) {
      userAnswer = userAnswer.replace("answer ", "").trim();
    }

    // Unsend user reply to keep chat clean
    api.unsendMessage(messageID);
    sessions.delete(senderID);

    if (userAnswer === session.correctAnswer) {
      const rewardCoins = 500;
      const rewardExp = 121;
      
      const userData = await usersData.get(senderID);
      await usersData.set(senderID, { 
        money: (userData.money || 0) + rewardCoins,
        exp: (userData.exp || 0) + rewardExp
      });

      // Update global stats
      if (global.quizStats[senderID]) {
        global.quizStats[senderID].won += 1;
      }

      const successMsg = `𝑩𝒂𝒃𝒚 𝑪𝒐𝒓𝒓𝒆𝒄𝒕 𝒂𝒏𝒔\n✨ 𝒀𝒐𝒖 𝒘𝒐𝒏 ${rewardCoins} 𝒄𝒐𝒊𝒏𝒔 𝒂𝒏𝒅 ${rewardExp} 𝒆𝒙𝒑`;
      return api.editMessage(successMsg, quizMsgID);
    } else {
      const failMsg = `𝑾𝒓𝒐𝒏𝒈 𝒂𝒏𝒔𝒘𝒆𝒓 𝒃𝒂𝒃𝒚 🥹\n📖 𝑪𝒐𝒓𝒓𝒆𝒄𝒕 𝒘𝒂𝒔 ${session.correctAnswer.toUpperCase()}`;
      return api.editMessage(failMsg, quizMsgID);
    }
  }
};
