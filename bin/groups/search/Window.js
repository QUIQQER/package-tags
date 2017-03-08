/**
 * @module package/quiqqer/tags/bin/groups/search/Window
 * @author www.pcsg.de (Henning Leutz)
 *
 * @require qui/QUI
 * @require qui/controls/windows/Confirm
 * @require Locale
 * @require Ajax
 * @require Projects
 * @require package/quiqqer/tags/bin/groups/search/Search
 *
 * @event onSubmit [self, [selectedTags] ]
 */
define('package/quiqqer/tags/bin/groups/search/Window', [

    'qui/QUI',
    'qui/controls/windows/Confirm',
    'Locale',
    'Ajax',
    'Projects',
    'package/quiqqer/tags/bin/groups/search/Search',
    'package/quiqqer/tags/bin/groups/SelectMap',

    'css!package/quiqqer/tags/bin/groups/search/Window.css'

], function (QUI, QUIConfirm, QUILocale, QUIAjax, Projects, Search, GroupSelectMap) {
    "use strict";

    var lg = 'quiqqer/tags';

    return new Class({
        Extends: QUIConfirm,
        Type   : 'package/quiqqer/tags/bin/groups/search/Window',

        Binds: [
            '$onOpen'
        ],

        options: {
            projectName   : false,
            projectLang   : false,
            maxHeight     : 600,
            maxWidth      : 400,
            icon          : 'fa fa-search',
            title         : QUILocale.get(lg, 'control.grouptags.search.window.title'),
            autoclose     : true,
            dblClickSubmit: true, // can submit tag group selection with double click,
            multiselect   : true   // allows selection of multiple tag groups
        },

        initialize: function (options) {
            this.parent(options);

            this.$Project = Projects.get(
                this.getAttribute('projectName'),
                this.getAttribute('projectLang')
            );

            this.$Search    = null;
            this.$SelectMap = null;

            this.addEvents({
                onOpen: this.$onOpen
            });
        },

        /**
         * event: on open
         */
        $onOpen: function () {
            var self         = this,
                SubmitButton = this.getButton('submit'),
                Content      = this.getContent();

            var infoText = QUILocale.get(lg, 'control.grouptags.search.window.info');

            if (this.getAttribute('multiselect')) {
                infoText = QUILocale.get(lg, 'control.grouptags.search.window.info.multiselect');
            }

            Content.set(
                'html',
                '<div class="quiqqer-tags-search-window-info">' +
                    '<p>' + infoText + '</p>' +
                '</div>' +
                '<div class="quiqqer-tags-search-window-tree"></div>'
            );

            SubmitButton.disable();

            this.$SelectMap = new GroupSelectMap({
                Project    : this.$Project,
                multiselect: this.getAttribute('multiselect'),
                events     : {
                    onChange: function () {
                        SubmitButton.enable();
                    }
                }
            }).inject(
                Content.getElement('.quiqqer-tags-search-window-tree')
            );

            //this.$Search = new Search({
            //    projectName   : this.getAttribute('projectName'),
            //    projectLang   : this.getAttribute('projectLang'),
            //    dblClickSubmit: this.getAttribute('dblClickSubmit'),
            //    events        : {
            //        onChange: function (Search) {
            //            if (Search.getSelectedGroupTags().length) {
            //                SubmitButton.enable();
            //            } else {
            //                SubmitButton.disable();
            //            }
            //        },
            //
            //        onSubmit: function () {
            //            self.submit();
            //        }
            //    }
            //}).inject(this.getContent());
        },

        /**
         * Submit the window
         */
        submit: function () {
            //var selected = this.$Search.getSelectedGroupTags();
            var selected = this.$SelectMap.getSelectedGroupIds();

            if (!selected.length) {
                this.fireEvent('submit', [this, false]);
            } else {
                this.fireEvent('submit', [this, selected]);
            }

            if (this.getAttribute('autoclose')) {
                this.close();
            }
        }
    });
});