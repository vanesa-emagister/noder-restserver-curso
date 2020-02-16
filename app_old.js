const http = require('http');
http.createServer((req, res) => {
        res.write("Empezamos");
        res.end();
    })
    .listen(3000);

console.log("Escuchando puerto 3000");