// Dijalog za potvrdu izlaza na dugme/gest „nazad" — standard vlasnika za sve aplikacije:
// 3 sloja u istoriji pri naoružavanju, ikonica vrata 128px, ikonice dugmadi 44px
// (vertical-align:-14px, margin-right:6px), dijalog na top:42% sa translate(-50%,-50%).
import { useEffect, useRef, useState } from "react";

const GUARD_LAYERS = 3;

interface ExitGuardProps {
  /** Vraća true ako je aplikacija sama obradila „nazad" (npr. povratak na glavni ekran). */
  onBack: () => boolean;
}

export function ExitGuard({ onBack }: ExitGuardProps) {
  const [open, setOpen] = useState(false);
  const pushed = useRef(0);
  const leaving = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    for (let i = 0; i < GUARD_LAYERS; i++) {
      history.pushState({ meraGuard: true }, "");
      pushed.current += 1;
    }
    const onPop = () => {
      if (leaving.current) return;
      pushed.current = Math.max(0, pushed.current - 1);
      // Odmah vraćamo potrošeni sloj, da sledeći „nazad" ne zatvori aplikaciju.
      history.pushState({ meraGuard: true }, "");
      pushed.current += 1;
      if (!onBackRef.current()) setOpen(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const stay = () => setOpen(false);

  const exit = () => {
    leaving.current = true;
    setOpen(false);
    const layers = pushed.current;
    pushed.current = 0;
    // Vraćamo se na prvi unos istorije, pa još jedan korak nazad.
    const onArrive = () => {
      window.removeEventListener("popstate", onArrive);
      history.back();
    };
    if (layers > 0) {
      window.addEventListener("popstate", onArrive);
      history.go(-layers);
    } else {
      history.back();
    }
  };

  if (!open) return null;
  return (
    <div className="exit-backdrop" role="presentation" onClick={stay}>
      <div
        className="exit-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="exit-door" aria-hidden="true">🚪</div>
        <h2 id="exit-title" className="exit-title">Izaći iz Mere?</h2>
        <div className="exit-actions">
          <button type="button" className="btn btn-secondary" onClick={stay} autoFocus>
            <span className="btn-icon" aria-hidden="true">↩️</span>Ostani
          </button>
          <button type="button" className="btn btn-primary" onClick={exit}>
            <span className="btn-icon" aria-hidden="true">✅</span>Izađi
          </button>
        </div>
      </div>
    </div>
  );
}
