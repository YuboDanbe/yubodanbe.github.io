(function(){
// Retro '79 UI pieces + music widgets.

const {
  useState,
  useRef,
  useEffect
} = React;
const CFG = window.APP_CONFIG || {};

// ---- Retro button ----
function RetroBtn({
  icon,
  text,
  sub,
  primary,
  onClick,
  disabled,
  className,
  selected,
  tone
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: 'retro-btn' + (primary ? ' primary' : '') + (selected ? ' selected' : '') + (tone ? ' tone-' + tone : '') + (className ? ' ' + className : ''),
    onClick: onClick,
    disabled: disabled
  }, icon != null && /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-text"
  }, text), sub && /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-sub"
  }, sub)));
}

// ---- Small toolbar button (retro, compact) ----
function TopBtn({
  text,
  onClick,
  primary
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: 'top-btn' + (primary ? ' primary' : ''),
    onClick: onClick
  }, text);
}

// ---- Full-screen page: brand+icons, title, Regresar, options ----
function Page({
  title,
  sub,
  onBack,
  backLabel,
  children,
  wide,
  topbar
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: 'page-inner' + (wide ? ' wide' : '')
  }, topbar && /*#__PURE__*/React.createElement("div", {
    className: "page-topbar"
  }, topbar), /*#__PURE__*/React.createElement("div", {
    className: "page-title"
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, sub), onBack && /*#__PURE__*/React.createElement("button", {
    className: "retro-btn back-btn regresar-btn",
    onClick: onBack
  }, /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-icon"
  }, "‹"), /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "retro-btn-text"
  }, backLabel || 'Regresar'))), /*#__PURE__*/React.createElement("div", {
    className: "page-opts"
  }, children)));
}

// ---- Musical note figure; sizes from config ----
function NoteFigure({
  type,
  scale = 1
}) {
  const cfg = CFG.notes || {};
  const base = cfg.base || 30;
  let size = base;
  if (type === 'whole') size = base * (cfg.wholeScale != null ? cfg.wholeScale : 2);else if (type === 'half') size = base * (cfg.halfScale != null ? cfg.halfScale : 1) - 2;
  size *= scale;
  const filled = type !== 'whole' && type !== 'half';
  const hasStem = type !== 'whole';
  const flags = type === 'eighth' ? 1 : type === 'sixteenth' ? 2 : 0;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: type === 'whole' ? '0 15 24 21' : '0 0 24 34',
    height: size,
    width: size * (type === 'whole' ? 1 : 0.72),
    className: 'notefig notefig-' + type,
    style: {
      display: 'block',
      overflow: 'visible'
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "8",
    cy: "25.5",
    rx: "6.1",
    ry: "4.4",
    transform: "rotate(-22 8 25.5)",
    fill: filled ? 'currentColor' : 'none',
    stroke: "currentColor",
    strokeWidth: filled ? 0 : 2.1
  }), hasStem && /*#__PURE__*/React.createElement("line", {
    x1: "13.7",
    y1: "24.5",
    x2: "13.7",
    y2: "3.5",
    stroke: "currentColor",
    strokeWidth: "2.1",
    strokeLinecap: "round"
  }), flags >= 1 && /*#__PURE__*/React.createElement("path", {
    d: "M13.7 3.5 C 21.5 6.5 21.5 13.5 16.8 16.2",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.3",
    strokeLinecap: "round"
  }), flags >= 2 && /*#__PURE__*/React.createElement("path", {
    d: "M13.7 9 C 21.5 12 21.5 19 16.8 21.7",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.3",
    strokeLinecap: "round"
  }));
}

