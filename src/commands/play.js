const play = require('play-dl');
const { getOrCreateQueue } = require('../music/queue');
const { playSong } = require('../music/player');

module.exports = {
  name: 'invocar',
  aliases: ['inv'],
  async execute(message, args) {
    const voiceChannel = message.member.voice?.channel;
    if (!voiceChannel) {
      return message.reply('⚔️ Debes estar en una cámara de voz para invocar a Hibiki.');
    }

    const perms = voiceChannel.permissionsFor(message.client.user);
    if (!perms.has('Connect') || !perms.has('Speak')) {
      return message.reply('🚫 Hibiki no tiene permiso para acceder a esa cámara.');
    }

    const query = args.join(' ');
    if (!query) {
      return message.reply('📜 Indica una melodía o URL de playlist.\n> Ejemplo: `>invocar nombre de canción`');
    }

    const aviso = await message.reply('🎐 El mensajero parte en busca de la melodía...');

    let songs = [];
    try {
      const validated = play.yt_validate(query);

      if (validated === 'playlist') {
        await aviso.edit('🎐 Desenrollando el pergamino de la playlist...');
        const playlistInfo = await play.playlist_info(query, { incomplete: true });
        const videos = await playlistInfo.all_videos();
        if (!videos.length) return aviso.edit('📜 La playlist está vacía o no es accesible.');
        songs = videos.slice(0, 50).map(v => ({
          title: v.title,
          url: v.url,
          duration: formatDuration(v.durationInSec),
          requestedBy: message.author.tag,
        }));
      } else {
        // Buscar en SoundCloud para evitar bloqueos de YouTube en el servidor
        const results = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
        if (!results.length) return aviso.edit('📜 Los pergaminos no contienen tal melodía.');
        const track = results[0];
        songs = [{
          title: track.name,
          url: `scsearch5:${track.name}`,
          duration: formatDuration(track.durationInSec),
          requestedBy: message.author.tag,
        }];
      }
    } catch (err) {
      console.error('[Hibiki Invoke Error]', err);
      return aviso.edit('⚠️ Los mensajeros fallaron al buscar la melodía. Inténtalo de nuevo.');
    }

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
      const extra = songs.length > 1 ? ` (+${songs.length - 1} en pergamino)` : '';
      await aviso.edit(`🎴 Hibiki desenrolla el pergamino... **${song.title}** comenzará a sonar.${extra}`);
      playSong(message.guildId, song, message.channel);
    } else if (songs.length > 1) {
      await aviso.edit(`📜 **${songs.length} melodías** añadidas al pergamino.`);
    } else {
      await aviso.edit(
        `📜 Añadido al pergamino (#${queue.songs.length}): **${songs[0].title}** \`[${songs[0].duration}]\``
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
