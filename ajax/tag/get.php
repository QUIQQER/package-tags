<?php

/**
 * Add a tag
 *
 * @param string $projectName - name of the project
 * @param string $projectLang - lang of the project
 * @param string $tag - wanted tag
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_tag_get',
    function ($projectName, $projectLang, $tag) {
        $Tags = new QUI\Tags\Manager(
            QUI::getProject($projectName, $projectLang)
        );

        return $Tags->get($tag);
    },
    array('projectName', 'projectLang', 'tag', 'tagParams')
);