// ---- Chord bars: | C♩ Am♩ | F♩ G♩ |  with wrap-safe bars ----
// Every cell carries left+right borders that overlap, so each visual row
// starts and ends with a bar automatically, even after wrapping.
function ChordBars({
  group,
  timeSig,
  transpose,
  editMode,
  onEditCell,
  onAddCell,
  onAddBar,
  openCi
}) {
  const bars = window.splitBars(group.measures, timeSig);
  const out = [];
  bars.forEach((bar, bi) => {
    const isLastBar = bi === bars.length - 1;
    // Cuando el compás está incompleto y estamos en modo edición, la
    // celda "agregar" es el último elemento visual de ese compás (por
    // eso la última celda real NO lleva línea de cierre en ese caso).
    const hasMissing = bar.missing > 0 && editMode;
    bar.cells.forEach(({
      measure,
      index
    }, ci) => {
      const shown = window.transposeChord(measure.chord, transpose, false);
      // Línea al INICIO del compás: solo en la primera nota de cada uno.
      const isFirstInBar = ci === 0;
      // Línea de CIERRE: solo en la última nota del ÚLTIMO compás (las
      // divisiones entre compases las aporta el "inicio" del siguiente,
      // así nunca se dibuja una línea entre dos notas del mismo compás).
      const isClosing = isLastBar && !hasMissing && ci === bar.cells.length - 1;
      out.push(/*#__PURE__*/React.createElement("button", {
        key: 'c' + index,
        className: 'mcell' + (editMode ? ' editable' : '') + (openCi === index ? ' open-target' : '') + (isFirstInBar ? ' bar-first' : '') + (isClosing ? ' bar-last' : ''),
        disabled: !editMode,
        onClick: () => onEditCell(index)
      }, shown ? /*#__PURE__*/React.createElement("span", {
        className: "chord"
      }, shown) : null, /*#__PURE__*/React.createElement("span", {
        className: "figbox"
      }, /*#__PURE__*/React.createElement(NoteFigure, {
        type: measure.dur
      }))));
    });
    if (hasMissing) {
      const fig = window.figureForBeats(bar.missing);
      const isFirstInBar = bar.cells.length === 0;
      out.push(/*#__PURE__*/React.createElement("button", {
        key: 'miss' + bi,
        className: 'mcell missing' + (openCi === 'new' + bi ? ' open-target' : '') + (isFirstInBar ? ' bar-first' : '') + (isLastBar ? ' bar-last' : ''),
        onClick: () => onAddCell(fig, 'new' + bi)
      }, /*#__PURE__*/React.createElement("span", {
        className: "figbox"
      }, /*#__PURE__*/React.createElement(NoteFigure, {
        type: fig
      })), /*#__PURE__*/React.createElement("span", {
        className: "miss-label"
      }, "agregar")));
    }
  });
  if (editMode) {
    out.push(/*#__PURE__*/React.createElement("button", {
      key: "addbar",
      className: "addbar-btn",
      onClick: onAddBar
    }, "+ agregar otro compás"));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "bars"
  }, out);
}

// ---- Cell (chord+figure) editor page ----
const CHORD_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHORD_MODS = [{
  id: 'm',
  label: 'm (menor)'
}, {
  id: '#',
  label: '♯ sostenido'
}, {
  id: 'b',
  label: '♭ bemol'
}, {
  id: 'dim',
  label: 'dim (disminuido)'
}, {
  id: '7',
  label: '7 (séptima)'
}];
function parseChordParts(chord) {
  const m = (chord || '').match(/^([A-G])([#b]?)(m(?!aj))?(dim)?(7)?/);
  if (!m) return {
    letter: null,
    mods: []
  };
  const mods = [];
  if (m[2] === '#') mods.push('#');
  if (m[2] === 'b') mods.push('b');
  if (m[3]) mods.push('m');
  if (m[4]) mods.push('dim');
  if (m[5]) mods.push('7');
  return {
    letter: m[1],
    mods
  };
}
function buildChord(letter, mods) {
  if (!letter) return '';
  let s = letter;
  if (mods.includes('#')) s += '#';
  if (mods.includes('b')) s += 'b';
  if (mods.includes('m')) s += 'm';
  if (mods.includes('dim')) s += 'dim';
  if (mods.includes('7')) s += '7';
  return s;
}

// ---- Wrapper for an inline accordion panel (no full-screen Page) ----
function InlinePanel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "inline-panel"
  }, children);
}

