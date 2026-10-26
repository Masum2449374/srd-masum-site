// "Top English Hits" page (/english/). Plays through the shared mini-player; the queue stays inside
// this page's playlist (playlist: "english").
// To add a song: put the mp3 in public/audio/english/<id>.mp3 and covers in public/covers/english/
// (<id>.jpg 800px, <id>.webp, <id>-512.jpg, <id>-96.jpg), then add one entry below.
// credits: only facts confirmed from the file tags or a verified source. links: only verified URLs.
// spotifyUrl / youtubeUrl: official, verified URLs only. Never copy lyrics text of cover songs here.
// Originals can carry in-site synced lyrics like the Bangla songs: lyrics (text), lyricTimes, lyricEnds.
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
    spotifyUrl: "https://open.spotify.com/track/2sFepQNyl1WjpROruP8bJ0",
    youtubeUrl: "https://www.youtube.com/watch?v=DPEodkHzH-s", // TateMcRaeVEVO, "Housewife (Official Video)"
  },
  {
    id: "nicole-kidman", title: "Nicole Kidman", artist: "ADÉLA", album: "PRIMA", explicit: true,
    src: "/audio/english/nicole-kidman.mp3", duration: 221.33, playlist: P, ...c("nicole-kidman"),
    spotifyUrl: "https://open.spotify.com/track/70cHKK8bHAfJrOGVnfRG9J",
    youtubeUrl: "https://www.youtube.com/watch?v=3sB4Iv_tM7U", // AdelaMusicVEVO, "ADÉLA - Nicole Kidman"
  },
  {
    id: "stop-the-wedding", title: "Stop The Wedding!", artist: "Ashe", album: "Stop The Wedding!",
    src: "/audio/english/stop-the-wedding.mp3", duration: 208.3, playlist: P, ...c("stop-the-wedding"),
    spotifyUrl: "https://open.spotify.com/track/3zOYmiNOuyDL0ClxJcEJ0T",
    youtubeUrl: "https://www.youtube.com/watch?v=DLV8FpyxZPQ", // Ashe (official channel), "Stop The Wedding! (Official Video)"
  },
  {
    id: "aint-in-la", title: "Ain't In LA", artist: "ADÉLA", album: "PRIMA",
    src: "/audio/english/aint-in-la.mp3", duration: 219.29, playlist: P, ...c("nicole-kidman"), // same PRIMA cover
    spotifyUrl: "https://open.spotify.com/track/6U9VpmP3dEinuezxCJ2Zg9",
    youtubeUrl: "https://www.youtube.com/watch?v=0ijm2Xui5N8", // AdelaMusicVEVO
  },
  {
    id: "drop-dead", title: "drop dead", artist: "Olivia Rodrigo", album: "drop dead",
    src: "/audio/english/drop-dead.mp3", duration: 250.15, playlist: P, ...c("drop-dead"),
    spotifyUrl: "https://open.spotify.com/track/6gkbtMtioHgtyGjrMel6ei",
    youtubeUrl: "https://www.youtube.com/watch?v=78wrful9cVU", // OliviaRodrigoVEVO
  },
  {
    id: "jenny-was-a-friend-of-mine", title: "Jenny Was A Friend Of Mine", artist: "The Killers", album: "Hot Fuss",
    src: "/audio/english/jenny-was-a-friend-of-mine.mp3", duration: 243.94, playlist: P, ...c("jenny-was-a-friend-of-mine"),
    spotifyUrl: "https://open.spotify.com/track/60eVCXFCuw1WYswBuNZc4H",
    youtubeUrl: "https://www.youtube.com/watch?v=MQwu08Sc2vA", // The Killers - Topic (official audio; no music video exists)
  },
  {
    id: "sweater-weather", title: "Sweater Weather", artist: "The Neighbourhood", album: "I Love You.",
    src: "/audio/english/sweater-weather.mp3", duration: 252.38, playlist: P, ...c("sweater-weather"),
    spotifyUrl: "https://open.spotify.com/track/0cQVqPuHQP4KEwc7ZUQmj6",
    youtubeUrl: "https://www.youtube.com/watch?v=GCdwKhTtNNw", // TheNeighbourhoodVEVO, "Sweater Weather (Official Video)"
  },
  {
    id: "iris", title: "Iris", artist: "The Goo Goo Dolls", album: "Dizzy Up the Girl",
    src: "/audio/english/iris.mp3", duration: 289.92, playlist: P, ...c("iris"),
    spotifyUrl: "https://open.spotify.com/track/2mtVxf50BYsKNtQoz8sfzm",
    youtubeUrl: "https://www.youtube.com/watch?v=NdYWuo9OFAw", // Goo Goo Dolls (official), "Iris [Official Music Video] [4K Remaster]"
  },
  {
    id: "patient-zero", title: "Patient Zero", artist: "Taylor Swift", album: "The Life of a Showgirl: The Encore",
    src: "/audio/english/patient-zero.mp3", duration: 225.89, playlist: P, ...c("patient-zero"),
    spotifyUrl: "https://open.spotify.com/track/11hcBLPtbMp4aQI6zGQLub",
    youtubeUrl: "https://www.youtube.com/watch?v=mw3kSNIxjqo", // Taylor Swift, "Patient Zero (Official Music Video)"
  },
  {
    id: "loser", title: "Loser", artist: "Tame Impala", album: "Loser", explicit: true,
    src: "/audio/english/loser.mp3", duration: 223.08, playlist: P, ...c("loser"),
    spotifyUrl: "https://open.spotify.com/track/3RmFPuTTAjSQ2pbEd2j9oA",
    youtubeUrl: "https://www.youtube.com/watch?v=s3a4OQR-10M", // tameimpalaVEVO, "Loser (Official Video)"
  },
];

export const ENGLISH_ALL = [...ENGLISH_ORIGINALS, ...ENGLISH_TRACKS];
