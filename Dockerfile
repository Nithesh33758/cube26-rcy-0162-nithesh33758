# =========================================================
# Stage 1: Build React Frontend (Vite + TypeScript)
# =========================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY recovery-manager/package*.json ./
RUN npm install

COPY recovery-manager/ ./
RUN npm run build

# =========================================================
# Stage 2: Build Spring Boot Backend (Java 25 + Maven)
# =========================================================
FROM eclipse-temurin:25-jdk AS backend-builder
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src ./src

# Bundle compiled frontend assets into Spring Boot static resources
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

RUN mvn clean package -DskipTests

# =========================================================
# Stage 3: Lightweight Production Runtime Image
# =========================================================
FROM eclipse-temurin:25-jre
WORKDIR /app

# Ensure data directory exists for H2 and upstream fixtures
COPY data /app/data

# Copy built self-contained Spring Boot JAR
COPY --from=backend-builder /app/backend/target/recovery-manager-backend-*.jar app.jar

ENV PORT=8080
ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-Xmx350m", "-Xss512k", "-jar", "app.jar"]
