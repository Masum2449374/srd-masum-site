// Audio songs shown in the "Hindi Songs" section (plays through the shared mini-player).
// To add a song: upload the full-quality mp3 to the srd-masum-songs repo and add one entry below.
// Optional per song: artist (default SRD Masum), cover (square art for players/share card), thumb, artwork512.
// id must be unique, src is the jsDelivr URL, duration is in seconds (shown without loading the file).
export const AUDIO_TRACKS = [
  { id: "laal-cover", artist: "SRD Masum", cover: "/covers/laal-dupatta.jpg", coverWebp: "/covers/laal-dupatta.webp", thumb: "/covers/laal-dupatta-96.jpg", artwork512: "/covers/laal-dupatta-512.jpg", title: "Laal Dupatta", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/laal-dupatta-cover.mp3", duration: 74.53 },
  { id: "dekha-tenu-pehli-pehli", title: "Dekha Tenu Pehli Pehli", artist: "Anurati Roy", album: "Dekha Tenu Pehli Pehli", label: "Songs Cloud", cover: "/covers/dekha-tenu-pehli-pehli.jpg", coverWebp: "/covers/dekha-tenu-pehli-pehli.webp", thumb: "/covers/dekha-tenu-pehli-pehli-96.jpg", artwork512: "/covers/dekha-tenu-pehli-pehli-512.jpg", spotifyUrl: "https://open.spotify.com/search/Dekha%20Tenu%20Pehli%20Pehli%20Anurati%20Roy", youtubeUrl: "https://www.youtube.com/watch?v=7aG3OcN5tnc", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/pehla-pehla-pyar-cover.mp3", duration: 181.63 }, // Valentine's Day Mashup with Suraj Hua Maddham; (P) 2023 Songs Cloud, released 2023-02-09. Official video: ic-D7rAWa6E (Hindi Unplugged World)
  // Hosted on the site itself (Cloudflare Pages, same origin). cover = per-song art; artist is per song.
  { id: "aashiqana", title: "Aashiqana", artist: "SRD Masum", src: "/audio/aashiqana.mp3", cover: "/covers/aashiqana.jpg", thumb: "/covers/aashiqana-96.jpg", artwork512: "/covers/aashiqana-512.jpg", duration: 194.3 },
];
