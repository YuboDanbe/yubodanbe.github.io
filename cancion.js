(function () {
  const {
    Page, RetroBtn, TopBtn, BrandBlock, ChordBars, CellEditor, StructureLine,
    StructureEditor, LyricParagraphEditor, Metronome, InlinePanel, SizeControl,
    SongPicker, useLibrary, usePageChrome,
    uid, safeName, downloadBlob, transposeChord, letterFor, detectKey, TIME_OPTIONS
  } = window;
  const { useState, useRef, useEffect } = window.React;
  const CONF = window.APP_CONFIG || {};
  const isMobile = () => window.matchMedia('(max-width: 820px)').matches;

function PrintSheet({
  job
}) {
  const sideBySide = job.layout === 'lyrics-left' || job.layout === 'chords-left';
  const cls = 'print-sheet' + (sideBySide ? ' side' : '') + (job.orientation === 'horizontal' ? ' landscape' : '');
  return /*#__PURE__*/React.createElement("div", {
    className: cls
  }, job.songs.map((s, i) => /*#__PURE__*/React.createElement(PrintSong, {
    key: s.id || i,
    song: s,
    layout: job.layout,
    last: i === job.songs.length - 1
  })));
}
function PrintSong({
  song,
  layout,
  last
}) {
  const tr = song.meta.transpose || 0;
  const key = transposeChord(song.meta.key || detectKey(song.groups), tr, false);
  const capoN = parseInt(song.meta.capo, 10) || 0;
  const letterById = Object.fromEntries(song.groups.map((g, i) => [g.id, letterFor(i)]));
  const showChords = layout !== 'lyrics-only';
  const showLyrics = layout !== 'chords-only';
  const sideBySide = layout === 'lyrics-left' || layout === 'chords-left';
  const chordsBlock = showChords && /*#__PURE__*/React.createElement("div", {
    className: "p-chords"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-h"
  }, "ACORDES"), song.groups.map((g, gi) => /*#__PURE__*/React.createElement("div", {
    className: "p-grp",
    key: g.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "p-glabel"
  }, letterFor(gi)), /*#__PURE__*/React.createElement("div", {
    className: "bars p-bars"
  }, (() => {
    // Igual que en pantalla: se agrupan las notas en compases según el
    // compás de la canción, para que la línea divisoria solo aparezca
    // al inicio/cierre de cada compás, no entre cada nota.
    const bars = window.splitBars(g.measures, song.meta.time);
    const out = [];
    bars.forEach((bar, bi) => {
      const isLastBar = bi === bars.length - 1;
      bar.cells.forEach(({ measure: m, index: i }, ci) => {
        const shown = transposeChord(m.chord, tr, false);
        const isFirstInBar = ci === 0;
        const isClosing = isLastBar && ci === bar.cells.length - 1;
        out.push(/*#__PURE__*/React.createElement("span", {
          key: i,
          className: 'mcell p-cell' + (isFirstInBar ? ' bar-first' : '') + (isClosing ? ' bar-last' : '')
        }, shown ? /*#__PURE__*/React.createElement("span", {
          className: "chord"
        }, shown) : null, /*#__PURE__*/React.createElement("span", {
          className: "figbox"
        }, /*#__PURE__*/React.createElement(NoteFigure, {
          type: m.dur
        }))));
      });
    });
    return out;
  })()))), song.structure.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "p-h"
  }, "ESTRUCTURA"), /*#__PURE__*/React.createElement("div", {
    className: "bars p-bars structure-bars"
  }, song.structure.map(p => /*#__PURE__*/React.createElement("span", {
    key: p.id,
    className: "mcell scell p-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sname"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "sletter"
  }, letterById[p.groupId] || '—'), p.reps > 1 && /*#__PURE__*/React.createElement("span", {
    className: "sreps"
  }, "×", p.reps))))));
  const lyricsBlock = showLyrics && song.lyrics && song.lyrics.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "p-lyrics"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-lyr-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-h"
  }, "LETRA"), song.lyrics.map(s => /*#__PURE__*/React.createElement("div", {
    className: "p-lyr-sec",
    key: s.id
  }, s.name && /*#__PURE__*/React.createElement("div", {
    className: "p-lyr-name"
  }, s.name), /*#__PURE__*/React.createElement("div", {
    className: "p-lyr-text"
  }, s.text)))));
  return /*#__PURE__*/React.createElement("div", {
    className: 'p-song' + (last ? '' : ' page-break') + (layout === 'lyrics-only' ? ' lyrics-only' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-title"
  }, /*#__PURE__*/React.createElement("img", {
    className: "p-icon",
    src: (window.APP_CONFIG || {}).printIconPath || (window.APP_CONFIG || {}).iconPath || 'config/icon.svg',
    alt: ""
  }), song.meta.title), /*#__PURE__*/React.createElement("div", {
    className: "p-meta"
  }, "COMPÁS ", song.meta.time, " · TONO ", key, " · TEMPO ", song.meta.tempo, " bpm", capoN > 0 ? ' · CAPO ' + song.meta.capo : ''), sideBySide ? /*#__PURE__*/React.createElement("div", {
    className: 'p-cols' + (layout === 'lyrics-left' ? ' lyr-first' : '')
  }, layout === 'lyrics-left' ? lyricsBlock : chordsBlock, layout === 'lyrics-left' ? chordsBlock : lyricsBlock) : /*#__PURE__*/React.createElement(React.Fragment, null, chordsBlock, lyricsBlock), /*#__PURE__*/React.createElement("div", {
    className: "p-footer"
  }, /*#__PURE__*/React.createElement("span", null, new Date().toLocaleDateString('es-MX'), " · ", new Date().toLocaleTimeString('es-MX')), /*#__PURE__*/React.createElement("span", null, (window.APP_CONFIG || {}).appName || 'Musigatari', " — ", (window.APP_CONFIG || {}).subtitle || '')));
}

