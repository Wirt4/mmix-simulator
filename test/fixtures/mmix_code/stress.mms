* stress.mms — Attempt to exceed sandbox resource limits
*
* Run inside the bwrap sandbox to verify enforcement:
*   python3 script/bwrap_seccomp.py -e mmix stress.mmo
*
* Expected behavior:
*   Part 1 — simulator killed when host memory exceeds 75 MB (rlimit-as)
*   Part 2 — file writes fail past 128 MB (SIGXFSZ from rlimit-fsize)

at       IS   $255
Handle   IS   3

         LOC  Data_Segment
         GREG @
FArg     OCTA Fname,TextWrite
Fname    BYTE "stress.txt",0
Wstr     BYTE "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234",#a,0
Msg1     BYTE "Starting RAM stress test (80 MB)...",#a,0
Msg2     BYTE "RAM limit not enforced!",#a,0
Msg3     BYTE "Starting disk stress test (136 MB)...",#a,0
Msg4     BYTE "Disk limit not enforced!",#a,0

         LOC  #100

* ── Part 1: RAM stress ──────────────────────────────────
* Touch one byte per page across 80 MB of MMIX virtual memory,
* forcing the simulator to allocate > 75 MB of real host RAM.
Main     LDA  at,Msg1
         TRAP 0,Fputs,StdOut

         LDA  $0,Msg4
         ADDU $0,$0,256          % base = safely past all string data
         SET  $1,0               % offset = 0
         SETML $2,#0500          % limit = #05000000 = 80 MB
         SETL $3,#AB             % fill value

RLoop    STBU $3,$0,$1           % store byte at base + offset
         INCL $1,#1000           % offset += 4096 (one page)
         CMP  $4,$1,$2
         BN   $4,RLoop           % loop while offset < 80 MB

         LDA  at,Msg2
         TRAP 0,Fputs,StdOut

* ── Part 2: Disk stress ─────────────────────────────────
* Write 32 bytes × ~4.4 million iterations ≈ 136 MB to a file.
         LDA  at,Msg3
         TRAP 0,Fputs,StdOut

         LDA  at,FArg
         TRAP 0,Fopen,Handle

         SET  $4,0               % counter = 0
         SETML $5,#0044          % limit = #00440000 ≈ 4.4 million

DLoop    LDA  at,Wstr
         TRAP 0,Fputs,Handle     % write 32 bytes
         INCL $4,1
         CMP  $6,$4,$5
         BN   $6,DLoop           % loop until counter >= limit

         TRAP 0,Fclose,Handle

         LDA  at,Msg4
         TRAP 0,Fputs,StdOut

         TRAP 0,Halt,0
