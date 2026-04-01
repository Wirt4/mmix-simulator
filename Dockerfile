# syntax=docker/dockerfile:1
# check=error=true

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=4.0.1
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /rails

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y bubblewrap curl libjemalloc2 libvips python3-seccomp sqlite3 && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Set production environment variables and enable jemalloc for reduced memory usage and latency.
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems and MMIX from source
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential texlive-binaries git libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

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

# Install application gems
COPY Gemfile Gemfile.lock ./

RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile -j 1 --gemfile

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times.
RUN bundle exec bootsnap precompile -j 1 app/ lib/

# Precompiling assets for production without requiring secret RAILS_MASTER_KEY
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# ── Test stage ───────────────────────────────────────────────────────
# Includes build tools and all gem groups (dev + test).
FROM build AS test

ENV RAILS_ENV="test" \
    BUNDLE_WITHOUT="" \
    BUNDLE_DEPLOYMENT="0"

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y nodejs npm && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache

RUN npm install

RUN ln -s /rails/script/bwrap_seccomp.py /usr/local/bin/bwrap-seccomp

CMD ["bin/ci"]

# ── Production stage ─────────────────────────────────────────────────
FROM base AS production

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash
USER 1000:1000

# Copy built artifacts: gems, application, MMIX binaries
COPY --from=build /usr/local/bin/mmix /usr/local/bin/mmix
COPY --from=build /usr/local/bin/mmixal /usr/local/bin/mmixal
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails

# Make bwrap-seccomp available on PATH
USER root
RUN ln -s /rails/script/bwrap_seccomp.py /usr/local/bin/bwrap-seccomp
USER 1000:1000

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start server via Thruster by default, this can be overwritten at runtime
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
