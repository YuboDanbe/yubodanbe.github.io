(function () {
  const {
    Page, RetroBtn, ButtonRow, SongPicker, useLibrary, usePageChrome,
    uid, newSong, safeName, downloadBlob
  } = window;
  const { useState, useRef } = window.React;

function NumberBox({
  value,
  max,
  onChange
}) {
  const {
    useState
  } = window.React;
  const [v, setV] = useState(String(value));
  return /*#__PURE__*/React.createElement("input", {
    className: "lr-num-btn",
    value: v,
    inputMode: "numeric",
    onChange: e => setV(e.target.value.replace(/[^0-9]/g, '')),
    onBlur: () => {
      const n = Math.max(1, Math.min(max, parseInt(v, 10) || value));
      setV(String(n));
      if (n !== value) onChange(n);
    }
  });
}

function ListAddSongPage({
  songs,
  list,
  onBack,
  onAddExisting,
  onCreateAndAdd,
  topbar
}) {
  const {
    useState
  } = window.React;
  const [pos, setPos] = useState(String(list.songIds.length + 1));
  const [newTitle, setNewTitle] = useState('');
  const posNum = () => Math.max(1, parseInt(pos, 10) || list.songIds.length + 1);
  const match = songs.find(s => (s.meta.title || '').trim().toLowerCase() === newTitle.trim().toLowerCase());
  return /*#__PURE__*/React.createElement(Page, {
    title: "Agregar canción a la lista",
    onBack: onBack,
    topbar: topbar
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Posición en la lista"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    inputMode: "numeric",
    value: pos,
    onChange: e => setPos(e.target.value.replace(/[^0-9]/g, ''))
  }), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Buscar / escribir canción"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    value: newTitle,
    onChange: e => setNewTitle(e.target.value),
    placeholder: "Nombre de la canción…"
  }), newTitle.trim() && match && /*#__PURE__*/React.createElement("div", {
    className: "dim-note"
  }, "Ya existe en la base de datos — tono ", match.meta.key, ", ", match.meta.time, ", ", match.meta.tempo, " bpm.", /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Agregar a la lista",
    primary: true,
    onClick: () => onAddExisting(match.id, posNum())
  }))), newTitle.trim() && !match && /*#__PURE__*/React.createElement("div", {
    className: "dim-note"
  }, "No está en la base de datos.", /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "⊕",
    text: "Crear y agregar acordes",
    primary: true,
    onClick: () => onCreateAndAdd(newSong({
      title: newTitle.trim()
    }), posNum())
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "O elige una existente"), /*#__PURE__*/React.createElement(SongPicker, {
    songs: songs.filter(s => !list.songIds.includes(s.id)),
    mode: "single",
    onPick: s => onAddExisting(s.id, posNum())
  }));
}

  function App() {
    const [st, setSt] = useLibrary();
    const chrome = usePageChrome(st, setSt);

    const listId = window.getParam('id');
    const list = st.lists.find(l => l.id === listId);

    const [edit, setEdit] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [exportSel, setExportSel] = useState(null); // null | array de ids seleccionados
    const [dragId, setDragId] = useState(null); // id de la canción que se está arrastrando

    const setList = updater => setSt(s => ({
      ...s,
      lists: s.lists.map(l => l.id === listId ? updater(l) : l)
    }));
    const toggleListSongDisabled = songId => setList(l => ({
      ...l,
      disabled: { ...l.disabled, [songId]: !l.disabled[songId] }
    }));
    const removeSongFromList = songId => setList(l => ({
      ...l,
      songIds: l.songIds.filter(x => x !== songId)
    }));
    const addSongToList = (songId, atIndex) => setList(l => {
      const ids = l.songIds.filter(x => x !== songId);
      const idx = atIndex == null ? ids.length : Math.max(0, Math.min(ids.length, atIndex - 1));
      ids.splice(idx, 0, songId);
      return { ...l, songIds: ids };
    });
    // Reordenar: sirve tanto para escribir un número (NumberBox) como
    // para el arrastre en vivo, ya que ambos mueven una canción a una
    // posición 1-based dentro de la lista.
    const moveSongInList = (songId, newPos) => setList(l => {
      const ids = l.songIds.filter(x => x !== songId);
      const idx = Math.max(0, Math.min(ids.length, newPos - 1));
      ids.splice(idx, 0, songId);
      return { ...l, songIds: ids };
    });
    const removeList = () => setSt(s => ({ ...s, lists: s.lists.filter(l => l.id !== listId) }));

    const cleanSong = s => ({ meta: s.meta, groups: s.groups, structure: s.structure, lyrics: s.lyrics || [] });
    const listsAsTxt = songs => list.name + '\n' + songs.map(s => '- ' + (s.meta.title || 'Sin título')).join('\n');

    // ---- Arrastrar para reordenar (Pointer Events: funciona con dedo y mouse) ----
    const rowRefs = useRef({}); // songId -> elemento DOM de la fila
    const listRef = useRef(null);
    const startDrag = (songId, e) => {
      if (!edit) return;
      e.preventDefault();
      setDragId(songId);
      const onMove = ev => {
        const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
        const ids = list.songIds;
        let overIndex = null;
        ids.forEach((id, i) => {
          const el = rowRefs.current[id];
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (y >= r.top && y <= r.bottom) overIndex = i;
        });
        if (overIndex != null) {
          const curIndex = ids.indexOf(songId);
          if (overIndex !== curIndex) moveSongInList(songId, overIndex + 1);
        }
      };
      const onUp = () => {
        setDragId(null);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    };

    // ---- lista no encontrada ----
    if (!list) {
      return /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("div", { className: "screen-root" },
          /*#__PURE__*/React.createElement(Page, {
            title: "Lista",
            onBack: () => window.goTo('listas.html'),
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement("div", { className: "dim-note" }, "Esa lista ya no existe.")),
          chrome.overlayLayer
        )
      );
    }

    // ---- agregar canción a la lista ----
    if (showAdd) {
      return /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("div", { className: "screen-root" },
          /*#__PURE__*/React.createElement(ListAddSongPage, {
            songs: st.songs,
            list: list,
            onBack: () => setShowAdd(false),
            topbar: chrome.pageTopbar(true),
            onAddExisting: (songId, pos) => { addSongToList(songId, pos); setShowAdd(false); },
            onCreateAndAdd: (song, pos) => {
              setSt(s => ({ ...s, songs: [...s.songs, song] }));
              addSongToList(song.id, pos);
              setShowAdd(false);
            }
          }),
          chrome.overlayLayer
        )
      );
    }

    // ---- exportar (elegir canciones de esta lista) ----
    if (exportSel != null) {
      const songs = list.songIds.map(id => st.songs.find(s => s.id === id)).filter(Boolean);
      return /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("div", { className: "screen-root" },
          /*#__PURE__*/React.createElement(Page, {
            title: 'Exportar ' + list.name,
            sub: "Toca para seleccionar.",
            onBack: () => setExportSel(null),
            topbar: chrome.pageTopbar(true)
          }, /*#__PURE__*/React.createElement(SongPicker, {
            songs: songs,
            mode: "multi",
            selected: exportSel,
            onToggle: id => setExportSel(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]),
            actionLabel: "Exportar (.txt)",
            onAction: () => {
              const chosen = songs.filter(s => exportSel.includes(s.id));
              downloadBlob(safeName(list.name) + '.txt', new Blob([listsAsTxt(chosen)], { type: 'text/plain' }));
              setExportSel(null);
            }
          })),
          chrome.overlayLayer
        )
      );
    }

    // ---- vista principal de la lista ----
    const rows = list.songIds.map(id => st.songs.find(s => s.id === id)).filter(Boolean);

    return /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", { className: "screen-root" },
        /*#__PURE__*/React.createElement(Page, {
          title: list.name,
          sub: rows.length + ' canciones',
          onBack: () => window.goTo('listas.html'),
          topbar: chrome.pageTopbar(true)
        },
          /*#__PURE__*/React.createElement(ButtonRow, null,
            /*#__PURE__*/React.createElement(RetroBtn, {
              icon: "✎",
              text: edit ? 'Terminar edición' : 'Editar lista',
              primary: true,
              onClick: () => setEdit(e => !e)
            }),
            edit && /*#__PURE__*/React.createElement(RetroBtn, {
              icon: "⊕",
              text: "Agregar canción",
              onClick: () => setShowAdd(true)
            }),
            /*#__PURE__*/React.createElement(RetroBtn, {
              icon: "⇪",
              text: "Exportar esta lista",
              onClick: () => setExportSel(list.songIds.slice())
            }),
            // El botón de eliminar lista solo aparece en modo edición.
            edit && /*#__PURE__*/React.createElement(RetroBtn, {
              icon: "✕",
              text: "Eliminar lista",
              tone: "del",
              onClick: () => { removeList(); window.goTo('listas.html'); }
            })
          ),
          rows.length === 0 && /*#__PURE__*/React.createElement("div", {
            className: "dim-note"
          }, "Sin canciones en esta lista todavía."),
          /*#__PURE__*/React.createElement("div", { ref: listRef },
            rows.map((s, i) => /*#__PURE__*/React.createElement("div", {
              key: s.id,
              ref: el => { rowRefs.current[s.id] = el; },
              className: 'list-row' + (list.disabled[s.id] ? ' off' : '') + (dragId === s.id ? ' dragging' : '')
            },
              edit ? /*#__PURE__*/React.createElement(React.Fragment, null,
                // Asa de arrastre: mantener presionado y mover hacia
                // arriba/abajo reordena en vivo; también se puede escribir
                // el número directamente (NumberBox), ambas formas cambian
                // el mismo orden.
                /*#__PURE__*/React.createElement("button", {
                  className: "lr-grip",
                  onPointerDown: e => startDrag(s.id, e),
                  onTouchStart: e => startDrag(s.id, e),
                  "aria-label": "Arrastrar para reordenar"
                }, "⠿"),
                /*#__PURE__*/React.createElement(NumberBox, {
                  value: i + 1,
                  max: rows.length,
                  onChange: n => moveSongInList(s.id, n)
                })
              ) : /*#__PURE__*/React.createElement("span", { className: "lr-num" }, i + 1),

              /*#__PURE__*/React.createElement("button", {
                className: "lr-name",
                onClick: () => !edit && window.goTo('cancion.html', { id: s.id, list: list.id }),
                disabled: edit
              }, s.meta.title || 'Sin título'),

              !edit && /*#__PURE__*/React.createElement(React.Fragment, null,
                // Botón de encendido/apagado: el único botón de acción
                // dentro del renglón en modo lectura, junto con el de abrir.
                /*#__PURE__*/React.createElement("button", {
                  className: 'lr-icon toggle' + (list.disabled[s.id] ? ' off-state' : ''),
                  title: list.disabled[s.id] ? 'Encender' : 'Apagar',
                  onClick: () => toggleListSongDisabled(s.id)
                }, list.disabled[s.id] ? '⏻' : '●'),
                // Al final del renglón: abre la canción con acordes y
                // letra; desde ahí hay un botón para regresar a esta lista.
                /*#__PURE__*/React.createElement("button", {
                  className: "lr-icon",
                  title: "Ver acordes y letra",
                  onClick: () => window.goTo('cancion.html', { id: s.id, list: list.id })
                }, "♬")
              ),

              // Eliminar canción de la lista: solo en modo edición.
              edit && /*#__PURE__*/React.createElement("button", {
                className: "lr-icon del",
                title: "Quitar de la lista",
                onClick: () => removeSongFromList(s.id)
              }, "✕")
            ))
          )
        ),
        chrome.overlayLayer
      )
    );
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(
    /*#__PURE__*/React.createElement(App, null)
  );
})();
