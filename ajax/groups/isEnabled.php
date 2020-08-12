<?php

use QUI\Tags\Groups\Handler;

/**
 * Check if the tag group feature is enabled
 *
 * @return bool
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_groups_isEnabled',
    function () {
        return Handler::isTagGroupsEnabled();
    },
    [],
    'Permission::checkAdminUser'
);
