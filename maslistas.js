(function () {
  const { Page, RetroBtn, SongPicker, useLibrary, usePageChrome, uid, safeName, downloadBlob } = window;
  const { useState, useRef } = window.React;

  // ---- SelectSongsPage: selector múltiple con acción al final, igual
  // que en la versión original ----
  function SelectSongsPage({ songs, title, actionLabel, onBack, onDone, topbar }) {
    const [sel, setSel] = useState([]);
    const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    return /*#__PURE__*/React.createElement(Page, {
      title: title,
      sub: "Toca para seleccionar.",
      onBack: onBack,
      topbar: topbar
    }, /*#__PURE__*/React.createElement(SongPicker, {
      songs: songs,
      mode: "multi",
      selected: sel,
      onToggle: toggle,
      actionLabel: actionLabel,
      onAction: () => onDone(sel)
    }));
  }

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);
    const fileRef = useRef(null);

    // pila interna: 'root' | 'delete-pick' | {kind:'delete-confirm',listId}
    //             | 'export' | 'export-pick' | {kind:'export-select',listId}
    const [stack, setStack] = useState(['root']);
    const push = entry => setStack(s => [...s, entry]);
    const pop = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
    const top = stack[stack.length - 1];

    // ---- borrar lista ----
    const removeList = id => setSt(s => ({ ...s, lists: s.lists.filter(l => l.id !== id) }));

    // ---- exportar listas a .txt (mismo formato que espera "Importar") ----
    const listsAsTxt = lists => lists.map(l => {
      const songs = l.songIds.map(id => st.songs.find(s => s.id === id)).filter(Boolean);
      return l.name + '\n' + songs.map(s => '- ' + (s.meta.title || 'Sin título')).join('\n');
    }).join('\n\n');
    const exportListsTxt = lists => {
      downloadBlob(safeName(lists.length === 1 ? lists[0].name : 'listas') + '.txt',
        new Blob([listsAsTxt(lists)], { type: 'text/plain' }));
    };

    // ---- importar listas desde .txt ----
    const parseListsTxt = text => {
      const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
      return blocks.map(b => {
        const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
        const name = lines[0] || 'Lista importada';
        const titles = lines.slice(1).map(l => l.replace(/^-+\s*/, '').trim()).filter(Boolean);
        return { name, titles };
      }).filter(l => l.titles.length);
    };
    const importListsFromTxt = text => {
      const defs = parseListsTxt(text);
      if (!defs.length) { alert('El archivo no tiene el formato de lista esperado (nombre de lista seguido de líneas "- Canción").'); return; }
      const notFound = [];
      let created = 0, skippedFull = false;
      let lists = st.lists.slice();
      defs.forEach(def => {
        if (lists.length >= window.MAX_LISTS) { skippedFull = true; return; }
        const ids = [];
        def.titles.forEach(title => {
          const song = st.songs.find(x => (x.meta.title || '').trim().toLowerCase() === title.trim().toLowerCase());
          if (song) ids.push(song.id);
          else notFound.push(title);
        });
        if (ids.length) { lists = [...lists, { id: uid(), name: def.name, songIds: ids, disabled: {} }]; created++; }
      });
      if (created) setSt(s => ({ ...s, lists }));
      let msg = created ? ('Se importó ' + created + ' lista(s).') : 'No se importó ninguna lista.';
      if (notFound.length) msg += '\n\nNo se encontraron estas canciones en la base de datos (no se agregaron a la lista): ' + notFound.join(', ');
      if (skippedFull) msg += '\n\nAlgunas listas no se importaron: ya tienes el máximo de 10 listas.';
      alert(msg);
    };
    const onFile = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { importListsFromTxt(reader.result); }
        catch (err) { alert('No se pudo importar la lista: ' + err.message); }
        setStack(['root']);
      };
      reader.readAsText(file);
    };
    const triggerImport = () => {
      if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); }
    };

    let page;
    if (top === 'root') {
      page = /*#__PURE__*/React.createElement(Page, {
        title: "Listas | Más opciones",
        onBack: () => window.goTo('inicio.html'),
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "⇣",
        text: "Importar lista",
        sub: "Archivo .txt exportado desde la app",
        onClick: triggerImport
      }), /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "⇪",
        text: "Exportar",
        sub: "Una lista o todas en .txt",
        onClick: () => push('export')
      }), /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "✕",
        text: "Borrar lista",
        sub: "Elige cuál eliminar",
        tone: "del",
        onClick: () => push('delete-pick')
      }));
    } else if (top === 'delete-pick') {
      page = /*#__PURE__*/React.createElement(Page, {
        title: "Borrar lista",
        sub: "Elige cuál eliminar.",
        onBack: pop,
        topbar: chrome.pageTopbar(true)
      }, st.lists.length === 0 && /*#__PURE__*/React.createElement("div", {
        className: "dim-note"
      }, "Sin listas guardadas."), st.lists.map(l => /*#__PURE__*/React.createElement(RetroBtn, {
        key: l.id,
        icon: "▣",
        text: l.name,
        sub: l.songIds.length + ' canciones',
        onClick: () => push({ kind: 'delete-confirm', listId: l.id })
      })));
    } else if (top && top.kind === 'delete-confirm') {
      const list = st.lists.find(l => l.id === top.listId);
      page = !list ? /*#__PURE__*/React.createElement(Page, {
        title: "Borrar lista",
        onBack: pop,
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement("div", { className: "dim-note" }, "Esa lista ya no existe."))
      : /*#__PURE__*/React.createElement(Page, {
        title: "Borrar lista",
        sub: '¿Seguro que quieres eliminar «' + list.name + '»? No se puede deshacer.',
        onBack: pop,
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "✕",
        text: "Sí, borrar",
        tone: "del",
        primary: true,
        onClick: () => { removeList(list.id); setStack(['root']); }
      }), /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "‹",
        text: "Cancelar",
        onClick: pop
      }));
    } else if (top === 'export') {
      page = /*#__PURE__*/React.createElement(Page, {
        title: "Exportar listas",
        onBack: pop,
        topbar: chrome.pageTopbar(true)
      }, /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "▣",
        text: "Escoger lista",
        sub: "Elige cuál exportar",
        onClick: () => push('export-pick')
      }), /*#__PURE__*/React.createElement(RetroBtn, {
        icon: "⇪",
        text: "Exportar todas",
        sub: st.lists.length + ' listas en un .txt',
        disabled: !st.lists.length,
        onClick: () => { exportListsTxt(st.lists); setStack(['root']); }
      }));
    } else if (top === 'export-pick') {
      page = /*#__PURE__*/React.createElement(Page, {
        title: "Escoger lista",
        onBack: pop,
        topbar: chrome.pageTopbar(true)
      }, st.lists.length === 0 && /*#__PURE__*/React.createElement("div", {
        className: "dim-note"
      }, "Sin listas guardadas."), st.lists.map(l => /*#__PURE__*/React.createElement(RetroBtn, {
        key: l.id,
        icon: "▣",
        text: l.name,
        sub: l.songIds.length + ' canciones',
        onClick: () => push({ kind: 'export-select', listId: l.id })
      })));
    } else if (top && top.kind === 'export-select') {
      const list = st.lists.find(l => l.id === top.listId);
      if (!list) {
        page = /*#__PURE__*/React.createElement(Page, {
          title: "Lista",
          onBack: pop,
          topbar: chrome.pageTopbar(true)
        }, /*#__PURE__*/React.createElement("div", { className: "dim-note" }, "La lista ya no existe."));
      } else {
        const songs = list.songIds.map(id => st.songs.find(s => s.id === id)).filter(Boolean);
        page = /*#__PURE__*/React.createElement(SelectSongsPage, {
          songs: songs,
          title: 'Exportar ' + list.name,
          actionLabel: "Exportar (.txt)",
          onBack: pop,
          topbar: chrome.pageTopbar(true),
          onDone: ids => {
            exportListsTxt([{ ...list, songIds: ids }]);
            setStack(['root']);
          }
        });
      }
    }

    return /*#__PURE__*/React.createElement("div", { className: "screen-root" },
      /*#__PURE__*/React.createElement("input", {
        ref: fileRef,
        type: "file",
        accept: ".txt,text/plain",
        style: { display: 'none' },
        onChange: onFile
      }),
      page,
      chrome.overlayLayer
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
