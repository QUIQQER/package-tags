/**
 * @module package/quiqqer/tags/bin/search/Search
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/windows/Confirm
 * @require Locale
 * @require Ajax
 * @require Projects
 * @require text!package/quiqqer/tags/bin/search/Search.html
 * @require text!package/quiqqer/tags/bin/search/Search.Tag.html
 * @require css!package/quiqqer/tags/bin/search/Search.css
 */
define('package/quiqqer/tags/bin/search/Search', [

    'qui/QUI',
    'qui/controls/Control',
    'Locale',
    'Ajax',
    'Projects',
    'Mustache',

    'package/quiqqer/tags/bin/groups/SelectMap',

    'text!package/quiqqer/tags/bin/search/Search.html',
    'text!package/quiqqer/tags/bin/search/Search.Tag.html',
    'css!package/quiqqer/tags/bin/search/Search.css'

], function (QUI, QUIControl, QUILocale, QUIAjax, Projects, Mustache,
             GroupSelectMap, templateSearch, templateSearchTag) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({
        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/search/Search',

        Binds: [
            '$onInject',
            '$renderResult'
        ],

        options: {
            projectName   : false,
            projectLang   : false,
            selected      : [],
            dblClickSubmit: true    // determines if tag selection can be submitted by double click
        },

        initialize: function (options) {
            this.parent(options);

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.$Select      = null;
            this.$SelectGroup = null;
            this.$Search      = null;
            this.$Result      = null;

            this.$selected    = {};
            this.$searchtimer = false;

            if (this.getAttribute('selected')) {
                var selected = this.getAttribute('selected');

                for (var i = 0, len = selected.length; i < len; i++) {
                    this.$selected[selected[i]] = true;
                }
            }

            this.addEvents({
                onInject: this.$onInject
            });
        },

        /**
         * Create the domnode element
         *
         * @returns {HTMLDivElement}
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-tags-search',
                html   : Mustache.render(templateSearch, {
                    searchPlaceholder   : QUILocale.get(lg, 'tag.control.placeholder.addtag'),
                    textABC             : QUILocale.get(lg, 'filter.abc'),
                    textDEF             : QUILocale.get(lg, 'filter.def'),
                    textGHI             : QUILocale.get(lg, 'filter.ghi'),
                    textJKL             : QUILocale.get(lg, 'filter.jkl'),
                    textMNO             : QUILocale.get(lg, 'filter.mno'),
                    textPQR             : QUILocale.get(lg, 'filter.pqr'),
                    textSTU             : QUILocale.get(lg, 'filter.stu'),
                    textVZ              : QUILocale.get(lg, 'filter.vz'),
                    text123             : QUILocale.get(lg, 'filter.123'),
                    textSpecial         : QUILocale.get(lg, 'filter.special'),
                    textAll             : QUILocale.get(lg, 'filter.all'),
                    groupSelectOptionAll: QUILocale.get(lg, 'filter.groups.all')
                })
            });

            this.$Select       = this.$Elm.getElement('.quiqqer-tags-search-select');
            this.$GroupTreeElm = this.$Elm.getElement('.quiqqer-tags-search-tree');
            this.$ListElm      = this.$Elm.getElement('.quiqqer-tags-search-list');
            this.$Search       = this.$Elm.getElement('.quiqqer-tags-search-freetext');
            this.$Result       = this.$Elm.getElement('.quiqqer-tags-search-result');

            this.$Select.addEvent('change', function (event) {
                this.getTagsBySektor(event.target.value).then(this.$renderResult);
            }.bind(this));

            var searchtrigger = function () {
                var value = this.$Search.value;

                if (value === '') {
                    this.$Select.disabled = false;
                    this.getTagsBySektor(this.$Select.value).then(this.$renderResult);
                    return;
                }

                this.$Select.disabled = true;
                this.$executeSearch();
            }.bind(this);

            this.$Search.addEvent('keyup', searchtrigger);
            this.$Search.addEvent('change', searchtrigger);

            try {
                this.$Search.addEventListener('search', function () {
                    searchtrigger();
                });
            } catch (e) {
            }

            return this.$Elm;
        },

        /**
         * event: on inject
         */
        $onInject: function () {
            var self = this;

            if (!QUIQQER_TAGS_USE_GROUPS) {
                this.$GroupTreeElm.setStyle('display', 'none');
                this.$ListElm.setStyle('width', '100%');
                this.getTagsBySektor(this.$Select.value).then(this.$renderResult);
            } else {
                this.$SelectGroup = new GroupSelectMap({
                    Project : this.$Project,
                    multiple: false,
                    events  : {
                        onChange: function () {
                            self.getTagsBySektor(self.$Select.value).then(self.$renderResult);
                        },
                        onLoaded: function () {
                            self.getTagsBySektor(self.$Select.value).then(self.$renderResult);
                            self.$SelectGroup.select('all');
                        }
                    }
                }).inject(this.$GroupTreeElm);
            }
        },

        /**
         * Execute a search with delay 200 ms
         */
        $executeSearch: function () {
            if (this.$searchtimer) {
                clearTimeout(this.$searchtimer);
            }

            this.$searchtimer = (function () {
                this.search(this.$Search.value).then(this.$renderResult);
            }).delay(200, this);
        },

        /**
         * Search tags by the window select value
         *
         * @param {String} sektor
         * @return {Promise}
         */
        getTagsBySektor: function (sektor) {
            var groupId = null;

            if (this.$SelectGroup) {
                var groupIds = this.$SelectGroup.getSelectedGroupIds();

                if (groupIds.length) {
                    groupId = groupIds[0];
                }
            }

            return new Promise(function (resolve) {
                QUIAjax.get('package_quiqqer_tags_ajax_search_getTagsBySektor', resolve, {
                    'package': 'quiqqer/tags',
                    project  : this.$Project.encode(),
                    sektor   : sektor,
                    groupId  : groupId
                });
            }.bind(this));
        },

        /**
         * Search tags, use limit 20
         *
         * @param value
         * @returns {Promise}
         */
        search: function (value) {
            return new Promise(function (resolve) {
                QUIAjax.get('package_quiqqer_tags_ajax_search_search', resolve, {
                    'package'  : 'quiqqer/tags',
                    projectName: this.$Project.getName(),
                    projectLang: this.$Project.getLang(),
                    search     : value,
                    params     : JSON.encode({
                        limit: 20
                    })
                });
            }.bind(this));
        },

        /**
         * Return all selected tags
         *
         * @return {Array} - list of selected tags
         */
        getSelectedTags: function () {
            return Object.keys(this.$selected);
        },

        /**
         * Submit the search
         *
         * @return {Array} - list of selected tags
         */
        submit: function () {
            var selected = this.getSelectedTags();

            if (!selected.length) {
                return selected;
            }

            this.fireEvent('submit', [this, selected]);

            return selected;
        },

        /**
         * Render the tag result list
         *
         * @param {Array} result
         */
        $renderResult: function (result) {
            if (!result.length) {
                this.$Result.set(
                    'html',
                    '<div class="quiqqer-tags-search-no-result">' +
                    QUILocale.get(lg, 'control.tagcontainer.window.message.no.tags') +
                    '</div>'
                );
                return;
            }

            this.$Result.set('html', '');

            var i, len, tag, title, tagData, Tag;
            var self = this;


            var onClick = function () {
                var tag = this.get('data-tag');

                if (this.hasClass('quiqqer-tags-search-result-entry__select')) {
                    if (tag in self.$selected) {
                        delete self.$selected[tag];
                    }

                    this.removeClass('quiqqer-tags-search-result-entry__select');
                    self.fireEvent('unSelect', [self, tag]);
                    self.fireEvent('change', [self]);

                    return;
                }

                self.$selected[tag] = true;

                this.addClass('quiqqer-tags-search-result-entry__select');
                self.fireEvent('select', [self, tag]);
                self.fireEvent('change', [self]);
            };

            var onDblClick = function (event) {
                if (!self.getAttribute('dblClickSubmit')) {
                    return;
                }

                event.stop();

                self.$Result.getElements(
                    '.quiqqer-tags-search-result-entry__select'
                ).removeClass('quiqqer-tags-search-result-entry__select');

                this.addClass('quiqqer-tags-search-result-entry__select');
                self.submit();
            };

            for (i = 0, len = result.length; i < len; i++) {
                tagData = result[i];
                tag     = tagData.tag;
                title   = tag;

                if (tagData.title !== '') {
                    title = tagData.title;
                }

                Tag = new Element('div', {
                    'class'   : 'quiqqer-tags-search-result-entry',
                    html      : Mustache.render(templateSearchTag, {
                        title: title
                    }),
                    'data-tag': tag,
                    events    : {
                        click   : onClick,
                        dblclick: onDblClick
                    }
                }).inject(this.$Result);

                if (tag in this.$selected) {
                    Tag.addClass('quiqqer-tags-search-result-entry__select');
                }
            }
        }
    });
});