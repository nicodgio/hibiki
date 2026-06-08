const { createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { queues, DISCONNECT_TIMEOUT } = require('./queue');

async function playSong(guildId, song, textChannel) {
  const queue = queues.get(guildId);
  if (!queue) return;

  try {
    console.log('[Hibiki] Streaming:', song.url);

    const stream = await play.stream(song.url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    queue.player.play(resource);
    queue.isPlaying = true;

    if (queue.disconnectTimer) {
      clearTimeout(queue.disconnectTimer);
      queue.disconnectTimer = null;
    }

    textChannel.send(`🎵 **${song.title}** \`[${song.duration}]\`\n　　↳ Convocado por ${song.requestedBy}`);

    queue.player.once(AudioPlayerStatus.Idle, () => {
      queue.isPlaying = false;

      if (queue.songs.length > 0) {
        playSong(guildId, queue.shiftSong(), textChannel);
      } else {
        textChannel.send('📜 El pergamino ha sido agotado. Hibiki aguardará 30 segundos antes de retirarse.');
        queue.disconnectTimer = setTimeout(() => {
          queue.destroy();
          queues.delete(guildId);
        }, DISCONNECT_TIMEOUT);
      }
    });
  } catch (err) {
    console.error('[Hibiki Player Error]', err.message);
    textChannel.send('⚠️ Un mal espíritu interrumpió la melodía. Convocando la siguiente...');

    if (queue.songs.length > 0) {
      playSong(guildId, queue.shiftSong(), textChannel);
    } else {
      queue.destroy();
      queues.delete(guildId);
    }
  }
}

module.exports = { playSong };
