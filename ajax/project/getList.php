<?php

/**
 * Add a tag
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $gridParams  - JSON Array, Grid parameter
 *
 * @return Array
 */

function package_quiqqer_tags_ajax_project_getList(
    $projectName,
    $projectLang,
    $gridParams
) {
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject($projectName, $projectLang)
    );

    $gridParams = json_decode($gridParams, true);

    $Grid = new \QUI\Utils\Grid();
    $result = $Tags->getList($gridParams);

    return $Grid->parseResult($result, $Tags->count());
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_project_getList',
    array('projectName', 'projectLang', 'gridParams'),
    'Permission::checkAdminUser'
);
