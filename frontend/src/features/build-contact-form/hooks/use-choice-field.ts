/**
 * useChoiceField — the single state hook for one choice (select) field (builder spec v2.0).
 * The canvas editor, right panel, style gallery and respondent preview all read from this one
 * source. State is re-seeded when the selected field changes (seedKey) and mirrored up to the
 * form draft via onChange so the draft stays the persisted source of truth.
 */
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import {
  logicOf,
  styleAllowsImage,
  type ChoiceEditorOption,
  type ChoiceLogic,
  type ChoiceState,
} from '@/features/build-contact-form/lib/choice-core';
import type {
  ChoiceCardLayout,
  ChoiceCountRule,
  ChoiceOtherConfig,
  ChoiceRatio,
  ChoiceStyleId,
} from '@/entities/contact-form';

type BoolUpdater = boolean | ((current: boolean) => boolean);

function nextBool(current: boolean, value: BoolUpdater): boolean {
  return typeof value === 'function' ? value(current) : value;
}

function newOptionId(): string {
  return 'opt_' + Math.random().toString(36).slice(2, 10);
}

export interface ChoiceField extends ChoiceState {
  logic: ChoiceLogic;
  canImage: boolean;
  setStyle: (id: ChoiceStyleId) => void;
  toggleDefault: (id: string) => void;
  addOption: (label?: string) => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, patch: Partial<ChoiceEditorOption>) => void;
  move: (from: number, to: number) => void;
  bulkReplace: (text: string) => void;
  toggleImg: (id: string) => void;
  setOther: (value: BoolUpdater) => void;
  patchOther: (patch: Partial<ChoiceOtherConfig>) => void;
  patchCount: (patch: Partial<ChoiceCountRule>) => void;
  setRequired: (value: BoolUpdater) => void;
  setImgMode: (value: BoolUpdater) => void;
  setCardLayout: (layout: ChoiceCardLayout) => void;
  setCols: (cols: 2 | 3) => void;
  setRatio: (ratio: ChoiceRatio) => void;
}

