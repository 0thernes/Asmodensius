import json,glob,os,math,statistics as S
# Frozen rule (preregistrations/SC-PORT.md): grade A = d>=0.8 and Welch t>=2.75 vs every control, pooled n=48 (1112/1128/1144); AE1 also pooled with 1160-1223.
def dt(a,b):
    ma,mb=S.mean(a),S.mean(b); va,vb=S.variance(a),S.variance(b); sp=math.sqrt((va+vb)/2)
    se=math.sqrt(va/len(a)+vb/len(b)); d=(ma-mb)/sp if sp>0 else float('inf')*(1 if ma>mb else -1 if ma<mb else 0); t=(ma-mb)/se if se>0 else d
    return d,t,va
MAIN=[1112,1128,1144]; EXT=[1160,1176,1192,1208]
CLAIM=['RPT2R','RPT2RL5','RPT1','UAL','HOT3RM','AE2','AE1']; MUST=['GWT2']; REP=['AINF','C10','C16R']
def pool(arm,t,blocks):
    P={}; n=0
    for b in blocks:
        f=f'/tmp/scp/out/{arm}_{b}/tune_{t}.json'
        if not os.path.exists(f): return None,n
        A=json.load(open(f))['arms']; n+=1
        for k,v in A.items(): P.setdefault(k,[]).extend(v)
    return P,n
out=["# SC-PORT Combo A — OFFICIAL test scorecard","","Frozen prereg: preregistrations/SC-PORT.md (freeze commit cb3aaed, code pin bc6ad6a). Seeds 1112–1159 (n=48/arm); AE1 also pooled with 1160–1223 (n=112).","Cell: grade / weakest control d/t. Grade A = d≥0.8 and t≥2.75 vs every control.","","| test | role | v5.7b | Combo A | Combo A full vs v5.7b full d |","|---|---|---|---|---|"]
for t in CLAIM+MUST+REP:
    role='claim' if t in CLAIM else 'must-hold' if t in MUST else 'reported'
    bl=MAIN+EXT if t=='AE1' else MAIN; cells=[]; full={}
    for arm in ['offbase','offcomboA']:
        P,n=pool(arm,t,bl)
        if P is None: cells.append(f'pending ({n}/{len(bl)})'); continue
        fk=list(P)[0]; full[arm]=P[fk]; cs=[dt(P[fk],v) for k,v in P.items() if k!=fk]
        ok=all(d>=0.8 and tt>=2.75 for d,tt,_ in cs); d,tt,_=min(cs,key=lambda x:x[0])
        ceil=S.variance(P[fk])==0
        g='A' if ok else 'fail'
        if ceil: g='ceiling, not graded' if not ok or any(S.variance(v)==0 and S.mean(v)==S.mean(P[fk]) for k,v in P.items() if k!=fk) else 'A (full at ceiling; controls not)'
        cells.append(f'{g} {d:.2f}/{tt:.1f} (n={len(P[fk])})')
    x=f"{dt(full['offcomboA'],full['offbase'])[0]:+.2f}" if len(full)==2 else '.'
    out.append(f"| {t} | {role} | {cells[0]} | {cells[1]} | {x} |")
print("\n".join(out))
