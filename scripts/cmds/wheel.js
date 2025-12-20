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

const smallBoldNumbers = {
  "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒",
  "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗", ".": "."
};

function toSmallBoldNumber(num) {
  return num.toString().split("").map(c => smallBoldNumbers[c] || c).join("");
}

function formatMoney(num) {
  const suffixes = [
    { value: 1e33, symbol: "𝐃𝐂" },
    { value: 1e30, symbol: "𝐍𝐎" },
    { value: 1e27, symbol: "𝐎𝐂" },
    { value: 1e24, symbol: "𝐒𝐏" },
    { value: 1e21, symbol: "𝐒𝐗" },
    { value: 1e18, symbol: "𝐐𝐈" },
    { value: 1e15, symbol: "𝐐𝐃" },
    { value: 1e12, symbol: "𝐓" },
    { value: 1e9, symbol: "𝐁" },
    { value: 1e6, symbol: "𝐌" },
    { value: 1e3, symbol: "𝐊" }
  ];
  for (const s of suffixes) {
    if (num >= s.value) {
      return toSmallBoldNumber((num / s.value).toFixed(2)) + s.symbol;
    }
  }
  return toSmallBoldNumber(num);
}

const wheelEmojis = [
  { emoji: "🍒", multiplier: 0.5, weight: 20 },
  { emoji: "🍋", multiplier: 1, weight: 30 },
  { emoji: "🍊", multiplier: 2, weight: 25 },
  { emoji: "🍇", multiplier: 3, weight: 15 },
  { emoji: "💎", multiplier: 5, weight: 7 },
  { emoji: "💰", multiplier: 10, weight: 3 }
];

module.exports = {
  config: {
    name: "wheel",
    version: "5.3",
    author: "Saif",
    category: "game",
    shortDescription: "🎡 𝐔𝐋𝐓𝐑𝐀-𝐒𝐓𝐀𝐁𝐋𝐄 𝐖𝐇𝐄𝐄𝐋 𝐆𝐀𝐌𝐄",
    guide: {
      en: "{p}wheel <amount>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    let betAmount = parseAmount(args[0]);
    if (!betAmount || betAmount <= 0) {
      return api.sendMessage(`❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐁𝐄𝐓 𝐀𝐌𝐎𝐔𝐍𝐓!\n𝐔𝐒𝐀𝐆𝐄: ${global.GoatBot.config.prefix}wheel 500`, threadID);
    }

    const user = await usersData.get(senderID);
    if (!user || user.money < betAmount) {
      return api.sendMessage(`💰 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐁𝐀𝐋𝐀𝐍𝐂𝐄! 𝐘𝐎𝐔 𝐇𝐀𝐕𝐄: ${formatMoney(user?.money || 0)}`, threadID);
    }

    await api.sendMessage(`🎰 𝐒𝐏𝐈𝐍𝐍𝐈𝐍𝐆 𝐓𝐇𝐄 𝐖𝐇𝐄𝐄𝐋 🎀\n💵 𝐁𝐄𝐓: ${formatMoney(betAmount)}`, threadID);
    await new Promise(r => setTimeout(r, 1500));

    // Random weighted spin
    const totalWeight = wheelEmojis.reduce((sum, e) => sum + e.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    const spinResult = wheelEmojis.find(e => (cumulative += e.weight) >= rand) || wheelEmojis[0];

    const winAmount = Math.floor(betAmount * spinResult.multiplier) - betAmount;
    const newBalance = user.money + winAmount;
    await usersData.set(senderID, { money: newBalance });

    const outcomeText = spinResult.multiplier < 1
      ? `❌ 𝐋𝐎𝐒𝐓: ${formatMoney(betAmount * 0.5)}`
      : spinResult.multiplier === 1
        ? "➖ 𝐁𝐑𝐎𝐊𝐄 𝐄𝐕𝐄𝐍"
        : `✅ 𝐖𝐎𝐍 ${spinResult.multiplier}X! (+${formatMoney(winAmount)})`;

    return api.sendMessage(`
🎰 𝐖𝐇𝐄𝐄𝐋 𝐒𝐓𝐎𝐏𝐏𝐄𝐃 𝐎𝐍: ${spinResult.emoji}

${outcomeText}

💰 𝐍𝐄𝐖 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: ${formatMoney(newBalance)}
    `.trim(), threadID);
  }
};
