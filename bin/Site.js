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
 * @require package/quiqqer/tags/bin/tags/Select
 * @require Ajax
 * @require Locale
 * @require Mustache
 * @require text!package/quiqqer/tags/bin/Site.Settings.html
 * @require css!URL_OPT_DIR/quiqqer/tags/bin/Site.css
 */
define('package/quiqqer/tags/bin/Site', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/windows/Confirm',
    'package/quiqqer/tags/bin/tags/Select',
    'package/quiqqer/tags/bin/groups/Select',
    'Ajax',
    'Locale',
    'Mustache',

    'text!package/quiqqer/tags/bin/Site.Settings.html',
    'css!package/quiqqer/tags/bin/Site.css'

], function (QUI, QUIControl, QUILoader, QUIConfirm, TagSelect, TagGroupSelect,
             QUIAjax, QUILocale, Mustache, templateSiteSettings) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/Site',

        Binds: [
            '$onInject',
            '$onDestroy',
            '$onSelectChange',
            '$onGroupSelectChange'
        ],

        options: {
            Site: false
        },

        initialize: function (options) {
            this.parent(options);

            this.$Site    = options.Site;
            this.$Project = this.$Site.getProject();

            this.$TagGroupSelect = null;
            this.$TagSelect      = null;

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
                html   : Mustache.render(templateSiteSettings, {
                    titleTags  : QUILocale.get(lg, 'site.table.title'),
                    titleGroups: QUILocale.get(lg, 'site.table.groups.title')
                })
            });

            var projectName = this.$Project.getName(),
                projectLang = this.$Project.getLang();

            this.$TagSelect = new TagSelect({
                projectName: projectName,
                projectLang: projectLang,
                events     : {
                    onChange: this.$onSelectChange
                },
                styles     : {
                    height: 200
                }
            }).inject(this.$Elm.getElement('.package-quiqqer-tags-sitetags'));

            var GroupContainer = this.$Elm.getElement(
                '.package-quiqqer-tags-sitetaggroups'
            );

            this.$TagGroupSelect = new TagGroupSelect({
                projectName: projectName,
                projectLang: projectLang,
                events     : {
                    onChange: this.$onGroupSelectChange
                },
                styles     : {
                    height: 200
                }
            }).inject(GroupContainer);

            GroupContainer.getParent('table').setStyle('display', 'none');

            return this.$Elm;
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            this.$TagSelect.refresh();
            this.$TagGroupSelect.refresh();

            var tags     = this.$Site.getAttribute('quiqqer.tags.tagList');
            var groups   = this.$Site.getAttribute('quiqqer.tags.tagGroups');
            var promises = [];

            // tags
            if (typeOf(tags) === 'string') {
                tags = tags.split(',');
            }

            if (typeOf(tags) !== 'array') {
                tags = [];
            }


            for (var i = 0, len = tags.length; i < len; i++) {
                if (tags[i] !== '') {
                    promises.push(this.$TagSelect.addTag(tags[i]));
                }
            }

            // wenn fehler passiert, wird der tag einfach nicht mitaufgenommen
            if (promises.length) {
                Promise.all(promises).catch(function (err) {
                    console.error(err);
                });
            }

            // groups
            if (typeOf(groups) === 'string') {
                groups = groups.split(',');
            }

            if (typeOf(groups) !== 'array') {
                groups = [];
            }

            promises = [];

            for (i = 0, len = groups.length; i < len; i++) {
                if (groups[i] !== '') {
                    promises.push(this.$TagGroupSelect.addTagGroup(groups[i]));
                }
            }

            // wenn fehler passiert, wird die tag gruppe einfach nicht mitaufgenommen
            if (promises.length) {
                Promise.all(promises).catch(function (err) {
                    console.error(err);
                });
            }

            if (QUIQQER_TAGS_USE_GROUPS) {
                this.$TagGroupSelect.getElm().getParent('table').setStyle('display', null);
            }
        },

        /**
         * on control unload
         */
        unload: function () {
            this.$onDestroy();
        },

        /**
         * event : on destroy
         * set the tags to the site
         */
        $onDestroy: function () {
            this.$Site.setAttribute(
                'quiqqer.tags.tagList',
                this.$TagSelect.getTags()
            );
        },

        /**
         * event on select change
         */
        $onSelectChange: function () {
            this.$Site.setAttribute('quiqqer.tags.tagList', this.$TagSelect.getTags());
        },

        /**
         * event on group select change
         */
        $onGroupSelectChange: function () {
            this.$Site.setAttribute('quiqqer.tags.tagGroups', this.$TagGroupSelect.getTagGroupIds());
        }
    });
});
