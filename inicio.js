(function () {
  const { RetroBtn, HomeGroup, HomeGroupBtn, useLibrary, usePageChrome } = window;
  const CONF = window.APP_CONFIG || {};

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    const homeScreen = /*#__PURE__*/React.createElement("div", {
      className: "home"
    }, /*#__PURE__*/React.createElement("div", {
      className: "home-topicons"
    }, chrome.topIcons(false)), /*#__PURE__*/React.createElement("div", {
      className: "home-brand"
    }, /*#__PURE__*/React.createElement("img", {
      className: "home-icon",
      src: CONF.iconPath || 'config/icon.svg',
      alt: ""
    }), CONF.appNameSvgPath ? /*#__PURE__*/React.createElement("img", {
      className: "home-namesvg",
      src: CONF.appNameSvgPath,
      alt: CONF.appName || 'Musigatari'
    }) : /*#__PURE__*/React.createElement("div", {
      className: "home-name"
    }, CONF.appName || 'Musigatari'), /*#__PURE__*/React.createElement("div", {
      className: "home-sub"
    }, /*#__PURE__*/React.createElement("span", { className: "bar1" }, "|"),
       /*#__PURE__*/React.createElement("span", { className: "bar2" }, "|"),
       " ", CONF.subtitle || 'Interpretando canciones'), /*#__PURE__*/React.createElement("div", {
      className: "home-divider"
    })), /*#__PURE__*/React.createElement("div", {
      className: "home-menu"
    }, /*#__PURE__*/React.createElement(HomeGroup, {
      label: "CANCIONES"
    }, /*#__PURE__*/React.createElement(HomeGroupBtn, {
      icon: "♬",
      text: "Abrir",
      tone: "accent",
      onClick: () => window.goTo('canciones.html')
    }), /*#__PURE__*/React.createElement(HomeGroupBtn, {
      icon: "⊕",
      text: "Agregar",
      tone: "teal",
      onClick: () => window.goTo('agregar.html')
    }), /*#__PURE__*/React.createElement(HomeGroupBtn, {
      icon: "⋯",
      text: "Más",
      tone: "navy",
      onClick: () => window.goTo('mascanciones.html')
    })), /*#__PURE__*/React.createElement(HomeGroup, {
      label: "LISTAS"
    }, /*#__PURE__*/React.createElement(HomeGroupBtn, {
      icon: "▣",
      text: "Abrir",
      tone: "accent",
      onClick: () => window.goTo('listas.html')
    }), /*#__PURE__*/React.createElement(HomeGroupBtn, {
      icon: "⊕",
      text: "Crear",
      tone: "teal",
      onClick: () => window.goTo('crearlista.html')
    }), /*#__PURE__*/React.createElement(HomeGroupBtn, {
      icon: "⋯",
      text: "Más",
      tone: "navy",
      onClick: () => window.goTo('maslistas.html')
    })), /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "⚙",
      text: "Herramientas",
      sub: "Importar, exportar o imprimir canciones y listas",
      primary: true,
      onClick: () => window.goTo('herramientas.html')
    })));

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      homeScreen,
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
