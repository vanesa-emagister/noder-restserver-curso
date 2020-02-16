const fs = require('fs');
const path = require('path');
const os = require('os');
const csvjson = require('csvjson');
const readFile = require('fs').readFile;
const writeFile = require('fs').writeFile;
const express = require('express')
const app = express();
const { convertArrayToCSV } = require('convert-array-to-csv');
let csvToJson = require('convert-csv-to-json');
var jsonexport = require('jsonexport');
const stringify = require('csv-stringify');
const { Builder, By, Key, until } = require('selenium-webdriver');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
var gErrors = [];

const winston = require('winston');
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        winston.format.printf(log => `[${log.level}] [${log.timestamp}] ${log.message} `)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, 'public/log.log') }),
    ]
});



logger.error = err => {
    if (err instanceof Error) {
        logger.log({ level: 'error', message: `${err.stack || err}` });
    } else {
        logger.log({ level: 'error', message: err });
    }
};

const loopUrlsConcert = async function() {
    try {
        concerts = [];
        results = [];
        var url = "https://www.parisjazzclub.net/en/19/club/caveau-de-la-huchette";
        logger.info("*** Iniciando parseo " + url);
        let driver = await new Builder().forBrowser('chrome').build();
        elementos = await getConciertos(url, "//a[contains(@class, 'concert')]", driver);
        for (var e = 0; e < elementos.length; e++) {
            concerts.push(elementos[e]);
        }
        for (var e = 0; e < concerts.length; e++) {
            let elemento = await getConcert(concerts[e]['URL'], driver);
            results.push(elemento);
        };

        if (results.length > 0) {
            addConcertCsv(results);
        }

        driver.close();
        logger.info("Finalizado");
    } catch (e) {
        logger.info("Error en el método principal");
        logger.error(e);
        addGlobalError("Error en metodo principal: " + e);
    }

    finished();
}

const getConcert = async function(url, driver) {
    let concert = [];
    var UrlLink = await url;
    await driver.get(url);
    await driver.sleep(3000);
    if (typeof(url) !== "undefined") {
        try {
            logger.info("entrando a " + url);
            concert['VENUE'] = await getVenue(driver);
            logger.info(concert['VENUE']);
            concert['IMAGE_URL'] = await getImage(driver);
            logger.info(concert['IMAGE_URL']);
            concert['DATE'] = await getDate(driver);
            logger.info(concert['DATE']);
            concert['TIME'] = await getTime(driver);
            logger.info(concert['TIME']);
            concert['DESC'] = await getDesc(driver);
            logger.info(concert['DESC']);
            concert['TICKET_URL'] = UrlLink;
            logger.info(concert['TICKET_URL']);
            return concert;
        } catch (e) {
            logger.info("No podemos entrar");
            logger.error(e);
            addGlobalError("Error en getConcert con url " + url + " : " + e);
        }
    }
}

const getMeses = async function(str) {

    var fecha = await str.trim();
    logger.info("este es el mes a buscar " + fecha);
    const meses = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December"
    };
    let monthID;
    Object.keys(meses).forEach(function(key) {
        if (meses[key] === fecha) {
            let monthId = key;
            if (typeof monthId !== "undefined") {
                monthID = monthId;
            }
        }
    });

    return monthID;
}

const changeDate = async function(str) {
    try {
        var fecha = await str;
        const regex = /([a-zA-z]+)\s([a-zA-z]+),\s(\d+)/;
        let m;
        let day;
        let month;
        if ((m = regex.exec(fecha)) !== null) {
            day = m[3];
            try {
                month = await getMeses(m[2]);
                if (typeof month !== "undefined") {
                    return day + "-" + month + "-" + new Date().getFullYear();
                }
            } catch (e) {
                logger.error("No podemos entrar");
                addGlobalError("Error en changeDate: " + e);
                return "";
            }
        }
    } catch (e) {
        logger.error(e);
        addGlobalError("Error en changeDate: " + e);
    }
}

