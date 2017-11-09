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
            let CODE = $('def');
            console.log(CODE.html())
            //on peut aussi remplacer CODE par $('def') ci-dessous
            /*CODE.each(function()
            {
               // console.log("size",$(this).find('br').length);
               let rbr= $(this).find('br').remove();
                console.log(rbr.html())
            })*/

            /*console.log(CODE.html())
            let CODE2= CODE.remove('br').html();
            console.log(CODE2);*/
            
            return callback($.html());
        }

    });


}

app.get("/:value", function (req, res) {
    var value = req.params.value;
    //console.log("valeur de value " + value);


    res.setHeader('Acces-Control-Allow-Origin', '*');
    // res.setHeader("Content-type", "text/plain ; charset=ISO-8859-1");
    let uri = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + value + "&rel=";

    emitRequest(uri, function (body) {
     //   console.log("VALEUR DE body " + body)
        res.end(body);
    });


});



emitRequest();

