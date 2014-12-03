<?php

/**
 * Add a tag
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $tags - JSON Array, list of tags to be deleted
 * @return Array
 */
function package_quiqqer_tags_ajax_tag_delete($projectName, $projectLang, $tags)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject( $projectName, $projectLang )
    );

    $tags = json_decode( $tags, true );

    foreach ( $tags as $tag )
    {
        try
        {
            $Tags->deleteTag( $tag );

        } catch ( \QUI\Exception $Exception )
        {
            \QUI::getMessagesHandler()->addError( $Exception->getMessage() );
        }
    }
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_delete',
    array( 'projectName', 'projectLang', 'tags' ),
    'Permission::checkUser'
);
