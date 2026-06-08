const play = require('play-dl');
const { getOrCreateQueue } = require('../music/queue');
const { playSong } = require('../music/player');

module.exports = {
  name: 'mix',
  aliases: ['artista', 'art'],
  async execute(message, args) {
    const voiceChannel = message.member.voice?.channel;
    if (!voiceChannel) {
      return message.reply('⚔️ Debes estar en una cámara de voz para invocar a Hibiki.');
    }

    const perms = voiceChannel.permissionsFor(message.client.user);
    if (!perms.has('Connect') || !perms.has('Speak')) {
      return message.reply('🚫 Hibiki no tiene permiso para acceder a esa cámara.');
    }

    // Soporte para >mix Artista [cantidad]  (cantidad opcional, default 10, max 20)
    let limit = 10;
    const lastArg = args[args.length - 1];
    if (/^\d+$/.test(lastArg)) {
      limit = Math.min(parseInt(lastArg, 10), 20);
      args = args.slice(0, -1);
    }

    const artistQuery = args.join(' ');
    if (!artistQuery) {
      return message.reply('📜 Indica el nombre de un artista.\n> Ejemplo: `>mix Bad Bunny` o `>mix Eminem 5`');
    }

    const aviso = await message.reply(`🎐 El heraldo parte en busca de las mejores melodías de **${artistQuery}**...`);

    let results;
    try {
      results = await play.search(artistQuery, {
        source: { soundcloud: 'tracks' },
        limit,
      });
    } catch (err) {
      console.error('[Hibiki Mix Error]', err);
      return aviso.edit('⚠️ Los mensajeros fallaron al buscar las melodías. Inténtalo de nuevo.');
    }

    if (!results.length) {
      return aviso.edit(`📜 No se encontraron melodías para **${artistQuery}**.`);
    }

    const songs = results.map(t => ({
      title: t.name,
      url: `scsearch5:${t.name}`,
      duration: formatDuration(t.durationInSec),
      requestedBy: message.author.tag,
    })).filter(s => s.url);

    let queue;
    try {
      queue = await getOrCreateQueue(message, voiceChannel);
    } catch (err) {
      console.error('[Voice Connection Error]', err?.message);
      return aviso.edit('🌩️ Hibiki no pudo llegar a la cámara de voz. Inténtalo de nuevo.');
    }

    for (const song of songs) queue.addSong(song);

    if (!queue.isPlaying) {
      const song = queue.shiftSong();
      await aviso.edit(
        `🎴 Mix de **${artistQuery}** — **${songs.length} melodías** invocadas.\n` +
        `　　↳ Comenzando con: **${song.title}**`
      );
      playSong(message.guildId, song, message.channel);
    } else {
      await aviso.edit(
        `📜 Mix de **${artistQuery}** — **${songs.length} melodías** añadidas al pergamino.`
      );
    }
  },
};

function formatDuration(seconds) {
  if (!seconds) return 'En vivo';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
