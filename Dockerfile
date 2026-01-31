# 1️⃣ Base Linux + Node
FROM node:18-slim

# 2️⃣ Install Chromium + required system libraries
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libnss3 \
  libatk-bridge2.0-0 \
  libxkbcommon0 \
  libgtk-3-0 \
  libgbm1 \
  libasound2 \
  libxshmfence1 \
  libdrm2 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# 3️⃣ Tell Puppeteer to use system Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 4️⃣ App directory
WORKDIR /app

# 5️⃣ Install dependencies
COPY package*.json ./
RUN npm install

# 6️⃣ Copy source code
COPY . .

# 7️⃣ Start the app
CMD ["npm", "start"]
