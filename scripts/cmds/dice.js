const parseShorthand = (str) => {
  if (!str) return NaN;
  str = str.toLowerCase();

  const map = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12,
    qd: 1e15,
    qt: 1e18,
    sx: 1e21,
    sp: 1e24,
    oc: 1e27,
    no: 1e30,
    dc: 1e33
  };

  let suffix = Object.keys(map).sort((a,b) => b.length - a.length).find(s => str.endsWith(s));
  let multiplier = suffix ? map[suffix] : 1;

  if (suffix) str = str.slice(0, -suffix.length);
  const number = parseFloat(str);
  return isNaN(number) ? NaN : number * multiplier;
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
    { value: 1e18, symbol: "𝐐𝐍" },
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

module.exports = {
  config: {
    name: "dice",
    aliases: [],
    version: "2.0",
    author: "SAIF",
    category: "game",
    shortDescription: "🎲 roll a dice automatically with bet amount",
    longDescription: "User gives amount, bot rolls dice automatically to see if user wins",
    guide: { en: "{pn} <amount> - roll dice and bet automatically" },
  },

  onStart: async function({ message, event, args, usersData }) {
    const user = event.senderID;
    const userData = await usersData.get(user);

    const betInput = args[0];
    const betAmount = parseShorthand(betInput);

    if (isNaN(betAmount) || betAmount <= 0) 
      return message.reply("⚠️ 𝐄𝐍𝐓𝐄𝐑 𝐀 𝐕𝐀𝐋𝐈𝐃 𝐀𝐌𝐎𝐔𝐍𝐓.");
    if (userData.money < betAmount) 
      return message.reply("💰 𝐍𝐎𝐓 𝐄𝐍𝐎𝐔𝐆𝐇 𝐁𝐀𝐋𝐀𝐍𝐂𝐄.");

    // Bot rolls dice automatically
    const diceNum = Math.floor(Math.random() * 6) + 1;
    const rolledDice = Math.floor(Math.random() * 6) + 1;
    const isWin = rolledDice === diceNum;
    const winnings = isWin ? betAmount * 2 : -betAmount;

    userData.money += winnings;
    await usersData.set(user, userData);

    const resultMsg = `
🎲 𝐘𝐎𝐔𝐑 𝐃𝐈𝐂𝐄: ${diceNum}
🤖 𝐑𝐎𝐋𝐋𝐄𝐃: ${rolledDice}

${isWin ? ` 𝐘𝐎𝐔 𝐖𝐎𝐍 ${formatMoney(betAmount)}!` : ` 𝐘𝐎𝐔 𝐋𝐎𝐒𝐓 ${formatMoney(betAmount)}.`}

 𝐁𝐀𝐋𝐀𝐍𝐂𝐄: ${formatMoney(userData.money)}
`;

    return message.reply(resultMsg.trim());
  }
};
