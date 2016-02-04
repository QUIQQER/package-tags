<?php

/**
 * This file contains \QUI\Tags\Watch
 */

namespace QUI\Tags;

use QUI;

/**
 * Class Watch
 *
 * @package quiqqer/tags
 */
class Watch
{
    /**
     *
     * @param string $call
     * @param array $params
     * @param array $result
     *
     * @return string
     */
    public static function watchText($call, $params, $result)
    {
        switch ($call) {
            case 'package_quiqqer_tags_ajax_tag_add':
                return QUI::getLocale()->get('quiqqer/tags', 'watch.add.tags', array(
                    'tag' => $params['tag']
                ));

            case 'package_quiqqer_tags_ajax_tag_delete':
                $tags = json_decode($params['tags'], true);

                return QUI::getLocale()->get('quiqqer/tags', 'watch.delete.tags', array(
                    'tag' => implode(',', $tags)
                ));

            case 'package_quiqqer_tags_ajax_tag_edit':
                return QUI::getLocale()->get('quiqqer/tags', 'watch.edit.tags', array(
                    'tag' => $params['tag']
                ));
        }

        return '####';
    }
}
