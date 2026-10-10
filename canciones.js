(function () {
  const { Page, SongPicker, useLibrary, usePageChrome } = window;

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    // Abrir una canción: navega a la página de la canción (cancion.html)
    // pasando su id por la URL.
    const openSong = song => window.goTo('cancion.html', { id: song.id });

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      /*#__PURE__*/React.createElement(Page, {
        title: "Abrir canción",
        onBack: () => window.goTo('inicio.html'),
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement(SongPicker, {
        songs: st.songs,
        mode: "single",
        onPick: openSong
      })),
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
