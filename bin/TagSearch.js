
/**
 *
 */
define('package/quiqqer/tags/bin/TagSearch', [

    'qui/QUI',
    'qui/controls/Control'

], function(QUI, QUIControl)
{
    "use strict";

    return new Class({

        Extends : QUIControl,
        Type : 'package/quiqqer/tags/bin/TagSearch',

        Binds : [
            '$onImport'
        ],

        initialize : function()
        {
            this.addEvents({
                onImport : this.$onImport
            });
        },

        /**
         * event : on import
         */
        $onImport : function()
        {
            var Elm = this.getElm();

            // available list
            var Menu         = Elm.getElement('.quiqqer-tags-search-menu'),
                Available    = Elm.getElement('.quiqqer-tags-search-available'),
                Pool         = Elm.getElement('.quiqqer-tags-search-available-pool'),
                poolElements = Pool.getElements('.qui-tags-tag'),
                categories   = Available.getElements('.quiqqer-tags-search-menu-entry a');

            Menu.setStyles({
                display : null,
                height  : 0,
                overflow : 'hidden',
                opacity : 0
            });

            categories.addEvents({
                click : function(event) {

                    if (typeOf(event) == 'domevent') {
                        event.stop();
                    }

                    categories.removeClass('active');

                    this.addClass('active');

                    var filter = this.get('data-tag');
                    var Pattern = new RegExp(filter, 'i');

                    poolElements.each(function(Node) {

                        var text = Node.get('text').trim();

                        Node.setStyles({
                            overflow   : 'hidden',
                            whiteSpace : 'nowrap'
                        });

                        if (Pattern.test(text)) {

                            Node.setStyles({
                                margin  : null,
                                padding : null,
                                width   : null
                            });

                            Node.setStyle('display', null);

                            moofx(Node).animate({
                                opacity : 1,
                                width   : Node.getScrollSize().x
                            }, {
                                equation : 'cubic-bezier(.42,.4,.46,1.29)',
                                duration : 250
                            });

                        } else {

                            moofx(Node).animate({
                                margin  : 0,
                                opacity : 0,
                                padding : 0,
                                width   : 0
                            }, {
                                duration : 250,
                                equation : 'cubic-bezier(.42,.4,.46,1.29)',
                                callback : function() {
                                    Node.setStyle('display', 'none');
                                }
                            });
                        }
                    });
                }
            });

            categories[0].fireEvent('click');

            moofx(Menu).animate({
                height  : 60,
                opacity : 1
            }, {
                duration : 250,
                equation : 'cubic-bezier(.42,.4,.46,1.29)'
            });
        }

    });
});