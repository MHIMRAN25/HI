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

// Helper for the specific Bold Serif Italic style Baby
const toBoldSerifItalic = (text) => {
  const fonts = {
    'a': '𝒂','b': '𝒃','c': '𝒄','d': '𝒅','e': '𝒆','f': '𝒇','g': '𝒈',
    'h': '𝒉','i': '𝒊','j': '𝒋','k': '𝒌','l': '𝒍','m': '𝒎','n': '𝒏',
    'o': '𝒐','p': '𝒑','q': '𝗊','r': '𝒓','s': '𝒔','t': '𝒕','u': '𝒖',
    'v': '𝒗','w': '𝒘','x': '𝒙','y': '𝒚','z': '𝒛',
    'A': '𝑨','B': '𝑩','C': '𝑪','D': '𝑫','E': '𝑬','F': '𝑭','G': '𝑮',
    'H': '𝑯','I': '𝑰','J': '𝑱','K': '𝑲','L': '𝑳','M': '𝑴','N': '𝑵',
    'O': '𝑶','P': '𝑷','Q': '𝑸','R': '𝑹','S': '𝑺','T': '𝑻','U': '𝑼',
    'V': '𝑽','W': '𝑾','X': '𝑿','Y': '𝒀','Z': '𝒁',
    '0': '𝟎','1': '𝟏','2': '𝟐','3': '𝟑','4': '𝟒',
    '5': '𝟓','6': '𝟔','7': '𝟕','8': '𝟖','9': '𝟗'
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

const wheelEmojis = [
  { emoji: "🍒", multiplier: 0.5, weight: 20 },
  { emoji: "🍋", multiplier: 1,   weight: 30 },
  { emoji: "🍊", multiplier: 2,   weight: 25 },
  { emoji: "🍇", multiplier: 3,   weight: 15 },
  { emoji: "💎", multiplier: 5,   weight: 7 },
  { emoji: "💰", multiplier: 10,  weight: 3 }
];

module.exports = {
  config: {
    name: "wheel",
    version: "5.5",
    author: "Saif",
    category: "game",
    countDown: 10, // ✅ CMD USE COOLDOWN (10 seconds)
    shortDescription: "🎡 𝑼𝑳𝑻𝑹𝑨-𝑺𝑻𝑨𝑩𝑳𝑬 𝑾𝑯𝑬𝑬𝑳 𝑮𝑨𝑴𝑬",
    guide: { en: "{p}wheel <amount>" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    let betAmount = parseAmount(args[0]);

    if (!betAmount || betAmount <= 0) {
      return api.sendMessage(
        toBoldSerifItalic("❌ 𝑰𝑵𝑽𝑨𝑳𝑰𝑫 𝑩𝑬𝑻 𝑨𝑴𝑶𝑼𝑵𝑻! 𝑼𝑺𝑨𝑮𝑬: wheel 500"),
        threadID,
        messageID
      );
    }

    const user = await usersData.get(senderID);
    if (!user || user.money < betAmount) {
      return api.sendMessage(
        toBoldSerifItalic("💰 𝑰𝑵𝑺𝑼𝑭𝑭𝑰𝑪𝑰𝑬𝑵𝑻 𝑩𝑨𝑳𝑨𝑵𝑪𝑬! 𝒀𝑶𝑼 𝑯𝑨𝑽𝑬: ")
        + formatMoney(user?.money || 0),
        threadID,
        messageID
      );
    }

    const loadingMsg = await api.sendMessage(
      toBoldSerifItalic("🎰 𝑺𝑷𝑰𝑵𝑵𝑰𝑵𝑮 𝑻𝑯𝑬 𝑾𝑯𝑬𝑬𝑳 𝑩𝑨𝑩𝒀... 🎀\n💵 𝑩𝑬𝑻: ")
      + formatMoney(betAmount),
      threadID,
      messageID
    );

    await new Promise(r => setTimeout(r, 2000));

    const totalWeight = wheelEmojis.reduce((sum, e) => sum + e.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    const spinResult =
      wheelEmojis.find(e => (cumulative += e.weight) >= rand) || wheelEmojis[0];

    const winAmount = Math.floor(betAmount * spinResult.multiplier) - betAmount;
    const newBalance = user.money + winAmount;
    await usersData.set(senderID, { money: newBalance });

    let outcomeText = "";
    if (spinResult.multiplier < 1) {
      outcomeText = toBoldSerifItalic("❌ 𝑳𝑶𝑺𝑻: ") + formatMoney(betAmount * 0.5);
    } else if (spinResult.multiplier === 1) {
      outcomeText = toBoldSerifItalic("➖ 𝑩𝑹𝑶𝑲𝑬 𝑬𝑽𝑬𝑵");
    } else {
      outcomeText =
        toBoldSerifItalic(`✅ 𝑾𝑶𝑵 ${spinResult.multiplier}𝑿! (+`)
        + formatMoney(winAmount)
        + toBoldSerifItalic(")");
    }

    const finalResult = `
🎰 ${toBoldSerifItalic("𝑾𝑯𝑬𝑬𝑳 𝑺𝑻𝑶𝑷𝑷𝑬𝑫 𝑶𝑵:")} ${spinResult.emoji}

${outcomeText}

💰 ${toBoldSerifItalic("𝑵𝑬𝑾 𝑩𝑨𝑳𝑨𝑵𝑪𝑬:")} ${formatMoney(newBalance)}
    `.trim();

    return api.editMessage(finalResult, loadingMsg.messageID);
  }
};