// ---- || TAMAÑO A- A+ control, styled like the home slogan ----
function SizeControl({
  value,
  onChange,
  min = 0.7,
  max = 1.8,
  step = 0.1
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "size-control"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sc-bars"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar1"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "bar2"
  }, "|")), /*#__PURE__*/React.createElement("span", {
    className: "sc-label"
  }, "TAMAÑO"), /*#__PURE__*/React.createElement("button", {
    className: "sc-btn",
    onClick: () => onChange(Math.max(min, +(value - step).toFixed(2)))
  }, "A−"), /*#__PURE__*/React.createElement("button", {
    className: "sc-btn",
    onClick: () => onChange(Math.min(max, +(value + step).toFixed(2)))
  }, "A+"));
}
function CellEditor({
  initial,
  isNew,
  onAccept,
  onDelete,
  onBack,
  compact
}) {
  const parsed = parseChordParts(initial ? initial.chord : '');
  const [letter, setLetter] = useState(parsed.letter);
  const [mods, setMods] = useState(parsed.mods);
  const [dur, setDur] = useState(initial ? initial.dur : 'quarter');
  const toggleMod = id => setMods(ms => {
    let next = ms.includes(id) ? ms.filter(x => x !== id) : [...ms, id];
    if (id === '#') next = next.filter(x => x !== 'b' || id === x);
    if (id === 'b') next = next.filter(x => x !== '#' || id === x);
    return next;
  });
  const body = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Nota (figura rítmica)"), /*#__PURE__*/React.createElement("div", {
    className: "fig-row"
  }, window.RHYTHMS.map(r => /*#__PURE__*/React.createElement("button", {
    key: r.id,
    className: 'fig-opt' + (dur === r.id ? ' on' : ''),
    onClick: () => setDur(r.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "figbox"
  }, /*#__PURE__*/React.createElement(NoteFigure, {
    type: r.id,
    scale: 0.8
  })), /*#__PURE__*/React.createElement("span", null, r.es)))), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Acorde (C al B)"), letter == null ? /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, CHORD_LETTERS.map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    className: "letter-opt",
    onClick: () => setLetter(l)
  }, l)), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt dim",
    onClick: () => {
      setLetter('');
      setMods([]);
    }
  }, "sin acorde")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "chord-preview"
  }, /*#__PURE__*/React.createElement("span", null, letter === '' ? 'Sin acorde' : buildChord(letter, mods)), /*#__PURE__*/React.createElement("button", {
    className: "chip-btn",
    onClick: () => {
      setLetter(null);
      setMods([]);
    }
  }, "cambiar")), letter !== '' && /*#__PURE__*/React.createElement("div", {
    className: "mods-row"
  }, CHORD_MODS.map(m => /*#__PURE__*/React.createElement("button", {
    key: m.id,
    className: 'mod-opt' + (mods.includes(m.id) ? ' on' : ''),
    onClick: () => toggleMod(m.id)
  }, m.label)))), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, !isNew && onDelete && /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✕",
    text: "Quitar",
    tone: "del",
    onClick: onDelete
  }), /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    onClick: () => onAccept({
      chord: letter == null ? initial ? initial.chord : '' : buildChord(letter, mods),
      dur
    })
  })));
  if (compact) return /*#__PURE__*/React.createElement(InlinePanel, null, body);
  return /*#__PURE__*/React.createElement(Page, {
    title: isNew ? 'Agregar acorde' : 'Modificar acorde',
    onBack: onBack
  }, body);
}

// ---- Structure line: | Coro a ×2 | Verso b | ----
function StructureLine({
  structure,
  letterById,
  editMode,
  onEditPart,
  onAddPart,
  openIndex
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bars structure-bars"
  }, structure.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    className: 'mcell scell' + (editMode ? ' editable' : '') + (openIndex === i ? ' open-target' : ''),
    disabled: !editMode,
    onClick: () => onEditPart(i)
  }, /*#__PURE__*/React.createElement("span", {
    className: "sname"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "sletter"
  }, letterById[p.groupId] || '—'), p.reps > 1 && /*#__PURE__*/React.createElement("span", {
    className: "sreps"
  }, "×", p.reps))), editMode && /*#__PURE__*/React.createElement("button", {
    className: "addbar-btn",
    onClick: onAddPart
  }, "+ agregar"), !editMode && structure.length === 0 && /*#__PURE__*/React.createElement("span", {
    className: "dim-note"
  }, "Sin estructura todavía."));
}

