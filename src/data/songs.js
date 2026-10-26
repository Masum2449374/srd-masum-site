// Audio songs shown in the "Hindi Songs" section (plays through the shared mini-player).
// To add a song: upload the full-quality mp3 to the srd-masum-songs repo and add one entry below.
// Optional per song: artist (default SRD Masum), cover (square art for players/share card), thumb, artwork512.
// id must be unique, src is the jsDelivr URL, duration is in seconds (shown without loading the file).
export const AUDIO_TRACKS = [
  { id: "laal-cover", artist: "SRD Masum", cover: "/covers/laal-dupatta.jpg", coverWebp: "/covers/laal-dupatta.webp", thumb: "/covers/laal-dupatta-96.jpg", artwork512: "/covers/laal-dupatta-512.jpg", title: "Laal Dupatta", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/laal-dupatta-cover.mp3", duration: 74.53 },
  { id: "pehla-pehla-pyar-cover", artist: "SRD Masum", cover: "/covers/pehla-pehla-pyar.jpg", coverWebp: "/covers/pehla-pehla-pyar.webp", thumb: "/covers/pehla-pehla-pyar-96.jpg", artwork512: "/covers/pehla-pehla-pyar-512.jpg", title: "Pehla Pehla Pyar", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/pehla-pehla-pyar-cover.mp3", duration: 181.63 },
  // Hosted on the site itself (Cloudflare Pages, same origin). cover = per-song art; artist is per song.
  { id: "aashiqana", title: "Aashiqana", artist: "SRD Masum", src: "/audio/aashiqana.mp3", cover: "/covers/aashiqana.jpg", thumb: "/covers/aashiqana-96.jpg", artwork512: "/covers/aashiqana-512.jpg", duration: 194.3 },
];
