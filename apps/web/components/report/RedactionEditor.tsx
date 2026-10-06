'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { colors } from '@rmmm/tokens';
import { Button, Dialog, en } from '@rmmm/ui/web';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const t = en.report.redaction;

/** Shape of the experimental FaceDetector (Chrome on Android/ChromeOS, some desktop flags). */
type FaceDetectorCtor = new (o?: { fastMode?: boolean }) => {
  detect(src: ImageBitmap): Promise<{ boundingBox: DOMRectReadOnly }[]>;
};

/**
 * Cover parts of an image before upload (SPEC 4.1 step 4). Boxes are drawn with a pointer
 * or added and moved with the keyboard; "Cover faces" uses the browser's FaceDetector when
 * it exists. The result is re-rendered from pixels, so covered areas are gone from the file
 * (not a layer on top) and EXIF is dropped too.
 */
export function RedactionEditor({
  file,
  open,
  onClose,
  onApply,
}: {
  file: Blob | null;
  open: boolean;
  onClose: () => void;
  /** The covered image, plus the boxes as fractions of width/height (staff save boxes server-side). */
  onApply: (blob: Blob, boxes: { x: number; y: number; w: number; h: number }[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Box | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const faceDetector =
    typeof window !== 'undefined'
      ? (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector
      : undefined;

  useEffect(() => {
    if (!open || !file) return;
    let alive = true;
    createImageBitmap(file, { imageOrientation: 'from-image' })
      .then((b) => alive && setBmp(b))
      .catch(() => alive && setBmp(null));
    return () => {
      alive = false;
      setBoxes([]);
      setSelected(null);
      setNote(null);
    };
  }, [file, open]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !bmp) return;
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    ctx.fillStyle = colors.ink;
    for (const b of draft ? [...boxes, draft] : boxes) ctx.fillRect(b.x, b.y, b.w, b.h);
    if (selected !== null && boxes[selected]) {
      const b = boxes[selected]!;
      ctx.strokeStyle = colors.caution;
      ctx.lineWidth = Math.max(3, bmp.width / 200);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
  }, [bmp, boxes, draft, selected]);

  const toImage = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const sx = (bmp?.width ?? 1) / r.width;
    const sy = (bmp?.height ?? 1) / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const norm = (a: { x: number; y: number }, b: { x: number; y: number }): Box => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = toImage(e);
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) =>
    start.current && setDraft(norm(start.current, toImage(e)));
  const up = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!start.current) return;
    const b = norm(start.current, toImage(e));
    start.current = null;
    setDraft(null);
    if (b.w > 4 && b.h > 4) {
      setBoxes((bs) => [...bs, b]);
      setSelected(boxes.length);
    }
  };

  const addBox = () => {
    if (!bmp) return;
    const w = bmp.width / 4;
    const h = bmp.height / 8;
    setBoxes((bs) => [...bs, { x: (bmp.width - w) / 2, y: (bmp.height - h) / 2, w, h }]);
    setSelected(boxes.length);
  };

  const onKey = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (selected === null || !bmp) return;
    const step = Math.max(4, Math.round(bmp.width / 50));
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      setBoxes((bs) => bs.filter((_, i) => i !== selected));
      setSelected(null);
      return;
    }
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    setBoxes((bs) =>
      bs.map((b, i) =>
        i !== selected
          ? b
          : e.shiftKey
            ? { ...b, w: Math.max(8, b.w + v[0]), h: Math.max(8, b.h + v[1]) }
            : {
                ...b,
                x: Math.min(Math.max(0, b.x + v[0]), bmp.width - b.w),
                y: Math.min(Math.max(0, b.y + v[1]), bmp.height - b.h),
              },
      ),
    );
  };

  const coverFaces = async () => {
    if (!bmp || !faceDetector) return;
    try {
      const faces = await new faceDetector({ fastMode: true }).detect(bmp);
      const pad = 0.15;
      setBoxes((bs) => [
        ...bs,
        ...faces.map(({ boundingBox: f }) => ({
          x: Math.max(0, f.x - f.width * pad),
          y: Math.max(0, f.y - f.height * pad),
          w: f.width * (1 + 2 * pad),
          h: f.height * (1 + 2 * pad),
        })),
      ]);
      setNote(t.facesFound(faces.length));
    } catch {
      setNote(t.facesFound(0));
    }
  };

  const apply = async () => {
    const c = canvasRef.current;
    if (!c) return;
    setSelected(null);
    // Redraw without the selection outline, then export.
    const ctx = c.getContext('2d')!;
    ctx.drawImage(bmp!, 0, 0);
    ctx.fillStyle = colors.ink;
    for (const b of boxes) ctx.fillRect(b.x, b.y, b.w, b.h);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.92));
    if (blob && bmp) {
      onApply(
        blob,
        boxes.map((b) => ({
          x: b.x / bmp.width,
          y: b.y / bmp.height,
          w: b.w / bmp.width,
          h: b.h / bmp.height,
        })),
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.title}
      description={t.hint}
      size="full"
      closeLabel={t.cancel}
    >
      <div className="redact">
        <p className="muted" id="redact-keys">
          {t.keyboardHint}
        </p>
        <div className="redact__tools" role="toolbar" aria-label={t.title}>
          <Button variant="secondary" onClick={addBox} disabled={!bmp}>
            {t.addBox}
          </Button>
          {faceDetector && (
            <Button variant="secondary" onClick={coverFaces} disabled={!bmp}>
              {t.blurFaces}
            </Button>
          )}
          <Button
            variant="tertiary"
            onClick={() => setBoxes((bs) => bs.slice(0, -1))}
            disabled={!boxes.length}
          >
            {t.undo}
          </Button>
          <Button
            variant="tertiary"
            onClick={() => (setBoxes([]), setSelected(null))}
            disabled={!boxes.length}
          >
            {t.clear}
          </Button>
        </div>
        {note && (
          <p role="status" className="muted">
            {note}
          </p>
        )}
        {boxes.length > 0 && (
          <ul className="redact__boxes" aria-label={t.title}>
            {boxes.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="rmmm-btn rmmm-btn--ghost"
                  aria-pressed={selected === i}
                  onClick={() => {
                    setSelected(i);
                    canvasRef.current?.focus();
                  }}
                >
                  {t.boxLabel(i + 1)}
                </button>
              </li>
            ))}
          </ul>
        )}
        <canvas
          ref={canvasRef}
          className="redact__canvas"
          role="img"
          aria-label={t.canvasLabel}
          aria-describedby="redact-keys"
          tabIndex={0}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onKeyDown={onKey}
        />
        <div className="redact__actions">
          <Button onClick={apply} disabled={!bmp}>
            {t.apply}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
