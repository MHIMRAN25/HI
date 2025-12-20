const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

const API_ENDPOINT = "https://tawsif.is-a.dev/gemini/nano-banana"; 
const COST = 1000; // Anime edit jutsu cost

function extractImageUrl(message, args, event) {
    let imageUrl = args.find(arg => arg.startsWith('http'));

    if (!imageUrl && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const imageAttachment = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
        if (imageAttachment && imageAttachment.url) {
            imageUrl = imageAttachment.url;
        }
    }
    return imageUrl;
}

function extractEditPrompt(rawArgs, imageUrl) {
    let prompt = rawArgs.join(" ");
    
    if (imageUrl) {
        prompt = prompt.replace(imageUrl, '').trim();
    }
    
    if (prompt.includes('|')) {
        prompt = prompt.split('|')[0].trim();
    }

    return prompt || "enhance quality";
}


module.exports = {
  config: {
    name: "edit",
    aliases: ["imgedit", "e"],
    version: "2.4",
    author: "NeoKEX + modify by saif",
    countDown: 15,
    role: 0,
    longDescription: "Anime-style nano editing jutsu with coin deduction.",
    category: "image",
    guide: {
      en: "{pn} [prompt] or reply with [prompt] ✨ (Cost: 1000 coins)"
    }
  },

  onStart: async function({ message, args, event, usersData }) {
    
    // 🌀 ANIME-STYLE COIN SYSTEM (Same as buttslap)
    const userID = event.senderID;
    const userData = await usersData.get(userID);

    if (!userData.money || userData.money < COST) {
        return message.reply(
            `⚠️ *Senpai… your balance is too low to perform this edit command!*\n\n` +
            `💸 **Required:** ${COST} coins\n` +
            `💳 **Your Balance:** ${userData.money || 0}\n\n` +
            `✨ *use daily or others game… earn more… then return.*`
        );
    }

    const imageUrl = extractImageUrl(message, args, event);
    const editPrompt = extractEditPrompt(args, imageUrl);

    if (!imageUrl) {
      return message.reply("❌ *No image detected, senpai!* Send or reply to an image.");
    }
    if (!editPrompt) {
        return message.reply("❌ *Describe the transformation you desire, senpai!*");
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath; 

    try {

      // PAY FIRST (like buttslap)
      userData.money -= COST;
      await usersData.set(userID, userData);

      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(editPrompt)}&url=${encodeURIComponent(imageUrl)}`;
      
      const apiResponse = await axios.get(fullApiUrl);
      const data = apiResponse.data;

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || "API returned success: false or missing image URL.");
      }

      const finalImageUrl = data.imageUrl;

      const imageDownloadResponse = await axios.get(finalImageUrl, {
          responseType: 'stream',
      });
      
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      tempFilePath = path.join(cacheDir, `edited_nano_${Date.now()}.png`);
      
      const writer = fs.createWriteStream(tempFilePath);
      imageDownloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
      });

      message.reaction("✅", event.messageID);
      await message.reply({
        body:
          `✨ **Edit  Complete, Senpai!**\n` +
          `💸 Coins Used: ${COST}\n` +
          `💳 Remaining Balance: ${userData.money}\n\n` +
          `🎨 *Your transformed image is ready!*`,
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "⚠️ *A wild error appeared during the edit command!*";
      if (error.response && error.response.data && error.response.data.error) {
         errorMessage += `\nAPI: ${error.response.data.error}`;
      } else if (error.message) {
         errorMessage += `\n${error.message}`;
      } else if (error.code) {
         errorMessage += `\nNetwork Error: ${error.code}`;
      }

      console.error("Edit Command Error:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
      }
    }
  }
};