const geturl = async function(url) {
    if (typeof url !== "undefined") {
        return await url.getAttribute("href");
    }
    return "vacio";
}

const getDate = async function(driver) {
    let date = await driver.findElement(By.xpath('//h5[contains(@itemprop, "startDate")]'));
    if (typeof date !== "undefined") {
        var fecha = date.getAttribute("innerText");
        return await changeDate(fecha);
    }
    return "vacio";
}

const getDesc = async function(driver) {
    let descripcion = await driver.findElement(By.xpath('//div[contains(@itemprop, "description")]'));
    if (typeof descripcion !== "undefined") {
        return await descripcion.getAttribute("innerText");
    }
    return "";
}

const getTime = async function(driver) {
    let time = await driver.findElement(By.xpath('//h5[contains(text(),":")]'));
    if (typeof time !== "undefined") {
        let time2 = await changeDate(time.getAttribute("innerText"));
        if (strpos(time2, "PM", 0)) {
            return "21PM";
        }
    }
    return "vacio";
}

const strpos = async function(haystack, needle, offset) {
    var i = (haystack + '')
        .indexOf(needle, (offset || 0))
    return i === -1 ? false : i
}

const getVenue = async function(driver) {
    let venue = await driver.findElement(By.xpath('//h1[contains(@class, "text-light")]'));
    if (typeof venue !== "undefined") {
        return await venue.getAttribute("innerText");
    }
    return "";
}

const getImage = async function(driver) {
    let image = await driver.findElement(By.xpath('//div[contains(@class, "event-img")]/img'));
    if (typeof image !== "undefined") {
        return await image.getAttribute("src");
    }
    return "vacio";
}

const addConcertCsv = function(elementos) {
    const filename = path.join(__dirname, 'concerts.csv');
    const output = [];
    logger.info(elementos.length + "+++++++");
    for (var indice in elementos) {
        const row = [];
        datos = elementos[indice];
        if (typeof datos["TICKET_URL"] !== "undefined") {
            row.push(formatedFieldCsv(datos["TICKET_URL"]));
        }
        if (typeof datos["IMAGE_URL"] !== "undefined") {
            row.push(formatedFieldCsv(datos["IMAGE_URL"]));
        }
        if (typeof datos["DATE"] !== "undefined") {
            row.push(formatedFieldCsv(datos["DATE"]));
        }
        if (typeof datos["TIME"] !== "undefined") {
            row.push(formatedFieldCsv(datos["TIME"]));
        }
        if (typeof datos["DESC"] !== "undefined") {
            row.push(formatedFieldCsv(datos["DESC"]));
        }
        if (typeof datos["VENUE"] !== "undefined") {
            row.push(formatedFieldCsv(datos["VENUE"]));
        }
        output.push(row.join(";"));

    };
    var headers = ['TICKET_URL; IMAGE_URL; DATE; TIME; DESC; VENUE'];
    output.unshift(headers);
    fs.writeFileSync(filename, output.join(os.EOL));
}

const formatedFieldCsv = function(field) {
    return '"' + field.replace('"', '\'') + '"';
}

const getConciertos = async function(url, xpath, driver) {
    var urls = [];
    await driver.get(url);
    await driver.sleep(3000);
    let elementos = await driver.findElements(By.xpath(xpath));
    logger.info("tenemos tantos elementos " + elementos.length);
    if (typeof(elementos) !== "undefined") {
        logger.info("Entrando +++++++");
        for (var e = 0; e < elementos.length; e++) {
            let concert = [];
            concert['URL'] = await geturl(elementos[e]);
            logger.info(concert['URL']);
            urls.push(concert);
        }
        return urls;
    }
    logger.info("No hay elementos");
}

// Añade un error a la lista de errores que mostraremos al final
const addGlobalError = function(e) {
    gErrors.push(e);
}

// Mira si ha finalizado con errores
const finished = function() {
    if (gErrors.length > 0) {
        logger.info("Finalizado con " + gErrors.length + " errores:");
        logger.warn(gErrors);
    }
}

loopUrlsConcert();