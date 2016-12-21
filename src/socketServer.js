"use strict";
const Rx = require("rx");

module.exports = (function () {
    const sockets = [];
    const ioObservable = new Rx.Subject();
    const ws = require("websocket.io");
    const http = require("http");
    const fs = require("fs");
    const url = require("url");
    const domain = require("domain");
    const socketDomain = domain.create();
    const httpDomain = domain.create();

    const httpListen = function (port) {
        httpDomain.on("error", function (err) {
            console.log("Error caught in http domain:" + err);
        });

        httpDomain.run(function () {
            function readFile(res, pathname) {
                fs.readFile(pathname, function (err, data) {
                    if (err) {
                        console.log(err.message);
                        res.writeHead(404, {"content-type": "text/html"});
                        res.write("File not found: " + pathname);
                        res.end();
                    } else {
                        res.write(data);
                        res.end();
                    }
                });
            }
            http.createServer(function (req, res) {
                var pathname = url.parse(req.url).pathname;
                console.log(pathname);
                if (pathname === "/" || pathname === "/index.html") {
                    readFile(res, "src/static/index.html");
                } else {
                    readFile(res, "src/static/" + pathname);
                }
            }).listen(port);
        });
    };

    const socketListen = function (port) {
        socketDomain.on("error", function (err) {
            console.log("Error caught in socket domain:" + err);
        });

        socketDomain.run(function () {
            const socketServer = ws.listen(port);

            socketServer.on("listening", function () {
                console.log("SocketServer is running");
            });

            socketServer.on("connection", function (socket) {
                console.log("Connected to client");
                var connection = {
                    in: new Rx.Subject(),
                    out: new Rx.Subject()
                };
                connection.out.subscribeOnNext((msg) => socket.send(msg));
                sockets.push(socket);
                ioObservable.onNext(connection);

                socket.on("message", function (data) {
                    connection.in.onNext(data);
                });

                socket.on("close", function () {
                    try {
                        connection.in.onCompleted();
                        socket.close();
                        socket.destroy();
                        console.log("Socket closed!");
                        for (var i = 0; i < sockets.length; i++) {
                            if (sockets[i] == socket) {
                                sockets.splice(i, 1);
                                console.log("Removing socket from collection. Collection length: " + sockets.length);
                                break;
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });

            });
        });
    };
    const init = function (httpPort, socketPort) {
        httpListen(httpPort);
        socketListen(socketPort);
    };

    return {
        init: init,
        ioObservable: ioObservable
    };

}());
