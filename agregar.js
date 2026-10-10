(function () {
  const { Page, RetroBtn, SectionNamePicker, useLibrary, usePageChrome } = window;
  const { useState } = window.React;
  const { uid, newSong, TIME_OPTIONS } = window;

  // ---- AddSongPage: idéntico al de la versión original (index.html) ----
function AddSongPage({
  songs,
  onBack,
  onCreate,
  topbar
}) {
  const {
    useState
  } = window.React;
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('4/4');
  const [tempo, setTempo] = useState('120');
  const [capo, setCapo] = useState('0');
  const [withLyrics, setWithLyrics] = useState(false);
  const [sections, setSections] = useState([{
    id: uid(),
    name: 'Verso 1',
    text: ''
  }]);
  const dupe = songs.some(s => (s.meta.title || '').trim().toLowerCase() === title.trim().toLowerCase()) && title.trim();
  const create = () => {
    if (dupe) return;
    onCreate(newSong({
      title: title.trim() || 'Nueva canción',
      time,
      tempo,
      capo
    }, withLyrics ? sections.filter(s => s.name || s.text) : []));
  };
  return /*#__PURE__*/React.createElement(Page, {
    title: "Agregar canción",
    onBack: onBack,
    topbar: topbar
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Título"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    autoFocus: true,
    value: title,
    placeholder: "Nombre de la canción",
    onChange: e => setTitle(e.target.value)
  }), dupe && /*#__PURE__*/React.createElement("div", {
    className: "err-note"
  }, "Ya existe una canción con ese título."), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Compás"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, TIME_OPTIONS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: 'letter-opt' + (time === t ? ' on' : ''),
    onClick: () => setTime(t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "two-col"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Tempo (bpm)"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    inputMode: "numeric",
    value: tempo,
    onChange: e => setTempo(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Capo"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    inputMode: "numeric",
    value: capo,
    onChange: e => setCapo(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dim-note"
  }, "El tono se calcula solo a partir de los acordes que agregues; también puedes fijarlo después en «Modificar canción»."), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Letra"), !withLyrics ? /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "⊕",
    text: "Agregar letra",
    onClick: () => setWithLyrics(true)
  }) : /*#__PURE__*/React.createElement("div", {
    className: "addsong-lyrics"
  }, sections.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "lyr-block",
    key: s.id
  }, /*#__PURE__*/React.createElement("button", {
    className: "lyr-del",
    onClick: () => setSections(x => x.filter((_, k) => k !== i))
  }, "✕"), /*#__PURE__*/React.createElement(SectionNamePicker, {
    value: s.name,
    onChange: n => setSections(x => x.map((y, k) => k === i ? {
      ...y,
      name: n
    } : y))
  }), /*#__PURE__*/React.createElement("textarea", {
    className: "input lyric-ta",
    placeholder: "Texto de la sección…",
    value: s.text,
    onChange: e => setSections(x => x.map((y, k) => k === i ? {
      ...y,
      text: e.target.value
    } : y))
  }))), /*#__PURE__*/React.createElement("button", {
    className: "addbar-btn",
    onClick: () => setSections(x => [...x, {
      id: uid(),
      name: 'Coro',
      text: ''
    }])
  }, "+ añadir sección")), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Crear canción",
    primary: true,
    disabled: !!dupe,
    onClick: create
  })));
}

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    const onCreate = song => {
      setSt(s => ({
        ...s,
        songs: [...s.songs, song],
        currentId: song.id
      }));
      // Como en la versión original: al crear la canción se abre de una
      // vez para seguir trabajando en ella.
      window.goTo('cancion.html', { id: song.id });
    };

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      /*#__PURE__*/React.createElement(AddSongPage, {
        songs: st.songs,
        onBack: () => window.goTo('inicio.html'),
        topbar: chrome.pageTopbar(true),
        onCreate: onCreate
      }),
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
