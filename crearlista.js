(function () {
  const { Page, RetroBtn, FolderGrid, useLibrary, usePageChrome, FOLDER_THRESHOLD, uid, newSong } = window;
  const { useState } = window.React;

  // ---- Selector de canciones con UN SOLO recuadro de búsqueda ----
  // A diferencia del selector genérico (SongPicker), aquí el mismo
  // cuadro sirve para buscar canciones existentes Y para escribir el
  // nombre de una que todavía no existe: si no hay resultados aparece
  // la leyenda y el botón para agregarla directo a la lista.
  function ListSongPicker({ songs, selected, onToggle, onCreateSong }) {
    const [query, setQuery] = useState('');
    const [letter, setLetter] = useState(null);
    const q = query.trim().toLowerCase();
    const filtered = q ? songs.filter(s => (s.meta.title || '').toLowerCase().includes(q)) : songs;
    const needsFolders = !q && filtered.length > FOLDER_THRESHOLD;
    const shown = letter
      ? filtered.filter(s => ((s.meta.title || '#').trim().charAt(0).toUpperCase() || '#') === letter)
      : filtered;

    const rowFor = s => /*#__PURE__*/React.createElement(RetroBtn, {
      key: s.id,
      icon: selected.includes(s.id) ? '☑' : '☐',
      text: s.meta.title || 'Sin título',
      selected: selected.includes(s.id),
      sub: 'Tono ' + (s.meta.key || '—') + ' · ' + s.meta.time,
      onClick: () => onToggle(s.id)
    });

    return /*#__PURE__*/React.createElement("div", { className: "song-picker" },
      /*#__PURE__*/React.createElement("input", {
        className: "search-bar",
        value: query,
        onChange: e => { setQuery(e.target.value); setLetter(null); },
        placeholder: "Buscar o escribir el nombre de una canción…"
      }),
      needsFolders && !letter && /*#__PURE__*/React.createElement(FolderGrid, {
        letters: [...new Set(filtered.map(s => (s.meta.title || '#').trim().charAt(0).toUpperCase() || '#'))].sort(),
        onPick: setLetter
      }),
      (!needsFolders || letter || q) && /*#__PURE__*/React.createElement("div", {
        className: "picker-list"
      }, shown.map(rowFor)),

      // Sin coincidencias y hay algo escrito: leyenda + botón para
      // crear la canción y agregarla de una vez a la lista.
      q && filtered.length === 0 && /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("div", {
          className: "dim-note center"
        }, (window.APP_CONFIG || {}).noResultsText || 'No se encontró ninguna canción con ese nombre.'),
        /*#__PURE__*/React.createElement("div", {
          className: "ed-actions"
        }, /*#__PURE__*/React.createElement(RetroBtn, {
          icon: "⊕",
          text: "Agregar a la lista",
          primary: true,
          onClick: () => {
            const id = onCreateSong(query.trim());
            onToggle(id);
            setQuery('');
          }
        }))
      ),

      needsFolders && letter && /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "‹",
        text: "Volver a las carpetas",
        onClick: () => setLetter(null)
      })
    );
  }

  function CreateListPage({ songs, defaultName, full, onBack, onSave, onCreateSong, topbar }) {
    const [name, setName] = useState(defaultName || 'Lista 1');
    const [sel, setSel] = useState([]);
    const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    if (full) {
      return /*#__PURE__*/React.createElement(Page, {
        title: "Crear lista",
        sub: "Ya tienes 10 listas. Borra una antes de crear otra.",
        onBack: onBack,
        topbar: topbar
      }, /*#__PURE__*/React.createElement("div", {
        className: "dim-note"
      }, "Ve a Listas → Abrir para eliminar alguna."));
    }

    return /*#__PURE__*/React.createElement(Page, {
      title: "Crear lista",
      onBack: onBack,
      topbar: topbar
    }, /*#__PURE__*/React.createElement("div", {
      className: "ed-label"
    }, "Nombre de la lista"), /*#__PURE__*/React.createElement("input", {
      className: "input",
      value: name,
      onChange: e => setName(e.target.value),
      placeholder: "Ej. Lista próximo domingo"
    }), /*#__PURE__*/React.createElement("div", {
      className: "ed-label"
    }, "Canciones"), /*#__PURE__*/React.createElement(ListSongPicker, {
      songs: songs,
      selected: sel,
      onToggle: toggle,
      onCreateSong: onCreateSong
    }), sel.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "picker-action"
    }, /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "✓",
      text: 'Guardar lista (' + sel.length + ')',
      primary: true,
      onClick: () => onSave(sel, name.trim() || defaultName)
    })));
  }

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    const nextListName = () => {
      for (let i = 1; i <= window.MAX_LISTS; i++) {
        const n = 'Lista ' + i;
        if (!st.lists.find(l => l.name === n)) return n;
      }
      return 'Lista ' + (st.lists.length + 1);
    };

    const saveList = (songIds, name) => {
      if (st.lists.length >= window.MAX_LISTS) return false;
      setSt(s => ({
        ...s,
        lists: [...s.lists, { id: uid(), name: name || nextListName(), songIds, disabled: {} }]
      }));
      return true;
    };

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      /*#__PURE__*/React.createElement(CreateListPage, {
        songs: st.songs,
        defaultName: nextListName(),
        full: st.lists.length >= window.MAX_LISTS,
        onBack: () => window.goTo('inicio.html'),
        topbar: chrome.pageTopbar(true),
        onCreateSong: title => {
          const song = newSong({ title });
          setSt(s => ({ ...s, songs: [...s.songs, song] }));
          return song.id;
        },
        onSave: (ids, name) => {
          saveList(ids, name);
          window.goTo('listas.html');
        }
      }),
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
