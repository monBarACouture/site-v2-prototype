// front.js
// ========
// - author: Neal.Rame. <contact@nealrame.com>
// -  date:  Fri Apr  3 01:05:57 2015

var _ = require('underscore');
var debug = require('debug')('mbac:routes:achievements');
var express = require('express');
var path = require('path');

var Achievement = require(path.join(__dirname, 'models', 'achievement'));
var router = express.Router();

var list_template = path.join(__dirname, 'views', 'achievements.jade');

router
    // GET achievements page.
    .get('/', function(req, res, next) {
        Achievement.published()
            .then(function(achievements) {
                res.render(list_template, {achievements: achievements});
            })
            .then(null, function(err) {
                next(err);
            });
    });

module.exports = router;
