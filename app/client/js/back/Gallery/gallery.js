// models/achievement.js
// ---------------------
// - author: Neal.Rame. <contact@nealrame.com>
// -   date: Fri Jan  2 23:23:59 CET 2015
define(function(require) {
    var _ = require('underscore');
    var $ = require('jquery');
    var Backbone = require('backbone');
    var Thumbnail = require('back/Gallery/gallery.thumbnail');

    var galleryTemplate = require('text!back/Gallery/gallery.template.html');

    if (_.indexOf($.event.props, 'dataTransfer') < 0) {
        $.event.props.push('dataTransfer');
    }


    var Achievement = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {
            published: false,
            pictures: [],
            tags: [],
        },
        publish: function() {
            this.save({published: true});
        },
        unpublish: function() {
            this.save({published: false});
        },
        addPicture: function(picture) {
            var list = this.get('pictures').slice(0);
            if (! _.contains(list, picture)) {
                var index = list.length;
                // if (picture instanceof File) {
                //     picture = {file: picture};
                // }
                list.push(picture);
                this.set({pictures: list});
                this.trigger('new-picture', picture, index);
                return list[index];
            }
        },
        removePictureAtIndex: function(index) {
            var list = this.get('pictures').slice(0);
            if (index < list.length) {
                var picture = (list.splice(index, 1))[0];
                this.set({pictures: list});
                return true;
            }
            return false;
        },
        validate: function(attributes, options) {
            var isValidPicture = function(picture) {
                return picture.file instanceof File
                || (picture.original && picture.thumbnail);
            };

            if (! attributes.name instanceof String) {
                return new Error('name must be a String');
            }
            if (! attributes.description instanceof String) {
                return new Error('description mus be a String');
            }
            if (! (attributes.pictures instanceof Array
                    && _.every(attributes.pictures, isValidPicture))) {
                return new Error('pictures must be a non empty Array of valid pictures');
            }
            if (! (attributes.tags instanceof Array
                    && _.every(attributes.tags, _.isString))) {
                return new Error('tags must be an Array of String');
            }
        },
        sync: function(method, model, options) {
            switch (method.toLowerCase()) {
            case 'create':
            case 'update':
            case 'patch':
                return (function() {
                    var data = model.attributes;
                    var form_data = new FormData;

                    _.chain(data)
                        .pick('name', 'description', 'published')
                        .each(function(value, attr) {
                            form_data.append(
                                attr,
                                attr === 'tags'
                                    ? escape(JSON.stringify(value))
                                    : value
                            )
                        });
                    _.each(data.pictures, function(picture) {
                        form_data.append(
                            'pictures',
                            picture.file instanceof File
                                ? picture.file
                                : JSON.stringify(picture)
                        );
                    });

                    var params = _.extend(
                        {
                            data: form_data,
                            contentType: false,
                            processData: false,
                            type: method === 'create' ? 'POST':'PUT',
                            url: options.url || model.url(),
                        },
                        options
                    );

                    var xhr = Backbone.ajax(params);

                    model.trigger('request', model, xhr, options);

                    return xhr;
                })();
                break;

            default:
                return Backbone.sync.call(this, method, model, options);
            }
        }
    });


    var AchievementPictureList = Marionette.CollectionView.extend({
        childView: Thumbnail.view,
        events: {
            'dragenter': 'onDragEnter',
            'dragleave': 'onDragLeave',
            'dragover':  'onDragOver',
            'drop':      'onDrop'
        },
        addChild: function(child, ChildView, index) {
            var thumbnail = new ChildView({
                tagName: 'li',
                model: child
            }, {editable: false});
            this.$el.append(thumbnail.render().el);
            this.listenTo(thumbnail, 'remove', function() {
                console.log('-- AchievementPictureList: remove');
                this.stopListening(thumbnail);
                child.destroy();
                thumbnail.remove();
                this.trigger('remove-picture', index);
            });
        },
        addFile: function(file) {
            if (file instanceof File) {
                var picture = {file: file};
                var index = this.collection.length;
                this.collection.add(picture);
                this.trigger('add-picture', picture, index);
            }
        },
        addFiles: function(files) {
            _.each(files, this.addFile, this);
        },
        onDragEnter: function(e) {
            console.log('-- AchievementCreator:onDragEnter');
            e.preventDefault();
            e.stopPropagation();
            this.$el.attr('data-state', 'over');
            return false;
        },
        onDragLeave: function(e) {
            console.log('-- AchievementCreator:onDragLeave');
            e.preventDefault();
            e.stopPropagation();
            this.$el.removeAttr('data-state');
            return false;
        },
        onDragOver: function(e) {
            console.log('-- AchievementCreator:onDragOver');
            e.dataTransfer.dropEffect = 'copy';
            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        onDrop: function(e) {
            console.log('-- AchievementCreator:onDrop');
            this.onDragLeave.call(this, e);
            this.addFiles(e.dataTransfer.files);
            return false;
        },
        onBeforeRender: function() {
            console.log('-- AchievementCreator:onBeforeRender', this.collection.toJSON());
            this.$el.empty();
        }
    });


    var AchievementCreator = Marionette.ItemView.extend({
        ui: {
            nameField: '#name',
            descField: '#desc',
            addButton: '#add-pictures > input',
            sbtButton: '#submit'
        },
        events: {
            'blur   @ui.nameField': 'onNameChanged',
            'blur   @ui.descField': 'onDescriptionChanged',
            'click  @ui.sbtButton': 'onOkClicked',
            'change @ui.addButton': 'onAddPictures'
        },
        template: false,
        initialize: function() {
            this.achievementPictureList = new AchievementPictureList({
                el: this.$('#pictures'),
                collection: new Backbone.Collection(
                    [], {model: Thumbnail.model}
                )
            });
            this.listenTo(
                this.achievementPictureList,
                'add-picture',
                function(picture, index) {
                    console.log('add-picture: ', picture, index);
                    this.model.addPicture(picture);
                }
            );
            this.listenTo(
                this.achievementPictureList,
                'remove-picture',
                function(index) {
                    console.log('remove-picture: ', index);
                    this.model.removePictureAtIndex(index);
                }
            );
            this.render();
            this.reset();
        },
        reset: function(render) {
            return this.setModel(null);
        },
        setModel: function(model) {
            if (this.model) {
                this.stopListening(this.model);
            }
            this.model = model || new Achievement;
            this.listenTo(this.model, 'destroy', this.reset);
            this.ui.nameField.val(this.model.get('name'));
            this.ui.descField.val(this.model.get('description'));
            this.achievementPictureList.collection.reset(this.model.get('pictures'));

            console.log(this.model.toJSON());

            return this;
        },
        onNameChanged: function() {
            console.log('-- AchievementCreator:onNameChanged');
            this.model.set('name', this.ui.nameField.val().trim());
            return false;
        },
        onDescriptionChanged: function() {
            console.log('-- AchievementCreator:onDescriptionChanged');
            this.model.set('description', this.ui.descField.val());
            return false;
        },
        onAddPictures: function(e) {
            console.log('-- AchievementCreator:onAddPictures');
            e.preventDefault();
            e.stopPropagation();
            this.achievementPictureList.addFiles(e.target.files);
            return false;
        },
        onOkClicked: function(e) {
            console.log('-- AchievementCreator:onOkClicked');
            e.preventDefault();
            e.stopPropagation();
            if (this.model.isNew()) {
                this.collection.add(this.model);
            }
            return false;
        },
        onRender: function() {
            this.achievementPictureList.render();
            // this.ui.nameField.val(this.model.get('name'));
            // this.ui.descField.val(this.model.get('description'));
            return this;
        }
    });


    var AchievementList = Marionette.CollectionView.extend({
        childView: Thumbnail.view,
        initialize: function() {
            this.render();
        },
        addChild: function(child, ChildView, index) {
            var picture = function() {
                var pictures = child.get('pictures');
                return pictures.length > 0
                        ? new Thumbnail.model(pictures[0])
                        : null;
            };
            var thumbnail = new ChildView({
                tagName: 'li',
                model: picture()
            });
            this.$el.append(thumbnail.render().el);
            this.listenTo(child, 'change', function() {
                console.log('-- AchievementView: change');
                thumbnail.setPicture(picture());
            });
            this.listenTo(thumbnail, 'remove', function() {
                console.log('-- AchievementView: remove');
                this.stopListening(thumbnail);
                child.destroy();
                thumbnail.remove();
            });
            this.listenTo(thumbnail, 'edit', function() {
                console.log('-- AchievementView: edit');
                this.trigger('edit', child);
            });
        },
    });


    var achievements = new Backbone.Collection(
        [
            new Achievement({
                name: 'Kittens',
                description: 'Some cats, that\'s all',
                pictures: [
                    {
                        original: 'http://placekitten.com/g/800/600',
                        thumbnail: 'http://placekitten.com/g/128/128',
                    }
                ]
            })
        ],
        {
            model: Achievement,
            // url: '/api/achievements'
        }
    );


    var Gallery = Marionette.ItemView.extend({
        template: _.template(galleryTemplate),
        initialize: function() {
            this.configure({});
        },
        configure: function(config) {
            this.config = _.extend(this.config || {}, config);
            return this;
        },
        onBeforeRender: function() {
        },
        onRender: function() {
            this.achievementCreator = new AchievementCreator({
                el: this.$('#achievement-creator'),
                collection: achievements,
            });
            this.achievementList = new AchievementList({
                el: this.$('#achievement-list'),
                collection: achievements,
            });
            this.listenTo(this.achievementList, 'edit', function(model) {
                this.achievementCreator.setModel(model);
            });
        }
    });

    return Gallery;
});
