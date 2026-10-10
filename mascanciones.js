(function () {
  const { Page, RetroBtn, SongPicker, useLibrary, usePageChrome } = window;
  const { useState } = window.React;

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    // Pila interna de esta sección: 'root' | 'delete-pick' | { kind:'delete-confirm', songId }
    const [stack, setStack] = useState(['root']);
    const push = entry => setStack(s => [...s, entry]);
    const pop = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
    const top = stack[stack.length - 1];

    // Igual que removeSong en la versión original: también limpia la
    // canción de cualquier lista donde estuviera.
    const removeSong = id => setSt(s => {
      if (s.songs.length <= 1) return s;
      const songs = s.songs.filter(x => x.id !== id);
      const lists = s.lists.map(l => ({
        ...l,
        songIds: l.songIds.filter(x => x !== id)
      }));
      const currentId = s.currentId === id ? songs[0].id : s.currentId;
      return { ...s, songs, lists, currentId };
    });

    let page;
    if (top === 'root') {
      page = /*#__PURE__*/React.createElement(Page, {
        title: "Canciones | Más opciones",
        onBack: () => window.goTo('inicio.html'),
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "⇣",
        text: "Importar",
        sub: ".json, .zip o letra .xml",
        onClick: () => window.goTo('herramientas.html')
      }), /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "⇪",
        text: "Exportar",
        sub: "Canción, letra, listas o toda la base",
        onClick: () => window.goTo('herramientas.html')
      }), /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "✕",
        text: "Borrar canción",
        sub: "Elige cuál eliminar",
        tone: "del",
        onClick: () => push('delete-pick')
      }));
    } else if (top === 'delete-pick') {
      page = /*#__PURE__*/React.createElement(Page, {
        title: "Borrar canción",
        sub: "Elige cuál eliminar.",
        onBack: pop,
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement(SongPicker, {
        songs: st.songs,
        mode: "single",
        onPick: s => push({ kind: 'delete-confirm', songId: s.id })
      }));
    } else if (top && top.kind === 'delete-confirm') {
      const song = st.songs.find(s => s.id === top.songId);
      if (!song) {
        page = /*#__PURE__*/React.createElement(Page, {
          title: "Borrar canción",
          onBack: pop,
          topbar: chrome.pageTopbar(true)
        }, /*#__PURE__*/React.createElement("div", { className: "dim-note" }, "Esa canción ya no existe."));
      } else {
        page = /*#__PURE__*/React.createElement(Page, {
          title: "Borrar canción",
          sub: st.songs.length > 1
            ? '¿Seguro que quieres eliminar «' + song.meta.title + '»? No se puede deshacer.'
            : 'No puedes borrar la única canción de la base de datos.',
          onBack: pop,
          topbar: chrome.pageTopbar(true)
        }, st.songs.length > 1 && /*#__PURE__*/React.createElement(RetroBtn, {
          icon: "✕",
          text: "Sí, borrar",
          tone: "del",
          primary: true,
          onClick: () => {
            removeSong(song.id);
            setStack(['root']);
          }
        }), /*#__PURE__*/React.createElement(RetroBtn, {
          icon: "‹",
          text: "Cancelar",
          onClick: pop
        }));
      }
    }

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      page,
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
