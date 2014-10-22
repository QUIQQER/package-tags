<?php

/**
 * Add a tag
 *
 * @return Array
 */

function package_quiqqer_tags_ajax_tag_getDataList($projectName, $projectLang, $string)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject( $projectName, $projectLang )
    );

    $result = '';
    $list   = $Tags->searchTags( $string );

    foreach ( $list as $tag ) {
        $result .= '<option value="'. $tag['tag'] .'">';
    }

    return $result;
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_getDataList',
    array( 'projectName', 'projectLang', 'string' )
);
