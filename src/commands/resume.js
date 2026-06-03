const { AudioPlayerStatus } = require('@discordjs/voice');
const { queues } = require('../music/queue');

module.exports = {
  name: 'despertar',
  aliases: ['des'],
  async execute(message) {
    const queue = queues.get(message.guildId);
    if (!queue || queue.player.state.status !== AudioPlayerStatus.Paused) {
      return message.reply('⛩️ Hibiki no está en silencio ahora mismo.');
    }
    queue.player.unpause();
    message.reply('⛩️ Hibiki despierta y retoma la melodía donde la dejó.');
  },
};
