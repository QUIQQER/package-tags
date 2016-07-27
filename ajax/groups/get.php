<?php

/**
 * This file contains package_quiqqer_tags_ajax_groups_get
 */

/**
 * Create a tag group
 *
 * @param string $project - JSON project params
 * @param string $params - grid params
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_groups_get',
    function ($project, $params) {
        $Project = QUI::getProjectManager()->decode($project);
        $Grid    = new QUI\Utils\Grid();
        $result  = array();

        $groupIds = QUI\Tags\Groups\Handler::getGroupIds(
            $Project,
            $Grid->parseDBParams(json_decode($params, true))
        );

        foreach ($groupIds as $groupId) {
            $Group    = QUI\Tags\Groups\Handler::get($Project, $groupId);
            $result[] = $Group->toArray();
        }

        return $result;
    },
    array('project', 'params'),
    'Permission::checkAdminUser'
);
