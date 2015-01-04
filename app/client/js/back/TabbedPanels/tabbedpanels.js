define(function(require) {
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = Backbone.Marionette;

    var tabbedPanelsTemplate = require('text!back/TabbedPanels/tabbedpanels.template.html');
    var tabbarItemTemplate = require('text!back/TabbedPanels/tabbedpanels.tabbar.item.template.html');
    var menuClasses = {
        1: 'one-up',  2: 'two-up',  3: 'three-up',
        4: 'four-up', 5: 'five-up', 6: 'six-up',
    };
    var nextPanelId_ = 0;
    var called = 0;

    var Panel = Backbone.Model.extend({
        defaults: function() {
            var id = nextPanelId_++;
            return {
                active: false,
                id: 'item' + id,
                label: 'Item' + id,
                view: function() {
                    return new Marionette.ItemView({
                        template: (function() {
                            console.log('-- Panel: [' + this.id + '] rendering');
                        }).bind(this)
                    });
                }
            };
        },
        label: function() {
            return this.get('label');
        },
        isActive: function() {
            return this.get('active');
        },
        setActive: function(state) {
            this.set('active', state);
        },
        createView: function() {
            return this.get('view').call(this);
        }
    });


    var ItemView = Marionette.ItemView.extend({
        tagName: 'a',
        className: 'item',
        template: _.template(tabbarItemTemplate),
        attributes: function() {
            return {
                href: '#/' + (this.model.id || this.model.cid)
            };
        },
        onBeforeRender: function() {
            this.$el.attr('data-state', this.model.isActive() ? 'active':'');
        }
    });


    var TabBarView = Marionette.CollectionView.extend({
        childView: ItemView,
        tagName: 'div',
        initialize: function() {
            this.configure({
                labelRight: false
            });
            this.listenTo(this.collection, 'change', this.render);
        },
        configure: function(config) {
            this.config = _.extend(
                this.config || {},
                _.pick(config || {}, 'labelRight')
            );
            return this;
        },
        onBeforeRender: function() {
            var classes = [ 'items' ];

            classes.push(menuClasses[this.collection.length]);
            if (this.config.labelRight) {
                classes.push('label-right');
            }
            this.$el.removeClass().addClass(classes.join(' '));
        },
        setActiveItem: function(panel) {
            panel.setActive(true);
            this.collection.chain().without(panel).each(function(p) {
                p.setActive(false);
            });
        }
    });


    var TabbedPanels = Marionette.LayoutView.extend({
        regions: {
            tabBar: '.tab-bar',
            panel:  '.tab-panel'
        },
        template: _.template(tabbedPanelsTemplate),
        initialize: function() {
            console.log('-- TabbedPanels: initialization');
            this.collection = new Backbone.Collection([], {
                model: Panel
            });
            this.tabBar = new TabBarView({
                collection: this.collection
            });
            console.log('-- TabbedPanels: initialization - done');
        },
        configure: function(config) {
            this.tabBar.configure(config);
            return this;
        },
        addPanel: function(panel) {
            this.collection.add(panel);
        },
        switchPanel: function(panel_id) {
            var panel =
                (_.isString(panel_id)
                    ? this.collection.get
                    : this.collection.at).call(this.collection, panel_id);

            if (panel) {
                console.log('-- TabbedPanels: switching to panel ' + panel.id);
                this.tabBar.setActiveItem(panel);
                this.getRegion('panel').show(panel.createView());
                console.log('-- TabbedPanels: switching to panel ' + panel.id + ' - done');
            } else {
                console.error('-- TabbedPanels: cannot switch to panel ' + panel_id);
            }
        },
        onRender: function() {
            console.log('-- TabbedPanels: renderering');
            this.getRegion('tabBar').show(this.tabBar);
            console.log('-- TabbedPanels: renderering - done');
        }
    });

    return TabbedPanels;
});
