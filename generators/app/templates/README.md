[![Stories in Ready](https://badge.waffle.io/degnome/api-using-cassandra.png?label=ready&title=Ready)](https://waffle.io/degnome/api-using-cassandra)
# api-using-cassandra

Microservice Sample using Cassandra as a backing store.

### Requirements

- Docker for Mac: 1.13.1 (build: 092cba3)
- NODE: 6.9.5 or greater
- NPM: 4.2.0 or greater
- YARN: 0.19.1 or greater

Environment Options (.env)

| Environment Var         | Default      | Description                                    |
| ----------------------- | ------------ | ---------------------------------------------- |
|                         |              |                                                |


### Install

1. Install Packages
```
$ yarn install
```

2. Startup Local Cassandra DB for development purposes
```
$ npm run db
```

3. Test the API against Local Cassandra
```
$ npm run test
```

4. Start the API Locally
```
$ npm run start
```

5. Build Docker Image
```
$ npm run build
```

6. Start the API in Docker
```
$ npm run Docker
```