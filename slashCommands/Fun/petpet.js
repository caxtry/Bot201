const Discord = require('discord.js');
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require('canvacord');
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const request = require('request');
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);

const DRAFT_TYPE = 0;
const DEFAULT_DELAY = 20;
const DEFAULT_RESOLUTION = 128;
const FRAMES = 10;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (event, _source, _lineno, _colno, err) => reject(err || event);
    img.crossOrigin = "Anonymous";
    img.src = source;
  });
}

async function resolveImage(options, ctx, noServerPfp) {
  // Implement your logic for resolving the image here
  // You can replace the placeholder implementation with your own code
}

module.exports = {
  name: 'petpet',
  aliases: [""],
  description: 'IMAGE CMD',
  usage: 'petpet <DELAY> <RESOLUTION> <IMAGE> <URL> <USER> <NO-SERVER-PFP>',
  type: 'text',
  options: [
    {
      name: "delay",
      description: "The delay between each frame. Defaults to 20.",
      type: "INTEGER"
    },
    {
      name: "resolution",
      description: "Resolution for the gif. Defaults to 120. If you enter an insane number and it freezes Discord that's your fault.",
      type: "INTEGER"
    },
    {
      name: "image",
      description: "Image attachment to use",
      type: "ATTACHMENT"
    },
    {
      name: "url",
      description: "URL to fetch image from",
      type: "STRING"
    },
    {
      name: "user",
      description: "User whose avatar to use as image",
      type: "USER"
    },
    {
      name: "no-server-pfp",
      description: "Use the normal avatar instead of the server specific one when using the 'user' option",
      type: "BOOLEAN"
    }
  ],
  run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
    const opts = interaction.options;
    const cmdCtx = {}; // Replace with the necessary context data for your environment

    const frames = await getFrames();

    const noServerPfp = findOption(opts, "no-server-pfp", false);
    try {
      var url = await resolveImage(opts, cmdCtx, noServerPfp);
      if (!url) throw "No Image specified!";
    } catch (err) {
      // Replace with your error handling logic
    }

    const avatar = await loadImage(url);

    const delay = findOption(opts, "delay", DEFAULT_DELAY);
    const resolution = findOption(opts, "resolution", DEFAULT_RESOLUTION);

    const gif = new GIFEncoder();

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = resolution;
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < FRAMES; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const j = i < FRAMES / 2 ? i : FRAMES - i;
      const width = 0.8 + j * 0.02;
      const height = 0.8 - j * 0.05;
      const offsetX = (1 - width) * 0.5 + 0.1;
      const offsetY = 1 - height - 0.08;

      ctx.drawImage(
        avatar,
        offsetX * resolution,
        offsetY * resolution,
        width * resolution,
        height * resolution
      );
      ctx.drawImage(frames[i], 0, 0, resolution, resolution);

      const { data } = ctx.getImageData(0, 0, resolution, resolution);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);

      gif.writeFrame(index, resolution, resolution, {
        transparent: true,
        palette,
        delay,
      });
    }

    gif.finish();
    const file = new File([gif.bytesView()], "petpet.gif", { type: "image/gif" });

    // Replace with your logic for handling the created GIF file
    // You might want to upload it or send it to the channel
  },
};
