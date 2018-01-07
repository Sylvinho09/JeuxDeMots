var express = require("express");
var cors = require("cors");
var app = express();
app.listen(8888);
app.use(cors());
var request = require("request");
var iconv = require("iconv-lite");

var assert = require("assert");
var MongoClient = require("mongodb").MongoClient;
//var url = "mongodb://localhost:27017/JeuxDeMots";
var url = "mongodb://localhost:27017/";


var cheerio = require("cheerio");

function emitRequest(givenUri, callback) {
    request({ uri: givenUri/*"http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=alligator&rel="*/, encoding: null }, function (error, response, html) {

        if (!error) {
            var PAGE_ENCODING = "ISO-8859-1";
            var body = iconv.decode(html, PAGE_ENCODING);
            var $ = cheerio.load(body, { decodeEntities: false });
            let CODE = $('def');
            console.log("CODE", CODE.html())
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
    console.log("valeur value ", value)
    //console.log("valeur de value " + value);
    /*let values = value.split(" ");

    let finalValue = "";
    if (values.length > 1) {
        values.forEach(element => {
            finalValue += element + "+";
        });
    }
    else
    {
        finalValue=value;
    }*/
    let finalValue = "";
    let values = value.split(" ")
    if (values.length > 1) {
        finalValue = values[0];

        for (let i = 1; i < values.length; i++) {
            finalValue += "+" + values[i];
        }
    }
    else {
        finalValue = value;
    }





    res.setHeader('Acces-Control-Allow-Origin', '*');
    // res.setHeader("Content-type", "text/plain ; charset=ISO-8859-1");
    let uri = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + finalValue + "&rel=";
    console.log("valeur uri ", uri)

    emitRequest(uri, function (body) {
        //   console.log("VALEUR DE body " + body)
        res.end(body);
    });


});

MongoClient.connect(url, function (err, db) {

    //ne pas se référer au projet vente en ligne pour la ligne ci dessous
    /*
    In mongodb version >= 3.0, That database variable is actually the parent object 
    of the object you are trying to access with database.collection('whatever').
     To access the correct object, you need to reference your database name
    */
    let database = db.db("JeuxDeMots");
    assert.equal(null, err);
    app.get("/Word/:val", function (req, res) {
        let value = req.params.val;
        console.log("value", value)
        //var cursor = database.collection("words").find().sort({"coeff":-1}).limit(5);
    var cursor = database.collection("words").find({ word : { $regex: "^"+value,$options: "i"  }}).sort({"coeff":-1}).limit(5);
        var resultat=[];
        cursor.each(function(err,doc){
            assert.equal(null,err);
            if(doc != null) {
            
            resultat.push(doc);	
            }
            else {
            var json=JSON.stringify(resultat);
            console.log("res :");
            console.log(""+resultat);
            console.log("fin res");
            
            res.setHeader('Acces-Control-Allow-Origin','*');
            res.setHeader("Content-type","application/json ; charset=UTF-8");
            console.log(json);
            res.end(json); }  
        });	
    });
});
//emitRequest();



