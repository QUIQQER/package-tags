/**
 * tag group panel
 *
 * @module package/quiqqer/tags/bin/groups/Panel
 * @author www.pcsg.de (Henning Leutz)
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
    'package/quiqqer/tags/bin/groups/Select',

    'text!package/quiqqer/tags/bin/groups/Group.information.html',
    'css!package/quiqqer/tags/bin/groups/Group.css'

], function (QUI, QUIPanel, QUIButton, QUIFormUtils, QUILocale, QUIAjax,
             Mustache, Projects, ControlUtils, Tags, GroupSelect, templateGroupInformation) {
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

            this.$data              = null;
            this.$ParentGroupSelect = null;

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
                text     : QUILocale.get('quiqqer/core', 'save'),
                textimage: 'fa fa-save',
                events   : {
                    onClick: this.save
                }
            });

            this.addCategory({
                name  : 'information',
                text  : QUILocale.get('quiqqer/core', 'information'),
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

            this.$unloadData().then(function () {
                return new Promise(function (resolve) {
                    QUIAjax.post('package_quiqqer_tags_ajax_groups_save', function (newGroupData) {
                        this.Loader.hide();

                        if (newGroupData) {
                            this.$data = newGroupData;
                            this.$ParentGroupSelect.addItem(this.$data.parentId ? this.$data.parentId : 'all');
                        }

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

            }.bind(this)).catch(function () {
                // nothing
            });
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
                    tableHeader : QUILocale.get('quiqqer/core', 'information'),
                    title       : QUILocale.get('quiqqer/core', 'title'),
                    workingtitle: QUILocale.get('quiqqer/core', 'workingtitle'),
                    project     : QUILocale.get('quiqqer/core', 'project'),
                    image       : QUILocale.get('quiqqer/core', 'image'),
                    desc        : QUILocale.get('quiqqer/core', 'description'),
                    priority    : QUILocale.get('quiqqer/core', 'priority'),
                    parent      : QUILocale.get('quiqqer/tags', 'tag.groups.panel.template.parent')
                }));

                QUIFormUtils.setDataToForm({
                    title       : this.$data.title,
                    workingtitle: this.$data.workingtitle,
                    image       : this.$data.image,
                    desc        : this.$data.desc,
                    priority    : this.$data.priority
                }, Content.getElement('form'));

                var ProjectContainer = Content.getElement('.quiqqer-tags-group-project'),
                    projectFlag      = '<img src="' + URL_BIN_DIR + '16x16/flags/' + this.$Project.getLang() + '.png" />',
                    projectText      = projectFlag + this.$Project.getName();

                ProjectContainer.set('html', projectText);

                this.$ParentGroupSelect = new GroupSelect({
                    projectName: this.$Project.getName(),
                    projectLang: this.$Project.getLang(),
                    multiple   : false,
                    max        : 1
                }).inject(
                    Content.getElement('.quiqqer-tags-group-parent')
                );

                if (!this.$data.parentId) {
                    this.$ParentGroupSelect.addItem('all');
                } else {
                    this.$ParentGroupSelect.addItem(this.$data.parentId);
                }

                return ControlUtils.parse(Content).then(function () {
                    QUI.Controls.getControlsInElement(Content).each(function (Control) {
                        if ("setProject" in Control) {
                            Control.setProject(this.$Project);
                        }

                        //Control.addEvent('change', this.$unloadData);
                    }.bind(this));

                    this.$loadCategory();
                    this.Loader.hide();
                }.bind(this));

            }.bind(this)).catch(function () {
                this.Loader.hide();
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
                    projectName      : this.$Project.getName(),
                    projectLang      : this.$Project.getLang(),
                    considerMaxAmount: false,
                    allowDuplicates  : false,
                    styles           : {
                        height: '100%'
                    },
                    events           : {
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

            }.bind(this)).catch(function () {

                this.getCategory('information').setActive();
                this.Loader.hide();
            }.bind(this));
        },

        /**
         * unload current category
         *
         * @returns {Promise}
         */
        $unloadCategory: function () {
            return this.$unloadData().then(function () {
                var Container = this.getContent().getElement(
                    '.quiqqer-tags-group-container'
                );

                return new Promise(function (resolve) {
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
                                if (Control.getType() == 'package/quiqqer/tags/bin/groups/Select') {
                                    return;
                                }

                                Control.destroy();
                            });

                            resolve();
                        }
                    });

                }.bind(this));
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
         *
         * @return {Promise}
         */
        $unloadData: function () {
            return new Promise(function (resolve, reject) {
                var Form = this.getContent().getElement('form'),
                    data = QUIFormUtils.getFormData(Form);

                if (!Form) {
                    return resolve();
                }

                for (var i = 0, len = Form.elements.length; i < len; i++) {
                    if (!("checkValidity" in Form.elements[i])) {
                        continue;
                    }

                    if (Form.elements[i].checkValidity()) {
                        continue;
                    }

                    // chrome validate message
                    if ("reportValidity" in Form.elements[i]) {
                        Form.elements[i].reportValidity();
                        reject(Form.elements[i].validationMessage);
                        return;
                    }
                }

                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        this.$data[key] = data[key];
                    }
                }

                if (this.$ParentGroupSelect) {
                    this.$data.parentId = this.$ParentGroupSelect.getTagGroupIds();
                }

                resolve();

            }.bind(this));
        }
    });
});
