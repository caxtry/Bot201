const { Permissions } = require("discord.js");

module.exports = function(client, options) {
  const resetOnMistake = options && options.resetOnMistake;

  client.on("messageCreate", message => {
    if (!message.guild || message.guild.available === false || message.author.bot) return;
    client.settings.ensure(message.guild.id, {
      counter: "no",
      counternum: 0,
      counterauthor: ""
    });
    if (message.channel.id == client.settings.get(message.guild.id, `counter`)) {
      let count = client.settings.get(message.guild.id, `counternum`);
      let counterauthor = client.settings.get(message.guild.id, `counterauthor`);
      if (isNaN(count)) {
        client.settings.set(message.guild.id, 0, `counternum`);
        count = 0;
      };
      if (!message.author.bot && message.author.id === counterauthor) {
        if (message.channel.permissionsFor(message.channel.guild.me).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
          message.delete().catch(() => { });
        } else {
          message.reply(":x: **I am missing the MANAGE_MESSAGES Permission!**").then(m => {
            setTimeout(() => {
              m.delete().catch(() => { });
            }, 3500);
          });
        }
        message.reply("You cannot count twice in a row! Count starts again from 1").then(m => setTimeout(() => {
          m.delete();
        }, 3000));
        message.react('❌');
        client.settings.set(message.guild.id, 0, `counternum`);
        client.settings.set(message.guild.id, "", `counterauthor`);
        return;
      } else if (parseInt(message.content) !== count + 1) {
        if (resetOnMistake) {
          client.settings.set(message.guild.id, 1, 'counternum');
          message.reply(`Incorrect number, the number was ${count}. Count starts again from 1`).then(m => setTimeout(() => {
            m.delete();
          }, 3000));
          client.settings.set(message.guild.id, '', 'counterauthor');
          count = 1; // reset the count variable to 1
        } else {
          message.reply(`Incorrect number. The next number was ${count}. Count again from 1`).then(m => setTimeout(() => {
            m.delete();
          }, 3000));
        }
        client.settings.set(message.guild.id, 0, `counternum`);
        client.settings.set(message.guild.id, "", `counterauthor`);
        message.react('❌');
        return;
      }
      client.settings.set(message.guild.id, parseInt(message.content), `counternum`);
      client.settings.set(message.guild.id, message.author.id, `counterauthor`);
      message.react('✅');
    }
  });
};
