# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=4.0.1
FROM ghcr.io/rails/devcontainer/images/ruby:$RUBY_VERSION

USER root
RUN apt-get update && apt-get install -y nodejs npm texlive-binaries build-essential && rm -rf /var/lib/apt/lists/*

# Build MMIX and MMIXAL from vendored source
COPY vendor/mmixware /tmp/mmixware
ENV CWEBINPUTS=/tmp/mmixware
RUN cd /tmp/mmixware && \
    ctangle mmix-arith.w && \
    ctangle mmix-io.w && \
    ctangle mmix-sim.w && \
    ctangle mmixal.w && \
    ctangle abstime.w && \
    gcc -O0 -c mmix-arith.c && \
    gcc -O0 -c mmix-io.c && \
    gcc -O0 -o abstime abstime.c && \
    ./abstime > abstime.h && \
    gcc -O0 mmixal.c mmix-arith.o -o mmixal && \
    gcc -O0 mmix-sim.c mmix-arith.o mmix-io.o -o mmix && \
    cp mmix mmixal /usr/local/bin/ && \
    rm -rf /tmp/mmixware
USER vscode

# Ensure binding is always 0.0.0.0
# Binds the server to all IP addresses of the container, so it can be accessed from outside the container.
ENV BINDING="0.0.0.0"
