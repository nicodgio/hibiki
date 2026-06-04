const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ayuda',
  aliases: ['ay'],
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('⛩️ Pergamino de Órdenes — 響 Hibiki')
      .setColor(0x8b0000)
      .setDescription(
        '🎴 **>invocar** `>inv` — Convoca una melodía, URL o playlist de YouTube\n' +
        '🎭 **>mix** `>artista` `>art` — Invoca el top de un artista *(>mix Bad Bunny 10)*\n' +
        '⚔️ **>siguiente** `>sig` — Descarta la melodía actual\n' +
        '🏯 **>disolver** `>dis` — Despide a Hibiki del salón\n' +
        '🏮 **>silencio** `>sil` — Ordena a Hibiki guardar silencio\n' +
        '⛩️ **>despertar** `>des` — Despierta a Hibiki\n' +
        '📜 **>pergamino** `>per` — Despliega el pergamino de canciones\n' +
        '🗺️ **>ayuda** `>ay` — Muestra este pergamino de órdenes'
      )
      .setFooter({ text: '響 Hibiki — El eco del reino  •  Prefijo: >' });

    message.reply({ embeds: [embed] });
  },
};
