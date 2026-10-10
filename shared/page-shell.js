(function () {
  const { useState, useEffect } = window.React;

  // ---- Estado completo de la librería (canciones, listas, ui) ----
  // Se guarda solo en localStorage automáticamente cada vez que cambia.
  function useLibrary() {
    const [st, setSt] = useState(window.loadLibrary);
    useEffect(() => { window.saveLibrary(st); }, [st]);
    useEffect(() => { window.applyTheme(st.ui.theme); }, [st.ui.theme]);
    return [st, setSt];
  }

  // ---- "Chrome" común de cada página: tema, iconos de arriba y los
  // overlays de Código QR / Compartir y Ayuda, que se ven exactamente
  // igual en todas las pantallas. ----
  function usePageChrome(st, setSt, opts) {
    opts = opts || {};
    const homeHref = opts.homeHref || 'inicio.html';
    const [stack, setStack] = useState([]); // solo 'qr' | 'help'
    const push = kind => setStack(s => [...s, kind]);
    const pop = () => setStack(s => s.slice(0, -1));

    const toggleTheme = () => setSt(s => ({
      ...s,
      ui: { ...s.ui, theme: s.ui.theme === 'dark' ? 'light' : 'dark' }
    }));

    const topIcons = showHome => /*#__PURE__*/React.createElement(window.TopIcons, {
      showHome: showHome,
      onHome: () => window.goTo(homeHref),
      themeDark: st.ui.theme === 'dark',
      onTheme: toggleTheme,
      onShare: () => push('qr'),
      onHelp: () => push('help')
    });

    const pageTopbar = showHome => /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(window.BrandBlock, { small: true }),
      topIcons(showHome)
    );

    function renderOverlay(kind) {
      const CONF = window.APP_CONFIG || {};
      const { RetroBtn, Page } = window;
      if (kind === 'qr') {
        return /*#__PURE__*/React.createElement(Page, {
          title: "Código QR",
          onBack: pop,
          backLabel: "Volver",
          topbar: pageTopbar(true)
        }, /*#__PURE__*/React.createElement("div", {
          className: "qr-holder"
        }, /*#__PURE__*/React.createElement("img", {
          src: CONF.qrSvgPath || 'config/qr.svg',
          alt: "Código QR"
        })), /*#__PURE__*/React.createElement("button", {
          className: "share-btn",
          onClick: async () => {
            const url = window.location.href;
            if (navigator.share) {
              try {
                await navigator.share({ title: CONF.appName || 'Musigatari', url });
                return;
              } catch (e) {}
            }
            try {
              await navigator.clipboard.writeText(url);
              alert('Enlace copiado.');
            } catch (e) {
              alert(url);
            }
          }
        }, CONF.qrText || 'Compartir'));
      }
      if (kind === 'help') {
        return /*#__PURE__*/React.createElement(Page, {
          title: "Ayuda",
          onBack: pop,
          topbar: pageTopbar(true)
        }, /*#__PURE__*/React.createElement("div", {
          className: "help-text"
        },
          /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Ver una canción"), " — ábrela desde Inicio; se muestra solo lectura: datos, acordes por grupos (a, b, c…), estructura y letra."),
          /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Modificar"), " — dentro de la canción toca «Modificar canción»; todo se convierte en botones: el tono, compás, tempo y capo; cada acorde con su nota; los grupos («agregar»), la estructura y cada párrafo de la letra. Toca lo que quieras cambiar."),
          /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Compases"), " — si un compás queda incompleto verás una nota marcada con «agregar»; tócala para completarlo. «+ agregar otro compás» añade más."),
          /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Metrónomo"), " — el botón ♩ se expande en el mismo lugar; el primer tiempo suena y brilla distinto."),
          /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Listas"), " — agrupa canciones (máximo 10 listas), reordénalas por número y expórtalas en .txt o .zip."),
          /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Exportar"), " — canciones en .json (zip si son varias), letras en OpenLyrics (.xml) para OpenLP, listas en .txt.")
        ), /*#__PURE__*/React.createElement(RetroBtn, {
          icon: "▶",
          text: "Ver explicación",
          sub: "Guía completa",
          onClick: () => window.open(CONF.explanationPath || 'config/explicacion.html', '_blank')
        }));
      }
      return null;
    }

    const overlayLayer = stack.map((kind, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "page-layer",
      style: { zIndex: 50 + i }
    }, renderOverlay(kind)));

    return { topIcons, pageTopbar, overlayLayer, hasOverlay: stack.length > 0 };
  }

  Object.assign(window, { useLibrary, usePageChrome });
})();
