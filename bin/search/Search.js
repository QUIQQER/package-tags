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

    'text!package/quiqqer/tags/bin/search/Search.html',
    'text!package/quiqqer/tags/bin/search/Search.Tag.html',
    'css!package/quiqqer/tags/bin/search/Search.css'

], function (QUI, QUIControl, QUILocale, QUIAjax, Projects, Mustache, templateSearch, templateSearchTag) {
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
            projectName: false,
            projectLang: false
        },

        initialize: function (options) {
            this.parent(options);

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.$Select = null;
            this.$Result = null;

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
                html   : templateSearch
            });

            this.$Select = this.$Elm.getElement('.quiqer-tags-search-select');
            this.$Result = this.$Elm.getElement('.quiqer-tags-search-result');

            this.$Select.addEvent('change', function (event) {
                this.getTagsBySektor(event.target.value).then(this.$renderResult);
            }.bind(this));

            return this.$Elm;
        },

        /**
         * event: on inject
         */
        $onInject: function () {
            this.getTagsBySektor(this.$Select.value).then(this.$renderResult);
        },

        /**
         * Search tags by the window select value
         *
         * @param {String} sektor
         * @return {Promise}
         */
        getTagsBySektor: function (sektor) {
            return new Promise(function (resolve) {
                QUIAjax.get('package_quiqqer_tags_ajax_search_getTagsBySektor', resolve, {
                    'package': 'quiqqer/tags',
                    project  : this.$Project.encode(),
                    sektor   : sektor
                });
            }.bind(this));
        },

        /**
         * Return all selected tags
         *
         * @return {Array} - list of selected tags
         */
        getSelectedTags: function () {
            return this.$Result.getElements(
                '.quiqer-tags-search-result-entry__select'
            ).map(function (Elm) {
                return Elm.get('data-tag');
            });
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

            var i, len, tag, title, tagData;
            var self = this;


            var onClick = function () {
                if (this.hasClass('quiqer-tags-search-result-entry__select')) {
                    this.removeClass('quiqer-tags-search-result-entry__select');
                    self.fireEvent('unSelect', [self, this.get('data-tag')]);
                } else {
                    this.addClass('quiqer-tags-search-result-entry__select');
                    self.fireEvent('select', [self, this.get('data-tag')]);
                }

                self.fireEvent('change', [self]);
            };

            var onDblClick = function (event) {
                event.stop();

                self.$Result.getElements(
                    '.quiqer-tags-search-result-entry__select'
                ).removeClass('quiqer-tags-search-result-entry__select');

                this.addClass('quiqer-tags-search-result-entry__select');
                self.submit();
            };


            for (i = 0, len = result.length; i < len; i++) {
                tagData = result[i];
                tag     = tagData.tag;
                title   = tag;

                if (tagData.title !== '') {
                    title = tagData.title;
                }

                new Element('div', {
                    'class'   : 'quiqer-tags-search-result-entry',
                    html      : Mustache.render(templateSearchTag, {
                        title: title
                    }),
                    'data-tag': tag,
                    events    : {
                        click   : onClick,
                        dblclick: onDblClick
                    }
                }).inject(this.$Result);
            }
        }
    });
});