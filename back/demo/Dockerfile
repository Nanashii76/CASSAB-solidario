# ========================
# Estágio 1: Build (Compilação)
# ========================
# Usamos uma imagem Maven com Java 21 (Eclipse Temurin é a distro recomendada atualmente)
FROM maven:3.9.9-eclipse-temurin-21 AS build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas o arquivo de configuração primeiro (para aproveitar o cache do Docker)
COPY pom.xml .

# Baixa as dependências (Isso faz o build ser mais rápido nas próximas vezes)
# Se der erro aqui, pode remover essa linha e deixar o 'mvn package' baixar tudo
RUN mvn dependency:go-offline

# Copia o código fonte do projeto
COPY src ./src

# Compila o projeto e gera o .jar (pulando testes para agilizar o deploy)
RUN mvn clean package -DskipTests

# ========================
# Estágio 2: Runtime (Execução)
# ========================
# Usamos apenas o JRE 21 (mais leve que o JDK completo) para rodar
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copia o .jar gerado no estágio anterior para a pasta atual com o nome app.jar
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta padrão do Spring Boot
EXPOSE 8080

# Comando para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]