const parseAmount = (str) => {
  if (!str) return NaN;
  str = str.toLowerCase().replace(/\s+/g, "");
  const suffixes = {
    k: 1e3, m: 1e6, b: 1e9, t: 1e12,
    qt: 1e15, qd: 1e15, qi: 1e18, sx: 1e21,
    sp: 1e24, oc: 1e27, no: 1e30, dc: 1e33
  };
  let matched = Object.keys(suffixes).find(suf => str.endsWith(suf));
  let multiplier = matched ? suffixes[matched] : 1;
  if (matched) str = str.slice(0, -matched.length);
  let num = parseFloat(str);
  return isNaN(num) ? NaN : num * multiplier;
};

const toBoldSerifItalic = (text) => {
  const fonts = {
    'a': '𝒂','b': '𝒃','c': '𝒄','d': '𝒅','e': '𝒆','f': '𝒇','g': '𝒈',
    'h': '𝒉','i': '𝒊','j': '𝒋','k': '𝒌','l': '𝒍','m': '𝒎','n': '𝒏',
    'o': '𝒐','p': '𝒑','q': '𝗊','r': '𝒓','s': '𝒔','t': '𝒕','u': '𝒖',
    'v': '𝒗','w': '𝒘','x': '𝒙','y': '𝒚','z': '𝒛',
    'A': '𝑨','B': '𝑩','C': '𝑪','D': '𝑫','E': '𝑬','F': '𝑭','G': '𝑮',
    'H': '𝑯','I': '𝑰','J': '𝑱','K': '𝑲','L': '𝑳','M': '𝑴','N': '𝑵',
    'O': '𝑶','P': '𝑷','Q': '𝑸','R': '𝑹','S': '𝑺','T': '𝑻','U': '𝑼',
    'V': '𝑽','W': '𝒘','X': '𝒙','Y': '𝒀','Z': '𝒁',
    '0': '𝟎','1': '𝟏','2': '𝟐','3': '𝟑','4': '𝟒',
    '5': '𝟓','6': '𝟔','7': '𝟕','8': '𝟖','9': '𝟗', '.': '.'
  };
  return text.split('').map(char => fonts[char] || char).join('');
};

function formatMoney(num) {
  const suffixes = [
    { value: 1e33, symbol: "𝑫𝑪" },
    { value: 1e30, symbol: "𝑵𝑶" },
    { value: 1e27, symbol: "𝑶𝑪" },
    { value: 1e24, symbol: "𝑺𝑷" },
    { value: 1e21, symbol: "𝑺𝑿" },
    { value: 1e18, symbol: "𝑸𝑰" },
    { value: 1e15, symbol: "𝑸𝑫" },
    { value: 1e12, symbol: "𝑻" },
    { value: 1e9,  symbol: "𝑩" },
    { value: 1e6,  symbol: "𝑴" },
    { value: 1e3,  symbol: "𝑲" }
  ];
  for (const s of suffixes) {
    if (num >= s.value) {
      return toBoldSerifItalic((num / s.value).toFixed(2)) + s.symbol;
    }
  }
  return toBoldSerifItalic(num.toString());
}

const emojis = ["❤️", "💙", "💚", "💛", "💜", "🧡"];
const dailyUsage = new Map();

module.exports = {
  config: {
    name: "bet",
    version: "5.5",
    author: "Saif",
    category: "game",
    countDown: 15,
    shortDescription: "🎰 𝑼𝑳𝑻𝑹𝑨-𝑺𝑻𝑨𝑩𝑳𝑬 𝑩𝑬𝑻 𝑮𝑨𝑴𝑬",
    guide: { en: "{p}bet <amount>" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    const user = senderID;

    // Daily reset logic
    const today = new Date().toDateString();
    if (!dailyUsage.has(user) || dailyUsage.get(user).date !== today) {
      dailyUsage.set(user, { count: 0, date: today });
    }
    const userDaily = dailyUsage.get(user);
    if (userDaily.count >= 20) {
        return api.sendMessage(toBoldSerifItalic("⚠️ 𝒀𝑶𝑼 𝑯𝑨𝑽𝑬 𝑹𝑬𝑨𝑪𝑯𝑬𝑫 𝒀𝑶𝑼𝑹 𝑫𝑨𝑰𝑳𝒀 𝑳𝑰𝑴𝑰𝑻 𝑶𝑭 𝟐𝟎 𝑩𝑬𝑻𝑺!"), threadID, messageID);
    }

    let betAmount = parseAmount(args[0]);
    if (!betAmount || betAmount <= 0) {
      return api.sendMessage(
        toBoldSerifItalic("❌ 𝑰𝑵𝑽𝑨𝑳𝑰𝑫 𝑩𝑬𝑻 𝑨𝑴𝑶𝑼𝑵𝑻! 𝑼𝑺𝑨𝑮𝑬: bet 500"),
        threadID,
        messageID
      );
    }

    const userData = await usersData.get(user);
    if (!userData || userData.money < betAmount) {
      return api.sendMessage(
        toBoldSerifItalic("💰 𝑰𝑵𝑺𝑼𝑭𝑭𝑰𝑪𝑰𝑬𝑵𝑻 𝑩𝑨𝑳𝑨𝑵𝑪𝑬! 𝒀𝑶𝑼 𝑯𝑨𝑽𝑬: ") + formatMoney(userData?.money || 0),
        threadID,
        messageID
      );
    }

    const userEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const loadingMsg = await api.sendMessage(
      toBoldSerifItalic("🎰 𝑩𝑬𝑻𝑻𝑰𝑵𝑮 𝑶𝑵 ") + userEmoji + toBoldSerifItalic(" 𝑩𝑨𝑩𝒀... 🎀\n💵 𝑨𝑴𝑶𝑼𝑵𝑻: ") + formatMoney(betAmount),
      threadID,
      messageID
    );

    await new Promise(r => setTimeout(r, 2000));

    // 50/50 Win Chance
    const isWin = Math.random() < 0.50;
    const winEmoji = isWin ? userEmoji : "🖤";
    const change = isWin ? betAmount : -betAmount;
    const newBalance = userData.money + change;

    await usersData.set(user, { money: newBalance });
    userDaily.count += 1;
    dailyUsage.set(user, userDaily);

    let resultText = isWin 
      ? toBoldSerifItalic("✅ 𝒀𝑶𝑼 𝑾𝑶𝑵: ") + formatMoney(betAmount) 
      : toBoldSerifItalic("❌ 𝒀𝑶𝑼 𝑳𝑶𝑺𝑻: ") + formatMoney(betAmount);

    const finalResult = `
🎰 ${toBoldSerifItalic("𝑩𝑬𝑻 𝑹𝑬𝑺𝑼𝑳𝑻 𝑩𝑨𝑩𝒀")}

${toBoldSerifItalic("𝒀𝑶𝑼𝑹 𝑬𝑴𝑶𝑱𝑰:")} ${userEmoji}
${toBoldSerifItalic("𝑾𝑰𝑵𝑵𝑰𝑵𝑮 𝑬𝑴𝑶𝑱𝑰:")} ${winEmoji}

${resultText}

💰 ${toBoldSerifItalic("𝑵𝑬𝑾 𝑩𝑨𝑳𝑨𝑵𝑪𝑬:")} ${formatMoney(newBalance)}
📈 ${toBoldSerifItalic("𝑫𝑨𝑰𝑳𝒀 𝑼𝑺𝑬:")} ${toBoldSerifItalic(userDaily.count.toString())}/𝟐𝟎
    `.trim();

    return api.editMessage(finalResult, loadingMsg.messageID);
  }
};
