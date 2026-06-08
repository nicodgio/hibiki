const { createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const { queues, DISCONNECT_TIMEOUT } = require('./queue');

let ytdlAgent = null;

const cookieStr = process.env.YOUTUBE_COOKIE;
if (cookieStr) {
  try {
    const cookies = [];
    for (const part of cookieStr.split(';')) {
      const trimmed = part.trim();
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      cookies.push({
        name: trimmed.slice(0, eq).trim(),
        value: trimmed.slice(eq + 1),
        domain: '.youtube.com',
        path: '/',
        httpOnly: false,
        secure: true,
      });
    }
    ytdlAgent = ytdl.createAgent(cookies);
    console.log('[Hibiki] ytdl agent listo con', cookies.length, 'cookies.');
  } catch (err) {
    console.error('[Hibiki] Error creando ytdl agent:', err.message);
  }
}

async function playSong(guildId, song, textChannel) {
  const queue = queues.get(guildId);
  if (!queue) return;

  try {
    console.log('[Hibiki] Streaming:', song.url);

    const options = {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    };
    if (ytdlAgent) options.agent = ytdlAgent;

    const stream = ytdl(song.url, options);
    stream.on('error', err => console.error('[ytdl] Error de stream:', err.message));

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
    });

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
