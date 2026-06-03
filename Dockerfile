FROM node:22-slim

# python-is-python3 crea el symlink /usr/bin/python que necesita yt-dlp-exec al instalarse
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["node", "src/index.js"]
