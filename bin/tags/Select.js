/**
 * Makes an input field to a tag selection field
 *
 * @module package/quiqqer/tags/bin/tags/Select
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @require Locale
 * @require Ajax
 * @require Projects
 *
 * @event onAddTag [ this, tag ]
 * @event onChange [ this ]
 */
define('package/quiqqer/tags/bin/tags/Select', [

    'qui/QUI',
    'qui/controls/elements/Select',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',
    'Locale',
    'Ajax',
    'Projects'

], function (QUI, QUIElementSelect, QUIButton, QUILoader, QUILocale, QUIAjax, Projects) {
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
            '$onCreate',
            'tagSearch',
            'showCreateTagDialog'
        ],

        options: {
            projectName: false,
            projectLang: false
        },

        initialize: function (options) {
            this.parent(options);

            this.setAttribute('Search', this.tagSearch);
            this.setAttribute('icon', 'fa fa-tag');
            this.setAttribute('showIds', false);
            this.setAttribute('child', 'package/quiqqer/tags/bin/tags/SelectItem');
            this.setAttribute('_maxTagsAmount', -1);

            this.setAttribute(
                'placeholder',
                QUILocale.get(lg, 'tag.control.placeholder.addtag')
            );

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.Loader = new QUILoader();

            this.addEvents({
                onSearchButtonClick: this.$onSearchButtonClick,
                onCreate           : this.$onCreate,
                onSetAttribute     : function (attr, value) {
                    if (attr == 'projectLang') {
                        this.$Project = Projects.get(
                            this.getAttribute('projectName'),
                            value
                        );
                    }
                }.bind(this),
                onAddItem          : function (Control, tag) {
                    this.fireEvent('addTag', [this, tag]);
                }.bind(this),
                onChange           : this.refreshStatus
            });
        },

        /**
         * Set the project
         *
         * @param {Object} Project - classes/projects/Project
         */
        setProject: function (Project) {
            if (typeOf(Project) === 'classes/projects/Project') {
                this.$Project = Project;
                this.setAttribute('projectName', this.$Project.getName());
                this.setAttribute('projectLang', this.$Project.getLang());
            }
        },

        /**
         * Search tags
         *
         * @param {String} value
         * @returns {Promise}
         */
        tagSearch: function (value) {
            if (!this.$Project) {
                return Promise.reject('No project available');
            }

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
            ], function (Window) {
                new Window({
                    projectName: self.$Project.getName(),
                    projectLang: self.$Project.getLang(),
                    selected   : self.getTags().split(','),
                    events     : {
                        onSubmit: function (Win, values) {
                            for (var i = 0, len = values.length; i < len; i++) {
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
            this.$Search.addEvent('keyup', function (event) {
                if (event.key === 'enter') {
                    var Active = this.$DropDown.getElement(
                        '.qui-elements-list-dropdown-entry-hover'
                    );

                    if (Active) {
                        return;
                    }

                    this.addTag(this.$Search.value).catch(function () {
                        this.showCreateTagDialog(this.$Search.value);
                    }.bind(this));
                }
            }.bind(this));

            this.Loader.inject(this.getElm());

            this.refreshStatus();
        },

        /**
         * Add a tag
         *
         * @param {String} tag - name of the tag
         * @returns {Promise}
         */
        addTag: function (tag) {
            // filter duplicates
            var found = this.getTags().split(',').filter(function (val) {
                return val === tag;
            });

            // found some tags
            if (found.length) {
                return Promise.resolve();
            }

            if (!this.$Project) {
                return Promise.reject('No project available');
            }

            return new Promise(function (resolve, reject) {
                this.Loader.show();

                QUIAjax.get([
                    'ajax_permissions_session_hasPermission',
                    'package_quiqqer_tags_ajax_tag_exists',
                    'package_quiqqer_tags_ajax_tag_getData'
                ], function (hasPermission, tagExists, TagData) {
                    if (!hasPermission && !tagExists) {
                        QUI.getMessageHandler(function (MH) {
                            MH.addError(
                                QUILocale.get(lg, 'message.no.permission.create.tags'),
                                this.getElm()
                            );
                        });

                        this.Loader.hide();
                        return;
                    }

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
                    projectName: this.$Project.getName(),
                    projectLang: this.$Project.getLang(),
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

            var promises = [];


            for (var i = 0, len = tags.length; i < len; i++) {
                promises.push(this.addTag(tags[i]));
            }

            return Promise.all(promises);
        },

        /**
         * Create a new tag in the project
         *
         * @param {String} tag
         * @returns {Promise}
         */
        createTag: function (tag) {
            return new Promise(function (resolve, reject) {
                this.Loader.show();

                QUIAjax.get('package_quiqqer_tags_ajax_tag_add', function (result) {

                    this.Loader.hide();
                    resolve(result);

                }.bind(this), {
                    'package'  : 'quiqqer/tags',
                    permission : 'tags.create',
                    projectName: this.$Project.getName(),
                    projectLang: this.$Project.getLang(),
                    tag        : tag,
                    showError  : false,
                    onError    : reject
                });
            }.bind(this));
        },

        /**
         *
         * @param {String} tag
         */
        showCreateTagDialog: function (tag) {
            var self      = this;
            var Container = new Element('div', {
                html      : QUILocale.get(lg, 'site.window.add.tag.title', {
                    tag: tag
                }),
                styles    : {
                    background: '#FFFFFF',
                    border    : '1px solid #dedede',
                    height    : '100%',
                    left      : 0,
                    opacity   : 0,
                    outline   : 'none',
                    padding   : 20,
                    position  : 'absolute',
                    textAlign : 'center',
                    top       : -50,
                    width     : '100%'
                },
                'tabindex': -1
            }).inject(this.getElm());

            var hide = function () {
                moofx(Container).animate({
                    opacity: 0,
                    top    : -50
                }, {
                    duration: 200,
                    callback: function () {
                        QUI.Controls.getControlsInElement(Container).each(function (Control) {
                            Control.destroy();
                        });

                        Container.destroy();
                    }
                });
            };

            new QUIButton({
                text  : QUILocale.get('quiqqer/system', 'save'),
                events: {
                    onClick: function () {
                        self.createTag(tag).then(function (created) {
                            return self.addTag(created.tag);
                        }).then(function () {
                            hide();
                        }).catch(hide);
                    }
                },
                styles: {
                    'float': 'none',
                    margin : '10px 5px 0 0'
                }
            }).inject(Container);

            new QUIButton({
                text  : QUILocale.get('quiqqer/system', 'cancel'),
                events: {
                    onClick: hide
                },
                styles: {
                    'float': 'none',
                    margin : '10px 0 0 5px'
                }
            }).inject(Container);

            moofx(Container).animate({
                opacity: 1,
                top    : 0
            }, {
                duration: 250,
                callback: function () {
                    Container.focus();
                }
            });
        },

        /**
         * return the value, alias for getValue()
         * @returns {String}
         */
        getTags: function () {
            return this.getValue();
        },

        /**
         * Returns a promise resolving with the maximum amount of tags the current user can add
         *
         * @return {Promise}
         */
        getMaxTagAmount: function () {
            var self = this;
            return new Promise(function (resolve, reject) {
                if (self.getAttribute('_maxTagsAmount') !== -1) {
                    resolve(self.getAttribute('_maxTagsAmount'));
                } else {
                    QUIAjax.get('package_quiqqer_tags_ajax_tag_getMaxAmount', function (maxAmount) {
                        self.setAttribute('_maxTagsAmount', maxAmount);
                        resolve(self.getAttribute('_maxTagsAmount'));
                    }.bind(this), {
                        'package': 'quiqqer/tags',
                        onError  : reject
                    });
                }
            });
        },


        /**
         * Refreshes the controls status.
         * Currently this only en-/disables adding new tags.
         */
        refreshStatus: function () {
            var self = this;
            this.getMaxTagAmount().then(function (maxTagAmount) {
                if (self.$values.length >= maxTagAmount) {
                    self.$Search.style.visibility = 'hidden';
                    self.$SearchButton.$Elm.style.visibility = 'hidden';
                    QUI.getMessageHandler(function (MH) {
                        MH.addInformation(
                            QUILocale.get(lg, 'message.limit.tags.to.site', {amount: maxTagAmount}),
                            self.getElm()
                        );
                    });
                } else {
                    self.$Search.style.visibility = 'visible';
                    self.$SearchButton.$Elm.style.visibility = 'visible';
                }
            });
        }
    });
});
