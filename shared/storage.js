(function () {
  // Almacenamiento compartido — misma clave y misma forma de datos que
  // usaba la versión de un solo archivo, para no perder lo ya guardado.
  const LIB_KEY = 'chordchart.library.v1';
  const MAX_LISTS = 10;

  function loadLibrary() {
    let data = null;
    try {
      const raw = localStorage.getItem(LIB_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {}
    if (!data || !data.songs || !data.songs.length) {
      const sample = {
        id: window.uid(),
        meta: { ...window.SAMPLE_SONG.meta },
        groups: window.clone(window.SAMPLE_SONG.groups),
        structure: window.clone(window.SAMPLE_SONG.structure),
        lyrics: window.clone(window.SAMPLE_SONG.lyrics)
      };
      data = { songs: [sample], currentId: sample.id };
    }
    data.songs.forEach(s => {
      if (!s.lyrics) s.lyrics = [];
      if (!s.structure) s.structure = [];
      if (!s.groups) s.groups = [];
      if (!s.meta) s.meta = {};
      if (s.meta.transpose == null) s.meta.transpose = 0;
      if (!s.meta.key) s.meta.key = window.detectKey(s.groups);
      if (s.meta.capo == null) s.meta.capo = '0';
    });
    if (!data.lists) data.lists = [];
    data.lists = data.lists.filter(l => l && typeof l === 'object').map(l => ({
      id: l.id || window.uid(),
      name: l.name || 'Lista',
      songIds: Array.isArray(l.songIds) ? l.songIds : [],
      disabled: (l.disabled && typeof l.disabled === 'object') ? l.disabled : {}
    }));
    if (!data.songs.find(s => s.id === data.currentId)) data.currentId = data.songs[0].id;
    const ui = {
      theme: 'dark',
      sizes: { title: 1, meta: 1, chords: 1, lyrics: 1, structure: 1 },
      lyricsView: null,
      ...(data.ui || {})
    };
    return { songs: data.songs, lists: data.lists, currentId: data.currentId, ui };
  }

  function saveLibrary(state) {
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('No se pudo guardar la base de datos local:', e);
    }
  }

  // ---- helpers de navegación entre páginas reales ----
  function qs(params) {
    const p = new URLSearchParams();
    Object.keys(params || {}).forEach(k => {
      if (params[k] != null) p.set(k, params[k]);
    });
    const s = p.toString();
    return s ? '?' + s : '';
  }
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  function goTo(page, params) {
    window.location.href = page + qs(params);
  }

  // aplica el tema guardado antes de pintar, para evitar parpadeo
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme || 'dark';
  }

  Object.assign(window, {
    LIB_KEY,
    MAX_LISTS,
    loadLibrary,
    saveLibrary,
    getParam,
    goTo,
    applyTheme
  });
})();
