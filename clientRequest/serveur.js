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
var keyFileStorage = require("key-file-storage");

/**
 * ATTENTION A BIEN SEPCIFIER LE BON CHEMIN
 */
var kfs = keyFileStorage("/Users/sylvinho/Documents/M2/EAppJDM/Cache", true);

var months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"]
var nbMaxFiles = 3;

/**
 * voir https://www.npmjs.com/package/key-file-storage
 */


if (!kfs['compteur']) {
    console.log("Création du compteur")
    kfs['compteur'] = 0;
}

function emitRequest(givenUri, callback) {
    request({ uri: givenUri/*"http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=alligator&rel="*/, encoding: null }, function (error, response, html) {


        if (!error) {
            var PAGE_ENCODING = "ISO-8859-1";
            var body = iconv.decode(html, PAGE_ENCODING);
            var $ = cheerio.load(body, { decodeEntities: false });
            let CODE = $('def');
            //console.log("$", $.html())
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

    //les mois vont de 0 à 11
    let d = new Date();

    /*console.log([months[d.getMonth()]] + "/")
    if (d.getMonth() == 0) {
        let precedentMonth = kfs[months[11] + "/"];
        if (precedentMonth.length > 0) {
            console.log("mois précédent ! janvier")
            console.log("dossier trouvé")
            new kfs(months[11] + "/");
            //si on supprime le dossier du mois d'avant, c'est que c'est la 1ere recherche du nouveau mois,
            //on réinitialise donc le compteur 

            kfs['compteur'] = 0;


        }
    }
    else {
        console.log("mois précédent ! autre")

        let precedentMonth = kfs[months[d.getMonth() - 1] + "/"];
        if (precedentMonth.length > 0) {
            console.log("dossier trouvé")
            new kfs(months[d.getMonth() - 1] + "/")
            kfs['compteur'] = 0;

        }
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

    //on vérifie si le fichier a deja été enregistré
    if (/*months[d.getMonth()] + "/" + */finalValue in kfs) {
        console.log("Mot déjà demandé, je le récupère dans les fichiers !")
        // console.log("deja present, je retourne la valeur dans le fichier ", kfs[finalValue]);
        res.end(kfs[/*months[d.getMonth()] + "/" + */finalValue]);
    }
    else {
        // res.setHeader("Content-type", "text/plain ; charset=ISO-8859-1");
        let uri = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + finalValue + "&rel=";
        console.log("valeur uri ", uri)


        emitRequest(uri, function (body) {
            //   console.log("VALEUR DE body " + body)

            res.end(body);

            //si le compteur est à 2000 (correspondant à 2000 recherches de mots différents), on vide le dossier de fichiers 
            if (parseInt(kfs['compteur']) == nbMaxFiles) {
                console.log("nombre max de fichiers atteint !")
                console.log("ok")
                //console.log("dossier "+kfs[months[d.getMonth()] + "/"]);
                new kfs("./*", function () {
                    console.log("ok")
                    kfs['compteur'] = 1;
                    console.log("ok")

                    kfs[finalValue] = body;
                    console.log("ok")

                });


            }
            //sinon on l'incrémente
            else {
                kfs['compteur'] = parseInt(kfs['compteur']) + 1;
                kfs[finalValue] = body;

            }


            //afficher le contenu d'un dossier 
            /*kfs('./', function (error, keys) {
                keys.forEach(element => {
                    console.log("element", element)
                })
                // keys = ['col/path/key1', 'col/path/sub/key2', ... ] 
            });*/
        });
    }

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
        //console.log("value", value)
        //var cursor = database.collection("words").find().sort({"coeff":-1}).limit(5);
        var cursor = database.collection("words").find({ word: { $regex: "^" + value, $options: "i" } }).sort({ "coeff": -1 }).limit(5);
        var resultat = [];
        cursor.each(function (err, doc) {
            assert.equal(null, err);
            if (doc != null) {

                resultat.push(doc);
            }
            else {
                var json = JSON.stringify(resultat);
                //console.log("res :");
                //console.log(""+resultat);
                //console.log("fin res");

                res.setHeader('Acces-Control-Allow-Origin', '*');
                res.setHeader("Content-type", "application/json ; charset=UTF-8");
                //console.log(json);
                res.end(json);
            }
        });
    });
});
//emitRequest();