function PrintFlowPage({
  fromHome,
  songs,
  cur,
  onBack,
  onPrint,
  topbar
}) {
  const {
    useState
  } = window.React;
  const [orientation, setOrientation] = useState(null);
  if (!orientation) {
    return /*#__PURE__*/React.createElement(Page, {
      title: "Imprimir",
      sub: "Elige la orientación de la hoja.",
      onBack: onBack,
      topbar: topbar
    }, /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "▯",
      text: "Vertical",
      sub: "Hoja carta vertical",
      onClick: () => setOrientation('vertical')
    }), /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "▭",
      text: "Horizontal",
      sub: "Hoja carta horizontal, todo en una página",
      onClick: () => setOrientation('horizontal')
    }));
  }
  const opts = orientation === 'horizontal' ? [{
    v: 'lyrics-left',
    l: 'Letra izquierda · Acordes derecha'
  }, {
    v: 'chords-left',
    l: 'Acordes izquierda · Letra derecha'
  }] : [{
    v: 'both',
    l: 'Acordes y letra'
  }, {
    v: 'chords-only',
    l: 'Solo acordes'
  }, {
    v: 'lyrics-only',
    l: 'Solo letra'
  }, {
    v: 'lyrics-left',
    l: 'Letra izquierda · Acordes derecha'
  }, {
    v: 'chords-left',
    l: 'Acordes izquierda · Letra derecha'
  }];
  return /*#__PURE__*/React.createElement(Page, {
    title: "Imprimir",
    sub: "Elige el acomodo.",
    onBack: () => setOrientation(null),
    topbar: topbar
  }, opts.map(o => /*#__PURE__*/React.createElement(RetroBtn, {
    key: o.v,
    icon: "⎙",
    text: o.l,
    onClick: () => onPrint({
      songs: [cur],
      layout: o.v,
      orientation
    })
  })));
}

