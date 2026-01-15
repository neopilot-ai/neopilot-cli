# syntax=docker/dockerfile:1.6

############################
# Base image
############################
FROM node:20-slim

LABEL org.opencontainers.image.title="Neopilot CLI"
LABEL org.opencontainers.image.description="Neopilot CLI runtime image"
LABEL org.opencontainers.image.licenses="MIT"

############################
# Environment
############################
ARG TZ=UTC
ENV TZ=${TZ}

ENV PNPM_HOME=/home/node/.local/share/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

############################
# System dependencies
############################
RUN apt-get update && apt-get install -y --no-install-recommends \
    aggregate \
    ca-certificates \
    curl \
    dnsutils \
    fzf \
    gh \
    git \
    gnupg2 \
    iproute2 \
    ipset \
    iptables \
    jq \
    less \
    man-db \
    procps \
    ripgrep \
    unzip \
    zsh \
 && rm -rf /var/lib/apt/lists/*

############################
# Enable pnpm
############################
RUN corepack enable && corepack prepare pnpm@latest --activate

############################
# Firewall init (root-only)
############################
USER root
COPY scripts/init_firewall.sh /usr/local/bin/init_firewall.sh
RUN chmod +x /usr/local/bin/init_firewall.sh

############################
# Application setup (node user)
############################
USER node
WORKDIR /home/node/app

# Copy install metadata first (cache friendly)
COPY --chown=node:node package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

# Copy full source
COPY --chown=node:node . .

# Install CLI globally
RUN pnpm install -g .

############################
# Runtime directory
############################
WORKDIR /home/node

############################
# Entrypoint (firewall → drop privileges → CLI)
############################
USER root
ENTRYPOINT ["/usr/local/bin/init_firewall.sh"]

############################
# Default command
############################
CMD ["neopilot"]
