<?php

use QUI\Tags\Controls\TagList;

/**
 * Return the tags by its sektor
 *
 * @param String $project
 * @param String $sektor
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_search_getTagsBySektor',
    function ($project, $sektor) {
        $TagList = new TagList(array(
            'Project' => QUI::getProjectManager()->decode($project)
        ));

        return $TagList->getList($sektor);
    },
    array('project', 'sektor')
);
