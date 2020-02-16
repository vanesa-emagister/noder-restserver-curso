require('./config/config.js');
const express = require('express')
const app = express();
const hbs = require('hbs');
var fs = require("fs")
const path = require('path');
const shell = require('shelljs')
var jsdom = require("jsdom");
var bodyParser = require('body-parser')
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
// create application/json parser
app.use(bodyParser.json());

// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));

var $ = jQuery = require('jquery')(window);
app.use(express.static(__dirname + '/public'));
hbs.registerPartials(__dirname + '/views/parciales/');
app.set('view engine', 'hbs');
hbs.registerHelper('getAnnio', () => {
    return new Date().getFullYear();
});
/*app.get('/', (req, res) => {
    res.render('home')
});*/

app.get('/usuario', (req, res) => {
    res.json('get usuario')
});

app.put('/usuario/:id', (req, res) => {
    let id = req.params.id;
    res.json({
        id
    })
});

app.post('/usuario', (req, res) => {
    let body = req.body;
    res.json({
        persona: body
    })
});

app.get('/bash', (req, res) => {
    let saludo = req.param("saludo");
    let h1 = "<h1>" + saludo + "Ok</h1>";
    let result = shell.exec("/Users/vanesa/Documents/node/harlemjazzclub/runParseo.sh");

    res.status(200);
    res.setHeader('Content-type', 'text/html');
    return res.send(h1 + result);

});

app.listen(process.env.PORT, () => {
    console.log("Escuhando peticiones en el puerto" + process.env.PORT)

});
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

hbs.registerHelper('bash', function(context) {
    var parseo = $(this).attr("dataEjecutar");
    console.log(parseo);
    shell.exec(parseo);
});

hbs.registerHelper('getTabla', function() {
    var data = [{
            "SALA": "Harlem Jazz Club",
            "SCRIPT": "/Users/vanesa/Documents/node/RunScriptParser/harlemjazzclub/app.js",
            "LOG": "/Users/vanesa/Documents/node/harlemjazzclub/log.log",
            "CSV": "/Users/vanesa/Documents/node/harlemjazzclub/harlem.csv"

        },
        {
            "SALA": "Paris Jazz Club ",
            "SCRIPT": "/Users/vanesa/Documents/node/RunScriptParser/parisjazzclub/app.js",
            "LOG": "/Users/vanesa/Documents/node/parisjazzclub/log.log",
            "CSV": "/Users/vanesa/Documents/node/parisjazzclub/parisjazzclub.csv"

        }

    ];

    html = '<thead><tr>';
    var flag = 0;
    $.each(data[0], function(index, value) {
        html = html + '<th class="headers">' + index + '</th>';
    });
    html = html + '</tr></thead>';
    html = html + '<tr>';
    var contador = 0;
    $.each(data, function(index2, value2) {
        $.each(value2, function(index3, value3) {
            let str = checkIndexAndValue(index3, value3, contador);
            html = html + '<td class="body">' + str + '</td>';
            contador++;
        });
        html = html + '<tr>';
    });
    return html;
});

function checkIndexAndValue(index, value, contador) {
    if (index == "SCRIPT") {
        if (fs.existsSync(value)) {
            return '<a href="#" id="ejecutarScript_' + contador + '" dataEjecutar="' + value + '">Ejecutar Script</a>';
        } else {
            return "No existe Script";
        }
    } else if (index == "LOG") {
        if (fs.existsSync(value)) {
            return "Existe Log";
        } else {
            return "No existe Log";
        }
    } else if (index == "CSV") {
        if (fs.existsSync(value)) {
            return "Existe Csv";
        } else {
            return "No existe Csv";
        }
    } else if (index == "SALA") {

        return value;

    }

}