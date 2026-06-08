const { createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const { spawn } = require('child_process');
const { queues, DISCONNECT_TIMEOUT } = require('./queue');

const YTDLP_PATH = process.platform === 'win32'
  ? require('yt-dlp-exec/src/constants').YOUTUBE_DL_PATH
  : 'yt-dlp';

function spawnStream(url) {
  const isSCSearch = url.startsWith('scsearch');
  const args = [
    '-f', 'bestaudio/best',
    '-o', '-',
    '--quiet',
    '--no-warnings',
  ];

  if (isSCSearch) {
    args.push('--ignore-errors', '--max-downloads', '1');
  } else {
    args.push('--no-playlist');
  }

  args.push(url);

  const proc = spawn(YTDLP_PATH, args);
  proc.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.error('[yt-dlp]', msg);
  });
  return proc;
}

async function playSong(guildId, song, textChannel) {
  const queue = queues.get(guildId);
  if (!queue) return;

  try {
    console.log('[Hibiki] Streaming:', song.url);

    const proc = spawnStream(song.url);
    const resource = createAudioResource(proc.stdout, { inputType: StreamType.Arbitrary });

    queue.player.play(resource);
    queue.isPlaying = true;

    if (queue.disconnectTimer) {
      clearTimeout(queue.disconnectTimer);
      queue.disconnectTimer = null;
    }

    textChannel.send(`🎵 **${song.title}** \`[${song.duration}]\`\n　　↳ Convocado por ${song.requestedBy}`);

    queue.player.once(AudioPlayerStatus.Idle, () => {
      queue.isPlaying = false;
      proc.kill();

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
