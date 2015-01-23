<?php

use QUI\Tags\Controls\TagList;

/**
 * Return the tags by its sektor
 *
 * @param String $project
 * @param String $sektor
 * @return array
 */
function package_quiqqer_tags_ajax_search_getTagsBySektor($project, $sektor)
{
    $TagList = new TagList(array(
        'Project' => QUI::getProjectManager()->decode( $project )
    ));

    return $TagList->getList( $sektor );
}

QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_search_getTagsBySektor',
    array( 'project', 'sektor' )
);
