require('dotenv').config();
// Solo en Windows usamos ffmpeg-static; en Linux (Railway) ffmpeg está en PATH vía apt.
if (process.platform === 'win32') {
  try { process.env.FFMPEG_PATH = require('ffmpeg-static'); } catch {}
}

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Cargar comandos (soporta objeto único o array)
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const mod = require(path.join(commandsPath, file));
  const list = Array.isArray(mod) ? mod : [mod];
  for (const command of list) {
    if (!command?.name) continue;
    client.commands.set(command.name, command);
    for (const alias of command.aliases ?? []) {
      client.commands.set(alias, command);
    }
  }
}

// Cargar eventos
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(process.env.BOT_TOKEN);
