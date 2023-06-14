const { MessageEmbed } = require("discord.js");
const {
  parseMilliseconds,
  duration,
  GetUser,
  nFormatter,
  ensure_economy_user,
} = require(`${process.cwd()}/handlers/functions`);

module.exports = {
  name: "petname",
  category: "💸 Economy",
  aliases: ["changepetname"],
  description: "Changes the name of a pet",
  usage: "petname [name of the pet] [new name of the pet]",
  run: async (client, message, args) => {
    let user = message.author;
    const petName = args[0]?.toLowerCase();
    const newPetName = args[1];

    if (!petName || !newPetName) {
      return message.reply("Please provide the current name of the pet and the new name.");
    }

    ensure_economy_user(client, message.guild.id, user.id);
    const data = client.economy.get(`${message.guild.id}-${user.id}`);

    if (!(petName in data.items) || petName === newPetName) {
      return message.reply("You don't have a pet with that name.");
    }

    const petCount = data.items[petName];
    data.items[newPetName] = petCount;
    delete data.items[petName];

    client.economy.set(`${message.guild.id}-${user.id}`, data);

    return message.reply(`Successfully changed the name of your pet '${petName}' to '${newPetName}'.`);
  },
};