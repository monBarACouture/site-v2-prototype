/*global File:false*/
/// common/async.js
/// ---------------
/// - author: Neal.Rame. <contact@nealrame.com>
/// -   date: Wed Mar 12 03:58:30 2015
define(function(require) {
    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');
    var functional = require('common/functional');
    var Promise = require('promise');

    /// #### async.loadFileAsDataURL(file)
    /// Load the file as data URL.
    ///
    /// __Parameters:__
    /// - `file`, a `File` instance.
    ///
    /// __Return:__
    /// - `Promise` of a `String`.
    function load_file_as_data_url(file) {
        return (new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = resolve;
            reader.onerror = reject;
            reader.readAsDataURL(file);
        })).then(function(ev) {
            return ev.target.result;
        });
    }

    /// #### async.loadImage(source)
    /// Load the file as data URL.
    ///
    /// __Parameters:__
    /// - `source`, a `String` URI or a `File` instance.
    ///
    /// __Return:__
    /// - `Promise` of a DOM element for an image.
    function load_image(source) {
        if (source instanceof File) {
            return load_file_as_data_url(source).then(load_image);
        } else {
            return (new Promise(function(resolve, reject) {
                var image = new Image();
                $(image)
                    .one('load', resolve)
                    .one('error', reject)
                    .attr('src', source);
            })).then(function(ev) {
                return ev.target;
            });
        }
    }

    function synchronise_model(model) {
        var jq_xhr = model.save();
        if (jq_xhr) {
            return new Promise(function(resolve, reject) {
                jq_xhr
                    .done(function(data) {
                        resolve(data);
                    })
                    .fail(function(req, text, err) {
                        reject(err);
                    });
            });
        }
        return Promise.reject(model.validationError);
    }

    function destroy_model(model) {
        if (functional.existy(model.collection)) {
            if (functional.existy(model.collection.url)) {
                var jq_xhr = model.destroy();
                if (jq_xhr) {
                    return new Promise(function(resolve, reject) {
                        jq_xhr
                            .done(function(data) {
                                resolve(data);
                            })
                            .fail(function(req, text, err) {
                                reject(err);
                            });
                    });
                }
            } else {
                model.collection.remove(model);
            }
        }
        return Promise.resolve(model.attributes);
    }

    function fetch_collection(collection, options) {
        return new Promise(function(resolve, reject) {
            collection.fetch(_.assign(options, {
                success: resolve,
                error: function(collection, res) {
                    reject(res);
                }
            }));
        });
    }

    return {
        loadFileAsDataURL: load_file_as_data_url,
        loadImage: load_image,
        synchroniseModel: synchronise_model,
        destroyModel: destroy_model,
        fetchCollection: fetch_collection
    };
});
