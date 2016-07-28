<?php

/**
 * This file contains package_quiqqer_tags_ajax_groups_save
 */

/**
 * Create a tag group
 *
 * @param string $project - JSON project params
 * @param string $groupId - Tag Group-ID
 * @param string $data - JSON group data / attributes
 *
 * @return array
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_tags_ajax_groups_save',
    function ($project, $groupId, $data) {
        $Project = QUI::getProjectManager()->decode($project);
        $data    = json_decode($data, true);
        $Group   = QUI\Tags\Groups\Handler::get($Project, $groupId);

        if (isset($data['title'])) {
            $Group->setTitle($data['title']);
        }

        if (isset($data['description'])) {
            $Group->setDescription($data['description']);
        }

        if (isset($data['image'])) {
            $Group->setImage($data['image']);
        }

        if (isset($data['tags'])) {
            $tags = explode(',', $data['tags']);

            foreach ($tags as $tag) {
                $Group->addTag($tag);
            }
        }

        $Group->save();

        QUI::getMessagesHandler()->addSuccess(
            QUI::getLocale()->get('quiqqer/tags', 'message.group.successful.save')
        );

        return $Group->toArray();
    },
    array('project', 'groupId', 'data'),
    'Permission::checkAdminUser'
);
