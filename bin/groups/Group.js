/**
 * tag group panel
 *
 * @module package/quiqqer/tags/bin/groups/Panel
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/desktop/Panel
 * @require qui/controls/buttons/Button
 * @require qui/utils/Form
 * @require Locale
 * @require Ajax
 * @require Mustache
 * @require Projects
 * @require utils/Controls
 * @require text!package/quiqqer/tags/bin/groups/Group.information.html.html
 * @require css!package/quiqqer/tags/bin/groups/Group.css
 */
define('package/quiqqer/tags/bin/groups/Group', [

    'qui/QUI',
    'qui/controls/desktop/Panel',
    'qui/controls/buttons/Button',
    'qui/utils/Form',
    'Locale',
    'Ajax',
    'Mustache',
    'Projects',
    'utils/Controls',
    'package/quiqqer/tags/bin/tags/Select',

    'text!package/quiqqer/tags/bin/groups/Group.information.html.html',
    'css!package/quiqqer/tags/bin/groups/Group.css'

], function (QUI, QUIPanel, QUIButton, QUIFormUtils, QUILocale, QUIAjax,
             Mustache, Projects, ControlUtils, Tags, templateGroupInformation) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIPanel,
        Type   : 'package/quiqqer/tags/bin/groups/Group',

        Binds: [
            'save',
            '$onCreate',
            '$onResize',
            '$onInject',
            '$openInformation',
            '$openTags',
            '$unloadData'
        ],

        options: {
            projectName: false,
            projectLang: false,
            groupId    : false
        },

        initialize: function (options) {
            this.setAttributes({
                icon: 'fa fa-tags'
            });

            this.parent(options);

            this.$data = null;

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.addEvents({
                onCreate: this.$onCreate,
                onResize: this.$onResize,
                onInject: this.$onInject
            });
        },

        /**
         * import the saved attributes and the data
         *
         * @method controls/projects/project/Panel#unserialize
         * @param {Object} data
         */
        unserialize: function (data) {
            this.parent(data);

            // must be after this.parent(), because locale must be set
            // and maybe the title comes from the serialize cache
            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );
        },

        /**
         * refresh
         */
        refresh: function () {
            this.setAttribute('title', QUILocale.get(lg, 'tag.groups.group.title', {
                id   : this.$data.id,
                group: this.$data.title
            }));

            this.parent();
        },

        /**
         * Resize the panel
         *
         * @return {Promise}
         */
        $onResize: function () {

        },

        /**
         * event : on create
         */
        $onCreate: function () {
            this.addButton({
                name     : 'save',
                text     : QUILocale.get('quiqqer/system', 'save'),
                textimage: 'fa fa-save',
                events   : {
                    onClick: this.save
                }
            });

            this.addCategory({
                name  : 'information',
                text  : QUILocale.get('quiqqer/system', 'information'),
                icon  : 'fa fa-file-o',
                events: {
                    onClick: this.$openInformation
                }
            });

            this.addCategory({
                name  : 'tags',
                text  : QUILocale.get(lg, 'control.tags.group.tagCategory'),
                icon  : 'fa fa-tags',
                events: {
                    onClick: this.$openTags
                }
            });
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            this.Loader.show();

            QUIAjax.get('package_quiqqer_tags_ajax_groups_get', function (result) {
                this.$data = result;
                this.refresh();

                this.getCategory('information').click();
            }.bind(this), {
                'package': 'quiqqer/tags',
                project  : this.$Project.encode(),
                groupId  : this.getAttribute('groupId')
            });
        },

        /**
         * save the group
         */
        save: function () {
            this.Loader.show();

            this.$unloadData();

            return new Promise(function (resolve) {

                QUIAjax.post('package_quiqqer_tags_ajax_groups_save', function () {

                    this.Loader.hide();
                    this.refresh();

                    resolve();

                }.bind(this), {
                    'package': 'quiqqer/tags',
                    project  : this.$Project.encode(),
                    groupId  : this.getAttribute('groupId'),
                    data     : JSON.encode(this.$data),
                    onError  : function () {
                        this.Loader.hide();
                    }.bind(this)
                });

            }.bind(this));
        },

        /**
         * opens th information tab
         *
         * @return {Promise}
         */
        $openInformation: function () {
            if (this.getCategory('information').isActive()) {
                return Promise.resolve();
            }

            this.Loader.show();

            return this.$unloadCategory().then(function () {
                var Content = this.getContent();

                Content.set('html', Mustache.render(templateGroupInformation, {
                    tableHeader: QUILocale.get('quiqqer/system', 'information'),
                    title      : QUILocale.get('quiqqer/system', 'title'),
                    image      : QUILocale.get('quiqqer/system', 'image'),
                    desc       : QUILocale.get('quiqqer/system', 'description')
                }));

                QUIFormUtils.setDataToForm({
                    title: this.$data.title,
                    image: this.$data.image,
                    desc : this.$data.desc
                }, Content.getElement('form'));

                return ControlUtils.parse(Content).then(function () {
                    QUI.Controls.getControlsInElement(Content).each(function (Control) {
                        if ("setProject" in Control) {
                            Control.setProject(this.$Project);
                        }

                        Control.addEvent('change', this.$unloadData);
                    }.bind(this));

                    this.$loadCategory();
                    this.Loader.hide();
                }.bind(this));
            }.bind(this));
        },

        /**
         * Show the group tags
         */
        $openTags: function () {
            if (this.getCategory('tags').isActive()) {
                return Promise.resolve();
            }

            this.Loader.show();

            return this.$unloadCategory().then(function () {
                var self    = this,
                    Content = this.getContent();

                Content.set(
                    'html',
                    '<div class="quiqqer-tags-group-container"></div>'
                );

                var Container = Content.getElement('.quiqqer-tags-group-container');

                Container.setStyles({
                    height: '100%'
                });

                var TagContainer = new Tags({
                    projectName: this.$Project.getName(),
                    projectLang: this.$Project.getLang(),
                    styles     : {
                        height: '100%'
                    },
                    events     : {
                        onChange: function (TC) {
                            self.$data.tags = TC.getValue();
                        }
                    }
                }).inject(Container);

                if (this.$data.tags.length) {
                    TagContainer.addTags(this.$data.tags.split(','));
                }

                this.$loadCategory();
                this.Loader.hide();
            }.bind(this));
        },

        /**
         * unload current category
         *
         * @returns {Promise}
         */
        $unloadCategory: function () {
            return new Promise(function (resolve) {
                this.$unloadData();

                var Container = this.getContent().getElement(
                    '.quiqqer-tags-group-container'
                );

                if (!Container) {
                    return resolve();
                }

                moofx(Container).animate({
                    opacity: 0,
                    top    : -50
                }, {
                    duration: 250,
                    callback: function () {
                        QUI.Controls.getControlsInElement(Container).each(function (Control) {
                            Control.destroy();
                        });

                        resolve();
                    }
                });
            }.bind(this));
        },

        /**
         * animated container display
         *
         * @returns {Promise}
         */
        $loadCategory: function () {
            return new Promise(function (resolve) {
                var Container = this.getContent().getElement(
                    '.quiqqer-tags-group-container'
                );

                Container.setStyle('top', -50);

                moofx(Container).animate({
                    opacity: 1,
                    top    : 0
                }, {
                    duration: 250,
                    callback: resolve
                });
            }.bind(this));
        },

        /**
         * unload data from category
         */
        $unloadData: function () {
            var Form = this.getContent().getElement('form'),
                data = QUIFormUtils.getFormData(Form);

            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    this.$data[key] = data[key];
                }
            }
        }
    });
});
