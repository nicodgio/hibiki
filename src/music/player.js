const { createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const { spawn } = require('child_process');
const { writeFileSync } = require('fs');
const { queues, DISCONNECT_TIMEOUT } = require('./queue');

const COOKIE_FILE = '/tmp/yt-cookies.txt';
let hasCookieFile = false;

try {
  const cookieStr = process.env.YOUTUBE_COOKIE;
  if (cookieStr) {
    const lines = ['# Netscape HTTP Cookie File'];
    for (const part of cookieStr.split(';')) {
      const trimmed = part.trim();
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const name = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1);
      lines.push(`.youtube.com\tTRUE\t/\tFALSE\t2147483647\t${name}\t${value}`);
    }
    writeFileSync(COOKIE_FILE, lines.join('\n') + '\n');
    hasCookieFile = true;
    console.log('[Hibiki] Cookie file listo con', lines.length - 1, 'cookies.');
  }
} catch (err) {
  console.error('[Hibiki] Error creando cookie file:', err.message);
}

function spawnYtdlp(url) {
  let binary = 'yt-dlp';

  if (process.platform === 'win32') {
    try {
      const { YOUTUBE_DL_PATH } = require('yt-dlp-exec/src/constants');
      binary = YOUTUBE_DL_PATH;
    } catch {
      binary = 'yt-dlp';
    }
  }

  const args = [
    url,
    '-o', '-',
    '-f', 'bestaudio',
    '--extractor-args', 'youtube:player_client=android',
    '--quiet',
    '--no-warnings',
  ];

  if (hasCookieFile) {
    args.push('--cookies', COOKIE_FILE);
  }

  return spawn(binary, args);
}

async function playSong(guildId, song, textChannel) {
  const queue = queues.get(guildId);
  if (!queue) return;

  try {
    console.log('[Hibiki] Streaming:', song.url);

    const ytProcess = spawnYtdlp(song.url);

    if (!ytProcess.stdout) throw new Error('yt-dlp no produjo stdout');

    ytProcess.stderr.on('data', d => console.error('[yt-dlp]', d.toString().trim()));
    ytProcess.on('exit', (code) => console.log(`[yt-dlp] salió con código ${code}`));

    const resource = createAudioResource(ytProcess.stdout, {
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
