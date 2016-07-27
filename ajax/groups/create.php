<?php

/**
 * This file contains package_quiqqer_tags_ajax_groups_create
 */

/**
 * Create a tag group
 *
 * @param string $ - JSON query params
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_groups_create',
    function ($title, $image) {

    },
    array('title', 'image'),
    'Permission::checkAdminUser'
);