export function useChoiceField(
  seed: ChoiceState,
  seedKey: string,
  onChange: (state: ChoiceState) => void,
): ChoiceField {
  const [state, setState] = useState<ChoiceState>(seed);

  // Re-seed when the selected field changes (the hook instance is reused across fields). This is
  // React's "adjust state when a prop changes" pattern — tracking the previous key in state.
  const [prevKey, setPrevKey] = useState(seedKey);
  if (prevKey !== seedKey) {
    setPrevKey(seedKey);
    setState(seed);
  }

  // Mirror state up to the draft. onChange is kept in a ref (updated in an effect, not during
  // render) so the state effect depends only on state and never fires with a stale callback.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current(state);
  }, [state]);

  const logic = logicOf(state.style);
  const canImage = styleAllowsImage(state.style);

  const setStyle = useCallback((id: ChoiceStyleId) => {
    setState((s) => {
      const nextLogic = logicOf(id);
      return {
        ...s,
        style: id,
        defaults: nextLogic === 'single' ? s.defaults.slice(0, 1) : s.defaults,
        imgMode: styleAllowsImage(id) ? s.imgMode : false,
      };
    });
  }, []);

  const toggleDefault = useCallback((id: string) => {
    setState((s) => {
      if (logicOf(s.style) === 'single') {
        return { ...s, defaults: s.defaults[0] === id ? [] : [id] };
      }
      return {
        ...s,
        defaults: s.defaults.includes(id)
          ? s.defaults.filter((x) => x !== id)
          : [...s.defaults, id],
      };
    });
  }, []);

  const addOption = useCallback((label?: string) => {
    setState((s) => ({ ...s, options: [...s.options, { id: newOptionId(), label: label ?? '' }] }));
  }, []);

  const removeOption = useCallback((id: string) => {
    setState((s) =>
      s.options.length <= 1
        ? s
        : {
            ...s,
            options: s.options.filter((o) => o.id !== id),
            defaults: s.defaults.filter((x) => x !== id),
          },
    );
  }, []);

  const updateOption = useCallback((id: string, patch: Partial<ChoiceEditorOption>) => {
    setState((s) => ({
      ...s,
      options: s.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setState((s) => {
      if (from === to || from < 0 || to < 0 || from >= s.options.length || to >= s.options.length) {
        return s;
      }
      const options = s.options.slice();
      const [it] = options.splice(from, 1);
      if (it === undefined) {
        return s;
      }
      options.splice(to, 0, it);
      return { ...s, options };
    });
  }, []);

  const bulkReplace = useCallback((text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
    if (lines.length === 0) {
      return;
    }
    setState((s) => ({
      ...s,
      options: lines.map((l) => ({ id: newOptionId(), label: l })),
      defaults: [],
    }));
  }, []);

  const toggleImg = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      options: s.options.map((o) => (o.id === id ? { ...o, img: o.img !== true } : o)),
    }));
  }, []);

  const setOther = useCallback((value: BoolUpdater) => {
    setState((s) => ({ ...s, other: nextBool(s.other, value) }));
  }, []);

  const patchOther = useCallback((patch: Partial<ChoiceOtherConfig>) => {
    setState((s) => ({ ...s, otherCfg: { ...s.otherCfg, ...patch } }));
  }, []);

  const patchCount = useCallback((patch: Partial<ChoiceCountRule>) => {
    setState((s) => ({ ...s, countRule: { ...s.countRule, ...patch } }));
  }, []);

  const setRequired = useCallback((value: BoolUpdater) => {
    setState((s) => ({ ...s, required: nextBool(s.required, value) }));
  }, []);

  const setImgMode = useCallback((value: BoolUpdater) => {
    setState((s) =>
      styleAllowsImage(s.style) ? { ...s, imgMode: nextBool(s.imgMode, value) } : s,
    );
  }, []);

  const setCardLayout = useCallback((layout: ChoiceCardLayout) => {
    setState((s) => ({ ...s, cardLayout: layout }));
  }, []);

  const setCols = useCallback((cols: 2 | 3) => {
    setState((s) => ({ ...s, cols }));
  }, []);

  const setRatio = useCallback((ratio: ChoiceRatio) => {
    setState((s) => ({ ...s, ratio }));
  }, []);

  return {
    ...state,
    logic,
    canImage,
    setStyle,
    toggleDefault,
    addOption,
    removeOption,
    updateOption,
    move,
    bulkReplace,
    toggleImg,
    setOther,
    patchOther,
    patchCount,
    setRequired,
    setImgMode,
    setCardLayout,
    setCols,
    setRatio,
  };
}

/* ---------------- drag-to-reorder hook (HTML5 DnD, option rows) ---------------- */
export interface DragHandlers {
  draggable: true;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: DragEvent) => void;
  'data-over'?: '1';
}

export function useDragList(onMove: (from: number, to: number) => void): {
  make: (index: number) => DragHandlers;
  over: number | null;
} {
  const [over, setOver] = useState<number | null>(null);
  const fromRef = useRef<number | null>(null);

  const make = (index: number): DragHandlers => ({
    draggable: true,
    onDragStart: (e) => {
      fromRef.current = index;
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', String(index));
      } catch {
        // some browsers disallow setData outside a user gesture; safe to ignore.
      }
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (over !== index) {
        setOver(index);
      }
    },
    onDragEnd: () => {
      fromRef.current = null;
      setOver(null);
    },
    onDrop: (e) => {
      e.preventDefault();
      const from = fromRef.current;
      if (from != null && from !== index) {
        onMove(from, index);
      }
      fromRef.current = null;
      setOver(null);
    },
    ...(over === index ? { 'data-over': '1' as const } : {}),
  });

  return { make, over };
}
