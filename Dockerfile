FROM node:20-bullseye

# Install system deps, Python for PaddleOCR, and PDF tools (pdftocairo)
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    poppler-utils \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

# Install PaddleOCR (CPU). If you need GPU, adjust to paddlepaddle-gpu.
RUN pip3 install --no-cache-dir paddlepaddle paddleocr

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
