<?php

/**
 * Add a tag
 *
 * @return Array
 */

function package_quiqqer_tags_ajax_project_getList($projectName, $projectLang, $gridParams)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject( $projectName, $projectLang )
    );

    $gridParams = json_decode( $gridParams, true );

    $Grid   = new \QUI\Utils\Grid();
    $result = $Tags->getList( $gridParams );

    return $Grid->parseResult( $result, $Tags->count() );
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_project_getList',
    array( 'projectName', 'projectLang', 'gridParams' ),
    'Permission::checkAdminUser'
);
