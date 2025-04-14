FROM node:20-alpine AS builder
# RUN corepack enable

# WORKDIR /app

# COPY package.json pnpm-lock.yaml ./

# RUN pnpm install

# COPY . .

# RUN pnpm build

# ---------------------------

# FROM node:20-alpine AS runner
# RUN corepack enable

# WORKDIR /app

# COPY --from=builder /app/.next  ./.next
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# EXPOSE 3000

# CMD ["pnpm", "start"]