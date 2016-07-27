<?php

/**
 * Add a tag
 *
 * @param string $projectName - name of the project
 * @param string $projectLang - lang of the project
 * @param string $tag - wanted tag
 * @param string $tagParams - JSON Array, Tag attributes
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_tag_edit',
    function (
        $projectName,
        $projectLang,
        $tag,
        $tagParams
    ) {
        $Tags = new QUI\Tags\Manager(
            QUI::getProject($projectName, $projectLang)
        );

        $tagParams = json_decode($tagParams, true);

        $Tags->edit($tag, $tagParams);
    },
    array('projectName', 'projectLang', 'tag', 'tagParams'),
    'Permission::checkUser'
);
