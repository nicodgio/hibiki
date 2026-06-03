const { queues } = require('../music/queue');

module.exports = {
  name: 'disolver',
  aliases: ['dis'],
  async execute(message) {
    const queue = queues.get(message.guildId);
    if (!queue) {
      return message.reply('🏯 Hibiki no está presente en el salón.');
    }
    queue.destroy();
    queues.delete(message.guildId);
    message.reply('🏯 Hibiki hace una reverencia y abandona el salón. Hasta la próxima convocatoria.');
  },
};
