const SPOTIFY_API = 'https://api.spotify.com/v1';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify auth error ${res.status}`);
  const data = await res.json();

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function getArtistTopTracks(artistName, limit = 10) {
  const token = await getAccessToken();

  const searchRes = await fetch(
    `${SPOTIFY_API}/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!searchRes.ok) throw new Error(`Spotify search error ${searchRes.status}`);
  const searchData = await searchRes.json();

  const artist = searchData.artists?.items?.[0];
  if (!artist) return null;

  const tracksRes = await fetch(
    `${SPOTIFY_API}/artists/${artist.id}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!tracksRes.ok) throw new Error(`Spotify top-tracks error ${tracksRes.status}`);
  const tracksData = await tracksRes.json();

  return {
    artistName: artist.name,
    tracks: tracksData.tracks.slice(0, limit).map(t => ({
      name: t.name,
      query: `${t.name} ${t.artists.map(a => a.name).join(' ')}`,
    })),
  };
}

module.exports = { getArtistTopTracks };
