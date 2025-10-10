# Stage 1: Build the application
FROM maven:3.9.8-eclipse-temurin-21 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies first (better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -Dmaven.compile.fork=true

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-jammy

# Create app user for security
RUN groupadd -r appgroup && useradd -r -g appgroup -d /home/appuser -s /sbin/nologin -c "App user" appuser

# Set working directory
WORKDIR /home/appuser

# Copy only the built jar from previous stage
COPY --from=build /app/target/feedback-backend-*.jar app.jar

# Change ownership to app user
RUN chown -R appuser:appgroup /home/appuser

# Switch to non-root user
USER appuser

# Expose backend port
EXPOSE 8085

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8085/api/health || exit 1

# JVM options for containerized environment
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Run the jar with optimized JVM settings
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
