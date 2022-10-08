/**
 * @module package/quiqqer/tags/bin/frontend/groups/WindowSearch
 * @author www.pcsg.de (Henning Leutz)
 */
define('package/quiqqer/tags/bin/frontend/groups/WindowSearch', [

    'qui/QUI',
    'qui/controls/windows/Confirm',
    'Locale',
    'Ajax',
    'Mustache',

    'text!package/quiqqer/tags/bin/frontend/groups/WindowSearch.html',
    'css!package/quiqqer/tags/bin/frontend/groups/WindowSearch.css'

], function (QUI, QUIConfirm, QUILocale, QUIAjax, Mustache, template) {
    "use strict";

    const lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIConfirm,
        Type   : 'package/quiqqer/tags/bin/frontend/groups/WindowSearch',

        Binds: [
            '$onOpen',
            '$onGroupClick'
        ],

        options: {
            groupId  : false,
            maxHeight: 550,
            maxWidth : 750,
            suggests : true
        },

        initialize: function (options) {
            this.setAttributes({
                searchTitle: QUILocale.get(lg, 'window.tag.group.search.title')
            });

            this.parent(options);

            this.$Suggests = null;
            this.$Selected = null;
            this.$Groups = null;
            this.$Select = null;

            this.addEvents({
                onOpen: this.$onOpen
            });
        },

        $onOpen: function () {
            if (!this.getAttribute('groupId')) {
                this.close();
                return;
            }

            this.Loader.show();
            this.getContent().addClass('quiqqer-tags-group-window-search');

            this.getContent().set('html', Mustache.render(template, {
                suggestsTitle: QUILocale.get(lg, 'window.tag.group.search.suggest'),
                selectedTitle: QUILocale.get(lg, 'window.tag.group.search.selected'),
                searchTitle  : this.getAttribute('searchTitle')
            }));

            this.$SubmitButton = QUI.Controls.getById(
                this.$Buttons.getElement('button[name="submit"]').get('data-quiid')
            );

            this.$SubmitButton.setAttribute('text', QUILocale.get(lg, 'window.tag.group.search.selected.button'));
            this.$SubmitButton.disable();

            this.$SelectedContainer = this.getContent().getElement(
                '.quiqqer-tags-group-window-search-selectedContainer'
            );
            this.$SelectedContainer.setStyle('display', 'none');
            this.$Selected = this.getContent().getElement('.quiqqer-tags-group-window-search-selected');

            QUI.parse(this.getContent()).then(() => {
                this.$Select = QUI.Controls.getById(
                    this.getContent().getElement('[data-qui="package/quiqqer/tags/bin/frontend/groups/Select"]').get('data-quiid')
                );

                this.$Select.addEvent('select', (Instance, value) => {
                    this.$select(value);
                });

                this.$Select.setGroup(this.getAttribute('groupId'));
                this.$Select.getElm().setStyle('width', '100%');

                if (!this.getAttribute('suggests')) {
                    this.getContent().getElement('.quiqqer-tags-group-window-search-suggestsContainer').setStyle('display', 'none');
                    this.Loader.hide();
                    return;
                }

                this.$Suggests = this.getContent().getElement('.quiqqer-tags-group-window-search-suggests');
                this.$Groups = this.getContent().getElement('.quiqqer-tags-group-window-search-groups');

                Promise.all([
                    this.getTagsFromGroup(),
                    this.getGroupsFromGroup()
                ]).then((result) => {
                    const tags = result[0];
                    const groups = result[1];

                    if (!tags.length) {
                        console.error('Group has no tags');
                        this.close();
                        return;
                    }

                    // show first 10 tags
                    let i, len;

                    for (i = 0, len = tags.length; i < len; i++) {
                        new Element('div', {
                            'class'   : 'quiqqer-tags-group-window-search-suggests-entry',
                            'data-tag': tags[i].tag,
                            html      : tags[i].title
                        }).inject(this.$Suggests);
                    }

                    // show sub groups
                    if (groups.length) {
                        new Element('div', {
                            'class'   : 'quiqqer-tags-group-window-search-suggests-entry',
                            'data-tag': this.getAttribute('groupId'),
                            html      : QUILocale.get(lg, 'window.tag.group.search.all.tags'),
                            events    : {
                                click: this.$onGroupClick
                            }
                        }).inject(this.$Groups);

                        for (i = 0, len = groups.length; i < len; i++) {
                            new Element('div', {
                                'class'   : 'quiqqer-tags-group-window-search-suggests-entry',
                                'data-tag': groups[i].id,
                                html      : groups[i].title,
                                events    : {
                                    click: this.$onGroupClick
                                }
                            }).inject(this.$Groups);
                        }
                    }

                    this.Loader.hide();
                }).catch((e) => {
                    console.error(e);
                    this.close();
                });
            });
        },

        submit: function () {
            const nodes = this.$Selected.getElements('.quiqqer-tags-group-window-search-suggests-entry');
            const tags = nodes.map(function (Node) {
                return Node.get('data-tag');
            });

            if (!nodes.length) {
                return;
            }

            this.fireEvent('submit', [
                this,
                tags
            ]);

            if (this.getAttribute('autoclose')) {
                this.close();
            }
        },

        $onGroupClick: function (event) {
            event.stop();

            this.$Groups.getElements(
                '.quiqqer-tags-group-window-search-suggests-entry'
            ).removeClass(
                'quiqqer-tags-group-window-search-suggests-entry--active'
            );

            event.target.addClass('quiqqer-tags-group-window-search-suggests-entry--active');
            this.$Select.setGroup(event.target.get('data-tag'));
        },

        $select: function (tag) {
            if (this.$Selected.getElement('[ndata-tag="' + tag + '"]')) {
                return;
            }

            this.Loader.show();

            this.getTag(tag).then((result) => {
                new Element('div', {
                    'class'   : 'quiqqer-tags-group-window-search-suggests-entry',
                    'data-tag': result.tag,
                    html      : result.title
                }).inject(this.$Selected);

                this.$SubmitButton.setAttribute('text', QUILocale.get(lg, 'window.tag.group.search.selected.button.count', {
                    count: this.$Selected.getElements('.quiqqer-tags-group-window-search-suggests-entry').length
                }));

                this.$SubmitButton.enable();

                this.$SelectedContainer.setStyle('display', '');
                this.$Select.setValue('');
                this.Loader.hide();
            });
        },

        //region ajax

        /**
         * Return the tags from the tag group
         *
         * @returns {Promise}
         */
        getTagsFromGroup: function () {
            return new Promise((resolve, reject) => {
                QUIAjax.get('package_quiqqer_tags_ajax_groups_search_getTagsByGroup', resolve, {
                    'package': 'quiqqer/tags',
                    groupId  : this.getAttribute('groupId'),
                    recursive: 1,
                    onError  : reject
                });
            });
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
                    groupId  : this.getAttribute('groupId'),
                    recursive: 1,
                    onError  : reject
                });
            });
        },

        getTag: function (tag) {
            return new Promise((resolve, reject) => {
                QUIAjax.get('package_quiqqer_tags_ajax_tag_get', resolve, {
                    'package'  : 'quiqqer/tags',
                    tag        : tag,
                    projectName: QUIQQER_PROJECT.name,
                    projectLang: QUIQQER_PROJECT.lang,
                    onError    : reject
                });
            });
        },

        //endregion
    });
});
