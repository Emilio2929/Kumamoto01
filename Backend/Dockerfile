# Etapa 1: Construcción (Build)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyecto y restaurar dependencias
COPY ["Kumamoto.API.csproj", "./"]
RUN dotnet restore "./Kumamoto.API.csproj"

# Copiar el resto del código y compilar en modo Release
COPY . .
RUN dotnet publish "Kumamoto.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Etapa 2: Producción (Runtime ligero)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Exponer el puerto de la API
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Kumamoto.API.dll"]
