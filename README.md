# dabot — Bot de música para Discord

Bot de música para Discord construido con `discord.js v14`, `@discordjs/voice` y `play-dl`.

## Requisitos

- **Node.js** >= 18.0.0
- **ffmpeg** instalado en el sistema y disponible en `PATH`
  - Windows: descarga desde https://ffmpeg.org/download.html y agrega al PATH
  - Linux: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
- Una aplicación de Discord en el [Portal de Desarrolladores](https://discord.com/developers/applications)

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo .env a partir del ejemplo
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
BOT_TOKEN=tu_token_aqui
CLIENT_ID=id_de_tu_aplicacion
GUILD_ID=id_de_tu_servidor
```

**Dónde encontrar cada valor:**
- `BOT_TOKEN`: Portal de Desarrolladores → Tu app → Bot → Token
- `CLIENT_ID`: Portal de Desarrolladores → Tu app → General Information → Application ID
- `GUILD_ID`: Click derecho sobre tu servidor en Discord → Copiar ID (necesitas modo desarrollador activado)

## Registrar los comandos slash

Ejecuta esto **una sola vez** (o cada vez que agregues/modifiques comandos):

```bash
npm run deploy
```

## Iniciar el bot

```bash
# Producción
npm start

# Desarrollo (reinicia al guardar cambios)
npm run dev
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `/play <query>` | Reproduce una canción por URL de YouTube o texto de búsqueda |
| `/skip` | Salta la canción actual |
| `/stop` | Detiene la reproducción y desconecta al bot |
| `/queue` | Muestra la cola de canciones |
| `/pause` | Pausa la canción actual |
| `/resume` | Reanuda la reproducción pausada |

## Notas

- El bot se desconecta automáticamente si la cola queda vacía por **30 segundos**.
- Para búsquedas de texto, play-dl usa YouTube internamente. Si encuentras errores de rate-limit,
  puedes autenticar play-dl con cookies siguiendo la [documentación oficial](https://github.com/play-dl/play-dl/tree/main/instructions#youtube-cookies).

## Estructura del proyecto

```
src/
├── commands/
│   ├── play.js
│   ├── skip.js
│   ├── stop.js
│   ├── queue.js
│   ├── pause.js
│   └── resume.js
├── events/
│   ├── ready.js
│   └── interactionCreate.js
├── music/
│   ├── queue.js     # GuildQueue + mapa de colas activas
│   └── player.js    # Lógica de reproducción y encadenamiento
└── index.js
deploy-commands.js
.env
```
# hibiki
