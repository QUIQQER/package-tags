<?php

/**
 * Exists a tag?
 *
 * @return Bool
 */

function package_quiqqer_tags_ajax_tag_exists($projectName, $projectLang, $tag)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject( $projectName, $projectLang )
    );

    return $Tags->existsTag( $tag );
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_exists',
    array( 'projectName', 'projectLang', 'tag' ),
    'Permission::checkAdminUser'
);
