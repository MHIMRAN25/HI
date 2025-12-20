module.exports = {
  config: {
    name: "listgroup",
    aliases: ["lgroups", "lg"],
    version: "4.0",
    author: "Saif",
    countDown: 5,
    role: 2,
    shortDescription: "Show active groups and leave",
    longDescription: "Shows only the groups where the bot is currently a member. Reply with one or multiple index numbers to leave.",
    category: "owner",
    guide: "{p}listgroups"
  },

  onStart: async function ({ api, event }) {
    try {
      // Get list of groups from inbox
      const threadList = await api.getThreadList(100, null, ["INBOX"]);
      const groups = threadList.filter(t => t.isGroup);

      let activeGroups = [];
      for (let g of groups) {
        try {
          const info = await api.getThreadInfo(g.threadID);
          if (info.participantIDs.includes(api.getCurrentUserID())) {
            activeGroups.push({
              name: g.name,
              threadID: g.threadID
            });
          }
        } catch (err) {
          console.error("Error checking thread:", g.threadID, err);
        }
      }

      if (activeGroups.length === 0) 
        return api.sendMessage("I'm not currently in any groups.", event.threadID);

      let msg = "📋 Groups where the bot is currently in:\n";
      activeGroups.forEach((g, i) => {
        msg += `${i + 1}. ${g.name} (TID: ${g.threadID})\n`;
      });

      msg += `\n👉 Reply to this message with index number(s) (e.g. 2 or 1 3 5) to leave those group(s).`;

      return api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          groups: activeGroups
        });
      });
    } catch (e) {
      console.error(e);
      return api.sendMessage("Error fetching active group list.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, groups } = Reply;
    if (event.senderID !== author) 
      return api.sendMessage("You are not the one who ran this command!", event.threadID);

    // Split reply into multiple indexes
    const indexes = event.body.trim().split(/\s+/).map(n => parseInt(n) - 1);

    const invalid = indexes.some(i => isNaN(i) || i < 0 || i >= groups.length);
    if (invalid) {
      return api.sendMessage("One or more invalid indexes. Try again.", event.threadID);
    }

    let results = [];
    for (let i of indexes) {
      const target = groups[i];
      try {
        await api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
        results.push(`✅ Left '${target.name}'`);
      } catch (e) {
        console.error(e);
        results.push(`❌ Failed to leave '${target.name}'`);
      }
    }

    return api.sendMessage(results.join("\n"), event.threadID);
  }
};
