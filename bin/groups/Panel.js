/**
 * tag groups panel
 *
 * @module package/quiqqer/tags/bin/groups/Panel
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/desktop/Panel
 * @require qui/controls/buttons/Button
 * @require qui/controls/windows/Confirm
 * @require controls/grid/Grid
 * @require controls/projects/Select
 * @require Locale
 * @require Ajax
 * @require Mustache
 * @require text!package/quiqqer/tags/bin/groups/Panel.createGroup.html
 * @require css!package/quiqqer/tags/bin/groups/Panel.css
 */
define('package/quiqqer/tags/bin/groups/Panel', [

    'qui/QUI',
    'qui/controls/desktop/Panel',
    'qui/controls/buttons/Button',
    'qui/controls/windows/Confirm',
    'controls/grid/Grid',
    'controls/projects/Select',
    'Locale',
    'Ajax',
    'Mustache',
    'Projects',

    'text!package/quiqqer/tags/bin/groups/Panel.createGroup.html',
    'css!package/quiqqer/tags/bin/groups/Panel.css'

], function (QUI, QUIPanel, QUIButton, QUIConfirm, Grid, ProjectSelect, QUILocale, QUIAjax, Mustache, Projects, templateCreateGroup) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIPanel,
        Type   : 'package/quiqqer/tags/bin/groups/Panel',

        Binds: [
            'refresh',
            '$onCreate',
            '$onResize',
            '$onInject',
            'dataRefresh',
            'openCreateGroupDialog'
        ],

        options: {
            sortOn : false,
            sortBy : false,
            perPage: 150,
            page   : false
        },

        initialize: function (options) {
            this.setAttributes({
                title: QUILocale.get(lg, 'tag.groups.panel.title')
            });

            this.parent(options);

            this.$Grid    = null;
            this.$Project = null;

            this.$Projects = new ProjectSelect({
                emptyselect: false,
                events     : {
                    onChange: function (value) {
                        this.$setValue(value);
                        this.dataRefresh()
                    }.bind(this),
                    onLoad  : function (Select) {
                        this.$setValue(Select.getValue());
                        this.dataRefresh().then(function () {
                            this.Loader.hide();
                        }.bind(this));
                    }.bind(this)
                }
            });

            this.addEvents({
                onCreate: this.$onCreate,
                onResize: this.$onResize,
                onInject: this.$onInject
            });
        },

        /**
         * Set internal project select value
         *
         * @param {string} selectValue
         */
        $setValue: function (selectValue) {
            var values    = selectValue.split(',');
            this.$Project = Projects.get(values[0], values[1]);
        },

        /**
         * Resize the panel
         *
         * @return {Promise}
         */
        $onResize: function () {
            var Content  = this.getContent(),
                size     = Content.getSize(),
                computed = Content.getComputedSize();

            var paddingX = computed['padding-left'] + computed['padding-right'],
                paddingY = computed['padding-top'] + computed['padding-bottom'];

            return Promise.all([
                this.$Grid.setHeight(size.y - paddingY),
                this.$Grid.setWidth(size.x - paddingX)
            ]);
        },

        /**
         * event : on create
         */
        $onCreate: function () {
            this.addButton(this.$Projects);

            this.addButton({
                type: 'seperator'
            });

            // buttons
            this.addButton({
                name     : 'add',
                text     : QUILocale.get('quiqqer/system', 'add'),
                textimage: 'fa fa-plus',
                events   : {
                    onClick: this.openCreateGroupDialog
                }
            });

            this.addButton({
                name     : 'edit',
                text     : QUILocale.get('quiqqer/system', 'edit'),
                textimage: 'fa fa-edit',
                disabled : true,
                events   : {
                    onClick: function () {

                    }
                }
            });

            this.addButton({
                type: 'seperator'
            });

            this.addButton({
                name     : 'delete',
                text     : QUILocale.get('quiqqer/system', 'delete'),
                textimage: 'fa fa-trash',
                disabled : true,
                events   : {
                    onClick: function () {

                    }
                }
            });
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            this.Loader.show();

            var GridContainer = new Element('div', {
                style: {
                    'float': 'left',
                    height : '100%',
                    width  : '100%'
                }
            }).inject(this.getContent());

            this.$Grid = new Grid(GridContainer, {
                pagination       : true,
                multipleSelection: true,
                perPage          : this.getAttribute('perPage'),
                page             : this.getAttribute('page'),
                sortOn           : this.getAttribute('sortOn'),
                serverSort       : true,
                columnModel      : [{
                    header   : QUILocale.get('quiqqer/system', 'id'),
                    dataIndex: 'id',
                    dataType : 'number',
                    width    : 50
                }, {
                    header   : QUILocale.get('quiqqer/system', 'title'),
                    dataIndex: 'title',
                    dataType : 'text',
                    width    : 200
                }, {
                    header   : QUILocale.get('quiqqer/system', 'description'),
                    dataIndex: 'description',
                    dataType : 'text',
                    width    : 200
                }]
            });

            this.$Grid.addEvents({
                onRefresh: this.dataRefresh,

                onDblClick: function () {
                    this.fireEvent('dblClick', [this, this.getSelected()]);
                    this.submit();
                }.bind(this),

                onClick: function () {
                    this.fireEvent('click', [this, this.getSelected()]);
                }.bind(this)
            });
        },

        /**
         * Refresh the data
         *
         * @return {Promise}
         */
        dataRefresh: function () {
            this.Loader.show();

            var options = this.$Grid.options;

            return new Promise(function (resolve, reject) {
                QUIAjax.get('package_quiqqer_tags_ajax_groups_get', function (result) {

                    console.log(result);

                    this.Loader.hide();

                    resolve();

                }.bind(this), {
                    'package': 'quiqqer/tags',
                    onError  : reject,
                    project  : this.$Project.encode(),
                    params   : JSON.encode({
                        sheet : options.page,
                        limit : options.perPage,
                        sortOn: options.sortOn,
                        sortBy: options.sortBy
                    })
                });
            }.bind(this));
        },

        /**
         * Opens the tag group create dialog
         */
        openCreateGroupDialog: function () {
            var self = this;

            new QUIConfirm({
                title    : QUILocale.get(lg, 'tag.groups.window.create.title'),
                icon     : 'fa fa-group',
                maxWidth : 450,
                maxHeight: 300,
                autoclose: false,
                events   : {
                    onOpen: function (Win) {
                        Win.Loader.show();

                        var Content = Win.getContent();

                        Content.set('html', Mustache.render(templateCreateGroup, {
                            title: QUILocale.get('quiqqer/system', 'title'),
                            image: QUILocale.get('quiqqer/system', 'image')
                        }));

                        QUI.parse(Content).then(function () {
                            return new Promise(function (resolve) {
                                require(['utils/Controls'], function (Utils) {
                                    Utils.parse(Content).then(resolve);
                                });
                            });
                        }).then(function () {
                            Win.Loader.hide();
                        });
                    },

                    onSubmit: function (Win) {
                        Win.Loader.show();

                        var Content = Win.getContent();

                        QUIAjax.post('package_quiqqer_tags_ajax_groups_create', function () {
                            Win.Loader.hide();
                            self.dataRefresh();
                        }, {
                            'package': 'quiqqer/tags',
                            project  : self.$Project.encode(),
                            title    : Content.getElement('[name="title"]').value,
                            image    : Content.getElement('[name="image"]').value
                        });
                    }
                }
            }).open();
        }
    });
});
