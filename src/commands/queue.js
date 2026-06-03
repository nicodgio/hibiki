const { EmbedBuilder } = require('discord.js');
const { queues } = require('../music/queue');

module.exports = {
  name: 'pergamino',
  aliases: ['per'],
  async execute(message) {
    const queue = queues.get(message.guildId);
    if (!queue || (!queue.isPlaying && queue.songs.length === 0)) {
      return message.reply('📜 El pergamino está vacío. Usa `>invocar` para agregar melodías.');
    }

    const embed = new EmbedBuilder()
      .setTitle('📜 Pergamino de Hibiki — Melodías del Reino')
      .setColor(0x8b0000)
      .setFooter({ text: '響 Hibiki — El eco del reino' });

    if (queue.songs.length === 0) {
      embed.setDescription('_No aguardan más melodías en el pergamino._');
    } else {
      const lines = queue.songs.slice(0, 10).map((song, i) =>
        `**${i + 1}.** ${song.title} \`[${song.duration}]\`\n　　↳ Solicitado por ${song.requestedBy}`
      );
      if (queue.songs.length > 10) {
        lines.push(`\n_...y ${queue.songs.length - 10} melodía(s) más aguardan_`);
      }
      embed.setDescription(lines.join('\n'));
      embed.addFields({ name: 'En espera', value: `${queue.songs.length} melodía(s)`, inline: true });
    }

    message.reply({ embeds: [embed] });
  },
};
