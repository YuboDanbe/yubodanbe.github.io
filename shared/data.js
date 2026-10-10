(function(){
// Data model, music theory helpers, example song, OpenLyrics helpers.

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const KEY_CHOICES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'];
function noteIndex(n) {
  let i = SHARP.indexOf(n);
  if (i >= 0) return i;
  return FLAT.indexOf(n);
}
function transposeNote(note, semis, preferFlats) {
  const i = noteIndex(note);
  if (i < 0) return note;
  const j = ((i + semis) % 12 + 12) % 12;
  return (preferFlats ? FLAT : SHARP)[j];
}
function transposeChord(chord, semis, preferFlats) {
  if (!chord) return chord;
  const trimmed = chord.trim();
  if (!semis) return trimmed;
  if (trimmed === '%' || trimmed === '-' || trimmed === 'N.C.') return trimmed;
  return trimmed.split('/').map(part => {
    const m = part.match(/^([A-G][#b]?)(.*)$/);
    if (!m) return part;
    return transposeNote(m[1], semis, preferFlats) + m[2];
  }).join('/');
}
function letterFor(index) {
  let s = '';
  let n = index;
  do {
    s = String.fromCharCode(97 + n % 26) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}
const RHYTHMS = [{
  id: 'whole',
  es: 'Redonda',
  beats: 4
}, {
  id: 'half',
  es: 'Blanca',
  beats: 2
}, {
  id: 'quarter',
  es: 'Negra',
  beats: 1
}, {
  id: 'eighth',
  es: 'Corchea',
  beats: 0.5
}, {
  id: 'sixteenth',
  es: 'Semicorchea',
  beats: 0.25
}];
const BEAT_VALUES = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25
};
const TIME_OPTIONS = ['4/4', '3/4', '6/8', '2/4'];
const SECTION_NAMES = ['Coro', 'Verso', 'Pre-coro', 'Puente', 'Intro', 'Outro', 'Interludio', 'Solo'];
const TEMPO_NAMES = [{
  max: 60,
  name: 'Largo'
}, {
  max: 76,
  name: 'Adagio'
}, {
  max: 108,
  name: 'Andante'
}, {
  max: 120,
  name: 'Moderato'
}, {
  max: 156,
  name: 'Allegro'
}, {
  max: 200,
  name: 'Presto'
}, {
  max: 999,
  name: 'Prestissimo'
}];
function tempoName(bpm) {
  const t = TEMPO_NAMES.find(t => bpm <= t.max);
  return t ? t.name : '';
}
let _id = 0;
const uid = () => `id${++_id}_${Math.random().toString(36).slice(2, 6)}`;
function detectKey(groups) {
  if (!groups || !groups.length) return 'C';
  const counts = {};
  let firstChord = null;
  groups.forEach(g => (g.measures || []).forEach(m => {
    if (!m.chord) return;
    const mm = m.chord.trim().match(/^([A-G][#b]?)(.*)$/);
    if (!mm) return;
    if (!firstChord) firstChord = m.chord.trim();
    counts[mm[1]] = (counts[mm[1]] || 0) + 1;
  }));
  const roots = Object.keys(counts);
  if (!roots.length) return 'C';
  let best = roots[0];
  roots.forEach(r => {
    if (counts[r] > counts[best]) best = r;
  });
  const fm = (firstChord || '').match(/^([A-G][#b]?)(m(?!aj)|min)?/);
  if (fm && fm[1] === best && fm[2]) return best + 'm';
  return best;
}
function parseTimeSig(sig) {
  const p = (sig || '4/4').split('/').map(Number);
  return (p[0] || 4) * (4 / (p[1] || 4)); // quarter notes per bar
}
function beatsPerBar(sig) {
  const p = (sig || '4/4').split('/').map(Number);
  return p[0] || 4;
}

// Split a group's cells into complete bars. Returns array of bars:
// [{ cells: [ {measure, index} ], missing: beatsLeft }]
function splitBars(measures, timeSig) {
  const qnpm = parseTimeSig(timeSig);
  const bars = [];
  let cur = {
    cells: [],
    used: 0
  };
  measures.forEach((m, i) => {
    const b = BEAT_VALUES[m.dur] || 1;
    cur.cells.push({
      measure: m,
      index: i
    });
    cur.used += b;
    if (cur.used >= qnpm - 0.001) {
      bars.push({
        cells: cur.cells,
        missing: 0
      });
      cur = {
        cells: [],
        used: 0
      };
    }
  });
  if (cur.cells.length) bars.push({
    cells: cur.cells,
    missing: Math.max(0, qnpm - cur.used)
  });
  return bars;
}

// The largest rhythm figure that fits in `beats`
function figureForBeats(beats) {
  const r = RHYTHMS.find(r => r.beats <= beats + 0.001);
  return r ? r.id : 'sixteenth';
}
const clone = obj => JSON.parse(JSON.stringify(obj));
const EJEMPLO = {
  verso: 'verso de ejemplo numero 1, \esto es solo un verso de ejemplo numero 1.\ verso de ejemplo,\ aqui tenemos un verso de ejemplo.',
  puente: 'texto de ejemplo para puente numero 1, \esto solo es un texto de ejemplo para puente numero 1.\texto de ejemplo para puente.',
  coro: 'coro de ejemplo numero 1,\este es el coro de ejemplo numero 1.\texto de coro ejemplo 1,\solo es un texto de ejemplo para el coro.'
};
const SAMPLE_SONG = {
  meta: {
    title: 'Canción de ejemplo',
    time: '4/4',
    key: 'C',
    tempo: '96',
    capo: '2',
    transpose: 0
  },
  groups: [{
    id: uid(),
    measures: [{
      chord: 'C',
      dur: 'quarter'
    }, {
      chord: 'Am',
      dur: 'quarter'
    }, {
      chord: 'F',
      dur: 'quarter'
    }, {
      chord: 'G',
      dur: 'quarter'
    }]
  }, {
    id: uid(),
    measures: [{
      chord: 'Dm',
      dur: 'eighth'
    }, {
      chord: 'G',
      dur: 'eighth'
    }, {
      chord: 'C',
      dur: 'quarter'
    }, {
      chord: 'Am',
      dur: 'quarter'
    }, {
      chord: 'F',
      dur: 'half'
    }]
  }, {
    id: uid(),
    measures: [{
      chord: 'F',
      dur: 'half'
    }, {
      chord: 'G',
      dur: 'half'
    }, {
      chord: 'Am',
      dur: 'whole'
    }]
  }],
  structure: [],
  lyrics: [{
    id: uid(),
    name: 'Verso 1',
    text: EJEMPLO.verso
  }, {
    id: uid(),
    name: 'Puente',
    text: EJEMPLO.puente
  }, {
    id: uid(),
    name: 'Coro',
    text: EJEMPLO.coro
  }]
};
(function () {
  const g = SAMPLE_SONG.groups;
  SAMPLE_SONG.structure = [{
    id: uid(),
    name: 'Verso 1',
    groupId: g[1].id,
    reps: 2
  }, {
    id: uid(),
    name: 'Puente',
    groupId: g[2].id,
    reps: 1
  }, {
    id: uid(),
    name: 'Coro',
    groupId: g[0].id,
    reps: 3
  }];
})();
function newSong(meta, lyrics) {
  return {
    id: uid(),
    meta: {
      title: 'Nueva canción',
      time: '4/4',
      tempo: '120',
      capo: '0',
      transpose: 0,
      ...(meta || {})
    },
    groups: [],
    structure: [],
    lyrics: lyrics || []
  };
}

// ---------- OpenLyrics 0.9 ----------
function sectionBaseTag(name) {
  const n = (name || '').toLowerCase();
  if (/coro|estribillo|chorus/.test(n)) return 'c';
  if (/puente|bridge/.test(n)) return 'b';
  if (/pre.?coro|prechorus/.test(n)) return 'p';
  if (/intro/.test(n)) return 'i';
  if (/outro|final|ending/.test(n)) return 'e';
  return 'v';
}
function xmlEscape(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function songToOpenLyrics(song) {
  const counters = {};
  const verses = [];
  const nameToTag = {};
  (song.lyrics || []).forEach(sec => {
    const base = sectionBaseTag(sec.name);
    counters[base] = (counters[base] || 0) + 1;
    const tag = base + counters[base];
    nameToTag[sec.name] = tag;
    const lines = (sec.text || '').split('\n').map(l => xmlEscape(l)).join('<br/>');
    verses.push(`    <verse name="${tag}">\n      <lines>${lines}</lines>\n    </verse>`);
  });
  const order = [];
  const byBase = {};
  Object.keys(nameToTag).forEach(name => {
    const base = sectionBaseTag(name);
    (byBase[base] = byBase[base] || []).push(nameToTag[name]);
  });
  (song.structure || []).forEach(part => {
    const base = sectionBaseTag(part.name);
    const tags = byBase[base];
    if (!tags || !tags.length) return;
    for (let i = 0; i < (part.reps || 1); i++) order.push(tags[0]);
  });
  if (!order.length) order.push(...Object.values(nameToTag));
  const key = song.meta.key || detectKey(song.groups);
  const props = [`    <titles><title>${xmlEscape(song.meta.title)}</title></titles>`, `    <key>${xmlEscape(key)}</key>`, `    <timeSignature>${xmlEscape(song.meta.time)}</timeSignature>`, order.length ? `    <verseOrder>${order.join(' ')}</verseOrder>` : ''].filter(Boolean).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.9" createdIn="Acordes">
  <properties>
${props}
  </properties>
  <lyrics>
${verses.join('\n')}
  </lyrics>
</song>`;
}
function tagToName(tag) {
  const m = (tag || '').match(/^([a-z]+)(\d*)$/i);
  if (!m) return tag;
  const map = {
    v: 'Verso',
    c: 'Coro',
    b: 'Puente',
    p: 'Pre-coro',
    i: 'Intro',
    e: 'Outro'
  };
  const base = map[m[1].toLowerCase()] || 'Sección';
  return m[2] ? base + ' ' + m[2] : base;
}
function openLyricsToSong(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML inválido');
  const title = (doc.querySelector('title') || {}).textContent || 'Canción importada';
  const lyrics = [];
  doc.querySelectorAll('verse').forEach(v => {
    const tag = v.getAttribute('name') || '';
    let text = '';
    v.querySelectorAll('lines').forEach((linesEl, idx) => {
      const html = linesEl.innerHTML.replace(/<br\s*\/?>(\s*)/gi, '\n').replace(/<[^>]+>/g, '');
      const tmp = document.createElement('textarea');
      tmp.innerHTML = html;
      text += (idx ? '\n' : '') + tmp.value.trim();
    });
    lyrics.push({
      id: uid(),
      name: tagToName(tag),
      text
    });
  });
  return {
    title,
    lyrics
  };
}
function safeName(s) {
  return (s || 'archivo').replace(/[^\wáéíóúñÁÉÍÓÚÑ -]+/g, '').trim().replace(/\s+/g, '_');
}
function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
Object.assign(window, {
  SHARP,
  FLAT,
  KEY_CHOICES,
  transposeChord,
  transposeNote,
  letterFor,
  RHYTHMS,
  BEAT_VALUES,
  TIME_OPTIONS,
  SECTION_NAMES,
  SAMPLE_SONG,
  uid,
  clone,
  newSong,
  parseTimeSig,
  beatsPerBar,
  splitBars,
  figureForBeats,
  tempoName,
  detectKey,
  songToOpenLyrics,
  openLyricsToSong,
  safeName,
  downloadBlob
});
})();
