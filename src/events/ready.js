module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Hibiki está en línea como ${client.user.tag}`);
    client.user.setActivity('🎐 >invocar', { type: 2 }); // LISTENING
  },
};
