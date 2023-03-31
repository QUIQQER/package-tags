/**
 * @module package/quiqqer/tags/bin/frontend/groups/ContainerSelect
 * @author www.pcsg.de (Henning Leutz)
 */
define('package/quiqqer/tags/bin/frontend/groups/ContainerSelect', [

    'qui/QUI',
    'qui/controls/Control',
    'package/quiqqer/tags/bin/frontend/tags/Tag',
    URL_OPT_DIR + 'bin/quiqqer-asset/animejs/animejs/lib/anime.min.js',
    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/frontend/groups/ContainerSelect.css'

], function (QUI, QUIControl, Tag, animejs, QUIAjax, QUILocale) {
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
            'group-label'      : false,
            'tag-label'        : false,
            'selected-label'   : false,
            'group-auto-select': true
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
                'class': 'quiqqer-tags-containerSelect-tags',
                styles : {
                    display: 'none'
                }
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
                    this.openTags();
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

                if (this.getAttribute('group-auto-select')) {
                    this.$Groups.getElement('.quiqqer-tags-containerSelect-groups-entry').click();
                }
            });
        },

        /**
         * refresh the tags, fetch the tags from the parent group
         *
         * @return {Promise<unknown>}
         */
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

        /**
         * reads the input value and set tha tags
         */
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

        /**
         * refresh the value to the input
         */
        $refreshTagValues: function () {
            let tags = this.$Selected.getElements('[data-tag]').map(function (Node) {
                return Node.get('data-tag');
            });

            this.$Input.value = tags.join(',');
        },

        /**
         * add a tag
         *
         * @param tag
         * @return {*}
         */
        addTag: function (tag) {
            if (this.$Selected.getElement('.quiqqer-tags-containerSelect--empty')) {
                this.$Selected.getElement('.quiqqer-tags-containerSelect--empty').destroy();
            }

            if (this.$Selected.getElement('[data-tag="' + tag + '"]')) {
                return;
            }

            if (!this.$Selected.getElement('.quiqqer-tags-containerSelect-selectedTags-label')) {
                let label = QUILocale.get(lg, 'window.tag.group.search.selectLabel');

                if (this.getAttribute('selected-label')) {
                    label = this.getAttribute('selected-label');
                }

                new Element('div', {
                    'class': 'quiqqer-tags-containerSelect-selectedTags-label',
                    html   : label
                }).inject(this.$Selected);
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
                        deletable: true,
                        events   : {
                            onDelete: () => {
                                this.$refreshTagValues();
                                this.readTagValues();
                            }
                        }
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

            this.$Groups.setStyles({
                height  : this.$Groups.getSize().y,
                overflow: 'hidden'
            });

            this.closeGroups().then(() => {
                this.refreshTags();
                return this.openTags();
            }).then(() => {
                this.fireEvent('groupSelect', [this]);
            });
        },

        /**
         * opens the groups
         * @return {Promise<*>}
         */
        openGroups: function () {
            let label = QUILocale.get(lg, 'window.tag.group.search.tagLabel');
            let Label = this.$Groups.getElement('.quiqqer-tags-containerSelect-groups-label');
            let entries = this.$Groups.querySelectorAll('.quiqqer-tags-containerSelect-groups-entry');

            if (this.getAttribute('tag-label')) {
                label = this.getAttribute('tag-label');
            }

            Label.set({
                html: label
            });

            entries.forEach(function (Node) {
                Node.removeClass('quiqqer-tags-containerSelect-groups-entry--active');
            });

            return this.$animate(entries, {
                opacity: 1
            }).then(() => {
                const scrollSize = this.$Groups.getScrollSize();

                return this.$animate(this.$Groups, {
                    height: scrollSize.y
                });
            }).then(() => {
                this.$Groups.setStyle('height', null);
                this.$Groups.setStyle('paddingBottom', null);
                this.$Groups.setStyle('overflow', null);
            });
        },

        /**
         * closes the groups
         * @return {*}
         */
        closeGroups: function () {
            this.$animate(
                this.$Groups.querySelectorAll('.quiqqer-tags-containerSelect-groups-entry'),
                {opacity: 0}
            );

            const group = this.getAttribute('selectedGroup');
            const Group = this.$Groups.getElement('[data-tag="' + group + '"]');

            const Label = this.$Groups.getElement('.quiqqer-tags-containerSelect-groups-label');
            let label = QUILocale.get(lg, 'window.tag.group.search.tagLabel');

            if (this.getAttribute('tag-label')) {
                label = this.getAttribute('tag-label');
            }

            Label.set({
                html  : '< ' + label + ' (' + Group.get('html') + ')',
                styles: {
                    cursor: 'pointer'
                },
                events: {
                    click: () => {
                        this.closeTags().then(() => {
                            this.openGroups();
                        });
                    }
                }
            });

            return this.$animate(this.$Groups, {
                height       : 25,
                paddingBottom: 0
            });
        },

        /**
         * opens the tag section
         * @return {Promise<unknown>}
         */
        openTags: function () {
            this.$Tags.setStyle('opacity', 0);
            this.$Tags.setStyle('display', null);

            return this.$animate(this.$Tags, {
                height : this.$Tags.getScrollSize().y,
                opacity: 1
            }).then(() => {
                this.$Tags.setStyle('height', null);
            });
        },

        /**
         * closes the tag section
         * @return {Promise<unknown>}
         */
        closeTags: function () {
            return this.$animate(this.$Tags, {
                height : 0,
                opacity: 0,
            }).then(() => {
                this.$Tags.setStyle('display', 'none');
            });
        },

        /**
         * event: on tag click -> adds the tag to the values
         * @param event
         */
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

            return new Promise((resolve, reject) => {
                QUIAjax.get('package_quiqqer_tags_ajax_groups_search_getTagsByGroup', resolve, {
                    'package': 'quiqqer/tags',
                    groupId  : group,
                    recursive: 1,
                    onError  : reject
                });
            });
        },

        /**
         * animation helper
         *
         * @param Target
         * @param options
         * @return {*}
         */
        $animate: function (Target, options) {
            return new Promise(function (resolve) {
                options = options || {};
                options.targets = Target;
                options.complete = resolve;
                options.duration = options.duration || 250;
                options.easing = options.easing || 'easeInQuad';

                animejs(options);
            });
        }
    });
});
