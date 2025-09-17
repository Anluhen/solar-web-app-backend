This is a [NestJS](https://nestjs.com/) project bootstrapped with [Developers Portal](https://developers-portal.weg.net/).

## Getting Started

First, to run in development you may need to create a `.env` file inside the `config` folder.

This `config/.env` file should contain the given variables:

|Name|Description|Example|
|-|-|-|
|SWAGGER_SERVERS_LIST|List of servers divided by `,` that are passed to the [servers](https://swagger.io/docs/specification/api-host-and-base-path/) property of OpenAPI|`/,/api`|
|POSTGRESQL_HOST|The PostgreSQL host that will be called|`qas-postgresql-ap.weg.net`|
|POSTGRESQL_PORT|Number of port PostgreSQL|3000|
|POSTGRESQL_USERNAME| Username to access database|
|POSTGRESQL_PASSWORD| Password to access database|
|POSTGRESQL_NAME| Database name|
run the development server:

```bash
npm run start:dev
```

The API will be available at [http://localhost:3000/api](http://localhost:3000/api) or [http://localhost:3001](http://localhost:3001).

## Learn More

To leare more about Nest.js, take a look at the following resources:

- [NestJS Documentation](https://docs.nestjs.com/) - learn about NestJS features and API.