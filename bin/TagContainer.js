
/**
 * Tag container - collect tags
 *
 * @module package/quiqqer/tags/bin/TagContainer
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/loader/Loader
 * @require qui/controls/desktop/panels/Sheet
 * @require qui/controls/buttons/Button
 * @require qui/utils/Elements
 * @require Ajax
 * @require Locale
 * @require css!package/quiqqer/tags/bin/TagContainer.css
 *
 * @event onAdd [ {self}, {String} tag ]
 * @event onRemove [ {self}, {String} tag ]
 */
define('package/quiqqer/tags/bin/TagContainer', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/desktop/panels/Sheet',
    'qui/controls/buttons/Button',
    'qui/controls/windows/Popup',
    'qui/utils/Elements',
    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/TagContainer.css'

], function(QUI, QUIControl, QUILoader, QUISheet, QUIButton, QUIWindow, ElementUtils, Ajax, Locale)
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
            editable      : true,
            datalist      : false,
            styles        : false,
            loadDatalist  : false,
            limit         : false,
            inputPosition : 'top',   // input position bottom or top
            tagWindowOnClick : true, // click at the tag container opens a tag add window

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
         * @return {HTMLElement}
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

            this.$Container.addEvents({
                click : function()
                {
                    if ( self.$Input.get( 'disabled' ) ||
                         self.$Input.get( 'disabled' ) == 'disabled' )
                    {
                        return;
                    }

                    if ( !self.getAttribute( 'tagWindowOnClick' ) )
                    {
                        self.$Input.focus();
                        return;
                    }

                    self.openTagWindow();
                }
            });

            this.$Input = new Element('input', {
                'class' : 'qui-tags-input',
                name    : 'add-tag',
                type    : 'text',
                placeholder : Locale.get( lg, 'tag.control.placeholder.addtag' ),
                maxlength : 250,
                styles : {
                    bottom   : 0,
                    left     : 0,
                    position : 'absolute'
                },
                events :
                {
                    change : function()
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

            if ( this.getAttribute( 'inputPosition' ) == 'top' )
            {
                this.$Input.setStyles({
                    bottom   : null,
                    left     : null,
                    position : null
                });

                this.$Input.inject( this.$Elm, 'top' );
            }


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
         * @return {HTMLElement}
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
            if (!this.getAttribute('loadDatalist')) {
                return;
            }

            var self = this;

            this.Loader.show();

            // create own datalist
            this.$DataList = new Element('datalist', {
                id : 'list-'+ this.getId()
            }).inject( this.getElm() );

            this.setAttribute('datalist', 'list-'+ this.getId());
            this.$Input.set('list', this.getAttribute('datalist'));


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
            if (!this.getAttribute('loadDatalist'))
            {
                if (typeof callback === 'function') {
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
                self.$DataList.set('html', dataList);
                self.setAttribute('limit', limit);

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
            if (!tag) {
                return;
            }

            tag = tag.toString();

            if (tag.trim() === '') {
                return;
            }

            var self = this,
                tags = this.getTags();

            if (tags.contains(tag)) {
                return;
            }

            this.Loader.show();

            Ajax.get([
                'ajax_permissions_session_hasPermission',
                'package_quiqqer_tags_ajax_tag_exists',
                'package_quiqqer_tags_ajax_tag_get'
            ], function(hasPermission, tagExists, tagData)
            {
                if (!hasPermission && !tagExists)
                {
                    QUI.getMessageHandler(function(MH)
                    {
                        MH.addError(
                            Locale.get(lg, 'message.no.permission.create.tags'),
                            self.getElm()
                        );
                    });

                    self.Loader.hide();
                    return;
                }

                if (!tagExists)
                {
                    self.showAddTag(tag);
                    self.Loader.hide();
                    return;
                }

                var title = tag;

                if (typeof tagData !== 'undefined' && tagData && tagData.title !== '') {
                    title = tagData.title;
                }


                var Tag = new Element('div', {
                    'class' : 'qui-tags-tag',
                    html    : '<span class="icon-tag fa fa-tag"></span>'+
                              '<span class="qui-tags-tag-value">'+ title +'</span>' +
                              '<span class="icon-remove fa fa-remove"></span>',
                    'data-tag' : tag
                });


                Tag.inject(self.$Container);

                Tag.getElement('.icon-remove').addEvent('click', function(event)
                {
                    event.stop();

                    self.removeTag(this.getParent().get('data-tag'));
                });

                self.fireEvent('add', [self, tag]);
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
                    html : Locale.get(lg, 'site.window.add.tag.title', {
                        tag : tag
                    }),
                    styles : {
                        padding: 20
                    }
                });

                new QUIButton({
                    text   : Locale.get(lg, 'control.tagcontainer.sheet.btn.add'),
                    events :
                    {
                        onClick : function()
                        {
                            Ajax.post('package_quiqqer_tags_ajax_tag_add', function(result)
                            {
                                self.Loader.show();
                                self.addTag(result);
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
                    text   : Locale.get(lg, 'control.tagcontainer.sheet.btn.cancel'),
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
            this.$Elm.getElements('[data-tag="'+ tag +'"]').destroy();

            this.fireEvent('remove', [this, tag]);
            this.refresh();
        },

        /**
         * Return all tags
         *
         * @return {Array}
         */
        getTags : function()
        {
            return this.$Container.getElements('.qui-tags-tag').map(function(Elm) {
                return Elm.get('data-tag');
            });
        },

        /**
         * Return the project name
         *
         * @return {String}
         */
        getProject : function()
        {
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
        getProjectLang : function()
        {
            if (this.getAttribute('projectLang')) {
                return this.getAttribute('projectLang');
            }

            if (typeof QUIQQER_PROJECT !== 'undefined') {
                return QUIQQER_PROJECT.lang;
            }

            return '';
        },

        /**
         * Open the tag select window
         */
        openTagWindow : function()
        {
            if (this.$Input.get( 'disabled' ) ||
                this.$Input.get( 'disabled' ) == 'disabled')
            {
                return;
            }

            var self = this;

            new QUIWindow({
                title     : Locale.get(lg, 'control.tagcontainer.window.add.title'),
                maxWidth  : 600,
                maxHeight : 400,
                events    :
                {
                    onOpen : function(Win)
                    {
                        var Content = Win.getContent();

                        Content.set(
                            'html',

                            '<select class="qui-tags-container-window-select">'+
                                '<option value="abc">A B C</option>'+
                                '<option value="def">D E F</option>'+
                                '<option value="ghi">G H I</option>'+
                                '<option value="jkl">J K L</option>'+
                                '<option value="mno">M N O</option>'+
                                '<option value="pqr">P Q R</option>'+
                                '<option value="stu">S T U</option>'+
                                '<option value="vz">V - Z</option>'+
                            '</select>'+
                            '<div class="qui-tags-container-window-container"></div>'
                        );


                        var Select       = Content.getElement('select'),
                            TagContainer = Content.getElement('.qui-tags-container-window-container');

                        Select.addEvent('change', function()
                        {
                            Win.Loader.show();

                            self.getTagsBySektor(this.value, function(result)
                            {
                                if (!result.length)
                                {
                                    TagContainer.set(
                                        'html',
                                        Locale.get(lg, 'control.tagcontainer.window.message.no.tags')
                                    );
                                    Win.Loader.hide();

                                    return;
                                }

                                TagContainer.set('html', '');

                                var i, len, tag, title, tagData;

                                for (i = 0, len = result.length; i < len; i++)
                                {
                                    tagData = result[ i ];

                                    tag   = tagData.tag;
                                    title = tag;

                                    if (tagData.title !== '') {
                                        title = tagData.title;
                                    }

                                    new Element('div', {
                                        'class' : 'qui-tags-tag',
                                        html    : '<span class="icon-tag fa fa-tag"></span>'+
                                                  '<span class="qui-tags-tag-value">'+ title +'</span>',
                                        'data-tag' : tag
                                    }).inject( TagContainer );
                                }

                                TagContainer.getElements('.qui-tags-tag').addEvent('click', function()
                                {
                                    self.addTag(this.get('data-tag'));

                                    Win.close();
                                });

                                Win.Loader.hide();
                            });
                        });

                        Select.fireEvent('change');
                    }
                }
            }).open();
        },

        /**
         * Search tags by the window select value
         *
         * @param {string} sektor
         * @param {Function} callback
         */
        getTagsBySektor : function(sektor, callback)
        {
            Ajax.get('package_quiqqer_tags_ajax_search_getTagsBySektor', function(result)
            {
                callback(result);
            }, {
                'package' : 'quiqqer/tags',
                project : JSON.encode({
                    name : this.getProject(),
                    lang : this.getProjectLang()
                }),
                sektor : sektor
            });
        }
    });
});
