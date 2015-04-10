define(function(require) {
    var _ = require('underscore');
    var $ = require('jquery');
    var Backbone = require('backbone');

    var Achievement = require('pages/achievements/achievement');
    var AchievementEditorDialog = require('pages/achievements/editor');
    var AchievementList = require('pages/achievements/achievement-list');
    var AchievementMenu = require('pages/achievements/menu');

    var channel = Backbone.Wreqr.radio.channel('global');

    var AchievementApp = Marionette.LayoutView.extend({
        regions: {
            'list': '#achievements-list',
            'menu': '#achievements-menu'
        },
        template: false,
        onRender: function() {
            this.showChildView('list', new AchievementList({
                collection: this.collection,
                editable: true,
            }));
            this.showChildView('menu', new AchievementMenu({
                collection: this.collection
            }));
        }
    });

    var achievements = new (Backbone.Collection.extend({
        model: Achievement,
        url: '/api/achievements'
    }))();

    // achievements.on('add', function(achievement) {
    //     AchievementEditorDialog.open(achievement);
    // });
    // achievementsList.on('childview:edit', function(view, achievement) {
    //     AchievementEditorDialog.open(achievement);
    // });

    achievements.fetch({reset: true});

    (new AchievementApp({
        el: $('body').get(0),
        collection: achievements
    })).render();

    // var Gallery = Marionette.LayoutView.extend({
    //     template: _.template(template),
    //     regions: {
    //         achievementList: '#achievement-list'
    //     },
    //     ui: {
    //         addButton: '#add-achievement',
    //         filterButton: '#filter-achievement',
    //         filters: '#filters'
    //     },
    //     events: {
    //         'click @ui.addButton': 'onAddButtonClicked',
    //         'click @ui.filterButton': 'onFilterButtonClicked',
    //         'change #filters input': 'onFiltersChanged'
    //     },
    //     filterTemplate: _.template(
    //         '<input id="<%= tag %>" type="checkbox">'
    //         + '<label for="<%= tag %>"><%= tag %></label>'
    //     ),
    //     initialize: function() {
    //         console.log('-- Gallery:initialize');
    //         this.collection = new (Backbone.Collection.extend({
    //             model: Achievement,
    //             url: '/api/achievements'
    //         }))();
    //         this.achievementList = new AchievementList({
    //             collection: this.collection,
    //             editable: true
    //         });
    //         this.listenTo(this.collection, 'add', this.openEditor);
    //         this.listenTo(this.collection, 'change remove reset', function() {
    //             this.populateFilters();
    //         });
    //         this.collection.fetch({reset: true});
    //     },
    //     populateFilters: function() {
    //         var filters = this.ui.filters;
    //         filters.empty();
    //         this.collection.chain()
    //             .reduce(function(memo, model) {
    //                 return memo.concat(model.tags());
    //             }, [])
    //             .uniq()
    //             .each(function(tag) {
    //                 filters.append(
    //                     $(document.createElement('li'))
    //                         .html(this.filterTemplate({tag: tag}))
    //                 );
    //             }, this);
    //         this.updateFilter();
    //     },
    //     onAddButtonClicked: function(e) {
    //         console.log('-- Gallery:onAddButtonClicked');
    //         e.preventDefault();
    //         e.stopPropagation();
    //         this.collection.add(new Achievement());
    //         return false;
    //     },
    //     onFilterButtonClicked: function(e) {
    //         console.log('-- Gallery:onFiltersButtonClicked');
    //         e.preventDefault();
    //         e.stopPropagation();
    //         if (this.ui.filterButton.attr('data-state') === 'enabled') {
    //             this.ui.filterButton.attr('data-state', 'disabled');
    //             this.ui.filters.hide();
    //         } else {
    //             this.ui.filterButton.attr('data-state', 'enabled');
    //             this.ui.filters.show();
    //         }
    //         this.updateFilter();
    //         return false;
    //     },
    //     onFiltersChanged: function(e) {
    //         console.log('-- Gallery:onFiltersChanged');
    //         this.updateFilter();
    //         return false;
    //     },
    //     updateFilter: function() {
    //         var tags = [];
    //         if (this.ui.filterButton.attr('data-state') === 'enabled') {
    //             tags = this.ui.filters.find('input:checked').map(
    //                 function(){return this.id;}
    //             ).get();
    //         }
    //         this.achievementList.filter(tags);
    //     },
    //     openEditor: function(achievement) {
    //         console.log('-- Gallery:openEditor');
    //         AchievementEditorDialog.open(achievement);
    //     },
    //     onRender: function() {
    //         console.log('-- Gallery:onRender');
    //         this.getRegion('achievementList').show(this.achievementList);
    //         this.ui.filterButton.attr('data-state', 'disabled');
    //     }
    // });
});