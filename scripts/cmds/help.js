// Bold small caps font map
const boldFont = (text) => {
  const map = {
    A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",
    K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",
    U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
    a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",
    k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",
    u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",
    0:"𝟎",1:"𝟏",2:"𝟐",3:"𝟑",4:"𝟒",5:"𝟓",6:"𝟔",7:"𝟕",8:"𝟖",9:"𝟗"
  };
  return text.split("").map(c => map[c] || c).join("");
};

const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.21",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Display commands or details." },
    longDescription: { en: "Shows all commands categorized or details for one." },
    category: "box chat",
    guide: { en: "{pn} [command name]" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    // Admin info for full help only
    const adminName = "Saif";
    const adminFacebook = "https://www.facebook.com/61567256940629";
    const adminWhatsApp = "0182377204* (Important Msg Only)";

    if (!args || args.length === 0) {
      const categories = {};
      let msg = "";

      // Header
      msg += `╭───✦ ${boldFont("HELP MENU")} ✦───╮\n`;
      msg += `│ ${boldFont("Current Prefix")}: ${prefix}\n`;
      msg += "╰────────────────────╯\n\n";

      // Categorize commands
      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category || "Uncategorized";
        if (!categories[category]) categories[category] = [];
        categories[category].push(name);
      }

      // Build category boxes
      for (const categoryName of Object.keys(categories).sort()) {
        if (categoryName === "info") continue;
        const cmds = categories[categoryName].sort();
        msg += `╭─  ${boldFont(categoryName.toUpperCase())}  ─╮\n`;
        for (let i = 0; i < cmds.length; i += 3) {
          const row = cmds.slice(i, i + 3).map(x => `⭔ ${boldFont(x)}`).join("   ");
          msg += `│ ${row}\n`;
        }
        msg += "╰────────────────────╯\n\n";
      }

      // Footer / status + admin info
      const totalCommands = commands.size || 0;
      msg += `╭─────✰[ ${boldFont("ENJOY")} ]\n`;
      msg += `│ ${boldFont("Total Commands")}: [${totalCommands}]\n`;
      msg += `│ ${boldFont("Use")}: ${prefix}help [command]\n`;
      msg += "╰────────────✰\n\n";

      // Admin info at the very end
      msg += `╭─────✰\n`;
      msg += `│ ${boldFont("Admin Name")}: ${boldFont(adminName)}\n`;
      msg += `│ ${boldFont("Facebook")}: ${boldFont(adminFacebook)}\n`;
      msg += `│ ${boldFont("WhatsApp")}: ${boldFont(adminWhatsApp)}\n`;
      msg += "╰────────────✰";

      return message.reply(msg);
    }

    // ─── Specific command info ───
    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!command) return message.reply(`⚠️ Command "${commandName}" not found.`);

    const c = command.config;
    const desc = c.longDescription?.en || "No description available.";
    const guide = c.guide?.en ? c.guide.en.replace(/{pn}/g, `${prefix}${c.name}`) : "No guide provided.";
    const roleText = convertRole(c.role);

    // Command info box (admin info not included)
    const response = [
      `╭───✦ ${boldFont("COMMAND INFO")} ✦───╮`,
      `│ ${boldFont("Name")}: ${boldFont(c.name)}`,
      "├── INFO",
      `│ ${boldFont("Description")}: ${boldFont(desc)}`,
      `│ ${boldFont("Author")}: ${boldFont(c.author || "Unknown")}`,
      `│ ${boldFont("Guide")}: ${boldFont(guide)}`,
      "├── DETAILS",
      `│ ${boldFont("Version")}: ${boldFont(c.version || "1.0")}`,
      `│ ${boldFont("Role")}: ${boldFont(roleText)}`,
      "╰────────────✦"
    ].join("\n");

    return message.reply(response);
  },
};

function convertRole(role) {
  switch (role) {
    case 0: return "0 (All Users)";
    case 1: return "1 (Group Admins)";
    case 2: return "2 (Bot Admins)";
    default: return "Unknown";
  }
}
