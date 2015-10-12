<?php

/**
 * Add a tag
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $tag         - wanted tag
 * @param String $tagParams   - JSON Array, Tag attributes
 *
 * @return Array
 */
function package_quiqqer_tags_ajax_tag_add(
    $projectName,
    $projectLang,
    $tag,
    $tagParams
) {
    $Tags = new QUI\Tags\Manager(
        QUI::getProject($projectName, $projectLang)
    );

    $tagParams = json_decode($tagParams, true);

    return $Tags->add($tag, $tagParams);
}

QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_add',
    array('projectName', 'projectLang', 'tag', 'tagParams'),
    'Permission::checkUser'
);
