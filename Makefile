.PHONY: up down build logs ps restart clean

COMPOSE := docker compose -f docker-compose.yml

## Inicia todos los servicios en background
up:
	$(COMPOSE) up -d

## Inicia todos los servicios (modo interactivo, ver logs)
up-live:
	$(COMPOSE) up

## Construye las imágenes
build:
	$(COMPOSE) build

## Construye sin cache
build-no-cache:
	$(COMPOSE) build --no-cache

## Inicia servicios (construye si hace falta)
up-build:
	$(COMPOSE) up -d --build

## Detiene y elimina contenedores
down:
	$(COMPOSE) down

## Muestra logs de todos los servicios
logs:
	$(COMPOSE) logs -f

## Muestra estado de los servicios
ps:
	$(COMPOSE) ps

## Reinicia todos los servicios
restart: down up

## Limpia contenedores, redes y volúmenes
clean:
	$(COMPOSE) down -v
