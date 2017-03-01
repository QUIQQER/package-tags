/**
 * Tag Manager
 *
 * @module package/quiqqer/tags/bin/Manager
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/desktop/Panel
 * @require qui/controls/windows/Confirm
 * @require qui/controls/buttons/Select
 * @require controls/grid/Grid
 * @require Ajax
 * @require QUILocale
 * @require Projects
 * @require css!package/quiqqer/tags/bin/Manager.css
 */
define('package/quiqqer/tags/bin/Manager', [

    'qui/QUI',
    'qui/controls/desktop/Panel',
    'qui/controls/windows/Confirm',
    'qui/controls/buttons/Select',
    'controls/grid/Grid',
    'package/quiqqer/tags/bin/TagSites',
    'utils/Controls',
    'Ajax',
    'Locale',
    'Projects',

    'css!package/quiqqer/tags/bin/Manager.css'

], function (QUI, QUIPanel, QUIConfirm, QUISelect, Grid, TagSites, ControlUtils, Ajax, QUILocale, Projects) {
    "use strict";

    var lg = 'quiqqer/tags';

    /**
     * @param {Object} options - options / attributes
     */
    return new Class({

        Extends: QUIPanel,
        Type   : 'package/quiqqer/tags/bin/Manager',

        Binds: [
            '$onCreate',
            '$onResize',
            '$onInject'
        ],

        options: {
            title: QUILocale.get(lg, 'panel.manager.title')
        },

        initialize: function (options) {
            this.$Grid     = null;
            this.$Projects = null; // select

            this.$project = false;
            this.$lang    = false;

            this.parent(options);

            this.addEvents({
                onCreate: this.$onCreate,
                onResize: this.$onResize,
                onInject: this.$onInject
            });
        },

        /**
         * event : on create
         */
        $onCreate: function () {
            var self = this;

            this.$Projects = new QUISelect({
                name  : 'tag-projects',
                events: {
                    onChange: function (value) {
                        self.loadProject(
                            value.split(':')[0],
                            value.split(':')[1]
                        );
                    }
                }
            });

            // button line
            this.addButton(this.$Projects);
            this.addButton({type: 'seperator'});

            this.addButton({
                text     : QUILocale.get(lg, 'panel.manager.button.add.tag'),
                textimage: 'fa fa-plus',
                name     : 'add-tag',
                disabled : true,
                events   : {
                    onClick: function () {
                        self.openTagWindow();
                    }
                }
            });

            this.addButton({
                text     : QUILocale.get(lg, 'panel.manager.button.delete.tag'),
                textimage: 'fa fa-trash',
                name     : 'delete-tag',
                disabled : true,
                events   : {
                    onClick: function () {
                        self.openDeleteWindow();
                    }
                }
            });

            this.addButton({type: 'seperator'});

            this.addButton({
                text     : QUILocale.get(lg, 'panel.manager.button.showtagsites'),
                textimage: 'fa fa-file-text-o',
                name     : 'showtagsites',
                disabled : true,
                events   : {
                    onClick: function () {
                        self.showTagSites(
                            self.$Grid.getSelectedData()[0].tag
                        );
                    }
                }
            });

            // Grid
            var Container = new Element('div').inject(
                this.getContent()
            );

            this.$Grid = new Grid(Container, {
                columnModel      : [{
                    header   : QUILocale.get(lg, 'tag'),
                    dataIndex: 'tag',
                    dataType : 'string',
                    width    : 200,
                    hidden   : true
                }, {
                    header   : QUILocale.get(lg, 'panel.manager.tag.title'),
                    dataIndex: 'title',
                    dataType : 'string',
                    width    : 200
                }, {
                    header   : QUILocale.get('quiqqer/system', 'description'),
                    dataIndex: 'desc',
                    dataType : 'string',
                    width    : 300
                }, {
                    header   : QUILocale.get(lg, 'panel.manager.tag.count'),
                    dataIndex: 'count',
                    dataType : 'number',
                    width    : 75
                }],
                pagination       : true,
                multipleSelection: true,
                serverSort       : true
            });

            this.$Grid.addEvents({
                onDblClick: function (event) {
                    self.openTagWindow(
                        self.$Grid.getDataByRow(event.row).tag
                    );
                },

                onClick: function () {
                    self.getButtons('delete-tag').enable();
                    self.getButtons('showtagsites').enable();
                },

                onRefresh: function () {
                    self.refresh();
                }
            });
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            var self = this;

            this.Loader.show();

            Projects.getList(function (result) {
                var i, len, lang, langs;

                for (var project in result) {
                    if (!result.hasOwnProperty(project)) {
                        continue;
                    }

                    langs = result[project].langs.split(',');

                    for (i = 0, len = langs.length; i < len; i++) {
                        lang = langs[i];

                        self.$Projects.appendChild(
                            project + ' (' + lang + ')',
                            project + ':' + lang,
                            URL_BIN_DIR + '16x16/flags/' + lang + '.png'
                        );
                    }
                }


                self.$Projects.setValue(
                    self.$Projects.firstChild().getAttribute('value')
                );
            });
        },

        /**
         * event : on resize
         */
        $onResize: function () {
            if (!this.$Grid) {
                return;
            }

            var Body = this.getContent();

            if (!Body) {
                return;
            }


            var size = Body.getSize();

            this.$Grid.setHeight(size.y - 40);
            this.$Grid.setWidth(size.x - 40);
        },

        /**
         * Refresh the panel
         */
        refresh: function () {
            if (!this.$project) {
                return;
            }

            this.loadProject(this.$project, this.$lang);
        },


        /**
         * Tag Methods
         */

        /**
         * Display the tags of the project
         *
         * @param {String} project - name of the project
         * @param {String} lang - language of the project
         */
        loadProject: function (project, lang) {
            var self = this;

            this.$project = project;
            this.$lang    = lang;

            this.getButtons('add-tag').enable();

            var GridParams = {
                perPage: this.$Grid.options.perPage,
                page   : this.$Grid.options.page,
                sortOn : this.$Grid.getAttribute('sortOn'),
                sortBy : this.$Grid.getAttribute('sortBy')
            };

            switch (this.$Grid.getAttribute('sortOn')) {
                case 'count':
                    this.$Grid.setAttribute('serverSort', false);
                    this.$Grid.sort(2, 'count');
                    this.$Grid.setAttribute('serverSort', true);

                    return;
                    break;

                default:
                    GridParams.sortOn = this.$Grid.getAttribute('sortOn');
            }

            this.Loader.show();

            Ajax.get('package_quiqqer_tags_ajax_project_getList', function (result) {
                self.$Grid.setData(result);
                self.getButtons('delete-tag').disable();
                self.getButtons('showtagsites').disable();
                self.Loader.hide();
            }, {
                'package'  : 'quiqqer/tags',
                projectName: this.$project,
                projectLang: this.$lang,
                gridParams : JSON.encode(GridParams)
            });
        },

        /**
         * Add a tag to the project
         *
         * @param {String} tag - tag name
         * @param {Object} tagParams - Parameter of the tag {
         * 		tag,
         * 		title,
         * 		desc,
         * 		image
         * }
         * @param {Function} [callback] - (optional), callback function
         */
        addTag: function (tag, tagParams, callback) {
            var self = this;

            Ajax.post('package_quiqqer_tags_ajax_tag_add', function () {
                if (typeof callback !== 'undefined') {
                    callback();
                }

                self.refresh();

            }, {
                'package'  : 'quiqqer/tags',
                projectName: this.$project,
                projectLang: this.$lang,
                tag        : tag,
                tagParams  : JSON.encode(tagParams),
                gridParams : JSON.encode(this.$Grid.getPaginationData())
            });
        },

        /**
         * Edit a tag of the project
         *
         * @param {String} tag - tag name
         * @param {Object} tagParams - Parameter of the tag {
         * 		tag,
         * 		title,
         * 		desc,
         * 		image
         * }
         * @param {Function} [callback] - (optional), callback function
         */
        editTag: function (tag, tagParams, callback) {
            var self = this;

            Ajax.post('package_quiqqer_tags_ajax_tag_edit', function () {
                if (typeof callback !== 'undefined') {
                    callback();
                }

                self.refresh();

            }, {
                'package'  : 'quiqqer/tags',
                projectName: this.$project,
                projectLang: this.$lang,
                tag        : tag,
                tagParams  : JSON.encode(tagParams),
                gridParams : JSON.encode(this.$Grid.getPaginationData())
            });
        },

        /**
         * Delete the tags
         *
         * @param {Array} tags - List of tags [tags1, tag2, tag3]
         * @param {Function} [callback] - (optional), callback function
         */
        deleteTags: function (tags, callback) {
            var self = this;

            Ajax.post('package_quiqqer_tags_ajax_tag_delete', function () {
                if (typeof callback !== 'undefined') {
                    callback();
                }

                self.refresh();

            }, {
                'package'  : 'quiqqer/tags',
                projectName: this.$project,
                projectLang: this.$lang,
                tags       : JSON.encode(tags)
            });
        },

        /**
         * Window methods
         */

        /**
         * Opens the tag adding / edit window
         *
         * @param {String} [tag] - (optional) TAG
         */
        openTagWindow: function (tag) {
            var self = this;

            new QUIConfirm({
                title    : QUILocale.get(lg, 'panel.add.window.title'),
                icon     : 'fa fa-plus',
                maxWidth : 400,
                maxHeight: 500,
                autoclose: false,

                cancel_button: {
                    text     : QUILocale.get('quiqqer/system', 'cancel'),
                    textimage: 'fa fa-remove'
                },

                ok_button: {
                    text     : QUILocale.get('quiqqer/system', 'save'),
                    textimage: 'fa fa-save'
                },

                events: {
                    onOpen: function (Win) {
                        Win.Loader.show();

                        var Content = this.getContent();

                        Content.addClass('qui-tags-add-window');

                        Content.set(
                            'html',

                            '<input type="hidden" name="tag" id="field-tag" />' +

                            '<label for="field-title">' +
                            QUILocale.get(lg, 'panel.manager.tag.title') +
                            '</label>' +
                            '<input type="text" name="title" id="field-title" />' +

                            '<label for="field-desc">' +
                            QUILocale.get(lg, 'panel.manager.image.tag') +
                            '</label>' +
                            '<input name="image" id="field-image" class="media-image" type="text" />' +

                            '<label for="field-desc">' +
                            QUILocale.get('quiqqer/system', 'description') +
                            '</label>' +
                            '<textarea name="desc" id="field-desc"></textarea>'
                        );

                        var Tag   = Content.getElement('[name="tag"]'),
                            Title = Content.getElement('[name="title"]'),
                            Desc  = Content.getElement('[name="desc"]'),
                            Img   = Content.getElement('[name="image"]');

                        ControlUtils.parse(Content).then(function () {
                            QUI.Controls.getControlsInElement(Content).each(function (Control) {
                                if ("setProject" in Control) {
                                    Control.setProject(
                                        Projects.get(self.$project, self.$lang)
                                    );
                                }
                            });

                            if (typeof tag === 'undefined') {
                                Win.Loader.hide();
                                Title.focus();
                                return;
                            }

                            Ajax.get('package_quiqqer_tags_ajax_tag_get', function (data) {
                                Tag.value   = tag;
                                Title.value = data.title;
                                Desc.value  = data.desc;
                                Img.value   = data.image;

                                Title.focus();

                                var quiid        = Img.getParent().get('data-quiid');
                                var ImageControl = QUI.Controls.getById(quiid);

                                ImageControl.setValue(data.image);

                                Win.Loader.hide();
                            }, {
                                'package'  : 'quiqqer/tags',
                                projectName: self.$project,
                                projectLang: self.$lang,
                                tag        : tag
                            });
                        });
                    },

                    onSubmit: function (Win) {
                        var Content = this.getContent(),
                            Tag     = Content.getElement('[name="tag"]'),
                            Title   = Content.getElement('[name="title"]'),
                            Desc    = Content.getElement('[name="desc"]'),
                            Img     = Content.getElement('[name="image"]');

                        Win.Loader.show();

                        var tagParams = {
                            title: Title.value,
                            desc : Desc.value,
                            image: Img.value
                        };

                        var callback = function () {
                            Win.close();
                            self.refresh();
                        };

                        if (typeof tag === 'undefined') {
                            self.addTag(Title.value, tagParams, callback);
                        } else {
                            self.editTag(Tag.value, tagParams, callback);
                        }
                    }
                }
            }).open();
        },

        /**
         * Opens the tag deletion window
         */
        openDeleteWindow: function () {
            var self = this,
                data = this.$Grid.getSelectedData(),
                tags = [];

            for (var i = 0, len = data.length; i < len; i++) {
                tags.push(data[i].tag);
            }


            new QUIConfirm({
                title    : QUILocale.get(lg, 'panel.delete.window.title'),
                icon     : 'fa fa-plus',
                maxWidth : 600,
                maxHeight: 300,
                autoclose: false,
                events   : {
                    onOpen: function () {
                        var Content = this.getContent();

                        Content.set(
                            'html',

                            QUILocale.get(lg, 'panel.delete.window.message', {
                                tags: tags.join(', ')
                            })
                        );
                    },

                    onSubmit: function (Win) {
                        self.deleteTags(tags, function () {
                            Win.close();
                        });
                    }
                }
            }).open();
        },

        /**
         * Shows list with all sites the tag is associated with
         *
         * @param {string} tag
         */
        showTagSites: function (tag) {
            this.createSheet({
                title : QUILocale.get(lg, 'panel.showtagsites.title', {
                    tag: tag
                }),
                events: {
                    onShow : function (Sheet) {
                        Sheet.getContent().setStyle('padding', 20);

                        new TagSites({
                            tag: tag
                        }).inject(Sheet.getContent());
                    },
                    onClose: function (Sheet) {
                        Sheet.destroy();
                    }
                }
            }).show();
        }
    });
});
