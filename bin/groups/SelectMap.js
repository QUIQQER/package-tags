/**
 * Tag group map
 *
 * @module package/quiqqer/tags/bin/groups/SelectMap
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/tags/bin/groups/SelectMap.css
 *
 * @event onLoaded [this] - fires if the map has finished loading
 */
define('package/quiqqer/tags/bin/groups/SelectMap', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',

    'qui/controls/windows/Confirm',
    'qui/controls/sitemap/Map',
    'qui/controls/sitemap/Item',

    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/groups/SelectMap.css'

], function (QUI, QUIControl, QUIButton, QUILoader, QUIConfirm, QUISiteSelectMap,
             QUISiteSelectMapItem, QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/groups/SelectMap',

        Binds: [
            '$onInject',
            '$buildTree',
            '$addCategoryDialog',
            '$deleteCategoryDialog',
            '$renameCategoryDialog',
            'getCategory',
            'refresh',
            'deselectAll',
            'select',
            '$change',
            'getSelectedGroupIds'
        ],

        options: {
            Project    : false,     // QUIQQER Project of the tag groups
            multiselect: false      // allows selection of multiple tag groups at once
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onInject : this.$onInject,
                onRefresh: this.$onRefresh,
                onCreate : this.$onCreate,
                onResize : this.$onResize
            });

            this.Loader    = new QUILoader();
            this.$GroupMap = null;
            this.$FlatTree = {};
            this.$loaded   = false;

            this.$Project = options.Project;
        },

        /**
         * Create DOM Element
         *
         * @return {Element}
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-tags-groups-map'
            });

            this.Loader.inject(this.$Elm);

            return this.$Elm;
        },

        /**
         * Event: onInject
         */
        $onInject: function () {
            var self = this;

            this.refresh().then(function () {
                self.fireEvent('loaded', [self]);
            });
        },

        /**
         * Refresh category list
         *
         * @return {Promise}
         */
        refresh: function () {
            var self = this;

            this.$Elm.set('html', '');

            this.Loader.show();

            return new Promise(function (resolve) {
                self.$getGroupTree().then(function (groups) {
                    self.$GroupMap = new QUISiteSelectMap({
                        multible: self.getAttribute('multiselect')
                    }).inject(self.$Elm);

                    // Special category "All"
                    var ItemAll = new QUISiteSelectMapItem({
                        title      : QUILocale.get(lg, 'controls.groups.map.category.all'),
                        text       : QUILocale.get(lg, 'controls.groups.map.category.all'),
                        icon       : 'fa fa-tags',
                        contextmenu: true,
                        hasChildren: groups.length,
                        dragable   : false,
                        id         : 'all',
                        events     : {
                            onClick: self.$change
                        }
                    });

                    self.$GroupMap.appendChild(ItemAll);

                    self.$buildTree(groups, ItemAll);
                    self.$GroupMap.openAll();

                    //ItemAll.highlight();

                    self.Loader.hide();
                    self.$loaded = true;

                    resolve();
                });
            });
        },

        /**
         * Build group category tree
         *
         * @param {array} children
         * @param {Object} ParentItem - qui/controls/sitemap/Item
         */
        $buildTree: function (children, ParentItem) {
            var self     = this;
            var editMode = this.getAttribute('editMode');

            //var FuncItemOnClick = function (Item) {
            //    self.fireEvent('groupSelect', [Item.getAttribute('id'), self]);
            //    self.$selectedGroupId = Item.getAttribute('id');
            //};

            for (var i = 0, len = children.length; i < len; i++) {
                var Child = children[i];

                this.$FlatTree[Child.id] = {
                    id   : Child.id,
                    title: Child.title
                };

                var SelectMapItem = new QUISiteSelectMapItem({
                    id         : Child.id,
                    title      : Child.title,
                    text       : Child.title,
                    icon       : 'fa fa-tags',
                    contextmenu: false,
                    hasChildren: Child.children.length,
                    dragable   : false,
                    events     : {
                        onClick: self.$change
                    }
                });

                if (!ParentItem) {
                    self.$GroupMap.appendChild(SelectMapItem);
                } else {
                    ParentItem.appendChild(SelectMapItem);
                }

                if (Child.children.length) {
                    self.$buildTree(Child.children, SelectMapItem);
                }
            }
        },

        /**
         * Get the complete group tree
         *
         * @return {Promise}
         */
        $getGroupTree: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_tags_ajax_groups_getTree',
                    resolve, {
                        'package': 'quiqqer/tags',
                        project  : self.$Project.encode(),
                        onError  : reject
                    }
                );
            });
        },

        /**
         * Fires change event if user selects on ore more tag groups
         */
        $change: function () {
            this.fireEvent('change', [this.getSelectedGroupIds(), this]);
        },

        /**
         * Get IDs of all selected categories
         *
         * @return {Array}
         */
        getSelectedGroupIds: function () {
            var selectedChildren = this.$GroupMap.getSelectedChildren();
            var groupIds         = [];

            for (var i = 0, len = selectedChildren.length; i < len; i++) {
                var Item = selectedChildren[i];

                var id = Item.getAttribute('id');

                if (id && id !== 'all') {
                    groupIds.push(id);
                }
            }

            return groupIds;
        },

        /**
         * Select specific category
         *
         * @param {Integer} groupId - category ID
         */
        select: function (groupId) {
            var categories = this.$GroupMap.getChildren();

            for (var i = 0, len = categories.length; i < len; i++) {
                var Item = categories[i];

                var id = Item.getAttribute('id');

                if (id == groupId) {
                    Item.click();
                    break;
                }
            }
        },

        /**
         * Deselects all categories
         */
        deselectAll: function () {
            if (!this.$GroupMap) {
                return;
            }

            this.$GroupMap.deselectAllChildren();
        }
    });
});
