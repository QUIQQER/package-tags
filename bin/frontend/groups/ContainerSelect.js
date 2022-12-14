/**
 * @module package/quiqqer/tags/bin/frontend/groups/ContainerSelect
 * @author www.pcsg.de (Henning Leutz)
 */
define('package/quiqqer/tags/bin/frontend/groups/ContainerSelect', [

    'qui/QUI',
    'qui/controls/Control',
    'package/quiqqer/tags/bin/frontend/tags/Tag',
    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/frontend/groups/ContainerSelect.css'

], function (QUI, QUIControl, Tag, QUIAjax, QUILocale) {
    "use strict";

    const lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/frontend/groups/ContainerSelect',

        Binds: [
            '$onImport',
            '$onGroupClick',
            '$onTagClick'
        ],

        options: {
            'group-label': false,
            'tag-label'  : false,
        },

        initialize: function (options) {
            this.parent(options);

            this.$Input = null;
            this.$Groups = null;
            this.$Tags = null;

            this.addEvents({
                onImport: this.$onImport
            });
        },

        $onInject: function () {


        },

        $onImport: function () {
            this.$Input = this.getElm();
            this.$Input.type = 'hidden';

            this.$Container = new Element('div', {
                'class': 'quiqqer-tags-containerSelect'
            }).wraps(this.$Input);

            this.$Groups = new Element('div', {
                'class': 'quiqqer-tags-containerSelect-groups'
            }).inject(this.$Container);

            this.$Tags = new Element('div', {
                'class': 'quiqqer-tags-containerSelect-tags'
            }).inject(this.$Container);

            this.$Selected = new Element('div', {
                'class': 'quiqqer-tags-containerSelect-selected'
            }).inject(this.$Container);

            this.readTagValues();
        },

        /**
         * Set the tag group
         * - only tags from this group are displayed
         *
         * @param {Number} groupId
         * @return {Promise}
         */
        setGroup: function (groupId) {
            this.setAttribute('group', groupId);
            this.$Groups.set('html', '');

            let groupLabel = QUILocale.get(lg, 'window.tag.group.search.groupLabel');

            if (this.getAttribute('group-label')) {
                groupLabel = this.getAttribute('group-label');
            }

            new Element('div', {
                'class': 'quiqqer-tags-containerSelect-groups-label',
                html   : groupLabel
            }).inject(this.$Groups);


            return this.getGroupsFromGroup().then((groups) => {
                if (!groups.length) {
                    this.$Groups.setStyle('display', 'none');
                    this.refreshTags();
                    return;
                }

                for (let i = 0, len = groups.length; i < len; i++) {
                    new Element('div', {
                        'class'   : 'quiqqer-tags-containerSelect-groups-entry',
                        'data-tag': groups[i].id,
                        html      : groups[i].title,
                        events    : {
                            click: this.$onGroupClick
                        }
                    }).inject(this.$Groups);
                }

                this.$Groups.getElement('.quiqqer-tags-containerSelect-groups-entry').click();
            });
        },

        refreshTags: function () {
            this.$Tags.set('html', '');

            let label = QUILocale.get(lg, 'window.tag.group.search.tagLabel');

            if (this.getAttribute('tag-label')) {
                label = this.getAttribute('tag-label');
            }

            new Element('div', {
                'class': 'quiqqer-tags-containerSelect-groups-label',
                html   : label
            }).inject(this.$Tags);

            return this.getTagsFromGroup().then((tags) => {
                for (let i = 0, len = tags.length; i < len; i++) {
                    new Element('div', {
                        'class'   : 'quiqqer-tags-containerSelect-tags-entry',
                        'data-tag': tags[i].tag,
                        html      : '<span class="fa fa-plus"></span>' +
                                    '<span>' + tags[i].title + '</span>',
                        events    : {
                            click: this.$onTagClick
                        }
                    }).inject(this.$Tags);
                }
            });
        },

        readTagValues: function () {
            let tags = this.$Input.value;

            if (tags === '') {
                this.$Selected.set('html', '');

                new Element('div', {
                    'class': 'quiqqer-tags-containerSelect--empty',
                    html   : QUILocale.get(lg, 'window.tag.no.tags.selected')
                }).inject(this.$Selected);

                return;
            }

            tags.split(',').forEach((tag) => {
                this.addTag(tag);
            });
        },

        $refreshTagValues: function () {
            let tags = this.$Selected.getElements('[data-tag]').map(function (Node) {
                return Node.get('data-tag');
            });

            this.$Input.value = tags.join(',');
        },

        addTag: function (tag) {
            if (this.$Selected.getElement('.quiqqer-tags-containerSelect--empty')) {
                this.$Selected.getElement('.quiqqer-tags-containerSelect--empty').destroy();
            }

            if (this.$Selected.getElement('[data-tag="' + tag + '"]')) {
                return;
            }

            return new Promise((resolve, reject) => {
                QUIAjax.get([
                    'package_quiqqer_tags_ajax_tag_exists',
                    'package_quiqqer_tags_ajax_tag_getData'
                ], (tagExists, TagData) => {
                    if (!tagExists) {
                        reject();
                        return;
                    }

                    new Tag({
                        tag      : TagData.tag,
                        deletable: true
                    }).inject(this.$Selected);

                    this.$refreshTagValues();

                    resolve();
                }, {
                    'package'  : 'quiqqer/tags',
                    projectName: QUIQQER_PROJECT.name,
                    projectLang: QUIQQER_PROJECT.lang,
                    tag        : tag,
                    showError  : false
                });
            });
        },

        $onGroupClick: function (event) {
            event.stop();

            this.$Groups
                .getElements('.quiqqer-tags-containerSelect-groups-entry')
                .removeClass('quiqqer-tags-containerSelect-groups-entry--active');

            event.target.addClass('quiqqer-tags-containerSelect-groups-entry--active');

            this.setAttribute('selectedGroup', event.target.get('data-tag'));
            this.refreshTags();
        },

        $onTagClick: function (event) {
            let Target = event.target;

            if (!Target.hasClass('quiqqer-tags-containerSelect-tags-entry')) {
                Target = Target.getParent('.quiqqer-tags-containerSelect-tags-entry');
            }

            this.addTag(Target.get('data-tag'));
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
        },

        /**
         * Return the tags from the tag group
         *
         * @returns {Promise}
         */
        getTagsFromGroup: function () {
            let group = this.getAttribute('selectedGroup');

            if (!group) {
                group = this.getAttribute('group');
            }
            console.log(group, '-');

            return new Promise((resolve, reject) => {
                QUIAjax.get('package_quiqqer_tags_ajax_groups_search_getTagsByGroup', resolve, {
                    'package': 'quiqqer/tags',
                    groupId  : group,
                    recursive: 1,
                    onError  : reject
                });
            });
        }
    });
});
