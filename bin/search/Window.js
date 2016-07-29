/**
 * @module package/quiqqer/tags/bin/search/Window
 * @author www.pcsg.de (Henning Leutz)
 */
define('package/quiqqer/tags/bin/search/Window', [

    'qui/QUI',
    'qui/controls/windows/Confirm',
    'Locale',
    'Ajax',
    'Projects',
    'package/quiqqer/tags/bin/TagSearch'

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
            maxWidth   : 800,
            icon       : 'fa fa-search',
            title      : QUILocale.get(lg, 'control.tags.search.window.title')
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
            this.getContent().set('html', '');

            this.$Search = new Search().inject(this.getContent());
        }
    });
});