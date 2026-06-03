FROM node:22-slim

# Descargar yt-dlp standalone (no necesita Python para correr)
RUN apt-get update && apt-get install -y curl ca-certificates ffmpeg --no-install-recommends && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
         -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# --ignore-scripts evita que yt-dlp-exec corra su preinstall (chequeo de Python)
RUN npm ci --omit=dev --ignore-scripts

COPY . .

CMD ["node", "src/index.js"]
