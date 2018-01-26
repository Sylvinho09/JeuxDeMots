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
 * ATTENTION A BIEN SPECIFIER LE BON CHEMIN
 */
//var kfs = keyFileStorage("/Users/sylvinho/Documents/M2/EAppJDM/Cache", true);
var kfs = keyFileStorage(__dirname.toString() + "Cache", true);

var months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"]
var nbMaxFiles = 2000;

/**
 * voir https://www.npmjs.com/package/key-file-storage
 */


if (!kfs['compteur']) {

    console.log("Création du compteur");
    kfs['compteur'] = 0;
}

function emitRequest(givenUri, callback) {
    request({ uri: givenUri/*"http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=alligator&rel="*/, encoding: null }, function (error, response, html) {


        if (!error) {
            var PAGE_ENCODING = "ISO-8859-1";
            var body = iconv.decode(html, PAGE_ENCODING);
            var $ = cheerio.load(body, { decodeEntities: false });
            let CODE = $('def');

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

    app.get("/Rel/:val", function (req, res) {
        let value = req.params.val;
        //var cursor = database.collection("words").find().sort({"coeff":-1}).limit(5);
        var cursor = database.collection("relation").find({ rel_name: { $regex: "^" + value, $options: "i" } }).sort({ "rel_id": 1 }).limit(5);
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
                res.end(json);
            }
        });
    });


    app.get("/id/:value/Rel/:rel", function (req, res) {

        let value = req.params.value;
        let relationName = req.params.rel;
        let relationNames = relationName.split(",");
        console.log(relationNames);

        //les mois vont de 0 à 11
        let d = new Date();

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


        if (relationNames.length == 1) {
            let uri = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + finalValue + "&rel=" + relationNames[0];
            console.log("valeur uri ", uri);
            emitRequest(uri, function (body) {
                res.end(body);
            });
        } else {
            let resbody = "";
            let i = 0;
            relationNames.forEach(element => {
                let uri = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + finalValue + "&rel=" + element;
                console.log("valeur uri ", uri)
                emitRequest(uri, function (body) {
                    console.log("VALEUR DE body "/* + body*/)
                    if (i == 0) {
                        resbody += body;
                    } else {
                        resbody = properResponse(resbody, body);
                    }
                    if (i == relationNames.length - 1) {
                        console.log("RETOUR",resbody);
                        res.end(resbody);
                    }
                    i++;
                });

            })
        }
    });



});

function properResponse(resbody, body) {
    let resultat = "";


    let def = resbody.split("</def>");
    if (def.length > 1) {
        resultat += def[0] + "</def>";
        let allRelations = def[1];
        let firstPart = allRelations.split("// les types de relations (Relation Types) : rt;rtid;'trname';'trgpname';'rthelp'");
      
        let relationsTypes = "";
        let entranteSortante;
        let entrante;
        if (firstPart) {
            if (firstPart[0]) {
                resultat+=firstPart[0];
            } if (firstPart[1]) {
                relationsTypes = firstPart[1].split("// les relations sortantes : r;rid;node1;node2;type;w");
                entranteSortante=relationsTypes[1].split("// les relations entrantes : r;rid;node1;node2;type;w");
                entrante=entranteSortante[1].split("// END");
             //   console.log("relationsTypes", relationsTypes)
            }
        }

        let def2 = body.split("</def>");
        if (def2.length > 1) {
            let allRelations2 = def2[1];
            let firstPart2 = allRelations2.split("// les types de relations (Relation Types) : rt;rtid;'trname';'trgpname';'rthelp'");
            let entities = "";
            let relationsTypes2 = "";
            let entranteSortante2 = "";
            let entrante2;
            if (firstPart2) {
                if (firstPart2[0]) {
                    entities = firstPart2[0].split("// les noeuds/termes (Entries) : e;eid;'name';type;w;'formated name'");
                    if (entities[1]) {
                        resultat+= entities[1];
                      }
                 //   console.log("entities", entities)
                }
                

                if (firstPart2[1]) {
                    relationsTypes2 = firstPart2[1].split("// les relations sortantes : r;rid;node1;node2;type;w");
                    entranteSortante2=relationsTypes2[1].split("// les relations entrantes : r;rid;node1;node2;type;w");
                    entrante2=entranteSortante2[1].split("// END");
                   // console.log("relationsTypes", relationsTypes2);
                }
                
            }
            resultat+="// les types de relations (Relation Types) : rt;rtid;'trname';'trgpname';'rthelp'"+relationsTypes[0];
            resultat+=relationsTypes2[0]+"// les relations sortantes : r;rid;node1;node2;type;w";
            resultat+=entranteSortante[0]+entranteSortante2[0]+"// les relations entrantes : r;rid;node1;node2;type;w"+entrante[0]+entrante2[0]+"// END"+entrante[1];
        }
    }


    // console.log("res",resultat);
    return resultat;
}