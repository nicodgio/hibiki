const { queues } = require('../music/queue');

module.exports = {
  name: 'siguiente',
  aliases: ['sig'],
  async execute(message) {
    const queue = queues.get(message.guildId);
    if (!queue || !queue.isPlaying) {
      return message.reply('🎴 No hay ninguna melodía resonando en el salón.');
    }
    queue.player.stop();
    message.reply('⚔️ Hibiki descarta la melodía y convoca la siguiente del pergamino.');
  },
};
