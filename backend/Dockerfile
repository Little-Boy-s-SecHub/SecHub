FROM maven:3.9.11-eclipse-temurin-17-alpine AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src/ src/
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S sechub && adduser -S sechub -G sechub
WORKDIR /app
COPY --from=build /workspace/target/sechub-backend-*.jar app.jar
RUN mkdir -p /app/runtime/generated-labs && chown -R sechub:sechub /app
USER sechub
EXPOSE 8888
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
