const petPetGif = require('pet-pet-gif'); // npm i pet-pet-gif
const Discord = require('discord.js');

module.exports = {
    name: 'petpet',
    aliases: [''],
    category: "🕹️ Fun",
    description: "IMAGE CMD",
    usage: "petpet <USER>",
    type: "image",
    run: async (client, message, args) => {
        const member = message.mentions.members.first() || message.member;
        const avatar = member.user.displayAvatarURL({ format: "jpg" });

        const animatedGif = await petPetGif(avatar); // Generate the pet-pet GIF

        const attachment = new Discord.MessageAttachment(animatedGif, 'petpet.gif');
        message.reply({ files: [attachment] });
    }
};
