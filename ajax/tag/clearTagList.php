<?php

/**
 * Get inner html for a datalist
 *
 * @param string $projectName - name of the project
 * @param string $projectLang - lang of the project
 * @param string $tags - JSON Array
 *
 * @return string
 */

QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_tag_clearTagList',
    function (
        $projectName,
        $projectLang,
        $tags
    ) {
        $Tags = new QUI\Tags\Manager(
            QUI::getProject($projectName, $projectLang)
        );

        $result = array();
        $tags   = json_decode($tags, true);

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
    },
    array('projectName', 'projectLang', 'tags')
);
