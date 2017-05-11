/**
 * Tag Select
 *
 * @module package/quiqqer/tags/bin/TagSelect
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/controls/Control
 *
 * @event onChange [selectedTags, this]
 */
define('package/quiqqer/tags/bin/TagSelect', [

    'qui/controls/Control',
    'qui/controls/buttons/Select'

], function (QUIControl, QUISelect) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/TagSelect',

        Binds: [
            '$onImport',
            'getSelectedTags'
        ],

        initialize: function (options) {
            this.parent(options);

            this.$tagSelects = [];

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
            this.$parseTagSelects();
        },

        /**
         * Parse all tag selects and convert them to QUISelects
         */
        $parseTagSelects: function () {
            var self = this;

            this.$Elm.getElements('.quiqqer-tags-tagselect-select').each(function (SelectElm) {
                var Select = new QUISelect({
                    showIcons            : false,
                    multiple             : true,
                    checkable            : true,
                    placeholderText      : SelectElm.get('data-taggroup'),
                    placeholderIcon      : false,
                    placeholderSelectable: false,
                }).inject(self.$Elm);

                var values = [];

                SelectElm.getElements('option').each(function (OptionElm) {
                    if (OptionElm.value === '') {
                        return;
                    }

                    Select.appendChild(
                        OptionElm.innerHTML,
                        OptionElm.value
                    );

                    if (OptionElm.get('data-selected') === "1") {
                        values.push(OptionElm.value);
                    }

                    Select.setValues(values);
                });

                Select.addEvent('change', function() {
                    self.fireEvent('change', [self.getSelectedTags(), self]);
                });

                self.$tagSelects.push(Select);
            });
        },

        /**
         * Get all selected tags
         *
         * @return {Array}
         */
        getSelectedTags: function () {
            var selectedTags = [];

            for (var i = 0, len = this.$tagSelects.length; i < len; i++) {
                selectedTags = selectedTags.combine(this.$tagSelects[i].getValue());
            }

            console.log(selectedTags);

            return selectedTags;
        }
    });
});