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
 * @require Locale
 */
define('package/quiqqer/tags/bin/groups/Panel', [

    'qui/QUI',
    'qui/controls/desktop/Panel',
    'qui/controls/buttons/Button',
    'qui/controls/windows/Confirm',
    'controls/grid/Grid',
    'Locale',
    'Ajax',
    'Mustache',

    'text!package/quiqqer/tags/bin/groups/Panel.createGroup.html',
    'css!package/quiqqer/tags/bin/groups/Panel.css'

], function (QUI, QUIPanel, QUIButton, QUIConfirm, Grid, QUILocale, QUIAjax, Mustache, templateCreateGroup) {
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

            this.$Grid = null;

            this.addEvents({
                onCreate: this.$onCreate,
                onResize: this.$onResize,
                onInject: this.$onInject
            });
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
                onRefresh: function () {
                    this.fireEvent('refresh', [this, this.$Grid.options]);
                }.bind(this),

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
         * Opens the tag group create dialog
         */
        openCreateGroupDialog: function () {
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

                        QUIAjax.post('', function () {

                        });
                    }
                }
            }).open();
        }
    });
});
