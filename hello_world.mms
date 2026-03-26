        LOC   #100                   % Set the address of the program
                                     % initially to 0x100.

Main    GETA  $255,string            % Put the address of the string
                                     % into register 255.

        TRAP  0,Fputs,StdOut         % Write the string pointed to by
                                     % register 255 to the standard
                                     % output file.

        TRAP  0,Halt,0               % End process.

string  BYTE  "Hello, world!",#a,0   % String to be printed.  #a is
                                     % newline, 0 terminates the
                                     % string.
