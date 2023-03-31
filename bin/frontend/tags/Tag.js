/**
 * @module package/quiqqer/tags/bin/frontend/tags/Tag
 * @author www.pcsg.de (Henning Leutz)
 */
define('package/quiqqer/tags/bin/frontend/tags/Tag', [

    'qui/QUI',
    'qui/controls/Control',
    'Ajax',

    'css!package/quiqqer/tags/bin/frontend/tags/Tag.css'

], function (QUI, QUIControl, QUIAjax) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/tags/bin/frontend/tags/Tag',

        Binds: [
            '$onInject',
            'delete'
        ],

        options: {
            tag      : false,
            deletable: false
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onInject: this.$onInject
            });
        },

        create: function () {
            this.$Elm = this.parent();
            this.$Elm.set('data-quiid', this.getId());
            this.$Elm.set('data-qui', this.getType());
            this.$Elm.set('data-tag', this.getAttribute('tag'));
            this.$Elm.addClass('quiqqer-tags-tag');

            this.$Text = new Element('span', {
                html: '<span class="fa fa-circle-o-notch fa-spin"></span>'
            }).inject(this.getElm());

            if (this.getAttribute('deletable')) {
                new Element('span', {
                    'class': 'fa fa-close quiqqer-tags-tag--delete',
                    events : {
                        click: (e) => {
                            e.stop();
                            this.delete();
                        }
                    }
                }).inject(this.getElm());
            }

            return this.$Elm;
        },

        $onInject: function () {
            this.getTag().then((result) => {
                this.$Text.set('html', result.title);
                this.$Text.set('title', result.title);
            });
        },

        getTag: function () {
            return new Promise((resolve, reject) => {
                QUIAjax.get('package_quiqqer_tags_ajax_tag_get', resolve, {
                    'package'  : 'quiqqer/tags',
                    tag        : this.getAttribute('tag'),
                    projectName: QUIQQER_PROJECT.name,
                    projectLang: QUIQQER_PROJECT.lang,
                    onError    : reject
                });
            });
        },

        delete: function () {
            this.getElm().destroy();

            this.fireEvent('delete', [
                this,
                this.getAttribute('tag')
            ]);

            this.destroy();
        }
    });
});
