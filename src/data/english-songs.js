// "Top English Hits" page (/english/). Plays through the shared mini-player; the queue stays inside
// this page's playlist (playlist: "english").
// To add a song: put the mp3 in public/audio/english/<id>.mp3 and covers in public/covers/english/
// (<id>.jpg 800px, <id>.webp, <id>-512.jpg, <id>-96.jpg), then add one entry below.
// credits: only facts confirmed from the file tags or a verified source. links: only verified URLs.
// ENGLISH_ORIGINALS: SRD Masum's own English songs (shown highlighted on top; hidden while empty).
const P = "english";
const c = (id) => ({ cover: `/covers/english/${id}.jpg`, coverWebp: `/covers/english/${id}.webp`, thumb: `/covers/english/${id}-96.jpg`, artwork512: `/covers/english/${id}-512.jpg` });

export const ENGLISH_ORIGINALS = [
  // { id: "my-song", title: "My Song", artist: "SRD Masum", src: "/audio/english/my-song.mp3", duration: 180, original: true, playlist: P, ...c("my-song") },
];

export const ENGLISH_TRACKS = [
  {
    id: "housewife", title: "Housewife", artist: "Tate McRae", album: "Housewife",
    src: "/audio/english/housewife.mp3", duration: 209.14, playlist: P, ...c("housewife"),
    links: { spotify: "https://open.spotify.com/track/2sFepQNyl1WjpROruP8bJ0" },
  },
];

export const ENGLISH_ALL = [...ENGLISH_ORIGINALS, ...ENGLISH_TRACKS];