// ---- Structure part editor ----
function StructureEditor({
  initial,
  isNew,
  letters,
  onSave,
  onDelete,
  onBack,
  compact
}) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [groupId, setGroupId] = useState(initial ? initial.groupId : letters[0] ? letters[0].id : null);
  const [showReps, setShowReps] = useState(initial ? (initial.reps || 1) > 1 : false);
  const [reps, setReps] = useState(initial ? Math.max(1, initial.reps || 1) : 2);
  const body = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Nombre"), /*#__PURE__*/React.createElement(SectionNamePicker, {
    value: name,
    onChange: setName
  }), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Grupo de acordes"), /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, letters.map(l => /*#__PURE__*/React.createElement("button", {
    key: l.id,
    className: 'letter-opt' + (groupId === l.id ? ' on' : ''),
    onClick: () => setGroupId(l.id)
  }, l.letter))), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Repeticiones"), !showReps ? /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "↻",
    text: "Repetir",
    sub: "Agregar ×2, ×3…",
    onClick: () => {
      setShowReps(true);
      setReps(2);
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "reps-editor"
  }, /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setReps(r => Math.max(2, r - 1))
  }, "–"), /*#__PURE__*/React.createElement("span", {
    className: "reps-num"
  }, "×", reps), /*#__PURE__*/React.createElement("button", {
    className: "letter-opt",
    onClick: () => setReps(r => Math.min(99, r + 1))
  }, "+"), /*#__PURE__*/React.createElement("button", {
    className: "chip-btn",
    onClick: () => setShowReps(false)
  }, "quitar")), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, !isNew && onDelete && /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✕",
    text: "Eliminar parte",
    tone: "del",
    onClick: onDelete
  }), /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    disabled: !name.trim(),
    onClick: () => onSave({
      name: name.trim() || 'Parte',
      groupId,
      reps: showReps ? reps : 1
    })
  })));
  if (compact) return /*#__PURE__*/React.createElement(InlinePanel, null, body);
  return /*#__PURE__*/React.createElement(Page, {
    title: isNew ? 'Agregar parte' : 'Modificar parte',
    onBack: onBack
  }, body);
}

// ---- Section name selector: Coro/Verso/Puente… + number row for "Verso N" ----
const VERSE_NUMS = [1, 2, 3, 4, 5, 6];
function SectionNamePicker({
  value,
  onChange
}) {
  const isVerse = /^Verso\b/.test(value || '');
  const verseNum = isVerse ? parseInt((value || '').replace('Verso', '').trim(), 10) || null : null;
  const isCustom = value != null && value !== '' && !window.SECTION_NAMES.includes(value) && !isVerse;
  const [custom, setCustom] = useState(isCustom);
  return /*#__PURE__*/React.createElement("div", {
    className: "namepick"
  }, /*#__PURE__*/React.createElement("div", {
    className: "name-list"
  }, window.SECTION_NAMES.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: 'mod-opt' + (!custom && (n === 'Verso' ? isVerse : value === n) ? ' on' : ''),
    onClick: () => {
      setCustom(false);
      onChange(n === 'Verso' ? 'Verso' : n);
    }
  }, n)), /*#__PURE__*/React.createElement("button", {
    className: 'mod-opt' + (custom ? ' on' : ''),
    onClick: () => {
      setCustom(true);
      onChange('');
    }
  }, "Otra (teclear)")), isVerse && /*#__PURE__*/React.createElement("div", {
    className: "letter-row"
  }, VERSE_NUMS.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: 'letter-opt' + (verseNum === n ? ' on' : ''),
    onClick: () => onChange('Verso ' + n)
  }, n))), custom && /*#__PURE__*/React.createElement("input", {
    className: "input",
    autoFocus: true,
    placeholder: "Escribe el nombre de la sección…",
    value: value || '',
    onChange: e => onChange(e.target.value)
  }));
}

