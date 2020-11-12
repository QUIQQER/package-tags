<?php

/**
 * This file contains package_quiqqer_tags_ajax_groups_get
 */

/**
 * Return a tag group data
 *
 * @param string $project - JSON project params
 * @param string $params - query params
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_groups_get',
    function ($project, $groupId) {
        $Project = QUI::getProjectManager()->decode($project);
        \QUI\System\Log::writeRecursive([
            'initiated' => 'package_quiqqer_tags_ajax_groups_get',
            'searched GroupId' => $groupId
        ]);
        $Group   = QUI\Tags\Groups\Handler::get($Project, $groupId);

        \QUI\System\Log::writeRecursive([
            'returning' => $Group->toArray()
        ]);
        return $Group->toArray();
    },
    ['project', 'groupId'],
    'Permission::checkAdminUser'
);
