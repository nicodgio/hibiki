const PREFIX = '>';

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (err) {
      console.error(`[Hibiki Error] !${commandName}:`, err);
      message.reply('🌩️ Un mal espíritu interrumpió la ejecución de esta orden.').catch(() => {});
    }
  },
};
