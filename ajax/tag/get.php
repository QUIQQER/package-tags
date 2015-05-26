<?php

/**
 * Add a tag
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $tag         - wanted tag
 *
 * @return Array
 */
function package_quiqqer_tags_ajax_tag_get($projectName, $projectLang, $tag)
{
    $Tags = new \QUI\Tags\Manager(
        \QUI::getProject($projectName, $projectLang)
    );

    return $Tags->get($tag);
}

\QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_get',
    array('projectName', 'projectLang', 'tag', 'tagParams')
);
