const { createAudioPlayer, VoiceConnectionStatus, entersState, joinVoiceChannel } = require('@discordjs/voice');

const DISCONNECT_TIMEOUT = 30_000;
const queues = new Map();

class GuildQueue {
  constructor(guildId, voiceChannel, textChannel, connection) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.connection = connection;
    this.songs = [];
    this.player = createAudioPlayer();
    this.isPlaying = false;
    this.disconnectTimer = null;

    this.connection.subscribe(this.player);

    // Reconectar si se cae inesperadamente
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
        queues.delete(guildId);
      }
    });
  }

  addSong(song) {
    this.songs.push(song);
  }

  shiftSong() {
    return this.songs.shift();
  }

  destroy() {
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.songs = [];
    this.player.stop(true);
    if (this.connection.state.status !== 'destroyed') {
      this.connection.destroy();
    }
  }
}

async function getOrCreateQueue(message, voiceChannel) {
  const guildId = message.guildId;
  const existing = queues.get(guildId);
  if (existing) return existing;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: message.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  connection.on('stateChange', (o, n) => console.log(`[Voice] ${o.status} → ${n.status}`));

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch (err) {
    connection.destroy();
    throw err;
  }

  const queue = new GuildQueue(guildId, voiceChannel, message.channel, connection);
  queues.set(guildId, queue);
  return queue;
}

module.exports = { GuildQueue, queues, DISCONNECT_TIMEOUT, getOrCreateQueue };
