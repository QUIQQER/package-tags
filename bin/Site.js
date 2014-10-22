
/**
 * Tag Verwaltung für eine Seite
 *
 * @module URL_OPT_DIR/quiqqer/tags/bin/Site
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/loader/Loader
 * @require qui/controls/windows/Confirm
 * @require URL_OPT_DIR/quiqqer/tags/bin/TagContainer
 * @require Ajax
 * @require Locale
 * @require Projects
 * @require css!URL_OPT_DIR/quiqqer/tags/bin/Site.css
 */

define([

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/windows/Confirm',
    'package/quiqqer/tags/bin/TagContainer',

    'Ajax',
    'Locale',
    'Projects',

    'css!package/quiqqer/tags/bin/Site.css'

], function(QUI, QUIControl, QUILoader, QUIConfirm, TagContainer, Ajax, Locale, Projects)
{
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends : QUIControl,
        Type    : 'URL_OPT_DIR/quiqqer/tags/bin/Site',

        Binds : [
            '$onInject',
            '$onDestroy',
            '$onTagAdd'
        ],

        options : {
            Site : false
        },

        initialize : function(options, Panel)
        {
            this.parent( options );

            this.$Site    = options.Site;
            this.$Project = this.$Site.getProject();

            this.addEvents({
                onInject  : this.$onInject,
                onDestroy : this.$onDestroy
            });
        },

        /**
         * create the dom node element
         *
         * @return {DOMNode}
         */
        create : function()
        {
            this.$Elm = new Element('div', {
                'class' : 'qui-tags qui-box',
                html    : '<table class="data-table">'+
                              '<thead><tr><th>'+
                                  Locale.get( lg, 'site.table.title' ) +
                              '</th></tr></thead>'+
                              '<tbody>'+
                                  '<tr><td class="odd"></td></tr>'+
                                  '<tr>'+
                                      '<td class="even">'+
                                          '<p class="description">'+
                                              Locale.get( lg, 'site.table.description' ) +
                                          '</p>'+
                                      '</td>'+
                                  '</tr>'+
                              '</tbody>'+
                          '</table>'
            });

            var projectName = this.$Project.getName(),
                projectLang = this.$Project.getLang(),
                datalistId  = 'datalist-'+ projectName +'-'+ projectLang;

            this.$Container = new TagContainer({
                datalist : datalistId,
                events   : {
                    onAdd : this.$onTagAdd
                },
                styles : {
                    background: '#fff',
                    border : 'none',
                    width  : '100%'
                }
            }).inject( this.$Elm.getElement( '.odd' ) );

            return this.$Elm;
        },

        /**
         * event : on inject
         */
        $onInject : function()
        {
            var tags = this.$Site.getAttribute( 'quiqqer.tags.tagList' );

            if ( typeOf( tags ) === 'string' ) {
                tags = tags.split(',');
            }

            if ( typeOf( tags ) !== 'array' ) {
                tags = [];
            }

            for ( var i = 0, len = tags.length; i < len; i++ ) {
                this.$Container.addTag( tags[ i ] );
            }

            var projectName = this.$Project.getName(),
                projectLang = this.$Project.getLang(),
                datalistId  = 'datalist-'+ projectName +'-'+ projectLang;

            Ajax.get('package_quiqqer_tags_ajax_project_getList', function(list)
            {
                if ( !document.id( datalistId ) ) {
                    new Element( 'datalist#'+ datalistId ).inject( document.body );
                }

                var Datalist = document.id( datalistId ),
                    data     = list.data;

                Datalist.set( 'html', '' );

                for ( var i = 0, len = data.length; i < len; i++ )
                {
                    new Element('option', {
                        value : data[ i ].tag
                    }).inject( Datalist );
                }

            }, {
                'package'   : 'quiqqer/tags',
                projectName : projectName,
                projectLang : projectLang
            });
        },

        /**
         * event : on destroy
         * set the tags to the site
         */
        $onDestroy : function()
        {
            this.$Site.setAttribute(
                'quiqqer.tags.tagList',
                this.$Container.getTags().join(',')
            );
        },

        /**
         * event on tag adding via tag container
         *
         * @param {} Container
         * @param {String} tag
         */
        $onTagAdd : function(Container, tag)
        {
            var self = this;

            this.$Container.Loader.show();

            Ajax.get('package_quiqqer_tags_ajax_tag_exists', function(result)
            {
                if ( result )
                {
                    self.$Container.Loader.hide();
                    return;
                }

                self.addTagWindow( tag );

            }, {
                'package'   : 'quiqqer/tags',
                projectName : this.$Project.getName(),
                projectLang : this.$Project.getLang(),
                tag         : tag
            });
        },

        /**
         * Add the tag to the repository and to the site
         *
         * @param {String} tag
         */
        addTag : function(tag)
        {
            var self = this;

            this.$Container.Loader.show();

            Ajax.get('package_quiqqer_tags_ajax_tag_add', function(result)
            {
                self.$Container.addTag( tag );
                self.$Container.Loader.hide();

            }, {
                'package'   : 'quiqqer/tags',
                projectName : this.$Project.getName(),
                projectLang : this.$Project.getLang(),
                tag         : tag
            });
        },

        /**
         * opens the add tag window
         *
         * @param {String} tag - tag to add
         */
        addTagWindow : function(tag)
        {
            var self = this;

            new QUIConfirm({
                title : Locale.get( lg, 'site.window.add.tag.title' ),
                icon  : 'icon-tag',
                maxWidth  : 500,
                maxHeight : 300,
                events :
                {
                    onOpen : function(Win)
                    {
                        var Content = this.getContent();

                        Content.set(
                            'html',
                            Locale.get( lg, 'site.window.add.tag.title', {
                                tag : tag
                            })
                        );
                    },

                    onCancel : function()
                    {
                        self.$Container.removeTag( tag );
                        self.$Container.Loader.hide();
                    },

                    onSubmit : function()
                    {
                        self.$Container.removeTag( tag );
                        self.addTag( tag );
                        self.$Container.Loader.hide();
                    }
                }
            }).open();
        }
    });
});
