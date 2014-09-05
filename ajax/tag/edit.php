<?php

/**
 * Add a tag
 *
 * @return Array
 */

function package_quiqqer_tags_ajax_tag_edit($projectName, $projectLang, $tag, $tagParams)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject( $projectName, $projectLang )
    );

    $tagParams = json_decode( $tagParams, true );

    $Tags->edit( $tag, $tagParams );
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_edit',
    array( 'projectName', 'projectLang', 'tag', 'tagParams' ),
    'Permission::checkAdminUser'
);