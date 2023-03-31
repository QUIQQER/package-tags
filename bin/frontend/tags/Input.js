/**
 * @module package/quiqqer/tags/bin/frontend/tags/Input
 * @author www.pcsg.de (Henning Leutz)
 *
 * @event onAddTag [ this, tag ]
 * @event onRemoveTag [ tag ]
 * @event onChange [ this ]
 */
define('package/quiqqer/tags/bin/frontend/tags/Input', [

    'qui/QUI',
    'qui/controls/elements/Select',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',
    'Locale',
    'Ajax',

    'css!package/quiqqer/tags/bin/frontend/tags/Input.css'

], function (QUI, QUIElementSelect, QUIButton, QUILoader, QUILocale, QUIAjax) {
    "use strict";

    const lg = 'quiqqer/tags';

    /**
     * @class package/quiqqer/tags/bin/frontend/tags/Input
     *
     * @param {Object} options
     * @param {HTMLInputElement} [Input]  - (optional), if no input given, one would be created
     *
     * @memberof! <global>
     */
    return new Class({

        Extends: QUIElementSelect,
        Type   : 'package/quiqqer/tags/bin/frontend/tags/Input',

        Binds: [
            '$onSearchButtonClick',
            '$onGroupClick',
            '$onCreate',
            'tagSearch'
        ],

        options: {
            projectName: false,
            projectLang: false,
            group      : false // parent group -> shows the sub groups
        },

        initialize: function (options) {
            this.setAttributes({
                searchbutton: false
            });

            this.parent(options);

            this.setAttribute('Search', this.tagSearch);
            this.setAttribute('icon', 'fa fa-tag');
            this.setAttribute('showIds', false);
            this.setAttribute('child', 'package/quiqqer/tags/bin/tags/SelectItem');

            this.setAttribute(
                'placeholder',
                QUILocale.get(lg, 'tag.control.placeholder.addtag')
            );

            if (this.getAttribute('projectName') === false) {
                this.setAttribute('projectName', QUIQQER_PROJECT.name);
            }

            if (this.getAttribute('projectLang') === false) {
                this.setAttribute('projectLang', QUIQQER_PROJECT.lang);
            }

            this.Loader = new QUILoader();
            this.$Groups = null;

            this.addEvents({
                onSearchButtonClick: this.$onSearchButtonClick,
                onCreate           : this.$onCreate,
                onAddItem          : function (Control, tag) {
                    this.fireEvent('addTag', [
                        this,
                        tag
                    ]);
                }.bind(this),

                onRemoveItem: function (tag) {
                    this.fireEvent('removeTag', [tag]);
                }
            });
        },

        /**
         * Search tags
         *
         * @param {String} value
         * @returns {Promise}
         */
        tagSearch: function (value) {
            return new Promise((resolve) => {
                QUIAjax.get('package_quiqqer_tags_ajax_search_search', (result) => {
                    const list = [];

                    for (let i = 0, len = result.length; i < len; i++) {
                        list.push({
                            id   : result[i].tag,
                            title: result[i].title
                        });
                    }

                    resolve(list);
                }, {
                    'package'  : 'quiqqer/tags',
                    projectName: this.getAttribute('projectName'),
                    projectLang: this.getAttribute('projectLang'),
                    group      : this.getAttribute('selectedGroup') ? this.getAttribute('selectedGroup') : 0,
                    search     : value,
                    params     : JSON.encode({
                        limit: 10
                    })
                });
            });
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
            ], (Window) => {
                new Window({
                    projectName: this.getAttribute('projectName'),
                    projectLang: this.getAttribute('projectLang'),
                    selected   : self.getTags().split(','),
                    events     : {
                        onSubmit: function (Win, values) {
                            for (let i = 0, len = values.length; i < len; i++) {
                                self.addTag(values[i]);
                            }
                        }
                    }
                }).open();

                Btn.setAttribute('icon', 'fa fa-search');
            });
        },

        /**
         * event : on create
         */
        $onCreate: function () {
            this.getElm().addClass('quiqqer-tags-input');
            this.getElm().setStyle('height', null);

            if (this.getAttribute('group')) {
                this.setGroup(this.getAttribute('group'));
            }

            this.$Search.addEvent('keydown', (event) => {
                if (event.key === 'enter') {
                    const Active = this.$DropDown.getElement(
                        '.qui-elements-list-dropdown-entry-hover'
                    );

                    if (Active) {
                        return;
                    }

                    this.addTag(this.$Search.value).catch(function (error) {
                        console.error(error);
                    });
                }
            });

            this.Loader.inject(this.getElm());
        },

        setGroup: function (groupId) {
            if (!this.$Groups) {
                this.$Groups = new Element('div', {
                    'class': 'quiqqer-tags-input-groups'
                }).inject(this.$List, 'before');
            }

            this.setAttribute('group', groupId);
            this.$Groups.set('html', '');

            new Element('div', {
                'class': 'quiqqer-tags-input-groups-label',
                html   : QUILocale.get(lg, 'window.tag.group.search.groupLabel')
            }).inject(this.$Groups);

            this.getGroupsFromGroup().then((groups) => {
                if (!groups.length) {
                    this.$Groups.destroy();
                    this.$Groups = null;
                    return;
                }

                const All = new Element('div', {
                    'class'   : 'quiqqer-tags-input-groups-entry',
                    'data-tag': this.getAttribute('groupId'),
                    html      : QUILocale.get(lg, 'window.tag.group.search.all.tags'),
                    events    : {
                        click: this.$onGroupClick
                    }
                }).inject(this.$Groups);

                for (let i = 0, len = groups.length; i < len; i++) {
                    new Element('div', {
                        'class'   : 'quiqqer-tags-input-groups-entry',
                        'data-tag': groups[i].id,
                        html      : groups[i].title,
                        events    : {
                            click: this.$onGroupClick
                        }
                    }).inject(this.$Groups);
                }

                All.click();

            });
        },

        $onGroupClick: function (event) {
            event.stop();

            this.getElm()
                .getElements('.quiqqer-tags-input-groups-entry')
                .removeClass('quiqqer-tags-input-groups-entry--active');

            event.target.addClass('quiqqer-tags-input-groups-entry--active');

            this.setAttribute('selectedGroup', event.target.get('data-tag'));
        },

        /**
         * Add a tag
         *
         * @param {String} tag - name of the tag
         * @returns {Promise}
         */
        addTag: function (tag) {
            // filter duplicates
            const found = this.getTags().split(',').filter(function (val) {
                return val === tag;
            });

            // found some tags
            if (found.length) {
                return Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                this.Loader.show();

                QUIAjax.get([
                    'package_quiqqer_tags_ajax_tag_exists',
                    'package_quiqqer_tags_ajax_tag_getData'
                ], function (hasPermission, tagExists, TagData) {
                    if (!tagExists) {
                        reject();
                        this.Loader.hide();
                        return;
                    }

                    this.Loader.hide();
                    this.addItem(TagData.tag);

                    resolve();
                }.bind(this), {
                    'package'  : 'quiqqer/tags',
                    permission : 'tags.create',
                    projectName: this.getAttribute('projectName'),
                    projectLang: this.getAttribute('projectLang'),
                    tag        : tag,
                    showError  : false
                });
            }.bind(this));
        },

        /**
         * Add multiple tags
         *
         * @param {String|Array} tags - comma seperated tag list or array list
         * @return {Promise}
         */
        addTags: function (tags) {
            if (typeOf(tags) === 'string') {
                tags = tags.split(',');
            }

            const promises = [];

            for (let i = 0, len = tags.length; i < len; i++) {
                promises.push(this.addTag(tags[i]));
            }

            return Promise.all(promises);
        },

        /**
         * return the value, alias for getValue()
         * @returns {String}
         */
        getTags: function () {
            return this.getValue();
        },

        /**
         * Return the tags from the tag group
         *
         * @returns {Promise}
         */
        getGroupsFromGroup: function () {
            return new Promise((resolve, reject) => {
                QUIAjax.get('package_quiqqer_tags_ajax_groups_search_getGroupsByGroup', resolve, {
                    'package': 'quiqqer/tags',
                    groupId  : this.getAttribute('group'),
                    recursive: 1,
                    onError  : reject
                });
            });
        }
    });
});
