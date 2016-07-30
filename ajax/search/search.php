<?php

/**
 * This file contains package_quiqqer_tags_ajax_search_search
 */

/**
 * Search tags
 *
 * @param string $projectName - name of the project
 * @param string $projectLang - lang of the project
 * @param string $string - matching string
 *
 * @return string
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_search_search',
    function (
        $projectName,
        $projectLang,
        $search,
        $params
    ) {
        $Tags = new QUI\Tags\Manager(
            QUI::getProject($projectName, $projectLang)
        );

        return $Tags->searchTags($search, json_decode($params, true));
    },
    array('projectName', 'projectLang', 'search', 'params')
);