// ---- Lyric paragraph editor: normal single-paragraph OR bulk-paste-all mode ----
function LyricParagraphEditor({
  initial,
  isNew,
  onSave,
  onSaveMany,
  onDelete,
  onBack,
  compact
}) {
  const [name, setName] = useState(initial ? initial.name : 'Verso');
  const [text, setText] = useState(initial ? initial.text : '');
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [warn, setWarn] = useState('');
  const taRef = useRef(null);
  const bulkRef = useRef(null);
  const insertAtCursor = (ref, setter, insertText) => {
    const el = ref.current;
    if (!el || document.activeElement !== el) {
      setWarn('Pon el cursor sobre el párrafo donde quieres agregarlo.');
      setTimeout(() => setWarn(''), 3000);
      return;
    }
    const start = el.selectionStart,
      end = el.selectionEnd;
    const cur = el.value;
    const next = cur.slice(0, start) + insertText + cur.slice(end);
    setter(next);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + insertText.length;
    }, 0);
  };
  const nameButtons = (targetSetter, targetRef) => /*#__PURE__*/React.createElement("div", {
    className: "name-list"
  }, window.SECTION_NAMES.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: "mod-opt",
    onClick: () => insertAtCursor(targetRef, targetSetter, n === 'Verso' ? 'Verso ' : n + '\n')
  }, n)), VERSE_NUMS.map(n => /*#__PURE__*/React.createElement("button", {
    key: 'v' + n,
    className: "mod-opt small",
    onClick: () => insertAtCursor(targetRef, targetSetter, String(n) + '\n')
  }, n)));
  if (isNew && bulk) {
    const body = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "ed-label"
    }, "Pega toda la letra (deja un renglón vacío entre cada párrafo)"), warn && /*#__PURE__*/React.createElement("div", {
      className: "err-note"
    }, warn), /*#__PURE__*/React.createElement("div", {
      className: "ed-label"
    }, "Insertar nombre de sección en el cursor"), nameButtons(setBulkText, bulkRef), /*#__PURE__*/React.createElement("textarea", {
      ref: bulkRef,
      className: "input lyric-ta big",
      value: bulkText,
      onChange: e => setBulkText(e.target.value),
      placeholder: 'Verso 1\nprimera línea…\nsegunda línea…\n\nCoro\nprimera línea…'
    }), /*#__PURE__*/React.createElement("div", {
      className: "ed-actions"
    }, /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "‹",
      text: "Cancelar",
      onClick: () => setBulk(false)
    }), /*#__PURE__*/React.createElement(RetroBtn, {
      icon: "✓",
      text: "Guardar todo",
      primary: true,
      disabled: !bulkText.trim(),
      onClick: () => {
        const blocks = bulkText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
        const entries = blocks.map(b => {
          const lines = b.split('\n');
          const first = lines[0].trim();
          const isHeader = window.SECTION_NAMES.some(n => first === n || first.startsWith(n + ' ') || /^Verso\s*\d*$/.test(first));
          return isHeader ? {
            name: first,
            text: lines.slice(1).join('\n').trim()
          } : {
            name: 'Sección',
            text: b
          };
        });
        onSaveMany(entries);
      }
    })));
    return compact ? /*#__PURE__*/React.createElement(InlinePanel, null, body) : /*#__PURE__*/React.createElement(Page, {
      title: "Agregar letra completa",
      onBack: onBack
    }, body);
  }
  const body = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Sección"), /*#__PURE__*/React.createElement(SectionNamePicker, {
    value: name,
    onChange: setName
  }), /*#__PURE__*/React.createElement("div", {
    className: "ed-label"
  }, "Texto"), warn && /*#__PURE__*/React.createElement("div", {
    className: "err-note"
  }, warn), /*#__PURE__*/React.createElement("textarea", {
    ref: taRef,
    className: "input lyric-ta",
    value: text,
    onChange: e => setText(e.target.value),
    placeholder: "Texto del párrafo…"
  }), isNew && /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "▤",
    text: "Pegar toda la letra",
    sub: "Varios párrafos a la vez",
    onClick: () => setBulk(true)
  }), /*#__PURE__*/React.createElement("div", {
    className: "ed-actions"
  }, !isNew && onDelete && /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✕",
    text: "Eliminar párrafo",
    tone: "del",
    onClick: onDelete
  }), /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: "Guardar",
    primary: true,
    onClick: () => onSave({
      name: name || 'Sección',
      text
    })
  })));
  if (compact) return /*#__PURE__*/React.createElement(InlinePanel, null, body);
  return /*#__PURE__*/React.createElement(Page, {
    title: isNew ? 'Agregar párrafo' : 'Modificar párrafo',
    onBack: onBack
  }, body);
}

