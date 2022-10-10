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
    'package/quiqqer/tags/bin/frontend/tags/Tag',

    'text!package/quiqqer/tags/bin/frontend/groups/WindowSearch.html',
    'css!package/quiqqer/tags/bin/frontend/groups/WindowSearch.css'

], function (QUI, QUIConfirm, QUILocale, QUIAjax, Mustache, Tag, template) {
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
            groupId     : false,
            maxHeight   : 550,
            maxWidth    : 750,
            suggestions : true,
            selected    : false,
            emptyAllowed: false
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
            this.getContent().setStyle('padding', 0);

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

            if (this.getAttribute('selected')) {
                const selected = this.getAttribute('selected');

                if (typeOf(selected) === 'array') {
                    selected.forEach((tag) => {
                        this.$select(tag);
                    });
                }
            }

            QUI.parse(this.getContent()).then(() => {
                this.$Select = QUI.Controls.getById(
                    this.getContent().getElement('[data-qui="package/quiqqer/tags/bin/frontend/groups/Select"]').get('data-quiid')
                );

                this.$Select.addEvent('select', (Instance, value) => {
                    if (value !== '') {
                        this.$select(value);
                    }
                });

                this.$Select.setGroup(this.getAttribute('groupId'));
                this.$Select.getElm().setStyle('width', '100%');

                this.$Suggests = this.getContent().getElement('.quiqqer-tags-group-window-search-suggests');
                this.$Groups = this.getContent().getElement('.quiqqer-tags-group-window-search-groups');

                if (!this.getAttribute('suggestions')) {
                    this.getContent().getElement(
                        '.quiqqer-tags-group-window-search-suggestsContainer'
                    ).setStyle('display', 'none');
                }


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
                        const All = new Element('div', {
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

                        All.click();
                    }

                    this.Loader.hide();
                }).catch((e) => {
                    console.error(e);
                    this.close();
                });
            });
        },

        submit: function () {
            const nodes = this.$Selected.getElements('.quiqqer-tags-tag');
            const tags = nodes.map(function (Node) {
                return Node.get('data-tag');
            });

            if (!nodes.length && !this.getAttribute('emptyAllowed')) {
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
            if (this.$Select) {
                this.$Select.setValue('');
            }

            if (this.$Selected.getElement('[data-tag="' + tag + '"]')) {
                return;
            }

            new Tag({
                tag      : tag,
                deletable: true,
                events   : {
                    onDelete: () => {
                        this.$refresh();
                    }
                }
            }).inject(this.$Selected);

            this.$SubmitButton.setAttribute('text', QUILocale.get(lg, 'window.tag.group.search.selected.button.count', {
                count: this.$Selected.getElements('.quiqqer-tags-tag').length
            }));

            this.$SubmitButton.enable();
            this.$SelectedContainer.setStyle('display', '');
        },

        $refresh: function () {
            const tags = this.$Selected.getElements('quiqqer-tags-tag');

            if (this.$Select) {
                this.$Select.setValue('');
            }

            if (!tags.length) {
                this.$SelectedContainer.setStyle('display', 'none');

                if (!this.getAttribute('emptyAllowed')) {
                    this.$SubmitButton.disable();
                }

                this.$SubmitButton.setAttribute('text', QUILocale.get(lg, 'window.tag.group.search.selected.button'));
                return;
            }

            this.$SubmitButton.setAttribute('text', QUILocale.get(lg, 'window.tag.group.search.selected.button.count', {
                count: this.$Selected.getElements('.quiqqer-tags-tag').length
            }));

            this.$SubmitButton.enable();
            this.$SelectedContainer.setStyle('display', '');
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
