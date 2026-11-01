#!/bin/bash
# resumable: jobs skip existing outputs
cd /tmp/r21; ls q/*.sh | xargs -P3 -n1 bash; echo ALLDONE > /tmp/r21/q.done
