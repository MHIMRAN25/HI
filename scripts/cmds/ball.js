const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "ball",
        aliases: ["geda"],
        version: "1.4",
        author: "Saif",
        countDown: 5,
        role: 0,
        shortDescription: "Tag a person to kick geda/ball shot",
        longDescription: "",
        category: "fun",
        guide: "{pn} [@tag | r | rnd | random]"
    },

    onStart: async function ({ message, event, args, api }) {
        const mention = Object.keys(event.mentions);
        const senderID = event.senderID;
        let target;

        // Random user
        if (args[0] && ["r", "rnd", "rndm", "random"].includes(args[0].toLowerCase())) {
            const allUsers = await api.getThreadInfo(event.threadID).then(res => res.participantIDs.filter(id => id != senderID));
            target = allUsers[Math.floor(Math.random() * allUsers.length)];
        } 
        // Mentioned user
        else if (mention.length > 0) {
            target = mention[0];
        } 
        // Replied message
        else if (event.type == "message_reply" && event.messageReply) {
            target = event.messageReply.senderID;
        } 
        else {
            return message.reply("Baka! You need to mention someone, reply, or use random~ 😹");
        }

        // Fetch sender & target names
        const senderInfo = await api.getUserInfo([senderID]);
        const targetInfo = await api.getUserInfo([target]);
        const nameSender = Object.values(senderInfo)[0].name;
        const nameTarget = Object.values(targetInfo)[0].name;

        // Countdown
        let countdownMsg = await message.reply(`⏳ Bby~ ${nameTarget}, watch out! Ball coming in 3 seconds!`);
        for (let i = 2; i > 0; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await api.editMessage(`⏳ Baka~ ${nameTarget}, ball hits in ${i} seconds!`, countdownMsg.messageID);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        await api.editMessage("🚨 Nyaa~ Kicking now!", countdownMsg.messageID);

        // Generate ball image
        const ptth = await bal(senderID, target);

        // Send final image as new message
        await api.sendMessage({
            body: `⚽ Bby ${nameSender} kicked a ball at ${nameTarget}! OwO 😹`,
            attachment: fs.createReadStream(path.resolve(ptth))
        }, event.threadID);
    }
};

async function bal(one, two) {
    let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    avone.circle();
    let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    avtwo.circle();

    const pth = path.join(__dirname, "ball.png");
    let img = await jimp.read("https://i.ibb.co/6Jz7yvX/image.jpg");
    img.resize(1080, 1320)
       .composite(avone.resize(170, 170), 200, 320)
       .composite(avtwo.resize(170, 170), 610, 70);

    await img.writeAsync(pth);
    return pth;
}
