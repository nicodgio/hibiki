const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');
const { GuildQueue, queues } = require('../music/queue');
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
      return message.reply('📜 Indica una melodía o URL.\n> Ejemplo: `>invocar nombre de canción`');
    }

    const aviso = await message.reply('🎐 El mensajero parte en busca de la melodía...');

    let songInfo;
    try {
      const isYouTubeUrl = play.yt_validate(query) === 'video';

      if (isYouTubeUrl) {
        const info = await play.video_info(query);
        songInfo = {
          title: info.video_details.title,
          url: info.video_details.url,
          duration: formatDuration(info.video_details.durationInSec),
          requestedBy: message.author.tag,
        };
      } else {
        const results = await play.search(query, { source: { youtube: 'video' }, limit: 1 });
        if (!results.length) return aviso.edit('📜 Los pergaminos no contienen tal melodía.');
        const video = results[0];
        const videoUrl = video.url ?? `https://www.youtube.com/watch?v=${video.id}`;
        if (!videoUrl || videoUrl.includes('undefined')) {
          return aviso.edit('📜 No fue posible resolver la melodía. Intenta con la URL directa.');
        }
        songInfo = {
          title: video.title,
          url: videoUrl,
          duration: formatDuration(video.durationInSec),
          requestedBy: message.author.tag,
        };
      }
    } catch (err) {
      console.error('[Hibiki Invoke Error]', err);
      return aviso.edit('⚠️ Los mensajeros fallaron al buscar la melodía. Inténtalo de nuevo.');
    }

    const guildId = message.guildId;
    let queue = queues.get(guildId);

    if (!queue) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      connection.on('stateChange', (o, n) => {
        console.log(`[Voice] ${o.status} → ${n.status}`);
      });

      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      } catch (err) {
        console.error('[Voice Connection Error]', err?.message);
        connection.destroy();
        return aviso.edit('🌩️ Hibiki no pudo llegar a la cámara de voz. Inténtalo de nuevo.');
      }

      queue = new GuildQueue(guildId, voiceChannel, message.channel, connection);
      queues.set(guildId, queue);
    }

    queue.addSong(songInfo);

    if (!queue.isPlaying) {
      const song = queue.shiftSong();
      await aviso.edit(`🎴 Hibiki desenrolla el pergamino... **${song.title}** comenzará a sonar.`);
      playSong(guildId, song, message.channel);
    } else {
      await aviso.edit(
        `📜 Añadido al pergamino (#${queue.songs.length}): **${songInfo.title}** \`[${songInfo.duration}]\``
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
