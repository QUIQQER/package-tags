
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
    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/TagContainer.css'

], function(QUI, QUIControl, QUILoader, Ajax, Locale)
{
    "use strict";


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

            project     : false,
            projectLang : false
        },

        initialize : function(options)
        {
            this.parent( options );

            this.Loader = new QUILoader();

            this.$Container = null;
            this.$DataList  = null;
            this.$list      = {};

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
                html    : '<div class="qui-tags-container-list"></div>'+
                          '<div class="qui-tags-container-info">' +
                              Locale.get('quiqqer/tags', 'tag-container-info') +
                          '</div>'
            });

            this.Loader.inject( this.$Elm );
            this.$Container = this.$Elm.getElement( '.qui-tags-container-list' );


            this.$Elm.addEvents({
                click : function() {
                    self.focus();
                },

                blur : function() {

                }
            });

            if ( this.getAttribute( 'styles' ) ) {
                this.$Elm.setStyles( this.getAttribute( 'styles' ) );
            }

            return this.$Elm;
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

            // create own datalist
            this.$DataList = new Element('datalist', {
                id : 'list-'+ this.getId()
            }).inject( this.getElm() );

            this.setAttribute( 'datalist', 'list-'+ this.getId() );
            this.$refreshDatalist();
        },

        /**
         * Refresh the internal datalist
         */
        $refreshDatalist : function()
        {
            if ( !this.getAttribute( 'loadDatalist' ) ) {
                return;
            }

            var self = this;

            var project = this.getAttribute( 'project' ),
                lang    = this.getAttribute( 'projectLang' );

            if ( !project && typeof QUIQQER_PROJECT !== 'undefined' ) {
                project = QUIQQER_PROJECT.name;
            }

            if ( !lang && typeof QUIQQER_PROJECT !== 'undefined' ) {
                lang = QUIQQER_PROJECT.lang;
            }

            Ajax.get('package_quiqqer_tags_ajax_tag_getDataList', function(result)
            {
                self.$DataList.set( 'html', result );

            }, {
                'package'   : 'quiqqer/tags',
                projectName : project,
                projectLang : lang
            });
        },

        /**
         * focus the element
         * if the container is editable, and input elm would be insert to add a tag
         */
        focus : function()
        {
            if ( this.getAttribute( 'editable' ) === false ) {
                return;
            }

            if ( this.$Container.getElement( '.qui-tags-tag-add' ) )
            {
                this.$Container.getElement( '.qui-tags-tag-add' ).focus();
                return;
            }

            var self = this;

            var Edit = new Element('input', {
                'class' : 'qui-tags-tag-add',
                name    : 'add-tag',
                type    : 'text',
                styles  : {
                    'float' : 'left',
                    width   : 150
                },
                events :
                {
                    change : function(event)
                    {
                        self.addTag( this.value );

                        this.value = '';
                    },

                    blur : function () {
                        self.blur();
                    }
                }
            }).inject( this.$Container );

            Edit.focus();

            if ( this.getAttribute( 'datalist' ) ) {
                Edit.set( 'list', this.getAttribute( 'datalist' ) );
            }
        },

        /**
         * blur -> destroy the adding input element, if exists
         */
        blur : function()
        {
            if ( this.$Elm.getElement( '.qui-tags-tag-add' ) ) {
                this.$Elm.getElement( '.qui-tags-tag-add' ).destroy();
            }
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

            var tags = this.getTags();

            if ( tags.contains( tag ) ) {
                return;
            }

            if ( this.getAttribute( 'loadDatalist' ) )
            {
                if ( !this.$DataList.getElement( '[value="'+ tag +'"]' ) ) {
                    return;
                }
            }


            var Edit = this.$Container.getElement( '.qui-tags-tag-add' );

            var Tag = new Element('div', {
                'class' : 'qui-tags-tag',
                html    : '<span class="icon-tag fa fa-tag"></span>'+
                          '<span class="qui-tags-tag-value">'+ tag +'</span>' +
                          '<span class="icon-remove fa fa-remove"></span>',
                'data-tag' : tag
            });

            if ( Edit )
            {
                Tag.inject( Edit, 'before' );

            } else
            {
                Tag.inject( this.$Container );
            }


            Tag.getElement( '.icon-remove' ).addEvent('click', function() {
                this.getParent().destroy();
            });


            this.fireEvent( 'add', [ this, tag ] );
        },

        /**
         * Remove a tag from the list
         */
        removeTag : function(tag)
        {
            this.$Elm.getElements( '[data-tag="'+ tag +'"]' ).destroy();

            this.fireEvent( 'remove', [ this, tag ] );
        },

        /**
         * Return all tags
         *
         * @return {Array}
         */
        getTags : function()
        {
            return this.$Container.getElements( '.qui-tags-tag-value' ).map(function(Elm) {
                return Elm.get( 'text' );
            });
        }

    });
});
