// Frutiger Metro: an iPod click wheel that steers the page, dancing silhouettes on a 120 BPM beat, an equalizer and a cover flow.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // Poses: built from a small rig, four held frames each.
  const POSES = {"a":[{"d":"M79.8 150.5L56.2 208L71.5 215.5L102.2 161.5ZM78.5 156a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM55.3 211.7a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM55.6 209.7L36.2 266.7L62.4 273.2L72.1 213.8ZM55.3 211.7a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM35.8 269.9a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM98.2 162.2L132.6 213.9L147.4 205.4L119.8 149.8ZM96.5 156a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM131.5 209.7a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM131.6 210.9L135 271L161.7 267.2L148.4 208.5ZM131.5 209.7a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM134.9 269.1a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM55.3 265.9L34.5 266.9L22.3 276.9L22.3 278.9L56.3 278.9ZM141.4 278.1L175.4 278.1L175.4 276.1L163.2 266.1L142.4 265.1ZM101.1 81.5L104.9 39.6L94.1 38.1L86.2 79.4ZM86.2 80.4a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM94 38.9a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM104.3 41.6L124 4.5L117 0.5L94.7 36.1ZM94 38.9a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM116.5 2.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM114.5 2.5a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM127.2 86.9L162.6 64.2L157.1 54.7L119.7 74ZM116 80.4a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM154.4 59.4a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM165 57.6L149.3 18.6L141.7 21.4L154.7 61.3ZM154.4 59.4a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM141.5 20a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM139.5 20a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM87 160L113 160L127.6 78.4L89.6 78.4ZM86.6 81.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM114.6 81.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM86 154a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM114.4 75.9L119.7 52.5L109 49.8L102.7 73ZM102.6 74.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM108.9 51.2a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM97.4 51.2a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM93.4 40.2a21 21 0 1 0 42 0a21 21 0 1 0 -42 0ZM84.4 45.2a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM114.4 45.2a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM91.4 32.2a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM110.4 32.2a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM84.4 56.2a10 10 0 1 0 20 0a10 10 0 1 0 -20 0ZM124.4 56.2a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z","x":"","c":"M123.4 54.2Q152.4 63.1 145.5 20M105.4 54.2Q114.4 85.2 152.4 55.1","p":"<rect x=\"139.5\" y=\"11\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M78 155.3L37.8 202.7L50 214.5L96 172.7ZM74.5 164a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM35.4 208.6a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM35.9 211.5L51.8 269.6L77.1 260.4L51.9 205.7ZM35.4 208.6a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM51 265a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM93.1 167.9L116.1 225.6L132.2 220.3L116.9 160.1ZM92.5 164a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM115.7 223a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM115.7 223.3L112.8 283.4L139.7 282.5L132.7 222.7ZM115.7 223a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM112.8 282.9a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM57.5 274L91.5 274L91.5 272L79.3 262L58.5 261ZM119.3 291.9L153.3 291.9L153.3 289.9L141.1 279.9L120.3 278.9ZM73.5 95.3L108.9 72.6L103.4 63L66 82.3ZM62.2 88.8a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM100.6 67.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM111.6 68L111.6 26L103.6 25.7L100.6 67.6ZM100.6 67.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM103.6 25.8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM101.6 25.8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM106.7 86.7L93.2 46.9L82.6 49.9L92.2 90.9ZM91.9 88.8a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM82.4 48.4a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM93.3 49.4L99.1 7.8L91.2 6.4L82.4 47.5ZM82.4 48.4a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM91.2 7.1a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM89.2 7.1a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM83 168L109 168L103.6 86.8L65.6 86.8ZM62.6 89.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM90.6 89.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM82 162a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM90.3 80.9L82.4 58.3L71.9 61.7L78.9 84.7ZM78.6 82.8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM71.7 60a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM60.2 60a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM56.2 49a21 21 0 1 0 42 0a21 21 0 1 0 -42 0ZM47.2 54a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM77.2 54a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM54.2 41a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM73.2 41a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM47.2 65a10 10 0 1 0 20 0a10 10 0 1 0 -20 0ZM87.2 65a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z","x":"","c":"M86.2 63Q108.7 61 95.2 7.1M68.2 63Q77.2 94 108.7 53","p":"<rect x=\"89.2\" y=\"-1.9\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M80.9 157L69.8 218.1L86.2 222.2L105.1 163ZM80.5 160a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM69.5 220.2a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM69.5 219.3L58.3 278.4L85.2 281.2L86.5 221ZM69.5 220.2a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM58.2 279.8a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM104 170.4L157.6 201.7L167.2 187.6L118 149.6ZM98.5 160a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM153.9 194.7a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM154.2 192.3L132.9 248.6L158.8 256.1L170.6 197ZM153.9 194.7a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM132.4 252.3a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM77.7 275.8L56.9 276.8L44.7 286.8L44.7 288.8L78.7 288.8ZM151.9 248.3L131 249.3L118.9 259.3L118.9 261.3L152.9 261.3ZM108.5 82.7L92.3 43.9L81.9 47.7L94.4 87.8ZM94 85.2a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM81.6 45.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM92.3 47.7L105.2 7.7L97.7 4.9L81.9 43.9ZM81.6 45.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM97.5 6.3a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM95.5 6.3a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM137.5 89L156.8 51.6L147.2 46.1L124.5 81.5ZM123.5 85.2a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM146.5 48.9a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM154.8 53.6L190.4 31.3L186.4 24.4L149.3 44.1ZM146.5 48.9a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM184.4 27.9a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM182.4 27.9a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM89 164L115 164L135.2 83.2L97.2 83.2ZM94.2 86.2a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM122.2 86.2a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM88 158a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM121.8 81.5L130.3 59.1L120.1 54.9L110.7 77ZM110.2 79.2a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM119.7 57a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM108.2 57a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM104.2 46a21 21 0 1 0 42 0a21 21 0 1 0 -42 0ZM95.2 51a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM125.2 51a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM102.2 38a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM121.2 38a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM95.2 62a10 10 0 1 0 20 0a10 10 0 1 0 -20 0ZM135.2 62a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z","x":"","c":"M134.2 60Q179.3 69.9 188.4 27.9M116.2 60Q125.2 91 179.3 61.9","p":"<rect x=\"182.4\" y=\"18.9\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M80.6 162.7L37.2 207.2L48.6 219.8L97.4 181.3ZM76.5 172a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM34.4 213.5a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM35.2 216.9L55 273.8L79.7 262.8L50.7 210ZM34.4 213.5a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM53.8 268.3a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM98.6 181.3L147.4 219.8L158.8 207.2L115.4 162.7ZM94.5 172a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM144.6 213.5a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM145.2 210.3L118.1 264.1L143.1 274.2L161 216.7ZM144.6 213.5a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM117.1 269.1a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM60.3 277.3L94.3 277.3L94.3 275.3L82.2 265.3L61.3 264.3ZM136.6 265.1L115.7 266.1L103.6 276.1L103.6 278.1L137.6 278.1ZM78.1 103.7L119.7 97.3L118.5 86.3L76.5 88.7ZM69.8 96.2a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM113.6 91.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM114.9 95.3L143 126.6L149.1 121.4L123.3 88.3ZM113.6 91.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM142.1 124a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM140.1 124a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM114.6 97.8L121.4 56.3L110.6 54L99.9 94.6ZM99.7 96.2a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0ZM110.5 55.1a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM120.6 52.2L97.1 17.4L90.3 21.6L111.3 58ZM110.5 55.1a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM89.7 19.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM87.7 19.5a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM85 176L111 176L111.3 94.2L73.3 94.2ZM70.3 97.2a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM98.3 97.2a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM84 170a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM98.2 89.2L93.5 65.6L82.7 67.5L86.4 91.2ZM86.3 90.2a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM82.6 66.6a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM71.1 66.6a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM67.1 55.6a21 21 0 1 0 42 0a21 21 0 1 0 -42 0ZM58.1 60.6a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM88.1 60.6a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM65.1 47.6a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM84.1 47.6a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM58.1 71.6a10 10 0 1 0 20 0a10 10 0 1 0 -20 0ZM98.1 71.6a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z","x":"","c":"M97.1 69.6Q113.4 70.5 93.7 19.5M79.1 69.6Q88.1 100.6 113.4 62.5","p":"<rect x=\"87.7\" y=\"10.5\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"}],"b":[{"d":"M80.7 156.2L74.3 218L86.1 220.1L101.3 159.8ZM80.5 158a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM74.2 219.1a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM74.3 218.4L69.5 278.3L78.4 279.2L86.2 219.7ZM74.2 219.1a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM69.5 278.7a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM100.5 164.2L140.6 211.7L150.3 204.6L117.5 151.8ZM98.5 158a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM139.4 208.2a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM139.7 206.3L122.6 263.8L131.2 266.6L151.1 210ZM139.4 208.2a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM122.4 265.2a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM80 274.7L59.1 275.7L47 285.7L47 287.7L81 287.7ZM132.9 261.2L112.1 262.2L99.9 272.2L99.9 274.2L133.9 274.2ZM77.7 86.6L105.8 55.4L100 49.8L69.8 79ZM68.2 82.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM98.9 52.6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM106.9 52.2L101.5 10.5L95.5 11.1L98.9 53ZM98.9 52.6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM95.5 10.8a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM92.5 10.8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM101.6 88L141.5 100.9L144.3 93.4L105.3 77.6ZM97.9 82.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM138.9 97.2a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM146 99.7L172.2 66.9L167.6 63.1L139.8 94.6ZM138.9 97.2a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM166.9 65a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM163.9 65a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM87 162L113 162L103.6 80.8L73.6 80.8ZM70.6 83.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM90.6 83.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM86 156a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM94.4 75.1L87.3 52.2L76.7 55.2L82.8 78.5ZM82.6 76.8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM76.5 53.7a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM65 53.7a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM65 46.7a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM58 196L78 190L92 200L110 190L134 196L113 146L87 146Z","x":"M69 41.7C42 27.7 20 51.7 24 85.7C36 67.7 50 55.7 70 55.7Z","c":"M91 56.7Q148.4 86.9 169.9 65M73 56.7Q82 87.7 148.4 78.9","p":"<rect x=\"163.9\" y=\"56\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M87 155.3L50.6 205.6L59.7 213.4L103 168.7ZM84.5 162a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM49.1 209.5a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM49.4 211.1L67.4 268.4L76 265.9L60.9 207.8ZM49.1 209.5a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM67.2 267.2a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM102.6 163.5L115.7 224.2L127.6 222.6L123.4 160.5ZM102.5 162a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM115.6 223.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM115.6 223.8L121.3 283.6L130.3 282.9L127.6 223ZM115.6 223.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM121.3 283.3a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM64.7 276.2L98.7 276.2L98.7 274.2L86.5 264.2L65.7 263.2ZM118.8 292.3L152.8 292.3L152.8 290.3L140.7 280.3L119.8 279.3ZM96.3 90.3L124.5 121.5L130.6 116.4L104.8 83.3ZM95.1 86.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM123.6 119a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM128.9 122.7L168 107.4L166 101.8L126.2 115.2ZM123.6 119a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM164 104.6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM161 104.6a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM135 89.5L154.7 52.4L147.8 48.4L125.5 84ZM124.8 86.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM147.3 50.4a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM155.2 49.7L146.9 8.5L141 9.6L147.3 51.1ZM147.3 50.4a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM141 9.1a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM138 9.1a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM91 166L117 166L130.4 84.8L100.4 84.8ZM97.4 87.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM117.4 87.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM90 160a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM121.2 82.5L127.3 59.2L116.7 56.2L109.6 79.1ZM109.4 80.8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM116.5 57.7a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM105 57.7a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM105 50.7a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM72 200L92 194L106 204L124 194L148 200L117 150L91 150Z","x":"M135 45.7C162 31.7 184 55.7 180 89.7C168 71.7 154 59.7 134 59.7Z","c":"M131 60.7Q155.5 60.9 144 9.1M113 60.7Q122 91.7 155.5 52.9","p":"<rect x=\"138\" y=\"0.1\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M80.6 154.9L78.6 217L90.5 218.3L101.4 157.1ZM80.5 156a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM78.5 217.7a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM79.3 220.7L110.6 271.9L118.4 267.4L89.7 214.7ZM78.5 217.7a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM110 269.6a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM99.4 160.3L128.7 215.1L139.7 210.2L118.6 151.7ZM98.5 156a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM128.2 212.6a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM128.2 213.1L133.9 272.8L142.9 272.2L140.2 212.2ZM128.2 212.6a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM133.9 272.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM107.5 278.6L141.5 278.6L141.5 276.6L129.4 266.6L108.5 265.6ZM131.4 281.5L165.4 281.5L165.4 279.5L153.3 269.5L132.4 268.5ZM84.8 80.6L86.2 38.6L78.3 38L73.8 79.8ZM73.8 80.2a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM78.2 38.3a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM85.6 40.4L107 4.3L102 1.1L78.9 36.2ZM78.2 38.3a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM101.5 2.7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM98.5 2.7a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM114.7 80.4L114.7 38.4L106.7 38.1L103.7 80ZM103.7 80.2a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM106.7 38.2a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM114.1 36.1L91 1L85.9 4.2L107.3 40.3ZM106.7 38.2a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM85.5 2.6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM82.5 2.6a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM87 160L113 160L109.3 78.2L79.3 78.2ZM76.3 81.2a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM96.3 81.2a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM86 154a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM100.2 73.4L96.4 49.7L85.5 51.2L88.3 75ZM88.3 74.2a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM85.4 50.4a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM73.9 50.4a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM73.9 43.4a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM62 194L82 188L96 198L114 188L138 194L113 144L87 144Z","x":"M77.9 38.4C50.9 24.4 28.9 48.4 32.9 82.4C44.9 64.4 58.9 52.4 78.9 52.4Z","c":"M99.9 53.4Q112.2 54 88.5 2.6M81.9 53.4Q90.9 84.4 112.2 46","p":"<rect x=\"82.5\" y=\"-6.4\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M80.3 158.1L49.4 212L59.3 218.8L97.7 169.9ZM78.5 164a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM48.3 215.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM48.4 216.4L60.3 275.3L69.2 273.7L60.2 214.4ZM48.3 215.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM60.2 274.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM98.3 169.9L136.7 218.8L146.6 212L115.7 158.1ZM96.5 164a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM135.7 215.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM135.7 214.8L130.9 274.6L139.9 275.5L147.6 216ZM135.7 215.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM130.9 275.1a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM70.7 270.5L49.9 271.5L37.7 281.5L37.7 283.5L71.7 283.5ZM141.4 271.1L120.5 272.1L108.4 282.1L108.4 284.1L142.4 284.1ZM101.3 95.2L142.4 86.4L141 78.6L99.4 84.4ZM94.9 89.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM137.7 82.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM145.5 83.9L158.9 44.1L153.3 42L138 81.1ZM137.7 82.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM153.1 43a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM150.1 43a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM127 94.6L164.1 114.3L168.1 107.3L132.5 85ZM124.2 89.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM162.1 110.8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM162.3 112.2L177.6 151.3L183.3 149.2L169.9 109.4ZM162.1 110.8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0ZM177.5 150.3a3 3 0 1 0 6 0a3 3 0 1 0 -6 0ZM174.5 150.3a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM85 168L111 168L130 87.8L100 87.8ZM97 90.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM117 90.8a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM84 162a14 14 0 1 0 28 0a14 14 0 1 0 -28 0ZM120.8 85.6L127.7 62.7L117.2 59.3L109.3 81.9ZM109 83.8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM117 61a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM105.5 61a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM105.5 54a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM54 202L74 196L88 206L106 196L130 202L111 152L85 152Z","x":"M135.5 49C162.5 35 184.5 59 180.5 93C168.5 75 154.5 63 134.5 63Z","c":"M131.5 64Q174 133.1 180.5 150.3M113.5 64Q122.5 95 174 125.1","p":"<rect x=\"174.5\" y=\"141.3\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"}],"c":[{"d":"M80.8 162.9L29.8 198.3L43 219.5L97.2 189.1ZM73.5 176a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM23.9 208.9a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM25.6 215.1L53.4 268.3L79.4 253.3L47.2 202.6ZM23.9 208.9a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM51.4 260.8a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM95.5 186.4L139.2 230.4L157.8 213.7L118.5 165.6ZM91.5 176a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM136 222.1a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM136.2 219.9L123.3 278.6L152.8 283.8L160.8 224.2ZM136 222.1a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM123.1 281.2a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM59.4 269.8L93.4 269.8L93.4 267.8L81.3 257.8L60.4 256.8ZM144.1 277.2L123.2 278.2L111.1 288.2L111.1 290.2L145.1 290.2ZM59.4 109.8L96.7 129.1L103.2 117.8L67.9 95.1ZM55.1 102.4a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM93.5 123.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM106.1 125.7L118.6 85.5L110.1 82.4L93.9 121.2ZM93.5 123.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM109.8 84a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM108.3 84a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM97 109.8L132.3 87.1L125.8 75.8L88.5 95.1ZM84.2 102.4a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM122.6 81.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM125.8 87.1L163.2 106.3L167.7 98.5L132.3 75.8ZM122.6 81.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM161 102.4a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM159.5 102.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM82 180L114 180L101.2 100.4L55.2 100.4ZM52.2 103.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM88.2 103.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM81 174a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM83.8 94.4L75.1 72L64.8 75.8L72.5 98.5ZM72.2 96.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM64.5 73.9a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM53 73.9a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM68 194L128 194L122 152L74 152Z","x":"M52 69.9A18 18 0 0 1 88 69.9L110 72.9L87 76.9L52 75.9Z","c":"M79 76.9Q140.2 115.7 165.5 102.4M61 76.9Q70 107.9 140.2 107.7","p":"<rect x=\"159.5\" y=\"93.4\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M81.6 162.2L53.2 217.4L74.8 229.9L108.4 177.8ZM79.5 170a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM51.5 223.7a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM51.5 223.3L46.9 283.1L76.9 284.2L76.5 224.1ZM51.5 223.7a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM46.9 283.7a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM105.7 183.7L161.9 210.1L173.6 188.1L120.3 156.3ZM97.5 170a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM155.2 199.1a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM156.9 192.9L124.8 243.6L150.7 258.6L178.6 205.4ZM155.2 199.1a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM122.7 251.1a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM67.9 279.7L47.1 280.7L34.9 290.7L34.9 292.7L68.9 292.7ZM143.7 247.1L122.9 248.1L110.7 258.1L110.7 260.1L144.7 260.1ZM104.2 99.9L129.6 66.5L119.7 58.1L91.1 89ZM89.2 94.4a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM118.2 62.3a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM121.4 67.9L158.8 87.2L163.3 79.4L127.9 56.6ZM118.2 62.3a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM156.5 83.3a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM155 83.3a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM135.5 91.5L119.2 52.8L107 57.2L119.5 97.4ZM119 94.4a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM106.6 55a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM118.8 58.2L138 20.9L130.2 16.4L107.5 51.7ZM106.6 55a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM129.6 18.6a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM128.1 18.6a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM88 174L120 174L135.6 92.4L89.6 92.4ZM86.6 95.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM122.6 95.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM87 168a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM118.5 89.5L122.2 65.8L111.3 63.9L106.7 87.4ZM106.6 88.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM111.2 64.8a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM99.7 64.8a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM74 188L134 188L128 146L80 146Z","x":"M98.7 60.8A18 18 0 0 1 134.7 60.8L156.7 63.8L133.7 67.8L98.7 66.8Z","c":"M125.7 67.8Q147.9 69.2 134.1 18.6M107.7 67.8Q116.7 98.8 147.9 61.2","p":"<rect x=\"128.1\" y=\"9.6\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M86.7 169.1L28 189.1L34.8 213.1L95.3 198.9ZM75.5 184a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM18.9 201.1a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM20.4 207L46.3 261.1L72.8 247L42.4 195.2ZM18.9 201.1a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM44.6 254.1a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM100.8 197.1L155 227.5L168.2 206.3L117.2 170.9ZM93.5 184a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM149.1 216.9a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM152 208.8L111.5 253.2L134.5 272.5L171.2 224.9ZM149.1 216.9a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM108 262.8a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM52.6 263.1L86.6 263.1L86.6 261.1L74.4 251.1L53.6 250.1ZM129 258.8L108.2 259.8L96 269.8L96 271.8L130 271.8ZM47.4 116.9L63.6 155.7L75.8 151.2L63.4 111.1ZM46.9 114a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM63.2 153.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM72 159.5L110.7 143.3L107.7 134.8L67.5 147.3ZM63.2 153.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM104.7 139.1a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM103.2 139.1a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM83.2 122.5L125.2 120.5L125.2 107.5L83.2 105.5ZM74.7 114a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM118.7 114a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM119.1 116.2L135.3 155L143.8 151.9L131.3 111.7ZM118.7 114a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM135.1 153.4a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM133.6 153.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM84 188L116 188L92.3 112L46.3 112ZM43.3 115a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM79.3 115a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM83 182a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM74.3 104.6L60.4 85L51.3 91.1L64.3 111.3ZM63.3 108a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM50.4 88.1a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM38.9 88.1a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM70 202L130 202L124 160L76 160Z","x":"M37.9 84.1A18 18 0 0 1 73.9 84.1L95.9 87.1L72.9 91.1L37.9 90.1Z","c":"M64.9 91.1Q120.2 148.3 139.6 153.4M46.9 91.1Q55.9 122.1 120.2 140.3","p":"<rect x=\"133.6\" y=\"144.4\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"},{"d":"M76.6 162.2L56.2 220.8L79.4 230.2L105.4 173.8ZM75.5 168a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM55.3 225.5a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM55.4 227.2L61.3 287L91 282.8L80.2 223.7ZM55.3 225.5a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM61.1 284.9a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM96.5 177.1L135.3 225.5L155.6 210.8L121.5 158.9ZM93.5 168a15.5 15.5 0 1 0 31 0a15.5 15.5 0 1 0 -31 0ZM132.9 218.2a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM133.4 221.6L147.6 280L176.4 271.7L157.5 214.7ZM132.9 218.2a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0ZM147 275.8a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM82.1 280.9L61.3 281.9L49.1 291.9L49.1 293.9L83.1 293.9ZM155 284.8L189 284.8L189 282.8L176.8 272.8L156 271.8ZM113.8 94.7L113.2 52.7L100.3 52.2L96.8 94.1ZM96.8 94.4a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM100.2 52.5a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM111.7 56.6L137.2 23.2L130.3 17.4L101.8 48.3ZM100.2 52.5a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM129.2 20.3a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM127.7 20.3a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM138.6 101.8L174 79.1L167.5 67.8L130.1 87.1ZM125.9 94.4a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM164.3 73.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM177.2 74.1L179.6 32.1L170.7 31.2L164.3 72.8ZM164.3 73.4a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0ZM170.7 31.7a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM169.2 31.7a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM84 172L116 172L142.8 92.4L96.8 92.4ZM93.8 95.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM129.8 95.4a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM83 166a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM125.4 90.7L133.9 68.2L123.7 64.1L114.3 86.2ZM113.8 88.4a6 6 0 1 0 12 0a6 6 0 1 0 -12 0ZM123.3 66.2a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0ZM111.8 66.2a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM70 186L130 186L124 144L76 144Z","x":"M110.8 62.2A18 18 0 0 1 146.8 62.2L168.8 65.2L145.8 69.2L110.8 68.2Z","c":"M137.8 69.2Q174.5 76.4 175.2 31.7M119.8 69.2Q128.8 100.2 174.5 68.4","p":"<rect x=\"169.2\" y=\"22.7\" width=\"12\" height=\"18\" rx=\"2.500\" fill=\"#fff\"/>"}]};
  const dancer = (kind, offset = 0) => {
    const frames = POSES[kind];
    return `<svg class="m-dancer" viewBox="0 0 200 300" aria-hidden="true">${frames.map((f, i) => {
      const p = frames[(i + offset) % frames.length];
      return `<g class="p${i + 1}"><path class="b" d="${p.d}"/><path class="b" d="${p.x}"/><path class="c" d="${p.c}"/>${p.p}</g>`;
    }).join('')}</svg>`;
  };

  // Hero stage
  const heroText = document.querySelector('.hero-text');
  const stage = make('div', 'm-stage', `<div class="m-dancers">${dancer('a')}${dancer('b', 1)}${dancer('c', 2)}</div>`);
  stage.setAttribute('aria-hidden', 'true');
  heroText.append(stage);

  // Equalizer under the tagline
  const cols = ['#e6007e', '#ff8a00', '#0a0a0a', '#00aeef', '#6a2bd9', '#0a0a0a'];
  const eq = make('div', 'm-eq', Array.from({ length: 28 }, (_, i) => {
    const c = cols[Math.floor(i / 28 * cols.length)];
    const h = (0.3 + 0.7 * Math.abs(Math.sin(i * 1.7))).toFixed(2);
    return `<i style="--c:${c};--h:${h};--d:${(0.25 + (i % 7) * 0.05).toFixed(2)}s;--o:-${(i * 0.13 % 1).toFixed(2)}s"></i>`;
  }).join(''));
  eq.setAttribute('aria-hidden', 'true');
  heroText.querySelector('.hero-tagline').after(eq);

  // Small equalizer on the playing track
  document.querySelectorAll('.track-btn').forEach((b) => b.append(make('span', 'm-mini', '<i></i><i></i><i></i>')));

  // A short queue of dancers at the bottom of the last band
  const relatedSec = document.querySelector('#related');
  const queue = make('div', 'm-queue', dancer('b', 2) + dancer('a', 1) + dancer('c') + dancer('b') + dancer('a', 3));
  queue.setAttribute('aria-hidden', 'true');
  relatedSec.append(queue);

  // Figures in the right gutter
  const side = (sel, cls, html) => { const host = document.querySelector(sel); const n = make('div', `m-side ${cls}`, html); n.setAttribute('aria-hidden', 'true'); host.append(n); return n; };
  side('#how', 'm-side-how', dancer('c', 1));
  side('#refs', 'm-side-refs', dancer('b', 3));
  const brights = ['#e6007e', '#ff8a00', '#ffe600', '#b4e61a', '#00aeef', '#6a2bd9'];
  side('#vibe', 'm-side-vibe m-eq m-tall', Array.from({ length: 12 }, (_, i) => `<i style="--c:${brights[i % 6]};--h:${(0.3 + 0.7 * Math.abs(Math.cos(i * 1.3))).toFixed(2)};--d:${(0.26 + (i % 5) * 0.07).toFixed(2)}s;--o:-${(i * 0.17 % 1).toFixed(2)}s"></i>`).join(''));

  // Cover flow
  const flow = document.querySelector('.ref-gallery');
  if (flow) {
    const covers = [...flow.querySelectorAll('.shot')];
    let queued = false;
    const paint = () => {
      queued = false;
      const width = flow.clientWidth;
      for (const c of covers) {
        const r = c.offsetLeft + c.offsetWidth / 2 - flow.scrollLeft - width / 2;
        const d = Math.max(-1.6, Math.min(1.6, r / (c.offsetWidth * 0.72)));
        const a = Math.min(1, Math.abs(d));
        const side = Math.sign(d) * a;
        c.style.transform = `translateX(${(side * -6).toFixed(1)}px) translateZ(${(-a * 130).toFixed(1)}px) rotateY(${(-side * 58).toFixed(1)}deg)`;
        c.style.zIndex = String(200 - Math.round(Math.abs(d) * 50));
        c.style.setProperty('--a', Math.max(0, 1 - Math.abs(d) * 1.3).toFixed(2));
      }
    };
    const queuePaint = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    flow.addEventListener('scroll', queuePaint, { passive: true });
    addEventListener('resize', queuePaint);
    const nav = make('div', 'm-flow-nav', '<button type="button" aria-label="Previous cover">&#8249;</button><button type="button" aria-label="Next cover">&#8250;</button>');
    flow.after(nav);
    const step = (dir) => flow.scrollBy({ left: dir * covers[0].offsetWidth * 0.86, behavior: isCalm() ? 'auto' : 'smooth' });
    nav.children[0].addEventListener('click', () => step(-1));
    nav.children[1].addEventListener('click', () => step(1));
    const start = covers[Math.min(1, covers.length - 1)];
    requestAnimationFrame(() => {
      flow.style.scrollSnapType = 'none';
      flow.scrollLeft = start.offsetLeft + start.offsetWidth / 2 - flow.clientWidth / 2;
      flow.style.scrollSnapType = '';
      paint();
    });
  }

  // The iPod
  const sections = [...document.querySelectorAll('.sec')].map((s) => ({ el: s, label: (s.querySelector('.sec-title')?.textContent || s.id).trim() }));
  const ipod = make('div', 'ipod', `
    <div class="ipod-screen">
      <div class="ipod-bar"><span>Explore</span><b aria-label="Music playing">&#9654;</b><i class="ipod-batt"></i></div>
      <div class="ipod-list"><div class="ipod-rows">${sections.map((s) => `<div>${s.label}</div>`).join('')}</div></div>
    </div>
    <div class="ipod-wheel" tabindex="0" role="slider" aria-label="Click wheel. Up and down arrows choose a section, Enter goes there." aria-valuemin="1" aria-valuemax="${sections.length}" aria-valuenow="1">
      <div class="ipod-thumb"></div>
      <button type="button" class="w-menu" aria-label="Menu: back to the top">MENU</button>
      <button type="button" class="w-prev" aria-label="Previous section">&#9664;&#9664;</button>
      <button type="button" class="w-next" aria-label="Next section">&#9654;&#9654;</button>
      <button type="button" class="w-play" aria-label="Play or stop the music">&#9654;&#10074;&#10074;</button>
      <button type="button" class="w-center" aria-label="Go to the selected section"></button>
    </div>
    <div class="ipod-hint">Spin the wheel, press the middle</div>`);
  document.body.append(ipod);
  document.body.classList.add('has-ipod');
  const fab = make('button', 'ipod-fab');
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Open the click wheel menu');
  fab.setAttribute('aria-expanded', 'false');
  document.body.append(fab);
  fab.addEventListener('click', () => {
    const open = ipod.classList.toggle('open');
    fab.setAttribute('aria-expanded', String(open));
  });

  const rows = [...ipod.querySelectorAll('.ipod-rows div')];
  const rowsBox = ipod.querySelector('.ipod-rows');
  const wheel = ipod.querySelector('.ipod-wheel');
  const thumb = ipod.querySelector('.ipod-thumb');
  const hint = ipod.querySelector('.ipod-hint');
  const playIcon = ipod.querySelector('.ipod-bar b');
  if (store.get('eas-metro-spun')) hint.hidden = true;
  let sel = 0;
  let lastTouch = 0;
  const VISIBLE = 5;
  function paintList() {
    rows.forEach((r, i) => r.classList.toggle('on', i === sel));
    const first = Math.max(0, Math.min(rows.length - VISIBLE, sel - 2));
    rowsBox.style.transform = `translateY(${-first * 22.4}px)`;
    wheel.setAttribute('aria-valuenow', String(sel + 1));
    wheel.setAttribute('aria-valuetext', sections[sel].label);
  }
  paintList();

  let ctx;
  function tick() {
    if (isCalm()) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 2100;
      g.gain.setValueAtTime(0.018, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.014);
    } catch { /* silent is fine */ }
  }

  function goTo(i) {
    sel = (i + sections.length) % sections.length;
    paintList();
    const y = sections[sel].el.getBoundingClientRect().top + scrollY - 60;
    scrollTo({ top: y, behavior: isCalm() ? 'auto' : 'smooth' });
    lastTouch = 0;
    ipod.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
  }
  const used = () => { hint.hidden = true; store.set('eas-metro-spun', '1'); lastTouch = performance.now(); };
  function move(dir) {
    const next = Math.max(0, Math.min(sections.length - 1, sel + dir));
    if (next === sel) return;
    sel = next;
    paintList();
    tick();
    used();
  }
  const center = () => {
    const r = wheel.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const angleAt = (e) => { const [cx, cy] = center(); return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; };
  let spinning = false;
  let lastA = 0;
  let acc = 0;
  let total = 0;
  let downAt = null;
  wheel.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('w-center')) return;
    spinning = true;
    lastA = angleAt(e);
    acc = 0;
    total = 0;
    downAt = lastA;
    wheel.setPointerCapture(e.pointerId);
    wheel.classList.add('is-spin');
    thumb.style.setProperty('--a', String(lastA + 90));
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!spinning) return;
    const a = angleAt(e);
    let d = a - lastA;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastA = a;
    acc += d;
    total += Math.abs(d);
    thumb.style.setProperty('--a', String(a + 90));
    while (acc > 26) { move(1); acc -= 26; }
    while (acc < -26) { move(-1); acc += 26; }
  });

  const topPage = () => { scrollTo({ top: 0, behavior: isCalm() ? 'auto' : 'smooth' }); sel = 0; paintList(); };
  const currentSection = () => {
    const y = scrollY + innerHeight * 0.35;
    let i = -1;
    sections.forEach((s, n) => { if (s.el.getBoundingClientRect().top + scrollY <= y) i = n; });
    return i;
  };
  const stepSection = (dir) => { const c = currentSection(); goTo(Math.max(0, Math.min(sections.length - 1, c + dir))); };
  const togglePlay = () => {
    const playing = document.querySelector('.track.is-playing');
    if (playing) { document.querySelector('[data-player-close]').click(); return; }
    const b = document.querySelector('.track-btn');
    if (b) b.click();
  };

  const stopSpin = () => {
    if (!spinning) return;
    spinning = false;
    wheel.classList.remove('is-spin');
    if (total < 8 && downAt !== null) {
      // A press on the ring, not a spin: the four printed buttons.
      const a = downAt;
      if (a > -135 && a <= -45) topPage();
      else if (a > -45 && a <= 45) stepSection(1);
      else if (a > 45 && a <= 135) togglePlay();
      else stepSection(-1);
      used();
      lastTouch = 0;
    }
  };
  wheel.addEventListener('pointerup', stopSpin);
  wheel.addEventListener('pointercancel', stopSpin);

  ipod.querySelector('.w-center').addEventListener('click', () => { used(); goTo(sel); });
  // Keyboard users reach the printed buttons with Tab; mouse presses are read from the ring above.
  ipod.querySelector('.w-menu').addEventListener('click', () => { used(); topPage(); });
  ipod.querySelector('.w-prev').addEventListener('click', () => { used(); stepSection(-1); });
  ipod.querySelector('.w-next').addEventListener('click', () => { used(); stepSection(1); });
  ipod.querySelector('.w-play').addEventListener('click', () => { used(); togglePlay(); });
  wheel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    if (e.key === 'Enter' && e.target === wheel) { e.preventDefault(); used(); goTo(sel); }
  });
  rows.forEach((r, i) => r.addEventListener('click', () => { sel = i; used(); goTo(i); }));

  // The highlight follows your scrolling unless you were just turning the wheel.
  let syncing = false;
  const sync = () => {
    syncing = false;
    if (performance.now() - lastTouch < 3500 || spinning) return;
    const c = currentSection();
    const n = c < 0 ? 0 : c;
    if (n !== sel) { sel = n; paintList(); }
  };
  addEventListener('scroll', () => { if (!syncing) { syncing = true; requestAnimationFrame(sync); } }, { passive: true });

  // Show the play arrow on the screen while a track plays.
  const tracks = document.querySelector('.tracks');
  new MutationObserver(() => playIcon.classList.toggle('on', Boolean(document.querySelector('.track.is-playing')))).observe(tracks, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();
