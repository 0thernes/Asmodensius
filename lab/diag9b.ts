import { make001, rptProbe } from "./src/index";
for (const cut of ["CTX->THAL", "CTX->CTX"]) for (const s of [2000, 2001, 2002]) { const r = rptProbe(make001, s, cut); console.log(cut, s, r.intact.early.toFixed(4), r.intact.late.toFixed(4), r.cut.early.toFixed(4), r.cut.late.toFixed(4)); }
