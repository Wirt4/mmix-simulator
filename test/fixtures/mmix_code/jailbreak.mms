* Attempt to traverse one directory up and create a file named 'jailbreak'
* Uses Fopen TRAP with a relative path containing '..'

at       IS   $255
Handle   IS   3                        % Use file handle 3 (first available
                                       % after StdIn, StdOut, StdErr)

         LOC  Data_Segment
         GREG @
Arg      OCTA Filename,TextWrite       % Fopen args: pointer to filename, mode
Filename BYTE "../jailbreak",0         % Path traverses up one directory
Content  BYTE "jailbreak",#a,0         % Content to write into the file

         LOC  #100
Main     LDA  at,Arg
         TRAP 0,Fopen,Handle           % Fopen(Handle,"../jailbreak",TextWrite)

         LDA  at,Content
         TRAP 0,Fputs,Handle           % Fputs(Handle,Content)

         TRAP 0,Fclose,Handle          % Fclose(Handle)

         TRAP 0,Halt,0                 % Exit
