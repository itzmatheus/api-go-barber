# Go Barber - Rocketseat

## Rodando a aplicação

### Criando Container do Banco de Dados Postgres 11
` docker run --name gobarber-db  -e POSTGRES_PASSWORD=<Senha> -e POSTGRES_DB=goBarberDb -d -p 5433:5432 postgres:11`

### Criando Container para o Mongo DB
` docker run --name mongobarber -p 27017:27017 -d -t mongo`

