const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { MessageEmbed, MessageAttachment, User, Permissions } = require(`discord.js`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
const { Configuration, OpenAIApi } = require("openai");
const context = require('./context');
require('dotenv').config();

module.exports = (client) => {
  const configuration = new Configuration({
    apiKey: process.env.API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const msgLengthLimit = 2000;
  const chatbotConversations = new Map();

  // Event handler for setup channel
  client.on('messageCreate', async (message) => {
    try {
      if (
        !message.guild ||
        message.guild.available === false ||
        !message.channel ||
        message.author.bot ||
        message.content.startsWith('!')
      ) {
        return;
      }

      const chatbot = client.settings.get(message.guild.id, 'aichat');
      if (!chatbot || chatbot === 'no') {
        return;
      }

      const conversationId = message.author.id;
      const conversationLog = chatbotConversations.get(conversationId) || [
        { role: 'system', content: context.prompt },
      ];

      if (message.content.length > msgLengthLimit) {
        message.reply("Whoa now, I'm not going to read all that. Maybe summarize?");
        return;
      }

      if (message.channel.id === chatbot) {
        // Message sent in the setup channel
        await message.channel.sendTyping();

        // const mentioned = message.mentions.members.has(client.user.id);

        // // Check if the message is sent in the setup channel
        // if (message.channel.id === chatbot) {
        //   if (mentioned) {
        //     return;
        //   }
        // } else {
        //   if (mentioned) {
        //     return;
        //   }
        // }

        // Image Generator
        if (message.content.match(/image#/i) || message.content.match(/imagen#/i)) {
          const prompt = message.content.split(" ").slice(1).join(" ");
          const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: "1024x1024",
          });
          const imageUrl = response.data.data[0].url;
          message.reply(imageUrl);
          return;
        }

        conversationLog.push({
          role: 'user',
          content: message.content,
        });

        chatbotConversations.set(conversationId, conversationLog);

        const res = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog,
          temperature: 0.7,
        });

        const reply = res.data.choices[0].message?.content;

        if (reply?.length > msgLengthLimit) {
          // If the reply length is over 2000 characters, send a txt file.
          const buffer = Buffer.from(reply, 'utf8');
          const txtFile = new AttachmentBuilder(buffer, { name: `${message.author.tag}_response.txt` });

          message.reply({ files: [txtFile] }).catch((error) => {
            console.error('Failed to send reply:', error);
          });
        } else {
          if (reply && reply !== 'undefined') {
            message.reply(`<@${message.author.id}> ${reply}`);
          }
        }
      }
    } catch (error) {
      message.reply('Something went wrong. Try again in a bit.').then((msg) => {
        setTimeout(async () => {
          await msg.delete().catch(() => null);
        }, 5000);
      });

      console.log(`Error: ${error}`);
    }
  });

  // Event handler for regular conversation channel
  client.on('messageCreate', async (message) => {
    try {
      if (
        // !message.guild ||
        // message.guild.available === false ||
        !message.channel ||
        message.author.bot ||
        message.content.startsWith('!')
      ) {
        return;
      }

      // const chatbot = client.settings.get(message.guild.id, 'aichat');
      // if (!chatbot || chatbot === 'no') {
      //   return;
      // }

      const mentioned = message.mentions.users.some(user => user.id === client.user.id);
      if (!mentioned) {
        return;
      }

      const conversationId = message.author.id;
      const conversationLog = chatbotConversations.get(conversationId) || [
        { role: 'system', content: context.prompt },
      ];

      await message.channel.sendTyping();

      if (message.content.match(/image#/i) || message.content.match(/imagen#/i)) {
        const prompt = message.content.split(" ").slice(1).join(" ");
        const response = await openai.createImage({
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        const imageUrl = response.data.data[0].url;
        message.reply(imageUrl);
        return;
      }

      conversationLog.push({
        role: 'user',
        content: message.content,
      });

      chatbotConversations.set(conversationId, conversationLog);

      const res = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        temperature: 0.7,
      });

      const reply = res.data.choices[0].message?.content;

      if (reply?.length > msgLengthLimit) {
        // If the reply length is over 2000 characters, send a txt file.
        const buffer = Buffer.from(reply, 'utf8');
        const txtFile = new AttachmentBuilder(buffer, { name: `${message.author.tag}_response.txt` });

        message.reply({ files: [txtFile] }).catch((error) => {
          console.error('Failed to send reply:', error);
        });
      } else {
        if (reply && reply !== 'undefined') {
          message.reply(`<@${message.author.id}> ${reply}`);
        }
      }
    } catch (error) {
      message.reply('Something went wrong. Try again in a bit.').then((msg) => {
        setTimeout(async () => {
          await msg.delete().catch(() => null);
        }, 5000);
      });

      console.log(`Error: ${error}`);
    }
  });
  //AFK SYSTEM
  client.on("messageCreate", async message => {
    try {
      if (!message.guild || message.guild.available === false || !message.channel || message.author.bot) return;
      for (const user of [...message.mentions.users.values()]) {
        if (client.afkDB.has(message.guild.id + user.id)) {
          await message.reply({ content: `<:Crying:867724032316407828> **${user.tag}** went AFK <t:${Math.floor(client.afkDB.get(message.guild.id + user.id, "stamp") / 1000)}:R>!${client.afkDB.get(message.guild.id + user.id, "message") && client.afkDB.get(message.guild.id + user.id, "message").length > 1 ? `\n\n__His Message__\n>>> ${String(client.afkDB.get(message.guild.id + user.id, "message")).substr(0, 1800).split(`@`).join(`\`@\``)}` : ""}` }).then(msg => {
            setTimeout(() => {
              try {
                msg.delete().catch(() => { });
              } catch { }
            }, 5000)
          }).catch(() => { })
        }
      }
    } catch (e) {
      console.log(String(e).grey)
    }
  });
  //AFK SYSTEM
  client.on("messageCreate", async message => {
    try {
      if (!message.guild || message.guild.available === false || !message.channel || message.author.bot) return;
      if (message.content && !message.content.toLowerCase().startsWith("[afk]") && client.afkDB.has(message.guild.id + message.author.id)) {
        if (Math.floor(client.afkDB.get(message.guild.id + message.author.id, "stamp") / 10000) == Math.floor(Date.now() / 10000)) return console.log("AFK CMD");
        await message.reply({ content: `:tada: Welcome back **${message.author.username}!** :tada:\n> You went <t:${Math.floor(client.afkDB.get(message.guild.id + message.author.id, "stamp") / 1000)}:R> Afk` }).then(msg => {
          setTimeout(() => { msg.delete().catch(() => { }) }, 5000)
        }).catch(() => { })
        client.afkDB.delete(message.guild.id + message.author.id)
      }
    } catch (e) {
      console.log(String(e).grey)
    }
  });
  //autodelete
  client.on("messageCreate", async message => {
    if (message.guild) {
      client.setups.ensure(message.guild.id, {
        autodelete: [/*{ id: "991830733733769327", delay: 15000 }*/]
      })
      let channels = client.setups.get(message.guild.id, "autodelete")
      if (channels && channels.some(ch => ch.id == message.channel.id) && message.channel.type == "GUILD_TEXT") {
        setTimeout(() => {
          try {
            if (!message.deleted) {
              if (message.channel.permissionsFor(message.channel.guild.me).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
                message.delete().catch(() => {
                  //Try a second time
                  setTimeout(() => { message.delete().catch(() => { }) }, 1500)
                })
              } else {
                message.reply(":x: **I am missing the MANAGE_MESSAGES Permission!**").then(m => {
                  setTimeout(() => { m.delete().catch(() => { }) }, 3500)
                })
              }
            }
          } catch (e) { console.log(e.stack ? String(e.stack).grey : String(e).grey); }
        }, channels.find(ch => ch.id == message.channel.id).delay || 30000)
      }
    }
  })
  //sniping System
  client.on("messageDelete", async message => {
    if (!message.guild || message.guild.available === false || !message.channel || !message.author) return;
    let snipes = client.snipes.has(message.channel.id) ? client.snipes.get(message.channel.id) : [];
    if (snipes.length > 15) snipes.splice(0, 14);
    snipes.unshift({
      tag: message.author.tag,
      id: message.author.id,
      avatar: message.author.displayAvatarURL(),
      content: message.content,
      image: message.attachments.first()?.proxyURL || null,
      time: Date.now(),
    });
    client.snipes.set(message.channel.id, snipes)
  })
}