# Specialist: AE2 (body model)
Base already passes (d 2.49). SC body model (scBM: Kalman gain estimate + learned noise + innovation-gated updates instead of the oracle push flag) improves AE2 tracking error vs base by d +4.24 (block 500) and keeps the pass (2.55/7.2). No other test changed (all [+0.00]).
