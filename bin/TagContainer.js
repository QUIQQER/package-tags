
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

    'css!URL_OPT_DIR/quiqqer/tags/bin/TagContainer.css'

], function(QUI, QUIControl, QUILoader)
{
    "use strict";


    return new Class({

        Extends : QUIControl,
        Type    : 'URL_OPT_DIR/quiqqer/tags/bin/TagContainer',

        Binds : [

        ],

        options : {
            editable : true,
            datalist : false,
            styles   : false
        },

        initialize : function(options)
        {
            this.parent( options );

            this.Loader = new QUILoader();
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
                'class' : 'qui-tags-container'
            });

            this.Loader.inject( this.$Elm );


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
         * focus the element
         * if the container is editable, and input elm would be insert to add a tag
         */
        focus : function()
        {
            if ( this.getAttribute( 'editable' ) === false ) {
                return;
            }

            if ( this.$Elm.getElement( '.qui-tags-tag-add' ) )
            {
                this.$Elm.getElement( '.qui-tags-tag-add' ).focus();
                return;
            }

            var self = this;

            var Edit = new Element('input', {
                'class' : 'qui-tags-tag-add',
                name    : 'add-tag',
                type    : 'text',
                events  :
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
            }).inject( this.$Elm );

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

            var Edit = this.$Elm.getElement( '.qui-tags-tag-add' );

            var Tag = new Element('div', {
                'class' : 'qui-tags-tag',
                html    : '<span class="icon-tag"></span>'+
                          '<span class="qui-tags-tag-value">'+ tag +'</span>' +
                          '<span class="icon-remove"></span>',
                'data-tag' : tag
            })

            if ( Edit )
            {
                Tag.inject( Edit, 'before' );
            } else
            {
                Tag.inject( this.$Elm );
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
            return this.$Elm.getElements( '.qui-tags-tag-value' ).map(function(Elm) {
                return Elm.get( 'text' );
            });
        }

    });
});
