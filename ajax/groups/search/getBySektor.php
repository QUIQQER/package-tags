<?php

/**
 * This file contains package_quiqqer_tags_ajax_groups_search_getBySektor
 */

/**
 * Return the tag groups by its sektor
 *
 * @param string $project
 * @param string $sektor
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_groups_search_getBySektor',
    function ($project, $sektor) {
        return QUI\Tags\Groups\Handler::getBySektor(
            QUI::getProjectManager()->decode($project),
            $sektor
        );
    },
    array('project', 'sektor')
);
