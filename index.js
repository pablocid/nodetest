const { Server } = require('./server');
const http = require('http');

const config = {
    MONGOURI: process.env.MONGOURI,
    JWTSECRET: process.env.JWTSECRET,
    DBNAME: process.env.DBNAME,
    PORT: process.env.PORT
}

if (!config.MONGOURI || !config.JWTSECRET || !config.DBNAME || !config.PORT) {
    throw new Error('Missing enviromental variables');
}

const httpPort = config.PORT;
const app = Server.bootstrap(config).app;
const httpServer = http.createServer(app);

//listen on provided ports
httpServer.listen(httpPort);

//add error handler
httpServer.on("error", onError);

//start listening on port
httpServer.on("listening", onListening);


/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }

    var bind = typeof httpPort === "string" ?
        "Pipe " + httpPort :
        "Port " + httpPort;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    console.log(`Listening in localhost:${httpPort}`);
    var addr = httpServer.address();
    var bind = typeof addr === "string" ?
        "pipe " + addr :
        "port " + addr.port;
    // debug("Listening on " + bind);
}