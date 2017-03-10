/**
 * @module package/quiqqer/tags/bin/groups/SelectItem
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/controls/Control
 * @require css!package/quiqqer/tags/bin/groups/SelectItem.css
 */
define('package/quiqqer/tags/bin/groups/SelectItem', [

    'qui/controls/Control',
    'Ajax',
    'Locale',

    'css!package/quiqqer/tags/bin/groups/SelectItem.css'

], function (QUIControl, QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({
        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/groups/SelectItem',

        Binds: [
            '$onInject'
        ],

        options: {
            id         : false,
            projectName: '',
            projectLang: ''
        },

        initialize: function (options) {
            this.parent(options);

            this.$Icon    = null;
            this.$Text    = null;
            this.$Destroy = null;
            this.$Project = null;

            this.addEvents({
                onInject: this.$onInject
            });
        },

        /**
         * Return the DOMNode Element
         *
         * @returns {HTMLElement}
         */
        create: function () {
            var self = this,
                Elm  = this.parent();

            Elm.set({
                'class': 'quiqqer-tags-groups-selectItem smooth',
                html   : '<span class="quiqqer-tags-groups-selectItem-icon fa fa-tags"></span>' +
                '<span class="quiqqer-tags-groups-selectItem-text">&nbsp;</span>' +
                '<span class="quiqqer-tags-groups-selectItem-destroy fa fa-remove"></span>'
            });

            this.$Icon    = Elm.getElement('.quiqqer-tags-groups-selectItem-icon');
            this.$Text    = Elm.getElement('.quiqqer-tags-groups-selectItem-text');
            this.$Destroy = Elm.getElement('.quiqqer-tags-groups-selectItem-destroy');

            this.$Destroy.addEvent('click', function () {
                self.destroy();
            });

            return Elm;
        },

        /**
         * event : on inject
         */
        $onInject: function () {
            var self = this;

            this.$Text.set({
                html: '<span class="fa fa-spinner fa-spin"></span>'
            });

            var projectName = false,
                projectLang = false;

            if (this.getAttribute('Parent')) {
                var Parent = this.getAttribute('Parent');

                projectName = Parent.getAttribute('projectName');
                projectLang = Parent.getAttribute('projectLang');
            }

            if (this.getAttribute('projectName')) {
                projectName = this.getAttribute('projectName');
            }

            if (this.getAttribute('projectLang')) {
                projectLang = this.getAttribute('projectLang');
            }

            var groupId = this.getAttribute('id');

            if (groupId === 'all') {
                this.$Text.set('html', QUILocale.get(lg, 'controls.groups.map.category.all'));
                return;
            }

            QUIAjax.get('package_quiqqer_tags_ajax_groups_get', function (data) {
                self.$Text.set('html', data.title);
            }, {
                'package': 'quiqqer/tags',
                project  : JSON.encode({
                    name: projectName,
                    lang: projectLang
                }),
                groupId  : this.getAttribute('id'),
                onError  : function () {
                    self.$Icon.removeClass('fa-tags');
                    self.$Icon.addClass('fa-bolt');
                    self.$Text.set('html', '...');
                }
            });
        }
    });
});
