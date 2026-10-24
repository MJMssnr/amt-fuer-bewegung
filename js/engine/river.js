// Fluss-Labor (Typ W) [W34]: Boot fährt die Strecke L flussaufwärts und zurück. Kein DOM.
// vb = Geschwindigkeit des Bootes gegenüber dem Wasser, vf = Fließgeschwindigkeit (beide ≥ 0, in m/s).
// Ort x: 0 = Steg, L = Boje flussaufwärts.

/** Fahrplan einer Fahrt. ok = false, wenn das Boot gegen die Strömung nicht ankommt (vb ≤ vf). */
export function tripPlan(vb, vf, L) {
  if (vb <= vf + 1e-9) return { ok: false, vUp: vb - vf, L };
  const t1 = L / (vb - vf), t2 = L / (vb + vf), T = t1 + t2;
  return { ok: true, t1, t2, T, avg: (2 * L) / T, avgNoCurrent: vb, tNoCurrent: (2 * L) / vb, L };
}

/** Ort des Bootes zur Zeit t (nur für ok-Fahrten); danach bleibt es am Steg */
export function boatAt(plan, t, vb, vf) {
  if (!plan.ok) return Math.max(-plan.L * 0.35, plan.vUp * t); // treibt ab (höchstens bis zum Seil-Ende)
  if (t <= plan.t1) return (vb - vf) * t;
  if (t <= plan.T) return plan.L - (vb + vf) * (t - plan.t1);
  return 0;
}
