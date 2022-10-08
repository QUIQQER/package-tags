/**
 * @module package/quiqqer/tags/bin/frontend/groups/Select
 * @author www.pcsg.de (Henning Leutz)
 *
 * @event onSelect [Instance, value]
 */
define('package/quiqqer/tags/bin/frontend/groups/Select', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/buttons/Select',
    'Ajax',

    'css!package/quiqqer/tags/bin/frontend/groups/Select.css'

], function (QUI, QUIControl, QUISelect, QUIAjax) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/frontend/groups/Select',

        Binds: [
            '$onImport'
        ],

        options: {
            groupId: false
        },

        initialize: function (options) {
            this.parent(options);

            this.$Input = null;
            this.$Select = null;

            this.addEvents({
                onImport: this.$onImport
            });
        },

        $onImport: function () {
            if (this.getElm().nodeName === 'INPUT') {
                this.$Input = this.getElm();
                this.$Input.type = 'hidden';

                this.$Elm = new Element('div', {
                    'data-quiid': this.getId(),
                    'data-qui'  : 'package/quiqqer/tags/bin/frontend/groups/Select'
                }).wraps(this.$Input);
            } else {
                this.$Input = new Element('input', {
                    type: 'hidden'
                }).inject(this.getElm());
            }

            this.getElm().addClass('quiqqer-tags-groups-select');

            this.$Select = new QUISelect({
                searchable: true,
                events    : {
                    onChange: (value) => {
                        this.fireEvent('select', [
                            this,
                            value
                        ]);
                    }
                }
            }).inject(this.getElm());
        },

        /**
         *
         * @param {Number} groupId
         */
        setGroup: function (groupId) {
            this.$Select.disable();

            QUIAjax.get('package_quiqqer_tags_ajax_groups_search_getTagsByGroup', (tags) => {
                this.$Select.clear();

                for (let i = 0, len = tags.length; i < len; i++) {
                    this.$Select.appendChild(tags[i].title, tags[i].tag);
                }

                this.$Select.enable();
            }, {
                'package': 'quiqqer/tags',
                groupId  : groupId,
                recursive: 1
            });
        },

        setValue: function (value) {
            this.$Select.setValue(value);
        }
    });
});