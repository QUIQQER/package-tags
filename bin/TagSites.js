/**
 * List of all Sites a tag is associated with
 *
 * @module package/quiqqer/tags/bin/TagSites
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/loader/Loader
 * @require qui/controls/buttons/Button
 * @require qui/utils/Elements
 * @require Ajax
 * @require QUILocale
 * @require css!package/quiqqer/tags/bin/TagSites.css
 */
define('package/quiqqer/tags/bin/TagSites', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/buttons/Button',
    'qui/controls/windows/Popup',
    'qui/utils/Elements',
    'Projects',

    'controls/grid/Grid',

    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/TagSites.css'

], function (QUI, QUIControl, QUILoader, QUIButton, QUIWindow,
             ElementUtils, Projects, Grid, Ajax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/TagSites',

        Binds: [
            '$onInject',
            '$refreshGrid',
            '$loadSites',
            '$setGridData',
            '$onResize',
            '$openSitePanel'
        ],

        options: {
            tag        : false,
            project    : false,
            projectLang: false
        },

        initialize: function (options) {
            this.parent(options);

            this.Loader = new QUILoader();

            this.$Container = null;
            this.$Grid      = null;

            this.addEvents({
                onInject: this.$onInject,
                onResize: this.$onResize
            });
        },

        /**
         * create the domnode elemente
         *
         * @return {HTMLElement}
         */
        create: function () {
            var self = this;

            this.$Elm = new Element('div', {
                'class': 'qui-tags-sites-container',
                html   : '<div class="qui-tags-sites-container-list"></div>'
            });

            this.Loader.inject(this.$Elm);

            // Grid
            this.$GridContainer = this.$Elm.getElement('.qui-tags-sites-container-list');

            this.$Grid = new Grid(this.$GridContainer, {
                buttons          : [{
                    name     : 'openSitePanel',
                    text     : QUILocale.get(lg, 'controls.sites.table.btns.opensitepanel'),
                    textimage: 'fa fa-external-link',
                    events   : {
                        onClick: function () {
                            self.$openSitePanel(
                                self.$Grid.getSelectedData()[0].id
                            );
                        }
                    }
                }],
                columnModel      : [{
                    header   : QUILocale.get(lg, 'controls.sites.table.column.id'),
                    dataIndex: 'id',
                    dataType : 'integer',
                    width    : 75
                }, {
                    header   : QUILocale.get(lg, 'controls.sites.table.column.title'),
                    dataIndex: 'title',
                    dataType : 'string',
                    width    : 200
                }, {
                    header   : QUILocale.get(lg, 'controls.sites.table.column.url'),
                    dataIndex: 'url',
                    dataType : 'string',
                    width    : 200
                }],
                pagination       : true,
                multipleSelection: false,
                serverSort       : true
            });

            this.$Grid.addEvents({
                onDblClick: function () {
                    self.$openSitePanel(
                        self.$Grid.getSelectedData()[0].id
                    );
                },

                onClick: function () {
                    var Btns = self.$Grid.getAttribute('buttons');
                    Btns.openSitePanel.enable();
                },

                onRefresh: this.$refreshGrid
            });

            return this.$Elm;
        },

        /**
         * resize the internal elements and control
         */
        resize: function () {
            //var size     = this.$Elm.getSize(),
            //    computed = this.$Elm.getComputedSize();
            //
            //this.$Elm.setStyles({
            //    height: size.y
            //});
            //
            //this.$Container.setStyles({
            //    height: size.y - this.$Input.getSize().y -
            //    computed['padding-bottom'] - computed['padding-top']
            //});
            //
            //this.$Input.setStyles({
            //    left  : computed['padding-left'],
            //    bottom: computed['padding-bottom']
            //});
            //
            //this.$Input.style.setProperty(
            //    "width",
            //    this.$Container.getSize().x + 'px',
            //    "important"
            //);
        },

        /**
         * Refresh the DOMNode
         */
        refresh: function () {
            this.resize();
        },

        $onResize: function () {
            var size = this.$GridContainer.getSize();

            this.$Grid.setHeight(size.y);
            this.$Grid.resize();
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            this.$onResize();
            this.$Grid.refresh();
        },

        /**
         * Refresh the internal datalist
         */
        $refreshGrid: function (ResultGrid) {
            switch (ResultGrid.getAttribute('sortOn')) {
                // cannot sort on certain columns
                case 'url':
                    return;
            }

            var self = this;
            var Btns = this.$Grid.getAttribute('buttons');
            Btns.openSitePanel.disable();

            var GridOptions = {
                sortOn : ResultGrid.getAttribute('sortOn'),
                sortBy : ResultGrid.getAttribute('sortBy'),
                perPage: ResultGrid.getAttribute('perPage'),
                page   : ResultGrid.getAttribute('page')
            };

            this.Loader.show();

            this.$loadSites(GridOptions).then(function (Data) {
                self.$Grid.setData(Data);
                self.Loader.hide();
            });
        },

        /**
         * Load sites according to grid settings
         *
         * @param {Object} SearchParams
         * @returns {Promise}
         */
        $loadSites: function (SearchParams) {
            var self = this;

            return new Promise(function (resolve) {
                Ajax.get('package_quiqqer_tags_ajax_tag_getSites', resolve, {
                    'package'   : 'quiqqer/tags',
                    projectName : self.getProject(),
                    projectLang : self.getProjectLang(),
                    searchParams: JSON.encode(SearchParams),
                    tag         : self.getAttribute('tag'),
                    ruleset     : 'max_integer'
                });
            });
        },

        /**
         * Set site data to grid
         *
         * @param {Object} Data
         */
        $setGridData: function (Data) {
            //
            //for (var i = 0, len = GridData.data.length; i < len; i++) {
            //    Row = GridData.data[i];
            //}
            //
            //this.$Grid.setData(GridData);
        },

        /**
         * Return the project name
         *
         * @return {String}
         */
        getProject: function () {
            if (this.getAttribute('project')) {
                return this.getAttribute('project');
            }

            if (typeof QUIQQER_PROJECT !== 'undefined') {
                return QUIQQER_PROJECT.name;
            }

            return '';
        },

        /**
         * Return the project lang
         *
         * @return {String}
         */
        getProjectLang: function () {
            if (this.getAttribute('projectLang')) {
                return this.getAttribute('projectLang');
            }

            if (typeof QUIQQER_PROJECT !== 'undefined') {
                return QUIQQER_PROJECT.lang;
            }

            return '';
        },

        /**
         * Open site in new panel
         *
         * @param {number} siteId
         */
        $openSitePanel: function (siteId) {
            var self = this;

            require([
                'controls/projects/project/site/Panel',
                'utils/Panels'
            ], function (SitePanel, Panels) {
                var Project = Projects.get(self.getProject(), self.getProjectLang()),
                    Site    = Project.get(siteId);

                var SPanel = new SitePanel(Site);

                Panels.openPanelInTasks(SPanel);
            });
        }
    });
});
