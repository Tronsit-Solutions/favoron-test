import React from 'react';

function isEditable(el: any) {
  return el && (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable
  );
}

export function FocusStabilizer() {
  const last = React.useRef<{ selector: string; caret: number | null } | null>(null);

  React.useEffect(() => {
    const onFocus = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!isEditable(el)) return;
      // Ensure unique identifier
      if (!el.id) el.id = 'f_' + Math.random().toString(36).slice(2);
      const caret = (el as HTMLInputElement).selectionStart ?? null;
      last.current = { selector: `#${el.id}`, caret };
    };

    const onKeydown = (e: KeyboardEvent) => {
      // Ignore global hotkeys if I'm typing
      if (isEditable(e.target)) {
        e.stopPropagation();
      }
    };

    window.addEventListener('focus', onFocus, true);
    window.addEventListener('keydown', onKeydown, true);

    return () => {
      window.removeEventListener('focus', onFocus, true);
      window.removeEventListener('keydown', onKeydown, true);
    };
  }, []);

  // After each render, if focus was lost due to remount, restore it
  React.useEffect(() => {
    queueMicrotask(() => {
      if (document.activeElement && isEditable(document.activeElement)) return;
      const info = last.current;
      if (!info) return;
      const el = document.querySelector(info.selector) as HTMLInputElement;
      if (el && isEditable(el)) {
        el.focus();
        try {
          if (info.caret != null) el.setSelectionRange(info.caret, info.caret);
        } catch {}
      }
    });
  });

  return null;
}