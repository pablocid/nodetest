const express = require('express');
const logger = require('morgan');
const CORS = require('cors');
const errorHandler = require('errorhandler');
const { json, urlencoded } = require('body-parser');
const methodOverride = require('method-override');
const { DataRoute } = require('./data');
const { MongoClient } = require("mongodb");

class Server {
    static bootstrap(config) {
        return new Server(config);
    }

    constructor(config) {
        this.client = new MongoClient(config.MONGOURI, { useUnifiedTopology: true });
        this.secret = config.JWTSECRET;
        this.dbname = config.DBNAME;
        this.app = express();
        this.config();
        this.setupApi();
    }

    async setupApi() {
        try {
            await this.client.connect();
            const database = this.client.db(this.dbname);
            this.api(database);

        } catch (error) {
            console.log(error);
        }
    }

    config() {

        //use logger middlware
        this.app.use(logger("dev"));

        //use json form parser middlware
        this.app.use(json());

        //use query string parser middlware
        this.app.use(urlencoded({ extended: true }));

        //use override middlware
        this.app.use(methodOverride());

        //catch 404 and forward to error handler
        this.app.use(function (err, req, res, next) {
            err.status = 404;
            next(err);
        });

        //error handling
        this.app.use(errorHandler());

        //CORS
        this.app.use(CORS())

    }

    api(database) {
        this.app.use('/', DataRoute.route(database, this.secret));
    }
}

module.exports = { Server }