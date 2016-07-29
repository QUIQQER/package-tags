/**
 * Tag Verwaltung für eine Seite
 *
 * @module package/quiqqer/tags/bin/Site
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/loader/Loader
 * @require qui/controls/windows/Confirm
 * @require package/quiqqer/tags/bin/TagContainer
 * @require Ajax
 * @require Locale
 * @require css!URL_OPT_DIR/quiqqer/tags/bin/Site.css
 */

define('package/quiqqer/tags/bin/Site', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/windows/Confirm',
    'package/quiqqer/tags/bin/tags/Select',

    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/Site.css'

], function (QUI, QUIControl, QUILoader, QUIConfirm, TagContainer, Ajax, Locale) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/Site',

        Binds: [
            '$onInject',
            '$onDestroy',
            '$onTagAdd'
        ],

        options: {
            Site: false
        },

        initialize: function (options) {
            this.parent(options);

            this.$Site    = options.Site;
            this.$Project = this.$Site.getProject();

            this.addEvents({
                onInject : this.$onInject,
                onDestroy: this.$onDestroy
            });
        },

        /**
         * create the dom node element
         *
         * @return {HTMLElement}
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'qui-tags qui-box',
                html   : '<table class="data-table">' +
                         '<thead><tr><th>' +
                         Locale.get(lg, 'site.table.title') +
                         '</th></tr></thead>' +
                         '<tbody>' +
                         '<tr><td class="odd"></td></tr>' +
                         '</tbody>' +
                         '</table>'
            });

            var projectName = this.$Project.getName(),
                projectLang = this.$Project.getLang();

            this.$Container = new TagContainer({
                project    : projectName,
                projectLang: projectLang,
                events     : {
                    onChange: this.$onTagAdd
                },
                styles     : {
                    width: '100%'
                }
            }).inject(this.$Elm.getElement('.odd'));

            return this.$Elm;
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            this.$Container.refresh();

            var tags = this.$Site.getAttribute('quiqqer.tags.tagList');

            if (typeOf(tags) === 'string') {
                tags = tags.split(',');
            }

            if (typeOf(tags) !== 'array') {
                tags = [];
            }

            for (var i = 0, len = tags.length; i < len; i++) {
                this.$Container.addTag(tags[i]);
            }
        },

        /**
         * event : on destroy
         * set the tags to the site
         */
        $onDestroy: function () {
            this.$Site.setAttribute(
                'quiqqer.tags.tagList',
                this.$Container.getTags().join(',')
            );
        },

        /**
         * event on tag adding via tag container
         *
         * @param {Object} Container - TagContainer
         * @param {String} tag
         */
        $onTagAdd: function (Container, tag) {
            var self = this;

            this.$Container.Loader.show();

            Ajax.get('package_quiqqer_tags_ajax_tag_exists', function (result) {
                if (result) {
                    self.$Container.Loader.hide();
                    return;
                }

                self.addTagWindow(tag);

            }, {
                'package'  : 'quiqqer/tags',
                projectName: this.$Project.getName(),
                projectLang: this.$Project.getLang(),
                tag        : tag
            });
        },

        /**
         * Add the tag to the repository and to the site
         *
         * @param {String} tag
         */
        addTag: function (tag) {
            var self = this;

            this.$Container.Loader.show();

            Ajax.get('package_quiqqer_tags_ajax_tag_add', function () {
                self.$Container.addTag(tag);
                self.$Container.Loader.hide();

            }, {
                'package'  : 'quiqqer/tags',
                projectName: this.$Project.getName(),
                projectLang: this.$Project.getLang(),
                tag        : tag
            });
        },

        /**
         * opens the add tag window
         *
         * @param {String} tag - tag to add
         */
        addTagWindow: function (tag) {
            var self = this;

            new QUIConfirm({
                title    : Locale.get(lg, 'site.window.add.tag.title'),
                icon     : 'fa fa-tag',
                maxWidth : 500,
                maxHeight: 300,
                events   : {
                    onOpen: function () {
                        var Content = this.getContent();

                        Content.set(
                            'html',
                            Locale.get(lg, 'site.window.add.tag.title', {
                                tag: tag
                            })
                        );
                    },

                    onCancel: function () {
                        self.$Container.removeTag(tag);
                        self.$Container.Loader.hide();
                    },

                    onSubmit: function () {
                        self.$Container.removeTag(tag);
                        self.addTag(tag);
                        self.$Container.Loader.hide();
                    }
                }
            }).open();
        }
    });
});
