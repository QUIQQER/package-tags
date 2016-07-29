/**
 * @module package/quiqqer/tags/bin/search/Window
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/windows/Confirm
 * @require Locale
 * @require Ajax
 * @require Projects
 * @require package/quiqqer/tags/bin/search/Search
 *
 * @event onSubmit [self, [selectedTags] ]
 */
define('package/quiqqer/tags/bin/search/Window', [

    'qui/QUI',
    'qui/controls/windows/Confirm',
    'Locale',
    'Ajax',
    'Projects',
    'package/quiqqer/tags/bin/search/Search'

], function (QUI, QUIConfirm, QUILocale, QUIAjax, Projects, Search) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({
        Extends: QUIConfirm,
        Type   : 'package/quiqqer/tags/bin/search/Window',

        Binds: [
            '$onOpen'
        ],

        options: {
            projectName: false,
            projectLang: false,
            maxHeight  : 600,
            maxWidth   : 400,
            icon       : 'fa fa-search',
            title      : QUILocale.get(lg, 'control.tags.search.window.title'),
            autoclose  : true
        },

        initialize: function (options) {
            this.parent(options);

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.$Search = null;

            this.addEvents({
                onOpen: this.$onOpen
            });
        },

        /**
         * event: on open
         */
        $onOpen: function () {
            var self         = this,
                SubmitButton = this.getButton('submit');

            this.getContent().set('html', '');

            SubmitButton.disable();

            this.$Search = new Search({
                projectName: this.getAttribute('projectName'),
                projectLang: this.getAttribute('projectLang'),
                events     : {
                    onChange: function (Search) {
                        if (Search.getSelectedTags().length) {
                            SubmitButton.enable();
                        } else {
                            SubmitButton.disable();
                        }
                    },

                    onSubmit: function () {
                        self.submit();
                    }
                }
            }).inject(this.getContent());
        },

        /**
         * Submit the window
         */
        submit: function () {
            var selected = this.$Search.getSelectedTags();

            if (!selected.length) {
                return;
            }

            this.fireEvent('submit', [this, selected]);

            if (this.getAttribute('autoclose')) {
                this.close();
            }
        }
    });
});