# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=4.0.1
FROM ghcr.io/rails/devcontainer/images/ruby:$RUBY_VERSION

USER root
RUN apt-get update && apt-get install -y nodejs npm texlive-binaries build-essential bubblewrap python3-seccomp && rm -rf /var/lib/apt/lists/*

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
RUN ln -s /workspaces/mmix-simulator/script/bwrap_seccomp.py /usr/local/bin/bwrap-seccomp && \
    chmod +x /workspaces/mmix-simulator/script/bwrap_seccomp.py 2>/dev/null || true

# Install dependencies as vscode user (Ruby is installed via mise under vscode's home)
USER vscode
ENV PATH="/home/vscode/.local/bin:/home/vscode/.local/share/mise/installs/ruby/4.0.1/bin:${PATH}"

# Install Ruby dependencies
COPY --chown=vscode Gemfile Gemfile.lock /tmp/deps/
RUN cd /tmp/deps && bundle install && rm -rf /tmp/deps

# Cache JavaScript dependencies (copied into workspace by postCreateCommand)
COPY --chown=vscode package.json package-lock.json /tmp/deps/
RUN cd /tmp/deps && npm install && mv node_modules /home/vscode/.node_modules_cache && rm -rf /tmp/deps

# Ensure binding is always 0.0.0.0
ENV BINDING="0.0.0.0"
