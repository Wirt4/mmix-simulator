# syntax=docker/dockerfile:1.7

ARG RUBY_VERSION=4.0.1

# ─────────────────────────────────────────────────────────────
# Base image (stable, reused everywhere)
# ─────────────────────────────────────────────────────────────
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

# System deps (cached via BuildKit)
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      bubblewrap curl libjemalloc2 libvips python3-seccomp sqlite3 && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# ─────────────────────────────────────────────────────────────
# MMIX build (rarely changes → isolate for caching)
# ─────────────────────────────────────────────────────────────
FROM base AS mmix

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential texlive-binaries && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

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

# ─────────────────────────────────────────────────────────────
# Build stage (gems + app compilation)
# ─────────────────────────────────────────────────────────────
FROM base AS build

# Build deps
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential git libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Gems (max cache reuse)
COPY Gemfile Gemfile.lock ./

RUN --mount=type=cache,target=/usr/local/bundle/cache \
    bundle install && \
    rm -rf ~/.bundle \
           "${BUNDLE_PATH}"/ruby/*/cache \
           "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Bootsnap for gems (parallelized)
RUN bundle exec bootsnap precompile -j $(nproc) --gemfile

# ─────────────────────────────────────────────────────────────
# Assets precompile
# ─────────────────────────────────────────────────────────────
# Only copy files that affect assets
COPY . .

RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# ─────────────────────────────────────────────────────────────
# App code (comes AFTER expensive steps)
# ─────────────────────────────────────────────────────────────
COPY . .

# Bootsnap app code
RUN bundle exec bootsnap precompile -j $(nproc) app/ lib/

# ─────────────────────────────────────────────────────────────
# Test stage
# ─────────────────────────────────────────────────────────────
FROM build AS test

ENV RAILS_ENV="test" \
    BUNDLE_WITHOUT="" \
    BUNDLE_DEPLOYMENT="0"

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y nodejs npm && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Reuse gems instead of reinstalling
COPY --from=build /usr/local/bundle /usr/local/bundle

RUN --mount=type=cache,target=/root/.npm \
    npm install

RUN ln -s /rails/script/bwrap_seccomp.py /usr/local/bin/bwrap-seccomp

CMD ["bin/ci"]

# ─────────────────────────────────────────────────────────────
# Production image
# ─────────────────────────────────────────────────────────────
FROM base AS production

RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash

# Copy MMIX binaries (cached separately)
COPY --from=mmix /usr/local/bin/mmix /usr/local/bin/mmix
COPY --from=mmix /usr/local/bin/mmixal /usr/local/bin/mmixal

# Copy app + gems
COPY --chown=rails:rails --from=build /usr/local/bundle /usr/local/bundle
COPY --chown=rails:rails --from=build /rails /rails

USER root
RUN ln -s /rails/script/bwrap_seccomp.py /usr/local/bin/bwrap-seccomp
USER 1000:1000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
