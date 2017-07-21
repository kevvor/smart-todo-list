"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

//amazon keys
const secrets = require('./secrets')
const amazon = require('amazon-product-api');
const client = amazon.createClient({
  awsId: secrets.awsId,
  awsSecret: secrets.awsSecret,
  awsTag: secrets.awsTag
});

var Yelp = require('yelp-v3');
var yelp = new Yelp({
  access_token: secrets.access_token
});



// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));

app.use(express.static("public"));

app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));



// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/amazonSearch", (req,res)=>{
  console.log(req.query.userinput)
  client.itemSearch({
    Keywords: req.query.userinput,
    responseGroup: 'ItemAttributes,Offers,Images'
  }).then(function(results){
    res.json(results);
    console.log(results[0].LargeImage[0].URL[0]);
  }).catch(function(err){
    console.log(err.Error[0].Message);
  });
})

app.get("/yelpSearch",(req,res)=>{
  console.log(req.query.userinput)
  yelp.search({ term: req.query.userinput, location: 'Montreal' })
  .then(function (result) {
    res.json(result)
    console.log(result.businesses[0]);
  })
  .catch(function (err) {
    console.error(err);
  });
})





app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
