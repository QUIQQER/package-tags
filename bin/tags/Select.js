/**
 * Makes an input field to a tag selection field
 *
 * @module package/quiqqer/tags/bin/tags/Select
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require Locale
 *
 * @event onAddTag [ this, id ]
 * @event onChange [ this ]
 */
define('package/quiqqer/tags/bin/tags/Select', [

    'qui/QUI',
    'qui/controls/elements/Select',
    'Locale',
    'Ajax',
    'Projects'

], function (QUI, QUIElementSelect, QUILocale, QUIAjax, Projects) {
    "use strict";

    var lg = 'quiqqer/tags';

    /**
     * @class package/quiqqer/tags/bin/tags/Select
     *
     * @param {Object} options
     * @param {HTMLInputElement} [Input]  - (optional), if no input given, one would be created
     *
     * @memberof! <global>
     */
    return new Class({

        Extends: QUIElementSelect,
        Type   : 'package/quiqqer/tags/bin/tags/Select',

        Binds: [
            '$onSearchButtonClick',
            'tagSearch'
        ],

        options: {
            projectName: false,
            projectLang: false
        },

        initialize: function (options) {
            this.parent(options);

            this.setAttribute('Search', this.tagSearch);
            this.setAttribute('icon', 'fa fa-tags');
            this.setAttribute('showIds', false);
            this.setAttribute('child', 'package/quiqqer/tags/bin/tags/SelectItem');

            this.setAttribute(
                'placeholder',
                QUILocale.get(lg, 'tag.control.placeholder.addtag')
            );

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.addEvents({
                onSearchButtonClick: this.$onSearchButtonClick
            });
        },

        /**
         * Search areas
         *
         * @param {String} value
         * @returns {Promise}
         */
        tagSearch: function (value) {
            return new Promise(function (resolve) {
                QUIAjax.get('package_quiqqer_tags_ajax_search_search', function (result) {
                    var list = [];

                    for (var i = 0, len = result.length; i < len; i++) {
                        list.push({
                            id   : result[i].tag,
                            title: result[i].title
                        });
                    }

                    resolve(list);

                }, {
                    'package'  : 'quiqqer/tags',
                    projectName: this.$Project.getName(),
                    projectLang: this.$Project.getLang(),
                    search     : value,
                    params     : JSON.encode({
                        limit: 10
                    })
                });
            }.bind(this));
        },

        /**
         * event : on search button click
         *
         * @param self
         * @param Btn
         */
        $onSearchButtonClick: function (self, Btn) {
            Btn.setAttribute('icon', 'fa fa-spinner fa-spin');

            require([
                'package/quiqqer/tags/bin/search/Window'
            ], function (Search) {
                new Search({
                    events: {
                        onSubmit: function (Win, values) {
                            for (var i = 0, len = values.length; i < len; i++) {
                                self.addItem(values[i]);
                            }
                        }
                    }
                }).open();

                Btn.setAttribute('icon', 'fa fa-search');
            });
        },

        /**
         * Add a tag
         *
         * @param {String} tag - name of the tag
         * @returns {*}
         */
        addTag: function (tag) {
            return this.addItem(tag);
        },

        /**
         * Add multiple tags
         *
         * @param {String|Array} tags - comma seperated tag list or array list
         */
        addTags: function (tags) {
            if (typeOf(tags) === 'string') {
                tags = tags.split(',');
            }

            for (var i = 0, len = tags.length; i < len; i++) {
                this.addTag(tags[i]);
            }
        },

        /**
         * return the value, alias for getValue()
         * @returns {String}
         */
        getTags: function () {
            return this.getValue();
        }
    });
});
