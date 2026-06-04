const play = require('play-dl');
const { queues, getOrCreateQueue } = require('../music/queue');
const { playSong } = require('../music/player');
const { getArtistTopTracks } = require('../music/spotify');

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

    console.log('[Spotify ENV] ID:', process.env.SPOTIFY_CLIENT_ID ? 'OK' : 'MISSING', '| SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'OK' : 'MISSING');
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return message.reply('⚠️ Las credenciales de Spotify no están configuradas en el servidor.');
    }

    const aviso = await message.reply(`🎐 El heraldo parte en busca de las mejores melodías de **${artistQuery}**...`);

    let artistData;
    try {
      artistData = await getArtistTopTracks(artistQuery, limit);
    } catch (err) {
      console.error('[Hibiki Mix Spotify Error]', err);
      return aviso.edit('⚠️ No se pudo consultar el archivo de melodías de Spotify. Inténtalo de nuevo.');
    }

    if (!artistData) {
      return aviso.edit(`📜 No se encontró ningún artista llamado **${artistQuery}** en los archivos.`);
    }

    await aviso.edit(`🎐 Buscando las melodías de **${artistData.artistName}** en los pergaminos de YouTube...`);

    // Buscar cada track en YouTube en paralelo
    const results = await Promise.allSettled(
      artistData.tracks.map(track =>
        play.search(track.query, { source: { youtube: 'video' }, limit: 1 })
          .then(res => {
            if (!res.length) return null;
            const video = res[0];
            const url = video.url ?? `https://www.youtube.com/watch?v=${video.id}`;
            if (!url || url.includes('undefined')) return null;
            return {
              title: video.title,
              url,
              duration: formatDuration(video.durationInSec),
              requestedBy: message.author.tag,
            };
          })
      )
    );

    const songs = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    if (!songs.length) {
      return aviso.edit('📜 No se encontraron melodías en YouTube para este artista.');
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
      await aviso.edit(
        `🎴 Mix de **${artistData.artistName}** — **${songs.length} melodías** invocadas.\n` +
        `　　↳ Comenzando con: **${song.title}**`
      );
      playSong(message.guildId, song, message.channel);
    } else {
      await aviso.edit(
        `📜 Mix de **${artistData.artistName}** — **${songs.length} melodías** añadidas al pergamino.`
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
