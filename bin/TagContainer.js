
/**
 * Tag container - collect tags
 *
 * @module URL_OPT_DIR/quiqqer/tags/bin/TagContainer.js
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/loader/Loader
 * @require css!URL_OPT_DIR/quiqqer/tags/bin/TagContainer.css
 *
 * @event onAdd [ {self}, {String} tag ]
 * @event onRemove [ {self}, {String} tag ]
 */

define([

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/desktop/panels/Sheet',
    'qui/controls/buttons/Button',
    'qui/utils/Elements',
    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/TagContainer.css'

], function(QUI, QUIControl, QUILoader, QUISheet, QUIButton, ElementUtils, Ajax, Locale)
{
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({

        Extends : QUIControl,
        Type    : 'package/quiqqer/tags/bin/TagContainer',

        Binds : [
            '$onInject'
        ],

        options : {
            editable     : true,
            datalist     : false,
            styles       : false,
            loadDatalist : false,
            limit        : false,

            project     : false,
            projectLang : false
        },

        initialize : function(options)
        {
            this.parent( options );

            this.Loader = new QUILoader();

            this.$Container = null;
            this.$Input     = null;
            this.$DataList  = null;
            this.$list      = {};

            this.$AddTag = null;

            this.addEvents({
                onInject : this.$onInject
            });
        },

        /**
         * create the domnode elemente
         *
         * @return {DOMnode}
         */
        create : function()
        {
            var self = this;

            this.$Elm = new Element('div', {
                'class' : 'qui-tags-container',
                html    : '<div class="qui-tags-container-list"></div>',
                styles  : {
                    height : 150
                }
            });

            this.Loader.inject( this.$Elm );

            this.$AddTag = new QUISheet({
                buttons : false,
                header  : false
            }).inject( this.$Elm );

            this.$Container = this.$Elm.getElement( '.qui-tags-container-list' );

            this.$Input = new Element('input', {
                'class' : 'qui-tags-input',
                name    : 'add-tag',
                type    : 'text',
                placeholder : Locale.get( lg, 'tag.control.placeholder.addtag' ),
                events :
                {
                    change : function(event)
                    {
                        var val = this.value,
                            Tag = self.$DataList.getElement( '[value="'+ val +'"]' );

                        var tag = this.value;

                        if ( Tag )  {
                            tag = Tag.get( 'data-tag' );
                        }

                        self.addTag( tag );

                        (function()
                        {
                            this.value = '';
                            this.focus();
                        }).delay( 100, this );
                    }
                }
            }).inject( this.$Elm );


            if ( this.getAttribute( 'datalist' ) ) {
                this.$Input.set( 'list', this.getAttribute( 'datalist' ) );
            }

            if ( this.getAttribute( 'styles' ) ) {
                this.$Elm.setStyles( this.getAttribute( 'styles' ) );
            }

            return this.$Elm;
        },

        /**
         * resize the internal elements and control
         */
        resize : function()
        {
            var size     = this.$Elm.getSize(),
                computed = this.$Elm.getComputedSize();

            this.$Elm.setStyles({
                height : size.y
            });

            this.$Container.setStyles({
                height : size.y - this.$Input.getSize().y -
                         computed['padding-bottom'] - computed['padding-top']
            });

            this.$Input.setStyles({
                left   : computed['padding-left'],
                bottom : computed['padding-bottom']
            });

            this.$Input.style.setProperty(
                "width",
                this.$Container.getSize().x +'px',
                "important"
            );
        },

        /**
         * Refresh the DOMNode
         */
        refresh : function()
        {
            if ( !this.getAttribute( 'limit' ) )
            {
                this.$Input.set({
                    disabled    : null,
                    placeholder : Locale.get( lg, 'tag.control.placeholder.addtag' )
                });

                this.resize();

                return;
            }

            var tagList = this.getTags();

            if ( tagList.length >= this.getAttribute( 'limit' ) )
            {
                this.$Input.set({
                    disabled    : 'disabled',
                    placeholder : Locale.get( lg, 'tag.control.placeholder.limit' )
                });

            } else
            {
                this.$Input.set({
                    disabled    : null,
                    placeholder : Locale.get( lg, 'tag.control.placeholder.addtag' )
                });
            }

            this.resize();
        },

        /**
         * Returns the DOMNode of the tag container
         *
         * @return {DOMNode}
         */
        getContainer : function()
        {
            return this.$Container;
        },

        /**
         * event : on inject
         */
        $onInject : function()
        {
            if ( !this.getAttribute( 'loadDatalist' ) ) {
                return;
            }

            var self = this;

            this.Loader.show();

            // create own datalist
            this.$DataList = new Element('datalist', {
                id : 'list-'+ this.getId()
            }).inject( this.getElm() );

            this.setAttribute( 'datalist', 'list-'+ this.getId() );
            this.$Input.set( 'list', this.getAttribute( 'datalist' ) );


            this.$refreshDatalist(function()
            {
                self.Loader.hide();
                self.refresh();
            });
        },

        /**
         * Refresh the internal datalist
         */
        $refreshDatalist : function(callback)
        {
            if ( !this.getAttribute( 'loadDatalist' ) )
            {
                if ( typeof callback !== 'undefined' ) {
                    callback();
                }

                return;
            }

            var self = this;

            Ajax.get([
                'package_quiqqer_tags_ajax_tag_getDataList',
                'ajax_permissions_session_getPermission'
            ], function(dataList, limit)
            {
                self.$DataList.set( 'html', dataList );
                self.setAttribute( 'limit', limit );

                if ( typeof callback !== 'undefined' ) {
                    callback();
                }

            }, {
                'package'   : 'quiqqer/tags',
                projectName : this.getProject(),
                projectLang : this.getProjectLang(),
                permission  : 'tags.siteLimit',
                ruleset     : 'max_integer'
            });
        },

        /**
         * add a tag to the container
         *
         * @param {String} tag
         */
        addTag : function(tag)
        {
            if ( tag.trim() === '' ) {
                return;
            }

            var self = this,
                tags = this.getTags();

            if ( tags.contains( tag ) ) {
                return;
            }

            this.Loader.show();

            Ajax.get([
                'ajax_permissions_session_hasPermission',
                'package_quiqqer_tags_ajax_tag_exists',
                'package_quiqqer_tags_ajax_tag_get'
            ], function(hasPermission, tagExists, tagData)
            {
                var Edit = self.$Container.getElement( '.qui-tags-tag-add' );

                if ( !hasPermission && !tagExists )
                {
                    QUI.getMessageHandler(function(MH)
                    {
                        MH.addError(
                            Locale.get( lg, 'message.no.permission.create.tags' ),
                            self.getElm()
                        );
                    });

                    self.Loader.hide();
                    return;
                }

                if ( !tagExists )
                {
                    self.showAddTag( tag );
                    self.Loader.hide();
                    return;
                }

                var title = tag;

                if ( typeof tagData !== 'undefined' && tagData && tagData.title !== '' ) {
                    title = tagData.title;
                }


                var Tag = new Element('div', {
                    'class' : 'qui-tags-tag',
                    html    : '<span class="icon-tag fa fa-tag"></span>'+
                              '<span class="qui-tags-tag-value">'+ title +'</span>' +
                              '<span class="icon-remove fa fa-remove"></span>',
                    'data-tag' : tag
                });


                Tag.inject( self.$Container );

                Tag.getElement( '.icon-remove' ).addEvent('click', function() {
                    self.removeTag( this.getParent().get( 'data-tag' ) );
                });

                self.fireEvent( 'add', [ self, tag ] );
                self.Loader.hide();
                self.refresh();

            }, {
                'package'   : 'quiqqer/tags',
                permission  : 'tags.create',
                projectName : this.getProject(),
                projectLang : this.getProjectLang(),
                tag         : tag,
                showError   : false
            });
        },

        /**
         * Show the add tag sheet
         */
        showAddTag : function(tag)
        {
            var self = this;

            this.$AddTag.show(function()
            {
                var Content = self.$AddTag.getContent();

                Content.set({
                    html : Locale.get( lg, 'site.window.add.tag.title', {
                        tag : tag
                    }),
                    styles : {
                        padding: 20
                    }
                });

                new QUIButton({
                    text   : 'Hinzufügen',
                    events :
                    {
                        onClick : function()
                        {
                            Ajax.get('package_quiqqer_tags_ajax_tag_add', function(result)
                            {
                                self.Loader.show();
                                self.addTag( tag );
                                self.$AddTag.hide();

                            }, {
                                'package'   : 'quiqqer/tags',
                                projectName : self.getProject(),
                                projectLang : self.getProjectLang(),
                                tag         : tag
                            });
                        }
                    },
                    styles : {
                        margin : '10px 10px 10px 0'
                    }
                }).inject( Content );

                new QUIButton({
                    text   : 'Abbrechen',
                    events :
                    {
                        onClick : function() {
                            self.$AddTag.hide();
                        }
                    },
                    styles : {
                        margin : 10
                    }
                }).inject( Content );
            });
        },

        /**
         * Remove a tag from the list
         */
        removeTag : function(tag)
        {
            this.$Elm.getElements( '[data-tag="'+ tag +'"]' ).destroy();

            this.fireEvent( 'remove', [ this, tag ] );
            this.refresh();
        },

        /**
         * Return all tags
         *
         * @return {Array}
         */
        getTags : function()
        {
            return this.$Container.getElements( '.qui-tags-tag' ).map(function(Elm) {
                return Elm.get( 'data-tag' );
            });
        },

        /**
         * Return the project name
         *
         * @return {String}
         */
        getProject : function()
        {
            if ( this.getAttribute( 'project' ) ) {
                return this.getAttribute( 'project' );
            }

            if ( typeof QUIQQER_PROJECT !== 'undefined' ) {
                return QUIQQER_PROJECT.name;
            }

            return '';
        },

        /**
         * Return the project lang
         *
         * @return {String}
         */
        getProjectLang : function()
        {
            if ( this.getAttribute( 'projectLang' ) ) {
                return this.getAttribute( 'projectLang' );
            }

            if ( typeof QUIQQER_PROJECT !== 'undefined' ) {
                return QUIQQER_PROJECT.lang;
            }

            return '';
        }
    });
});
