<?php

/**
 * this file contains package_quiqqer_tags_ajax_project_getList
 */

/**
 * Return a tag list from the project
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $gridParams - JSON Array, Grid parameter
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_project_getList',
    function (
        $projectName,
        $projectLang,
        $gridParams
    ) {
        \ini_set('display_errors', 1);

        $Tags = new QUI\Tags\Manager(
            QUI::getProject($projectName, $projectLang)
        );

        $gridParams = \json_decode($gridParams, true);

        $Grid   = new QUI\Utils\Grid($gridParams);
        $result = $Tags->getList($gridParams);

        return $Grid->parseResult($result, $Tags->count());
    },
    ['projectName', 'projectLang', 'gridParams'],
    'Permission::checkAdminUser'
);
