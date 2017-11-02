var express = require("express");
var cors = require("cors");
var app = express();
app.listen(8888);
app.use(cors());
var request = require("request");
var iconv = require("iconv-lite");



var cheerio = require("cheerio");

function emitRequest(givenUri, callback) {
    request({ uri: givenUri/*"http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=alligator&rel="*/, encoding: null }, function (error, response, html) {

        if (!error) {
            var PAGE_ENCODING = "ISO-8859-1";
            var body = iconv.decode(html, PAGE_ENCODING);
            var $ = cheerio.load(body, { decodeEntities: false });
            let CODE = $('def').html();
            
            return callback(CODE);
        }

    });
    //   let value0 = C('CODE').html();


}

app.get("/:value", function (req, res) {
    var value = req.params.value;
    console.log("valeur de value " + value);


    res.setHeader('Acces-Control-Allow-Origin', '*');
    // res.setHeader("Content-type", "text/plain ; charset=ISO-8859-1");
    let uri = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + value + "&rel=";

    emitRequest(uri, function (body) {
        console.log("VALEUR DE body " + body)
        res.end(body);
    });


});



emitRequest();

