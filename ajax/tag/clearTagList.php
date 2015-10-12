<?php

/**
 * Get inner html for a datalist
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $tags        - JSON Array
 *
 * @return string
 */
function package_quiqqer_tags_ajax_tag_clearTagList(
    $projectName,
    $projectLang,
    $tags
) {
    $Tags = new QUI\Tags\Manager(
        QUI::getProject($projectName, $projectLang)
    );

    $result = array();
    $tags = json_decode($tags, true);

    if (!is_array($tags)) {
        $tags = array();
    }

    foreach ($tags as $tag) {
        try {

            if ($Tags->existsTag($tag)) {
                $result[] = $Tags->get($tag);
            }

        } catch (QUI\Exception $Exception) {

        }
    }

    return $result;
}

QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_clearTagList',
    array('projectName', 'projectLang', 'tags')
);
