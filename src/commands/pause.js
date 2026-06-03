const { AudioPlayerStatus } = require('@discordjs/voice');
const { queues } = require('../music/queue');

module.exports = {
  name: 'silencio',
  aliases: ['sil'],
  async execute(message) {
    const queue = queues.get(message.guildId);
    if (!queue || queue.player.state.status !== AudioPlayerStatus.Playing) {
      return message.reply('🏮 No hay melodía que silenciar en este momento.');
    }
    queue.player.pause();
    message.reply('🏮 Hibiki guarda silencio y aguarda tu señal.');
  },
};
