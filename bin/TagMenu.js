/**
 * Tag Menu
 *
 * @module package/quiqqer/tags/bin/TagMenu
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/controls/Control
 *
 * @event onChange [selectedTags, this]
 */
define('package/quiqqer/tags/bin/TagMenu', [

    'qui/controls/Control'

], function (QUIControl) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/TagMenu',

        Binds: [
            '$onImport',
            '$change'
        ],

        initialize: function (options) {
            this.parent(options);

            this.$tagElms = [];

            this.addEvents({
                onImport: this.$onImport
            });
        },

        /**
         * event : on import
         */
        $onImport: function () {
            var self = this;

            this.$Elm = this.getElm();

            // parse all tag group elements and make them toggleable
            var tagGroupIconElms = this.$Elm.getElements(
                '.quiqqer-tags-tagmenu-list-li-label-icon'
            );

            var FuncOnTagGroupIconClick = function (event) {
                event.stop();

                var Target = event.target;

                if (!Target.hasClass('quiqqer-tags-tagmenu-list-li-label-icon')) {
                    Target = Target.getParent();
                }

                var LiElm   = Target.getParent('li').getElement('ul.quiqqer-tags-tagmenu-list-children');
                var IconElm = Target.getElement('span');

                if (!LiElm) {
                    return;
                }

                if (LiElm.getStyle('display') === 'none') {
                    IconElm.removeClass('fa fa-angle-right');
                    IconElm.addClass('fa fa-angle-down');

                    LiElm.setStyle('display', '');
                    return;
                }


                IconElm.addClass('fa fa-angle-right');
                IconElm.removeClass('fa fa-angle-down');

                LiElm.setStyle('display', 'none');
            };

            tagGroupIconElms.addEvent('click', FuncOnTagGroupIconClick);

            // parse all elements with checkbox
            var tagElms = this.$Elm.getElements(
                '.quiqqer-tags-tagmenu-list-li-label-checkbox > input'
            );

            var FuncOnTagElmClick = function (event) {
                event.stop();
                self.$change();
            };

            var FuncOnTagLinkElmClick = function (event) {
                event.stop();

                var CheckboxElm = event.target.getPrevious(
                    '.quiqqer-tags-tagmenu-list-li-label-checkbox > input'
                );

                CheckboxElm.click();
            };

            for (var i = 0, len = tagElms.length; i < len; i++) {
                var TagElm = tagElms[i];

                var TagLinkElm = TagElm.getParent().getNext(
                    'a.quiqqer-tags-tagmenu-list-li-label-link'
                );

                TagElm.addEvent('change', FuncOnTagElmClick);
                TagLinkElm.addEvent('click', FuncOnTagLinkElmClick);

                this.$tagElms.push(TagElm);
            }
        },

        /**
         * Fire onChange event
         */
        $change: function () {
            this.fireEvent('change', [this.getSelectedTags(), this]);
        },

        /**
         * Get all selected tags
         *
         * @return {Array}
         */
        getSelectedTags: function () {
            var selectedTags = [];

            for (var i = 0, len = this.$tagElms.length; i < len; i++) {
                var TagElm = this.$tagElms[i];

                if (TagElm.checked) {
                    selectedTags.push({
                        tag  : TagElm.value,
                        title: TagElm.getProperty('data-title')
                    });
                }
            }

            return selectedTags;
        }
    });
});