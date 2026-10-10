(function () {
  const {
    Page, RetroBtn, SongPicker, useLibrary, usePageChrome,
    uid, safeName, downloadBlob, songToOpenLyrics, openLyricsToSong, detectKey
  } = window;
  const { useState, useRef, useEffect } = window.React;

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

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);
    const fileRef = useRef(null);
    const importMode = useRef('json');

    const [pendingImport, setPendingImport] = useState(null);
    const [printJob, setPrintJob] = useState(null);

    // ---- navegación interna de esta sección (misma forma que la
    // versión original: pila de {kind, props}) ----
    const [stack, setStack] = useState([]);
    const push = (kind, props) => setStack(s => [...s, { kind, props: props || {} }]);
    const pop = () => setStack(s => s.slice(0, -1));
    const popAll = () => setStack([]);
    const toggleTopSel = id => setStack(s => {
      if (!s.length) return s;
      const copy = s.slice();
      const top = copy[copy.length - 1];
      const sel = top.props.sel || [];
      const nextSel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
      copy[copy.length - 1] = { ...top, props: { ...top.props, sel: nextSel } };
      return copy;
    });

    // ---- imprimir (idéntico a la versión original) ----
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

    // ---- importar / exportar (misma lógica que la versión original) ----
    const triggerImport = mode => {
      importMode.current = mode;
      if (fileRef.current) {
        fileRef.current.value = '';
        fileRef.current.click();
      }
    };
    const dedupeTitle = (title, songs) => {
      let t = title;
      while (songs.some(s => (s.meta.title || '').trim().toLowerCase() === t.trim().toLowerCase())) {
        t = t + ' 02';
      }
      return t;
    };
    const rawToCandidate = raw => ({
      meta: { transpose: 0, capo: '0', ...raw.meta },
      groups: raw.groups || [],
      structure: raw.structure || [],
      lyrics: raw.lyrics || []
    });
    const parseJsonCandidates = jsonText => {
      const data = JSON.parse(jsonText);
      const arr = Array.isArray(data) ? data : [data];
      return arr.map(rawToCandidate);
    };
    const parseXmlCandidate = xmlText => {
      const parsed = openLyricsToSong(xmlText);
      return rawToCandidate({ meta: { title: parsed.title }, lyrics: parsed.lyrics });
    };
    // commit candidates: 'copy' agrega «02» a los títulos en conflicto,
    // 'replace' sobrescribe la canción existente (conserva su id, así
    // sigue apareciendo en cualquier lista donde estuviera).
    // El id de la primera canción importada se calcula ANTES de llamar a
    // setSt (no dentro del updater, que corre en otro momento), para
    // poder navegar de inmediato con el valor correcto.
    const commitImport = (candidates, conflictMode) => {
      setSt(s => {
        let songs = s.songs.slice();
        let firstId = null;
        candidates.forEach(c => {
          const title = (c.meta.title || 'Canción importada').trim();
          const existingIdx = songs.findIndex(x => (x.meta.title || '').trim().toLowerCase() === title.toLowerCase());
          if (existingIdx >= 0 && conflictMode === 'replace') {
            const merged = {
              id: songs[existingIdx].id,
              meta: { ...c.meta, title },
              groups: c.groups, structure: c.structure, lyrics: c.lyrics
            };
            if (!merged.meta.key) merged.meta.key = detectKey(merged.groups);
            songs[existingIdx] = merged;
            if (!firstId) firstId = merged.id;
          } else {
            const finalTitle = existingIdx >= 0 ? dedupeTitle(title, songs) : title;
            const song = { id: uid(), meta: { ...c.meta, title: finalTitle }, groups: c.groups, structure: c.structure, lyrics: c.lyrics };
            if (!song.meta.key) song.meta.key = detectKey(song.groups);
            songs = [...songs, song];
            if (!firstId) firstId = song.id;
          }
        });
        if (firstId) window.goTo('cancion.html', { id: firstId });
        return { ...s, songs, currentId: firstId || s.currentId };
      });
    };
    const startImport = candidates => {
      if (!candidates.length) return;
      const hasConflict = candidates.some(c => st.songs.some(x => (x.meta.title || '').trim().toLowerCase() === (c.meta.title || '').trim().toLowerCase()));
      if (hasConflict) {
        setPendingImport(candidates);
        popAll();
        push('import-conflict');
      } else commitImport(candidates, 'copy');
    };
    const onFile = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      // ZIP: descomprime y procesa cada .json o .xml adentro
      if (/\.zip$/i.test(file.name)) {
        JSZip.loadAsync(file).then(zip => {
          const entries = Object.values(zip.files).filter(f => !f.dir && /\.(json|xml)$/i.test(f.name));
          if (!entries.length) { alert('El ZIP no contiene archivos .json ni .xml'); return; }
          const candidates = [];
          const promises = entries.map(entry => entry.async('string').then(text => {
            try {
              if (/\.xml$/i.test(entry.name)) candidates.push(parseXmlCandidate(text));
              else candidates.push(...parseJsonCandidates(text));
            } catch (err) {
              console.warn('No se pudo importar ' + entry.name + ':', err.message);
            }
          }));
          Promise.all(promises).then(() => startImport(candidates));
        }).catch(err => alert('No se pudo leer el ZIP: ' + err.message));
        return;
      }
      // JSON o XML individual
      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (importMode.current === 'xml' || /\.xml$/i.test(file.name)) {
            startImport([parseXmlCandidate(reader.result)]);
          } else {
            startImport(parseJsonCandidates(reader.result));
          }
        } catch (err) {
          alert('No se pudo importar el archivo: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    const cleanSong = (s, withLyrics = true) => {
      const out = { meta: s.meta, groups: s.groups, structure: s.structure };
      out.lyrics = withLyrics ? s.lyrics || [] : [];
      return out;
    };
    const exportOne = song => {
      downloadBlob(safeName(song.meta.title) + '.json', new Blob([JSON.stringify(cleanSong(song), null, 2)], { type: 'application/json' }));
    };
    const exportZip = async (name, files) => {
      const zip = new JSZip();
      files.forEach(f => zip.file(f.name, f.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(name, blob);
    };
    const exportManySongs = songs => {
      if (songs.length === 1) return exportOne(songs[0]);
      return exportZip('canciones.zip', songs.map(s => ({ name: safeName(s.meta.title) + '.json', content: JSON.stringify(cleanSong(s), null, 2) })));
    };
    const exportLyricsXml = song => {
      downloadBlob(safeName(song.meta.title) + '.xml', new Blob([songToOpenLyrics(song)], { type: 'application/xml' }));
    };
    const exportLyricsMany = songs => {
      if (songs.length === 1) return exportLyricsXml(songs[0]);
      return exportZip('letras.zip', songs.map(s => ({ name: safeName(s.meta.title) + '.xml', content: songToOpenLyrics(s) })));
    };
    const exportAllLyricsZip = () => exportLyricsMany(st.songs);

    // ---- páginas internas de esta sección ----
    function renderPage(page) {
      const P = page.props;
      switch (page.kind) {
        case 'import':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Importar canciones",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⇣",
            text: "Importar canción",
            sub: "Archivo .json o .zip",
            onClick: () => triggerImport('json')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⇣",
            text: "Importar letra con XML",
            sub: "Formato OpenLyrics (OpenLP)",
            onClick: () => triggerImport('xml')
          }), /*#__PURE__*/React.createElement("div", {
            className: "dim-note"
          }, "Si un título ya existe en la base de datos, te preguntamos si quieres reemplazarla o guardar una copia."));

        case 'import-conflict': {
          if (!pendingImport) return /*#__PURE__*/React.createElement(Page, {
            title: "Importar",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement("div", { className: "dim-note" }, "Nada pendiente."));
          const dupes = pendingImport.filter(c => st.songs.some(x => (x.meta.title || '').trim().toLowerCase() === (c.meta.title || '').trim().toLowerCase()));
          const resolve = mode => {
            const cands = pendingImport;
            setPendingImport(null);
            commitImport(cands, mode);
          };
          return /*#__PURE__*/React.createElement(Page, {
            title: "Canciones repetidas",
            sub: 'Ya existe en la base de datos: ' + dupes.map(d => '«' + d.meta.title + '»').join(', '),
            onBack: () => { setPendingImport(null); pop(); },
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "↺",
            text: "Reemplazar existentes",
            sub: "Sobrescribe los datos de la canción que ya tienes",
            tone: "del",
            onClick: () => resolve('replace')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⊕",
            text: "Guardar como copia",
            sub: "Se agrega con «02» al final del título",
            primary: true,
            onClick: () => resolve('copy')
          }));
        }

        // ---------------- EXPORTAR ----------------
        case 'export-main':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Exportar",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⎙",
            text: "Imprimir",
            sub: "Generar PDF",
            onClick: () => push('print-root')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "♬",
            text: "Canción",
            sub: "Exportar canciones, letras o listas",
            onClick: () => push('export-song-root')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▣",
            text: "Todas las canciones",
            sub: st.songs.length + ' canciones en zip',
            onClick: () => { exportManySongs(st.songs); pop(); }
          }));
        case 'export-song-root':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Exportar canción",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "♬",
            text: "Exportar canción",
            sub: "Formato .json",
            onClick: () => push('export-song-pick')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✎",
            text: "Letra",
            sub: "Formato OpenLP (.xml)",
            onClick: () => push('export-lyrics-root')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▣",
            text: "Listas",
            sub: "Exportar una lista o todas",
            onClick: () => window.goTo('maslistas.html')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▤",
            text: "Toda la base de datos",
            sub: "Acordes, letras o ambos",
            onClick: () => push('export-db-root')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "☑",
            text: "Canciones varias",
            sub: "Elige varias para exportar",
            onClick: () => push('export-varias')
          }));
        case 'export-song-pick':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Exportar canción",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(SongPicker, {
            songs: st.songs,
            mode: "single",
            onPick: s => { exportOne(s); popAll(); }
          }));
        case 'export-lyrics-root':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Exportar letra",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "♬",
            text: "Seleccionar canción",
            sub: "Elige una o varias",
            onClick: () => push('export-lyrics-pick')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▤",
            text: "Todas las letras",
            sub: st.songs.length + ' canciones en zip',
            onClick: () => { exportAllLyricsZip(); popAll(); }
          }));
        case 'export-lyrics-pick':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Seleccionar canción",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(SongPicker, {
            songs: st.songs,
            mode: "multi",
            selected: P.sel || [],
            onToggle: toggleTopSel,
            actionLabel: "Exportar letra",
            onAction: () => { exportLyricsMany(st.songs.filter(s => (P.sel || []).includes(s.id))); popAll(); }
          }));
        case 'export-db-root':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Toda la base de datos",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "♩",
            text: "Acordes",
            sub: "Sin letras, .json en zip",
            onClick: () => {
              exportZip('acordes.zip', st.songs.map(s => ({ name: safeName(s.meta.title) + '.json', content: JSON.stringify(cleanSong(s, false), null, 2) })));
              popAll();
            }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "✎",
            text: "Letras",
            sub: "OpenLP (.xml) en zip",
            onClick: () => { exportAllLyricsZip(); popAll(); }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▤",
            text: "Letras y acordes",
            sub: "Elige el acomodo",
            onClick: () => push('export-db-layout')
          }));
        case 'export-db-layout':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Letras y acordes",
            sub: "Elige el acomodo para el PDF combinado.",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⎙",
            text: "Letra izquierda · Acordes derecha",
            onClick: () => { popAll(); setPrintJob({ songs: st.songs, layout: 'lyrics-left', orientation: 'horizontal' }); }
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "⎙",
            text: "Acordes izquierda · Letra derecha",
            onClick: () => { popAll(); setPrintJob({ songs: st.songs, layout: 'chords-left', orientation: 'horizontal' }); }
          }));
        case 'export-varias':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Canciones varias",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(SongPicker, {
            songs: st.songs,
            mode: "multi",
            selected: P.sel || [],
            onToggle: toggleTopSel,
            actionLabel: "Exportar",
            onAction: () => { exportManySongs(st.songs.filter(s => (P.sel || []).includes(s.id))); popAll(); }
          }));

        // ---------------- IMPRIMIR ----------------
        case 'print-root':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Imprimir",
            sub: "¿Qué quieres imprimir?",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "☑",
            text: "Seleccionar",
            sub: "Elige una o varias canciones",
            onClick: () => push('print-select')
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▣",
            text: "Toda la base de datos",
            sub: st.songs.length + ' canciones',
            onClick: () => push('print-orient', { songIds: st.songs.map(s => s.id) })
          }));
        case 'print-select':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Seleccionar canciones",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(SongPicker, {
            songs: st.songs,
            mode: "multi",
            selected: P.sel || [],
            onToggle: toggleTopSel,
            actionLabel: "Imprimir",
            onAction: () => push('print-orient', { songIds: P.sel || [] })
          }));
        case 'print-orient':
          return /*#__PURE__*/React.createElement(Page, {
            title: "Imprimir",
            sub: "Elige la orientación de la hoja.",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▯",
            text: "Vertical",
            sub: "Hoja carta vertical",
            onClick: () => push('print-layout', { songIds: P.songIds, orientation: 'vertical' })
          }), /*#__PURE__*/React.createElement(RetroBtn, {
            icon: "▭",
            text: "Horizontal",
            sub: "Todo en una página",
            onClick: () => push('print-layout', { songIds: P.songIds, orientation: 'horizontal' })
          }));
        case 'print-layout': {
          const songs = st.songs.filter(s => (P.songIds || []).includes(s.id));
          const opts = P.orientation === 'horizontal' ? [
            { v: 'lyrics-left', l: 'Letra izquierda · Acordes derecha' },
            { v: 'chords-left', l: 'Acordes izquierda · Letra derecha' }
          ] : [
            { v: 'both', l: 'Acordes y letra' },
            { v: 'chords-only', l: 'Solo acordes' },
            { v: 'lyrics-only', l: 'Solo letra' },
            { v: 'lyrics-left', l: 'Letra izquierda · Acordes derecha' },
            { v: 'chords-left', l: 'Acordes izquierda · Letra derecha' }
          ];
          return /*#__PURE__*/React.createElement(Page, {
            title: "Imprimir",
            sub: "Elige el acomodo.",
            onBack: pop,
            topbar: chrome.pageTopbar(true)
          }, opts.map(o => /*#__PURE__*/React.createElement(RetroBtn, {
            key: o.v,
            icon: "⎙",
            text: o.l,
            onClick: () => { popAll(); setPrintJob({ songs, layout: o.v, orientation: P.orientation }); }
          })));
        }

        default:
          return null;
      }
    }

    // ---- menú principal de esta sección ----
    const rootPage = /*#__PURE__*/React.createElement(Page, {
      title: "Herramientas",
      sub: "Importar, exportar o imprimir canciones y listas.",
      onBack: () => window.goTo('inicio.html'),
      topbar: chrome.pageTopbar(true)
    }, /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "⇣",
      text: "Importar",
      sub: ".json, .zip o letra .xml",
      onClick: () => push('import')
    }), /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "⇪",
      text: "Exportar",
      sub: "Canciones, letras o listas",
      onClick: () => push('export-main')
    }), /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "⎙",
      text: "Imprimir",
      sub: "Una canción o toda la base",
      onClick: () => push('print-root')
    }), /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "▶",
      text: "Explicación",
      sub: "Guía completa de uso",
      onClick: () => window.open((window.APP_CONFIG || {}).explanationPath || 'config/explicacion.html', '_blank')
    }));

    return /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("input", {
        ref: fileRef,
        type: "file",
        accept: ".json,.xml,.zip,application/json,application/xml,text/xml,application/zip",
        style: { display: 'none' },
        onChange: onFile
      }),
      /*#__PURE__*/React.createElement("div", {
        className: printJob ? 'screen-root printing' : 'screen-root'
      },
        stack.length === 0 ? rootPage : null,
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
