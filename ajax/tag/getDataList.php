<?php

/**
 * Get inner html for a datalist
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $string - matching string
 *
 * @return string
 */

function package_quiqqer_tags_ajax_tag_getDataList($projectName, $projectLang, $string)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject( $projectName, $projectLang )
    );

    $result = '';
    $list   = $Tags->searchTags( $string );

    foreach ( $list as $tag )
    {
        $value = $tag['tag'];

        if ( !empty( $tag['title'] ) ) {
            $value = $tag['title'];
        }

        $result .= '<option value="'. $value .'" data-tag="'. $tag['tag'] .'">';
    }

    return $result;
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_getDataList',
    array( 'projectName', 'projectLang', 'string' )
);
