require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const mod = require(path.join(commandsPath, file));
  const list = Array.isArray(mod) ? mod : [mod];
  for (const command of list) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Registrando ${commands.length} comando(s) slash...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`✅ ${data.length} comando(s) registrados correctamente.`);
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
  }
})();