// ---- Metronome (inline expandable) ----
function Metronome({
  tempo,
  timeSig,
  open,
  onToggle,
  scale
}) {
  const [bpm, setBpm] = useState(Math.min(300, Math.max(30, parseInt(tempo, 10) || 96)));
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(-1);
  const beats = window.beatsPerBar(timeSig);
  const acRef = useRef(null);
  const counter = useRef(0);
  const audioRefs = useRef({});
  useEffect(() => {
    setBpm(Math.min(300, Math.max(30, parseInt(tempo, 10) || 96)));
  }, [tempo]);
  const mcfg = CFG.metronome || {};
  const click = accent => {
    const path = accent ? mcfg.accentSoundPath : mcfg.clickSoundPath;
    if (path) {
      try {
        const key = accent ? 'a' : 'c';
        if (!audioRefs.current[key]) audioRefs.current[key] = new Audio(path);
        const a = audioRefs.current[key];
        a.currentTime = 0;
        a.play();
        return;
      } catch (e) {/* fall back to beep */}
    }
    let ac = acRef.current;
    if (!ac) ac = acRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = accent ? 1600 : 1050;
    osc.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.7 : 0.45, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.06);
  };
  useEffect(() => {
    if (!playing) {
      setBeat(-1);
      return;
    }
    counter.current = 0;
    const tick = () => {
      const b = counter.current % beats;
      click(b === 0);
      setBeat(b);
      counter.current++;
    };
    tick();
    const id = setInterval(tick, 60000 / bpm);
    return () => clearInterval(id);
  }, [playing, bpm, beats]);
  useEffect(() => {
    if (!open) setPlaying(false);
  }, [open]);
  const adj = d => setBpm(v => Math.min(300, Math.max(30, v + d)));
  return /*#__PURE__*/React.createElement("div", {
    className: 'metro-inline no-print-controls' + (open ? ' open' : ''),
    style: {
      '--sec-scale': scale || 1
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "meta-btn metro-toggle",
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar1"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "bar2"
  }, "|"), " ♩ METRÓNOMO ", open ? '▴' : '▾'), /*#__PURE__*/React.createElement("div", {
    className: "metro-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "metro-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "metro-play",
    onClick: () => setPlaying(p => !p),
    "aria-label": playing ? 'Detener' : 'Reproducir'
  }, playing ? '❚❚' : '▶'), /*#__PURE__*/React.createElement("div", {
    className: "metro-bpm"
  }, bpm, /*#__PURE__*/React.createElement("small", null, "BPM")), /*#__PURE__*/React.createElement("div", {
    className: "metro-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "metro-step",
    onClick: () => adj(-5)
  }, "«"), /*#__PURE__*/React.createElement("button", {
    className: "metro-step",
    onClick: () => adj(-1)
  }, "–"), /*#__PURE__*/React.createElement("button", {
    className: "metro-step",
    onClick: () => adj(1)
  }, "+"), /*#__PURE__*/React.createElement("button", {
    className: "metro-step",
    onClick: () => adj(5)
  }, "»")), /*#__PURE__*/React.createElement("div", {
    className: "metro-dots"
  }, Array.from({
    length: beats
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: 'mdot-wrap' + (i === 0 ? ' first' : '')
  }, /*#__PURE__*/React.createElement("span", {
    className: 'mdot' + (i === beat ? ' on' : '')
  })))), /*#__PURE__*/React.createElement("span", {
    className: "metro-name"
  }, window.tempoName(bpm)))));
}

// ---- Icon-only button (small square) ----
function IconBtn({
  icon,
  label,
  onClick,
  active,
  tone
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: 'icon-btn' + (active ? ' active' : '') + (tone ? ' tone-' + tone : ''),
    onClick: onClick,
    "aria-label": label,
    title: label
  }, /*#__PURE__*/React.createElement("span", {
    className: "icon-btn-glyph"
  }, icon));
}

// ---- Row of icons shown top-right on every screen ----
// ---- Row of icons shown top-right on every screen (now centered, share instead of QR) ----
function TopIcons({
  showHome,
  onHome,
  themeDark,
  onTheme,
  onShare,
  onHelp
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "top-icons"
  }, showHome && /*#__PURE__*/React.createElement(IconBtn, {
    icon: "⌂",
    label: "Inicio",
    onClick: onHome,
    tone: "home"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: themeDark ? '☀' : '◗',
    label: themeDark ? 'Color claro' : 'Color oscuro',
    onClick: onTheme
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: "⇡",
    label: "Compartir",
    onClick: onShare
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: "?",
    label: "Ayuda",
    onClick: onHelp
  }));
}

// ---- Home screen: section group ("|| CANCIONES") with a row of compact buttons ----
function HomeGroup({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "home-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-group-h"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar1"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "bar2"
  }, "|"), " ", label), /*#__PURE__*/React.createElement("div", {
    className: "home-group-row"
  }, children));
}
function HomeGroupBtn({
  icon,
  text,
  tone,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: 'home-group-btn' + (tone ? ' tone-' + tone : ''),
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    className: "hgb-icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "hgb-text"
  }, text));
}