// ---- Print sheet (rendered only while printing) ----

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    // La canción se identifica por ?id=... en la URL. Si no viene o no
    // existe, se cae de vuelta a la primera canción de la base de datos.
    const requestedId = window.getParam('id');
    const cur = st.songs.find(s => s.id === requestedId) || st.songs[0];
    const fromListId = window.getParam('list');

    const [editMode, setEditMode] = useState(false);
    const [metroOpen, setMetroOpen] = useState(false);
    const [openMeta, setOpenMeta] = useState(null); // 'tono' | 'compas' | 'tempo' | 'capo' | null
    const [openCell, setOpenCell] = useState(null); // { gi, ci, presetDur } | null
    const [openPart, setOpenPart] = useState(null); // { pi } | null  (pi null = agregar nueva)
    const [openLyric, setOpenLyric] = useState(null); // { li } | 'new' | null
    const [printJob, setPrintJob] = useState(null);
    const toggleMeta = k => setOpenMeta(o => o === k ? null : k);
    const toggleCell = t => setOpenCell(o => o && o.gi === t.gi && o.ci === t.ci ? null : t);
    const togglePart = pi => setOpenPart(o => o && o.pi === pi ? null : { pi });
    const toggleLyric = li => setOpenLyric(o => o === li ? null : li);
    // Al terminar la edición se cierran todos los paneles abiertos.
    useEffect(() => {
      if (!editMode) { setOpenMeta(null); setOpenCell(null); setOpenPart(null); setOpenLyric(null); }
    }, [editMode]);

    const setUi = patch => setSt(s => ({ ...s, ui: { ...s.ui, ...patch } }));
    const setSize = (key, val) => setUi({ sizes: { ...st.ui.sizes, [key]: val } });

    const setSong = updater => setSt(s => ({
      ...s,
      songs: s.songs.map(x => x.id === cur.id ? updater(x) : x)
    }));
    const setMeta = patch => setSong(x => ({ ...x, meta: { ...x.meta, ...patch } }));

    // Si el tono se fijó a mano (keyLocked), ya no se recalcula solo al
    // editar acordes; si no, se vuelve a detectar en automático cada vez.
    const withAutoKey = x => x.meta.keyLocked ? x : {
      ...x,
      meta: { ...x.meta, key: detectKey(x.groups) || x.meta.key }
    };
    const addGroup = () => setSong(x => withAutoKey({
      ...x,
      groups: [...x.groups, { id: uid(), measures: [] }]
    }));
    const removeGroup = gi => setSong(x => {
      const g = x.groups[gi];
      const groups = x.groups.filter((_, k) => k !== gi);
      const fallback = groups[0] ? groups[0].id : null;
      const structure = x.structure.map(p => p.groupId === g.id ? { ...p, groupId: fallback } : p);
      return withAutoKey({ ...x, groups, structure });
    });
    const setCell = (gi, ci, cell) => setSong(x => {
      const groups = x.groups.map((g, k) => {
        if (k !== gi) return g;
        const measures = g.measures.slice();
        if (ci == null) measures.push(cell); else measures[ci] = cell;
        return { ...g, measures };
      });
      return withAutoKey({ ...x, groups });
    });
    const removeCell = (gi, ci) => setSong(x => withAutoKey({
      ...x,
      groups: x.groups.map((g, k) => k !== gi ? g : { ...g, measures: g.measures.filter((_, i) => i !== ci) })
    }));
    const savePart = (pi, data) => setSong(x => {
      const structure = x.structure.slice();
      if (pi == null) structure.push({ id: uid(), ...data });
      else structure[pi] = { ...structure[pi], ...data };
      return { ...x, structure };
    });
    const removePart = pi => setSong(x => ({ ...x, structure: x.structure.filter((_, k) => k !== pi) }));
    const saveLyric = (li, data) => setSong(x => {
      const lyrics = (x.lyrics || []).slice();
      if (li == null) lyrics.push({ id: uid(), ...data });
      else lyrics[li] = { ...lyrics[li], ...data };
      return { ...x, lyrics };
    });
    const saveManyLyrics = entries => setSong(x => ({
      ...x,
      lyrics: [...(x.lyrics || []), ...entries.map(e => ({ id: uid(), ...e }))]
    }));
    const removeLyric = li => setSong(x => ({ ...x, lyrics: x.lyrics.filter((_, k) => k !== li) }));

    // Capo: al cambiarlo se transporta lo mostrado (capo + transpose se
    // mueven en sentido opuesto) para que la canción siga sonando igual.
    // Recibe un DELTA (+1/-1), no un valor absoluto: así cada clic parte
    // siempre del capo más reciente guardado, aunque dos clics ocurran
    // antes de que React vuelva a pintar (evita que ambos lean el mismo
    // valor "viejo" y el segundo clic no sume nada).
    const setCapo = delta => setSong(x => {
      const old = parseInt(x.meta.capo, 10) || 0;
      const n = Math.max(0, Math.min(12, old + delta));
      const actualDelta = n - old;
      return { ...x, meta: { ...x.meta, capo: String(n), transpose: (x.meta.transpose || 0) - actualDelta } };
    });
    // Fijar el tono a mano lo bloquea: deja de recalcularse solo al
    // editar acordes, hasta que se vuelva a tocar aquí.
    const setKeyManual = key => setMeta({ key, transpose: 0, keyLocked: true });

    const removeSong = id => setSt(s => {
      if (s.songs.length <= 1) return s;
      const songs = s.songs.filter(x => x.id !== id);
      const lists = s.lists.map(l => ({ ...l, songIds: l.songIds.filter(x => x !== id) }));
      const currentId = s.currentId === id ? songs[0].id : s.currentId;
      return { ...s, songs, lists, currentId };
    });

    const cleanSong = s => ({ meta: s.meta, groups: s.groups, structure: s.structure, lyrics: s.lyrics || [] });
    const exportOne = song => {
      downloadBlob(safeName(song.meta.title) + '.json', new Blob([JSON.stringify(cleanSong(song), null, 2)], { type: 'application/json' }));
    };

    // ---- imprimir ----
    useEffect(() => {
      if (!printJob) return;
      const styleEl = document.createElement('style');
      styleEl.textContent = `@page { size: letter ${printJob.orientation === 'horizontal' ? 'landscape' : 'portrait'}; margin: 12mm; }`;
      document.head.appendChild(styleEl);
      const done = () => setPrintJob(null);
      window.addEventListener('afterprint', done, { once: true });
      const tid = setTimeout(() => window.print(), 250);
      return () => {
        clearTimeout(tid);
        document.head.removeChild(styleEl);
        window.removeEventListener('afterprint', done);
      };
    }, [printJob]);

    // ---- navegación interna de esta página (Opciones, Acomodo, etc.) ----
    const [stack, setStack] = useState([]);
    const push = (kind, props) => setStack(s => [...s, { kind, props: props || {} }]);
    const pop = () => setStack(s => s.slice(0, -1));
    const popAll = () => setStack([]);
    const goHome = () => window.goTo('inicio.html');

    function renderPage(page) {
      const P = page.props;
      switch (page.kind) {
        case 'config':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Opciones",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✎",
            text: editMode ? 'Terminar de modificar' : 'Modificar canción',
            sub: editMode ? 'Volver a solo lectura' : 'Toca lo que quieras cambiar',
            primary: true,
            onClick: () => { setEditMode(e => !e); pop(); }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "♬",
            text: "Abrir canción",
            sub: "Cambia de canción guardada",
            onClick: () => window.goTo('canciones.html')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⇪",
            text: "Exportar canción",
            sub: '«' + cur.meta.title + '» en .json',
            onClick: () => { exportOne(cur); }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⎙",
            text: "Imprimir canción",
            sub: "PDF de esta canción",
            onClick: () => push('print', { fromHome: false })
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✕",
            text: "Borrar canción",
            sub: 'Elimina «' + cur.meta.title + '»',
            onClick: () => push('delete-song')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⌂",
            text: "Regresar al inicio",
            tone: "home",
            onClick: () => editMode ? push('home-confirm') : goHome()
          }));
        case 'home-confirm':
          return /*#__PURE__*/React.createElement(Page, {
            title: "¿Guardar cambios?",
            sub: "Estás en modo edición. ¿Quieres guardar y salir, o seguir editando?",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✓",
            text: "Guardar y salir",
            primary: true,
            onClick: () => { setEditMode(false); goHome(); }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✎",
            text: "Seguir editando",
            onClick: pop
          }));
        case 'delete-song':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Borrar canción",
            sub: st.songs.length > 1
              ? '¿Seguro que quieres eliminar «' + cur.meta.title + '»? No se puede deshacer.'
              : 'No puedes borrar la única canción de la base de datos.',
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, st.songs.length > 1 && /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✕",
            text: "Sí, borrar",
            primary: true,
            onClick: () => { removeSong(cur.id); goHome(); }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "‹",
            text: "Cancelar",
            onClick: pop
          }));
        case 'acomodo': {
          const mobile = isMobile();
          const view = st.ui.lyricsView || (mobile ? 'chords-top' : 'chords-left');
          const opts = mobile ? [
            { v: 'lyrics-top', l: 'Letra arriba · Acordes abajo' },
            { v: 'chords-top', l: 'Acordes arriba · Letra abajo' },
            { v: 'lyrics-only', l: 'Solo letra' },
            { v: 'chords-only', l: 'Solo acordes' }
          ] : [
            { v: 'lyrics-left', l: 'Letra izquierda · Acordes derecha' },
            { v: 'chords-left', l: 'Acordes izquierda · Letra derecha' },
            { v: 'lyrics-only', l: 'Solo letra' },
            { v: 'chords-only', l: 'Solo acordes' }
          ];
          return /*#__PURE__*/React.createElement(Page, {
            title: "Acomodo",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, opts.map(o => /*#__PURE__*/React.createElement(RetroBtn, {
            key: o.v,
            icon: view === o.v ? '●' : '○',
            text: o.l,
            selected: view === o.v,
            onClick: () => { setUi({ lyricsView: o.v }); pop(); }
          })));
        }
        case 'print':
          return /*#__PURE__*/React.createElement(PrintFlowPage, {
            fromHome: P.fromHome,
            songs: st.songs,
            cur: cur,
            onBack: pop,
            topbar: chrome.pageTopbar(true),
            onPrint: job => { popAll(); setPrintJob(job); }
          });
        default:
          return null;
      }
    }

  const view = st.ui.lyricsView || (isMobile() ? 'chords-top' : 'chords-left');
  const tr = cur.meta.transpose || 0;
  const shownKey = transposeChord(cur.meta.key || detectKey(cur.groups) || 'C', tr, false);
  const capoN = parseInt(cur.meta.capo, 10) || 0;
  const letterById = Object.fromEntries(cur.groups.map((g, i) => [g.id, letterFor(i)]));
  const sizes = st.ui.sizes;
  const letters = cur.groups.map((g, i) => ({
    id: g.id,
    letter: letterFor(i)
  }));
  const sectionHead = (label, sizeKey) => /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "block-h"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar1"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "bar2"
  }, "|"), " ", label), editMode && /*#__PURE__*/React.createElement(SizeControl, {
    value: sizes[sizeKey],
    onChange: v => setSize(sizeKey, v)
  }));
  const chordOffsetPx = (CONF.chordSizeOffsetPx != null ? CONF.chordSizeOffsetPx : 2) + 'px';
  const chordsSection = /*#__PURE__*/React.createElement("div", {
    className: "song-block",
    key: "chords",
    style: {
      '--sec-scale': sizes.chords,
      '--chord-offset': chordOffsetPx
    }
  }, sectionHead('ACORDES', 'chords'), cur.groups.map((g, gi) => /*#__PURE__*/React.createElement("div", {
    className: "grp-wrap",
    key: g.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "grp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "glabel"
  }, letterFor(gi), editMode && /*#__PURE__*/React.createElement("button", {
    className: "gdel",
    onClick: () => removeGroup(gi),
    "aria-label": "Eliminar grupo"
  }, "✕")), /*#__PURE__*/React.createElement(ChordBars, {
    group: g,
    timeSig: cur.meta.time,
    transpose: tr,
    editMode: editMode,
    openCi: openCell && openCell.gi === gi ? openCell.ci : undefined,
    onEditCell: ci => toggleCell({
      gi,
      ci
    }),
    onAddCell: (fig, tag) => toggleCell({
      gi,
      ci: null,
      presetDur: fig,
      tag
    }),
    onAddBar: () => toggleCell({
      gi,
      ci: null
    })
  })), openCell && openCell.gi === gi && /*#__PURE__*/React.createElement(CellEditor, {
    compact: true,
    initial: openCell.ci != null ? g.measures[openCell.ci] : {
      chord: '',
      dur: openCell.presetDur || 'quarter'
    },
    isNew: openCell.ci == null,
    onDelete: openCell.ci != null ? () => {
      removeCell(gi, openCell.ci);
      setOpenCell(null);
    } : null,
    onAccept: c => {
      setCell(gi, openCell.ci, c);
      setOpenCell(null);
    }
  }))), cur.groups.length === 0 && !editMode && /*#__PURE__*/React.createElement("div", {
    className: "dim-note"
  }, "Sin acordes todavía."), editMode && /*#__PURE__*/React.createElement("button", {
    className: "addgroup-btn",
    onClick: addGroup
  }, /*#__PURE__*/React.createElement("span", {
    className: "glabel small"
  }, letterFor(cur.groups.length)), " agregar"));
  const structureSection = /*#__PURE__*/React.createElement("div", {
    className: "song-block",
    key: "structure",
    style: {
      '--sec-scale': sizes.structure
    }
  }, sectionHead('ESTRUCTURA', 'structure'), /*#__PURE__*/React.createElement(StructureLine, {
    structure: cur.structure,
    letterById: letterById,
    editMode: editMode,
    openIndex: openPart ? openPart.pi : undefined,
    onEditPart: pi => togglePart(pi),
    onAddPart: () => togglePart(null)
  }), openPart && /*#__PURE__*/React.createElement(StructureEditor, {
    compact: true,
    letters: letters,
    initial: openPart.pi != null ? cur.structure[openPart.pi] : null,
    isNew: openPart.pi == null,
    onDelete: openPart.pi != null ? () => {
      removePart(openPart.pi);
      setOpenPart(null);
    } : null,
    onSave: data => {
      savePart(openPart.pi, data);
      setOpenPart(null);
    }
  }));
  const lyricsSection = /*#__PURE__*/React.createElement("div", {
    className: "song-block",
    key: "lyrics",
    style: {
      '--sec-scale': sizes.lyrics
    }
  }, sectionHead('LETRA', 'lyrics'), !cur.lyrics || cur.lyrics.length === 0 ? editMode ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "⊕",
    text: "Agregar letra",
    sub: "Escribe la primera sección",
    onClick: () => toggleLyric('new')
  }), openLyric === 'new' && /*#__PURE__*/React.createElement(LyricParagraphEditor, {
    compact: true,
    isNew: true,
    onSave: data => {
      saveLyric(null, data);
      setOpenLyric(null);
    },
    onSaveMany: entries => {
      saveManyLyrics(entries);
      setOpenLyric(null);
    }
  })) : /*#__PURE__*/React.createElement("div", {
    className: "dim-note"
  }, "Sin letra todavía.") : /*#__PURE__*/React.createElement("div", {
    className: "lyrics"
  }, editMode && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "addbar-btn wide",
    onClick: () => toggleLyric('new')
  }, "+ agregar párrafo"), openLyric === 'new' && /*#__PURE__*/React.createElement(LyricParagraphEditor, {
    compact: true,
    isNew: true,
    onSave: data => {
      saveLyric(null, data);
      setOpenLyric(null);
    },
    onSaveMany: entries => {
      saveManyLyrics(entries);
      setOpenLyric(null);
    }
  })), cur.lyrics.map((s, li) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s.id
  }, /*#__PURE__*/React.createElement("button", {
    className: 'lyric-sec' + (editMode ? ' editable' : '') + (openLyric === li ? ' open-target' : ''),
    disabled: !editMode,
    onClick: () => toggleLyric(li)
  }, s.name && /*#__PURE__*/React.createElement("span", {
    className: "lyric-name"
  }, s.name), /*#__PURE__*/React.createElement("span", {
    className: "lyric-text"
  }, s.text)), openLyric === li && /*#__PURE__*/React.createElement(LyricParagraphEditor, {
    compact: true,
    initial: s,
    isNew: false,
    onDelete: () => {
      removeLyric(li);
      setOpenLyric(null);
    },
    onSave: data => {
      saveLyric(li, data);
      setOpenLyric(null);
    }
  })))));
  const chordsCol = /*#__PURE__*/React.createElement("div", {
    className: "col",
    key: "cc"
  }, chordsSection, structureSection);
  let songBody;
  if (view === 'chords-only') songBody = chordsCol;else if (view === 'lyrics-only') songBody = lyricsSection;else if (view === 'lyrics-left') songBody = /*#__PURE__*/React.createElement("div", {
    className: "split-h"
  }, lyricsSection, chordsCol);else if (view === 'chords-left') songBody = /*#__PURE__*/React.createElement("div", {
    className: "split-h"
  }, chordsCol, lyricsSection);else if (view === 'lyrics-top') songBody = /*#__PURE__*/React.createElement("div", {
    className: "split-v"
  }, lyricsSection, chordsCol);else songBody = /*#__PURE__*/React.createElement("div", {
    className: "split-v"
  }, chordsCol, lyricsSection);
  const KEY_ROW1 = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const KEY_ROW2 = ['C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'];
  // ---- Cambiar tono: transporta los acordes mostrados ----
  // (distinto de "Tono original", que solo declara el tono de la canción)
  const TRANSPOSE_TARGETS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIdx = k => {
    const m = (k || 'C').match(/^([A-G][#b]?)/);
    const r = m ? m[1] : 'C';
    const i = window.SHARP.indexOf(r);
    return i >= 0 ? i : Math.max(0, window.FLAT.indexOf(r));
  };
  const baseKey = cur.meta.key || detectKey(cur.groups) || 'C';
  const isMinorKey = /^[A-G][#b]?m(?!aj)/.test(baseKey);
  const shownRootIdx = rootIdx(shownKey);
  const transposeTo = target => {
    let semis = ((rootIdx(target) - rootIdx(baseKey)) % 12 + 12) % 12;
    if (semis > 6) semis -= 12;
    setSong(x => ({ ...x, meta: { ...x.meta, transpose: semis } }));
  };
  const targetGrid = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Tocar en el tono de… (transporta los acordes)"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, TRANSPOSE_TARGETS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: 'letter-opt' + (rootIdx(t) === shownRootIdx ? ' on' : ''),
    onClick: () => transposeTo(t)
  }, t + (isMinorKey ? 'm' : '')))));
  const viewTonoPanel = /*#__PURE__*/React.createElement(InlinePanel, null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Ajuste rápido"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, transpose: (x.meta.transpose || 0) - 1 } }))
  }, "♭ medio tono"), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, transpose: (x.meta.transpose || 0) + 1 } }))
  }, "♯ medio tono"), tr !== 0 && /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, transpose: 0 } }))
  }, "↺ original")), targetGrid, /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Listo",
    primary: true,
    onClick: () => setOpenMeta(null)
  })));
  const tonoPanel = /*#__PURE__*/React.createElement(InlinePanel, null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Ajuste rápido (no cambia el tono original)"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, transpose: (x.meta.transpose || 0) - 1 } }))
  }, "♭ medio tono"), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, transpose: (x.meta.transpose || 0) + 1 } }))
  }, "♯ medio tono"), tr !== 0 && /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setMeta({
      transpose: 0
    })
  }, "↺ original")), targetGrid, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Declarar tono original (solo cambia la etiqueta, no transporta)"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, KEY_ROW1.map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: 'letter-opt' + ((cur.meta.key || '') === k ? ' on' : ''),
    onClick: () => setKeyManual(k)
  }, k)), KEY_ROW1.map(k => /*#__PURE__*/React.createElement("button", {
    key: k + 'm',
    className: 'letter-opt' + ((cur.meta.key || '') === k + 'm' ? ' on' : ''),
    onClick: () => setKeyManual(k + 'm')
  }, k, "m"))), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Sostenidos y bemoles"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, KEY_ROW2.map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: 'letter-opt' + ((cur.meta.key || '') === k ? ' on' : ''),
    onClick: () => setKeyManual(k)
  }, k))), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    onClick: () => setOpenMeta(null)
  })));
  const compasPanel = /*#__PURE__*/React.createElement(InlinePanel, null, /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, TIME_OPTIONS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: 'letter-opt' + (cur.meta.time === t ? ' on' : ''),
    onClick: () => setMeta({
      time: t
    })
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    onClick: () => setOpenMeta(null)
  })));
  const tempoPanel = /*#__PURE__*/React.createElement(InlinePanel, null, /*#__PURE__*/React.createElement("div", {
    className: "num-editor"
  }, /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, tempo: String(Math.max(30, (parseInt(x.meta.tempo, 10) || 96) - 5)) } }))
  }, "«"), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, tempo: String(Math.max(30, (parseInt(x.meta.tempo, 10) || 96) - 1)) } }))
  }, "–"), /*#__PURE__*/React.createElement("span", {
    className: "num-val"
  }, cur.meta.tempo, " ", /*#__PURE__*/React.createElement("small", null, "bpm")), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, tempo: String(Math.min(300, (parseInt(x.meta.tempo, 10) || 96) + 1)) } }))
  }, "+"), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setSong(x => ({ ...x, meta: { ...x.meta, tempo: String(Math.min(300, (parseInt(x.meta.tempo, 10) || 96) + 5)) } }))
  }, "»")), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    onClick: () => setOpenMeta(null)
  })));
  const capoPanel = /*#__PURE__*/React.createElement(InlinePanel, null, /*#__PURE__*/React.createElement("div", {
    className: "num-editor"
  }, /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setCapo(-1)
  }, "–"), /*#__PURE__*/React.createElement("span", {
    className: "num-val"
  }, capoN, " ", /*#__PURE__*/React.createElement("small", null, "traste")), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setCapo(1)
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "dim-note"
  }, "Cambiar el capo transporta los acordes para que la canción se mantenga en el mismo tono."), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    onClick: () => setOpenMeta(null)
  })));
  const metaLine = editMode ? /*#__PURE__*/React.createElement("div", {
    className: "meta-wrap",
    style: {
      '--sec-scale': sizes.meta
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "meta-line editing"
  }, /*#__PURE__*/React.createElement("button", {
    className: "meta-btn",
    onClick: () => toggleMeta('tono')
  }, "TONO ", shownKey), /*#__PURE__*/React.createElement("button", {
    className: "meta-btn",
    onClick: () => toggleMeta('compas')
  }, "COMPÁS ", cur.meta.time), /*#__PURE__*/React.createElement("button", {
    className: "meta-btn",
    onClick: () => toggleMeta('tempo')
  }, "TEMPO ", cur.meta.tempo, " BPM"), /*#__PURE__*/React.createElement("button", {
    className: "meta-btn",
    onClick: () => toggleMeta('capo')
  }, "CAPO ", cur.meta.capo)), openMeta === 'tono' && tonoPanel, openMeta === 'compas' && compasPanel, openMeta === 'tempo' && tempoPanel, openMeta === 'capo' && capoPanel) : /*#__PURE__*/React.createElement("div", {
    className: "meta-wrap",
    style: {
      '--sec-scale': sizes.meta
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "meta-line"
  }, "COMPÁS ", cur.meta.time, " · ", /*#__PURE__*/React.createElement("button", {
    className: "meta-btn",
    onClick: () => toggleMeta('tono')
  }, "TONO ", shownKey, openMeta === 'tono' ? ' ▴' : ' ▾'), " · TEMPO ", cur.meta.tempo, " bpm", capoN > 0 ? ' · CAPO ' + cur.meta.capo : ''), openMeta === 'tono' && viewTonoPanel);
  const songScreen = /*#__PURE__*/React.createElement("div", {
    className: "app song-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar no-print-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "top-left"
  }, /*#__PURE__*/React.createElement(BrandBlock, {
    small: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "top-right"
  }, /*#__PURE__*/React.createElement(TopBtn, {
    text: editMode ? 'TERMINAR' : 'EDITAR CANCIÓN',
    primary: true,
    onClick: () => setEditMode(e => !e)
  }), /*#__PURE__*/React.createElement(TopBtn, {
    text: "ACOMODO",
    onClick: () => push('acomodo')
  }), /*#__PURE__*/React.createElement(TopBtn, {
    text: "OPCIONES",
    onClick: () => push('config')
  }), fromListId && /*#__PURE__*/React.createElement(TopBtn, {
    text: "LISTA",
    onClick: () => window.goTo('lista.html', {
      id: fromListId
    })
  }), chrome.topIcons(true))), /*#__PURE__*/React.createElement("div", {
    className: "titlebar",
    style: {
      '--sec-scale': sizes.title
    }
  }, editMode && /*#__PURE__*/React.createElement("div", {
    className: "edit-hint top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar1"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "bar2"
  }, "|"), " Toca lo que quieras modificar."), editMode && /*#__PURE__*/React.createElement("div", {
    className: "title-size-row"
  }, /*#__PURE__*/React.createElement(SizeControl, {
    value: sizes.title,
    onChange: v => setSize('title', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "title-row"
  }, editMode ? /*#__PURE__*/React.createElement("input", {
    className: "song-title edit-title",
    value: cur.meta.title,
    onChange: e => setMeta({
      title: e.target.value
    }),
    "aria-label": "Título"
  }) : /*#__PURE__*/React.createElement("h1", {
    className: "song-title"
  }, cur.meta.title), editMode && /*#__PURE__*/React.createElement(SizeControl, {
    value: sizes.meta,
    onChange: v => setSize('meta', v)
  }))), metaLine, /*#__PURE__*/React.createElement(Metronome, {
    tempo: cur.meta.tempo,
    timeSig: cur.meta.time,
    open: metroOpen,
    onToggle: () => setMetroOpen(o => !o),
    scale: sizes.meta
  }), songBody);

    return /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", {
        className: printJob ? 'screen-root printing' : 'screen-root'
      },
        songScreen,
        stack.map((pg, i) => /*#__PURE__*/React.createElement("div", {
          key: i,
          className: "page-layer",
          style: { zIndex: 50 + i }
        }, renderPage(pg))),
        chrome.overlayLayer
      ),
      printJob && /*#__PURE__*/React.createElement(PrintSheet, { job: printJob })
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
