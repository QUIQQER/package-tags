/**
 * Tag Search
 * javaScript for the tag-search type
 *
 * @module package/quiqqer/tags/bin/TagSearch
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require Locale
 */
define('package/quiqqer/tags/bin/TagSearch', [

    'qui/QUI',
    'qui/controls/Control',
    'Locale'

], function (QUI, QUIControl, QUILocale) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/TagSearch',

        Binds: [
            '$onImport'
        ],

        initialize: function () {
            this.addEvents({
                onImport: this.$onImport
            });
        },

        /**
         * event : on import
         */
        $onImport: function () {
            var Elm = this.getElm();

            // available list
            var Menu       = Elm.getElement('.quiqqer-tags-search-menu'),
                Available  = Elm.getElement('.quiqqer-tags-search-available'),
                Pool       = Elm.getElement('.quiqqer-tags-search-available-pool'),
                categories = Available.getElements('.quiqqer-tags-search-menu-entry a');

            Menu.setStyles({
                display : null,
                height  : 0,
                overflow: 'hidden',
                opacity : 0
            });


            // create the pool
            var c, i, len, clen, text, filter,
                Pattern, Category;

            var poolContent = Pool.getElement('noscript').get('html');

            var __Container = new Element('div', {
                html: poolContent
            });

            var tags = __Container.getElements('a');

            Pool.setStyles({
                clear   : 'both',
                'float' : 'left',
                position: 'relative',
                width   : '100%'
            });

            for (c = 0, clen = categories.length; c < clen; c++) {

                Category = new Element('div', {
                    'class'   : 'tag-category',
                    'data-tag': categories[c].get('data-tag'),
                    styles    : {
                        display: 'none',
                        'float': 'left',
                        opacity: 0
                    }
                }).inject(Pool);

                filter  = Category.get('data-tag');
                Pattern = new RegExp(filter, 'i');

                for (i = 0, len = tags.length; i < len; i++) {
                    text = tags[i].get('text').trim();

                    if (Pattern.test(text)) {
                        tags[i].inject(Category);
                    }
                }

                if (Category.get('html') === '') {
                    Category.set(
                        'html',
                        QUILocale.get('quiqqer/tags', 'control.tags.search.category.no.tags')
                    );
                }
            }

            categories.addEvents({
                click: function (event) {

                    if (typeOf(event) == 'domevent') {
                        event.stop();
                    }

                    var Active = null;

                    if (Available.getElement('.active')) {
                        var active = Available.getElement('.active').get('data-tag');

                        Active = Pool.getElement(
                            '.tag-category[data-tag="' + active + '"]'
                        );
                    }

                    categories.removeClass('active');
                    this.addClass('active');

                    var filter   = this.get('data-tag');
                    var Category = Pool.getElement(
                        '.tag-category[data-tag="' + filter + '"]'
                    );

                    if (Active) {
                        moofx(Active).animate({
                            opacity: 0
                        }, {
                            callback : function() {
                                Active.setStyle('display', 'none');
                            }
                        });
                    }

                    Category.setStyles({
                        display : 'inline',
                        left    : 0,
                        position: 'absolute',
                        top     : 0
                    });

                    moofx(Pool).animate({
                        height: Category.getSize().y
                    }, {
                        duration: 250
                    });

                    moofx(Category).animate({
                        opacity: 1
                    }, {
                        duration: 250
                    });
                }
            });


            //categories.addEvents({
            //    click: function (event) {
            //
            //        if (typeOf(event) == 'domevent') {
            //            event.stop();
            //        }
            //
            //        categories.removeClass('active');
            //
            //        this.addClass('active');
            //
            //        var filter  = this.get('data-tag');
            //        var Pattern = new RegExp(filter, 'i');
            //
            //        poolElements.each(function (Node) {
            //
            //            var text = Node.get('text').trim();
            //
            //            Node.setStyles({
            //                overflow  : 'hidden',
            //                whiteSpace: 'nowrap'
            //            });
            //
            //            if (Pattern.test(text)) {
            //
            //                Node.setStyles({
            //                    margin : null,
            //                    padding: null,
            //                    width  : null
            //                });
            //
            //                Node.setStyle('display', null);
            //
            //                moofx(Node).animate({
            //                    opacity: 1,
            //                    width  : Node.getScrollSize().x
            //                }, {
            //                    equation: 'cubic-bezier(.42,.4,.46,1.29)',
            //                    duration: 250
            //                });
            //
            //            } else {
            //
            //                moofx(Node).animate({
            //                    margin : 0,
            //                    opacity: 0,
            //                    padding: 0,
            //                    width  : 0
            //                }, {
            //                    duration: 250,
            //                    equation: 'cubic-bezier(.42,.4,.46,1.29)',
            //                    callback: function () {
            //                        Node.setStyle('display', 'none');
            //                    }
            //                });
            //            }
            //        });
            //    }
            //});
            //
            categories[0].fireEvent('click');

            moofx(Menu).animate({
                height : 60,
                opacity: 1
            }, {
                duration: 250,
                equation: 'cubic-bezier(.42,.4,.46,1.29)'
            });
        }

    });
});