// ---- Brand block (logo + name + slogan) reused on every page ----
function BrandBlock({
  small
}) {
  const CFG = window.APP_CONFIG || {};
  return /*#__PURE__*/React.createElement("div", {
    className: 'brand-block' + (small ? ' small' : '')
  }, /*#__PURE__*/React.createElement("img", {
    className: "brand-icon",
    src: CFG.iconPath || 'config/icon.svg',
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "brand-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-name"
  }, CFG.appName || 'ACORDES'), /*#__PURE__*/React.createElement("div", {
    className: "brand-slogan"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar1"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "bar2"
  }, "|"), " ", CFG.subtitle || 'Editor de canciones')));
}

// ---- Search bar for song pickers ----
function SearchBar({
  value,
  onChange,
  placeholder
}) {
  return /*#__PURE__*/React.createElement("input", {
    className: "search-bar",
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder || 'Buscar canción…'
  });
}

// ---- Folder grid (A, B, C…) ----
function FolderGrid({
  letters,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "folder-grid"
  }, letters.map(L => /*#__PURE__*/React.createElement("button", {
    key: L,
    className: "folder-btn",
    onClick: () => onPick(L)
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "34",
    height: "34",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  })), /*#__PURE__*/React.createElement("span", null, L))));
}

// ---- Universal song picker: flat list, search, folder-by-letter fallback,
//      single or multi select with an action button that appears on pick ----
const FOLDER_THRESHOLD = 8;
function SongPicker({
  songs,
  mode = 'single',
  onPick,
  selected,
  onToggle,
  actionLabel,
  onAction,
  extraTop
}) {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState(null);
  const q = query.trim().toLowerCase();
  const filtered = q ? songs.filter(s => (s.meta.title || '').toLowerCase().includes(q)) : songs;
  const needsFolders = !q && filtered.length > FOLDER_THRESHOLD;
  const rowFor = s => /*#__PURE__*/React.createElement(RetroBtn, {
    key: s.id,
    icon: mode === 'multi' ? selected.includes(s.id) ? '☑' : '☐' : '♬',
    text: s.meta.title || 'Sin título',
    selected: mode === 'multi' && selected.includes(s.id),
    sub: 'Tono ' + (s.meta.key || '—') + ' · ' + s.meta.time,
    onClick: () => mode === 'multi' ? onToggle(s.id) : onPick(s)
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "song-picker"
  }, extraTop, /*#__PURE__*/React.createElement(SearchBar, {
    value: query,
    onChange: v => {
      setQuery(v);
      setLetter(null);
    }
  }), needsFolders && !letter && /*#__PURE__*/React.createElement(FolderGrid, {
    letters: [...new Set(filtered.map(s => (s.meta.title || '#').trim().charAt(0).toUpperCase() || '#'))].sort(),
    onPick: setLetter
  }), (!needsFolders || letter || q) && /*#__PURE__*/React.createElement("div", {
    className: "picker-list"
  }, (letter ? filtered.filter(s => ((s.meta.title || '#').trim().charAt(0).toUpperCase() || '#') === letter) : filtered).map(rowFor)), q && filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "dim-note center"
  }, (window.APP_CONFIG || {}).noResultsText || 'No se encontró ninguna canción con ese nombre.'), needsFolders && letter && /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "‹",
    text: "Volver a las carpetas",
    onClick: () => setLetter(null)
  }), mode === 'multi' && selected.length > 0 && actionLabel && /*#__PURE__*/React.createElement("div", {
    className: "picker-action"
  }, /*#__PURE__*/React.createElement(RetroBtn, {
    icon: "✓",
    text: actionLabel + ' (' + selected.length + ')',
    primary: true,
    onClick: onAction
  })));
}

// ---- Row-of-buttons toolbar (wraps to 2 rows past 4 items) ----
function ButtonRow({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, children);
}
Object.assign(window, {
  RetroBtn,
  TopBtn,
  Page,
  NoteFigure,
  ChordBars,
  CellEditor,
  StructureLine,
  StructureEditor,
  SectionNamePicker,
  LyricParagraphEditor,
  Metronome,
  parseChordParts,
  buildChord,
  IconBtn,
  TopIcons,
  HomeGroup,
  HomeGroupBtn,
  BrandBlock,
  SearchBar,
  FolderGrid,
  SongPicker,
  ButtonRow,
  FOLDER_THRESHOLD,
  InlinePanel,
  SizeControl,
  VERSE_NUMS
});
})();
