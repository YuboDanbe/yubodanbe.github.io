(function () {
  const { Page, RetroBtn, IconBtn, useLibrary, usePageChrome } = window;

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    const removeList = id => setSt(s => ({
      ...s,
      lists: s.lists.filter(l => l.id !== id)
    }));

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      /*#__PURE__*/React.createElement(Page, {
        title: "Abrir lista",
        onBack: () => window.goTo('inicio.html'),
        topbar: chrome.pageTopbar(true)
      },
        st.lists.length === 0 && /*#__PURE__*/React.createElement("div", {
          className: "dim-note"
        }, "Sin listas guardadas."),
        st.lists.map(l => /*#__PURE__*/React.createElement("div", {
          // Fila que nunca se rompe a otro renglón: el botón de cerrar (✕)
          // queda siempre a la derecha del botón con el nombre de la lista.
          className: "lists-open-row",
          key: l.id
        }, /*#__PURE__*/React.createElement(RetroBtn, {
          icon: "▣",
          text: l.name,
          sub: l.songIds.length + ' canciones',
          onClick: () => window.goTo('lista.html', { id: l.id })
        }), /*#__PURE__*/React.createElement(IconBtn, {
          icon: "✕",
          label: "Eliminar lista",
          onClick: () => removeList(l.id)
        })))
      ),
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
