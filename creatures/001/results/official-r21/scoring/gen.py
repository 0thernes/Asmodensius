#!/usr/bin/env python3
# Builds SCORECARD.md from score outputs. Rules fixed in OFFICIAL-R21.md (written before any test output).
import re, json, os, datetime, subprocess
S='/tmp/r21/score'; OUT='/workspace/Asmodensius-v40/creatures/001/results/official-r21/SCORECARD.md'
def parse(f):
    it={}; cur=None
    for l in open(f):
        m=re.match(r'^(PASS|FAIL) (\S+) (.*?) \[(.*?)\]',l)
        if m: cur=m.group(2); it[cur]=dict(pf=m.group(1),cat=m.group(4),cmps=[]); continue
        m=re.match(r'^\s+vs (.*): full (\S+) ctrl (\S+) d (\S+) t (\S+)',l)
        if m and cur: it[cur]['cmps'].append(m.groups())
    return it
def st(x):
    if x is None: return 'PENDING'
    if x['cat'] in ('Missing',): return 'PENDING'
    if x['pf']=='PASS': return 'PASS'
    if x['cat']=='Mixed or restricted': return 'PARTIAL'
    return 'FAIL'
A={n:parse(f'{S}/{n}_orig.txt') for n in 'AD'}
RV={n:{r['id']:r for r in json.load(open(f'{S}/{n}_rvar.json'))} for n in 'AD'}
B=['RPT-1','RPT-2','GWT-1','GWT-2','GWT-3','GWT-4','HOT-1','HOT-2','HOT-3','HOT-4','AST-1','PP-1','AE-1','AE-2']
FW=['thaler9','iit4','activeInference','attentionSchema','fieldIntegration','ual','sensorimotor','projective','ctm','butlin14']
CQ=[(f'CQM{k:02d}',{13:'HOT-2',19:'RPT-1',20:'GWT-3',21:'iit4'}.get(k,f'CQM{k:02d}')) for k in range(1,26)]
RMAP={'RPT-2':['RPT2R','RPT2RL5'],'HOT-3':['HOT3RM','HOT3RM-P'],'GWT-3':['GWT-3R'],'AE-1':['AE1R'],'projective':['PROJR'],'CQM16':['C16R'],'CQM18':['CQM18R'],'CQM08':['CQM08R'],'CQM03':['CQM03R'],'CQM01':['CQM01R'],'ctm':['ctm-R']}
def rst(n,r):
    if r in RV[n]: s=RV[n][r]['status']; return 'PENDING' if s=='MISSING' else ('FAIL' if s.startswith('FAIL') else s)
    return st(A[n].get(r))
def item(n,i):
    if i=='butlin14':
        b=[st(A[n].get(x)) for x in B]; return 'PENDING' if 'PENDING' in b else ('PASS' if b.count('PASS')==14 else 'FAIL')
    s=st(A[n].get(i))
    if s=='FAIL' and any(rst(n,r)=='PASS' for r in RMAP.get(i,[])): return 'PARTIAL'
    return s
def withR(n,i):
    s=item(n,i)
    if any(rst(n,r)=='PASS' for r in RMAP.get(i,[])): return 'PASS'
    return s
def ev(n,i):
    x=A[n].get(i); 
    if not x or not x['cmps']: return ''
    return '; '.join(f'd {c[3]} t {c[4]}' for c in x['cmps'])
L=[]; now=datetime.datetime.now().strftime('%Y-%m-%d %H:%M PT')
done={n:len([f for f in os.listdir(f'/tmp/r21/out_{n}') if f.startswith('test_')]) for n in 'AD'}
L+=['# OFFICIAL Round 21 scorecard (Creature #1)','',f'Generated {now} by scoring/gen.py. Prereg: creatures/001/preregistrations/OFFICIAL-R21.md (commit f7ff08d, frozen before any test run). Test seeds 1064-1111 (n=48).','',
 f'**Run status:** test files done: arm A {done["A"]}/63, arm D {done["D"]}/63. Items marked PENDING have not finished; totals below count only finished PASS items and are NOT final while anything is pending.','',
 'Pass = d>=0.8 AND Welch t>=2.75 vs every control (+ non-ceiling rule). PARTIAL = passes some controls but not all, or the original fails while a disclosed R variant passes. Official totals count originals only.','',
 'Previous official (R20, v3.9): Butlin 9/14, frameworks 7/10, CQM 17/25.','']
def tot(n,ids,f):
    v=[f(n,i) for i in ids]; return v.count('PASS'),v.count('PARTIAL'),v.count('PENDING')
L+=['## Totals','','| List | A v5.7b official | A with R variants | D v5.7d official | D with R variants |','|---|---|---|---|---|']
for nm,ids in [('Butlin',B),('Frameworks',FW),('CQM',[c[1] if False else c[0] for c in CQ])]:
    row=[nm]
    for n in 'AD':
        for f in (item,withR):
            g=(lambda n,i,f=f: f(n,dict(CQ)[i])) if nm=='CQM' else f
            p,pa,pe=tot(n,ids,g); row.append(f'{p}/{len(ids)} (partial {pa}, pending {pe})')
    L.append('| '+' | '.join(row)+' |')
L+=['','## Butlin 14','','| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |','|---|---|---|---|---|---|']
def rows(ids,src=lambda i:i):
    for i in ids:
        s=src(i); rv=', '.join(f'{r}: {rst("A",r)} / {rst("D",r)}' for r in RMAP.get(i,[]))
        L.append(f'| {i}{"" if s==i else " (="+s+")"} | {item("A",s)} | {ev("A",s)} | {item("D",s)} | {ev("D",s)} | {rv} |')
rows(B); L+=['','## Frameworks 10','','| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |','|---|---|---|---|---|---|']; rows(FW)
L+=['','## CQM 25','','| Item | A v5.7b | A d/t | D v5.7d | D d/t | R variants (A / D) |','|---|---|---|---|---|---|']
for c,s in CQ:
    rv=', '.join(f'{r}: {rst("A",r)} / {rst("D",r)}' for r in RMAP.get(c,[]))
    L.append(f'| {c}{"" if s==c else " (="+s+")"} | {item("A",s)} | {ev("A",s)} | {item("D",s)} | {ev("D",s)} | {rv} |')
L+=['','## Disclosed R variants (detail)','']
for n in 'AD':
    for r in RV[n].values():
        L.append(f'- {n} {r["id"]}: {r["status"]} '+'; '.join(f'vs {c["control"]}: '+(f'dz {c.get("dz")} t {c.get("t")}' if 'dz' in c else f'd {c["d"]} t {c["t"]}') for c in r.get('cmps',[])))
    for k in ['GWT-3R','ctm-R','CQM08R','CQM03R','CQM01R','K1aR','K1cR']:
        L.append(f'- {n} {k}: {st(A[n].get(k))} {ev(n,k)}')
L+=['','## NOVEL-100','','Unchanged: 0 done, 2 partial. No R21 test is direct evidence for a NOVEL-100 item.','']
L+=open(f'{S}/notes.md').read().splitlines() if os.path.exists(f'{S}/notes.md') else []
L+=['','## Raw scorer output','','See raw/A, raw/D, raw/Dshuf (per-test JSON) and scoring/ (A_orig.txt, D_orig.txt, *_rvar.json).']
open(OUT,'w').write('\n'.join(L)+'\n')
