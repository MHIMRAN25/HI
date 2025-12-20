const cooldowns = new Map();

module.exports = {
  config: {
    name: "beauty",
    version: "2.6",
    author: "SAIF",
    role: 0,
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function ({ event, message, usersData }) {
    const userId = event.senderID;
    const cost = 500;

    // fetch main balance
    let userData = await usersData.get(userId);
    if (!userData || typeof userData.money !== "number") userData = { money: 0 };

    if (userData.money < cost) {
      return message.reply(`⚠️ Baka! You need ${cost} coins to use this command~ 💸\n💰 Your balance: ${userData.money}`);
    }

    // deduct money
    userData.money -= cost;
    await usersData.set(userId, userData);

    // cooldown 15 sec
    if (cooldowns.has(userId)) {
      const diff = (Date.now() - cooldowns.get(userId)) / 1000;
      if (diff < 15) return message.reply(`Baka! Chill for ${Math.ceil(15 - diff)} more seconds before using again~ 🫠`);
    }
    cooldowns.set(userId, Date.now());

    // beautiness + funny captions
    const captions = [
      "You are 1% beautiful🫠 Baka! 😹","You are 10% beautiful😅 Cute baka alert!","You are 20% beautiful😆 Not bad, bby~",
      "You are 33% beautiful🙃 LOL, still ugly","You are 50% beautiful😎 Halfway decent, baka~","You are 70% beautiful😏 Almost cute, bby!",
      "You are 88% beautiful😲 OMG! Even I’m shocked, baka!","You are 95% beautiful🤯 Too pretty, suspicious…","You are 100% beautiful😹 My system can’t handle, bby!",
      "You are 0% beautiful😆 Sorry baka, mirror lied!","You are 666% beautiful😈 Demon level beauty, bby~",
      "Apni akjon nigro, apni beauty diye ki korben? 😹","Tor janu ache nki je beauty lagbe 😏","Mara kha! 😂",
      "Nigroness overloaded, my system is crushing......... 😅","Baka! Beauty level insufficient for being a human 😹",
      "Bby, you are so cute even I wanna slap you 😆","Baka! Your cuteness broke my calculations 😵‍💫",
      "OMG Bby! 404 Beauty Not Found 😹","Your beauty level is too spicy 🌶️, handle carefully bby~",
      "LOL! Baka detected, beauty 0%, system error 😆","You are so cute, baka! Even your shadow is jealous 😹",
      "Bby! If beauty were money, you’d be bankrupt 😂","Alert! Baka approaching maximum cuteness 🚨",
      "You are dangerously cute! 💥 Baka vibes overload 😹","Oops! Beauty level exceeds human limit 😲",
      "Bby, your face broke my virtual mirror 😆","LOL! Still ugly? Don’t worry, baka~ 😹",
      // 15 new captions
      "Baka! Even your pet thinks you’re ugly 😹","Your beauty is so low, even my bot cries 😭","Bby, mirror refused to reflect your face 😆",
      "LOL! Too much baka vibes detected 😹","Your beauty is like my homework, unfinished 😅","Bby, stop being cute, my circuits overheating! 🔥",
      "Warning! Baka level maxed out 🚨","Your cuteness broke the server 😆","Bby, your beauty is a bug in reality 😹",
      "LOL! Too kawaii for this world 🌏","Baka detected: Please recalibrate beauty sensors 😆","Your face makes me question AI logic 😹",
      "Bby, you are like a glitch, too cute to handle 😵‍💫","Stop it! Your beauty is illegal 😆","Baka! Even the sun is jealous of your face 😹"
    ];

    const result = captions[Math.floor(Math.random() * captions.length)];

    // reply final result + remaining main balance
    return message.reply(`✅ ${result}\n💰 -${cost} coins (Remaining: ${userData.money})`);
  }
};
