/**
 * Makes an input field to a tag group selection field
 *
 * @module package/quiqqer/tags/bin/groups/Select
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @require Locale
 * @require Ajax
 * @require Projects
 *
 * @event onAddTagGroup [ this, id ]
 * @event onChange [ this ]
 */
define('package/quiqqer/tags/bin/groups/Select', [

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
     * @class package/quiqqer/tags/bin/groups/Select
     *
     * @param {Object} options
     * @param {HTMLInputElement} [Input]  - (optional), if no input given, one would be created
     *
     * @memberof! <global>
     */
    return new Class({

        Extends: QUIElementSelect,
        Type   : 'package/quiqqer/tags/bin/groups/Select',

        Binds: [
            '$onSearchButtonClick',
            '$onCreate',
            'tagGroupSearch'
        ],

        options: {
            projectName: false,
            projectLang: false
        },

        initialize: function (options) {
            this.parent(options);

            this.setAttribute('Search', this.tagGroupSearch);
            this.setAttribute('icon', 'fa fa-tags');
            this.setAttribute('showIds', true);
            this.setAttribute('child', 'package/quiqqer/tags/bin/groups/SelectItem');

            this.setAttribute(
                'placeholder',
                QUILocale.get(lg, 'tag.control.placeholder.addgroup')
            );

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.Loader = new QUILoader();

            this.addEvents({
                onSearchButtonClick: this.$onSearchButtonClick,
                onCreate           : this.$onCreate
            });
        },

        /**
         * Search tag groups
         *
         * @param {String} value
         * @returns {Promise}
         */
        tagGroupSearch: function (value) {
            return new Promise(function (resolve) {
                QUIAjax.get('package_quiqqer_tags_ajax_groups_search_search', resolve, {
                    'package': 'quiqqer/tags',
                    project  : this.$Project.encode(),
                    search   : value,
                    params   : JSON.encode({
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
                'package/quiqqer/tags/bin/groups/search/Window'
            ], function (Window) {
                new Window({
                    multiselect: self.getAttribute('multiple'),
                    projectName: self.$Project.getName(),
                    projectLang: self.$Project.getLang(),
                    events     : {
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

                    this.addTagGroup(this.$Search.value).catch(function () {
                        this.showCreateTagGroupDialog(this.$Search.value);
                    }.bind(this));
                }
            }.bind(this));

            this.Loader.inject(this.getElm());
        },

        /**
         * Add a taggroup
         *
         * @param {Number} id - ID of the group
         * @returns {Promise}
         */
        addTagGroup: function (id) {
            return new Promise(function (resolve, reject) {
                this.Loader.show();

                QUIAjax.get([
                    'ajax_permissions_session_hasPermission',
                    'package_quiqqer_tags_ajax_groups_exists'
                ], function (hasPermission, tagExists) {
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
                    this.addItem(id);

                    resolve();

                }.bind(this), {
                    'package' : 'quiqqer/tags',
                    permission: 'tags.group.create',
                    project   : this.$Project.encode(),
                    groupId   : id,
                    showError : false
                });
            }.bind(this));
        },

        /**
         * Add multiple tag groups
         *
         * @param {String|Array} taggroups - comma seperated tag group list or array list
         * @return {Promise}
         */
        addTagGroups: function (taggroups) {
            if (typeOf(taggroups) === 'string') {
                taggroups = taggroups.split(',');
            }

            var promises = [];

            for (var i = 0, len = taggroups.length; i < len; i++) {
                promises.push(this.addTagGroup(taggroups[i]));
            }

            return Promise.all(promises);
        },

        /**
         * Create a new tag group in the project
         *
         * @param {String} title
         * @returns {Promise}
         */
        createTagGroup: function (title) {
            return new Promise(function (resolve, reject) {
                this.Loader.show();

                QUIAjax.get('package_quiqqer_tags_ajax_groups_create', function () {

                    this.Loader.hide();
                    resolve();

                }.bind(this), {
                    'package' : 'quiqqer/tags',
                    permission: 'tags.group.create',
                    project   : this.$Project.encode(),
                    title     : title,
                    showError : false,
                    onError   : reject
                });
            }.bind(this));
        },

        /**
         * Opens the create tag group dialog
         *
         * @param {String} title - title of the tag group
         */
        showCreateTagGroupDialog: function (title) {
            var self      = this;
            var Container = new Element('div', {
                html      : QUILocale.get(lg, 'site.window.add.taggroup.title', {
                    tag: title
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
                        self.createTagGroup(title).then(function () {
                            return self.addTagGroup(title);
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
         *
         * @returns {String}
         */
        getTagGroupIds: function () {
            return this.getValue();
        }
    });
});
