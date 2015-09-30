<?php

/**
 * This file contains \QUI\Tags\Site
 */

namespace QUI\Tags;

use QUI;

/**
 * Site events for tags
 *
 * @author www.pcsg.de (Henning Leutz)
 */
class Site
{
    /**
     * event on site save
     *
     * @param \QUI\Projects\Site $Site
     *
     * @throws \QUI\Exception
     */
    static function onSave($Site)
    {
        $Project = $Site->getProject();
        $tags    = $Site->getAttribute('quiqqer.tags.tagList');
        $Manager = new QUI\Tags\Manager($Project);

        // register path
        if ($Site->getAttribute('type') == 'types/tag-listing' &&
            $Site->getAttribute('active')
        ) {
            $url = $Site->getUrlRewrited();
            $url = str_replace(QUI\Rewrite::URL_DEFAULT_SUFFIX, '', $url);

            QUI::getRewrite()->registerPath($url . '/*', $Site);
        }


        // set tags
        if (!$tags) {
            $tags = '';
        }

        if (is_string($tags)) {
            $tags = explode(',', $tags);
        }

        if (!is_array($tags)) {
            return;
        }

        $list = array();

        foreach ($tags as $tag) {
            if ($Manager->existsTag($tag)) {
                $list[] = $tag;
            }
        }

        $User  = \QUI::getUserBySession();
        $limit = $User->getPermission('tags.siteLimit', 'max_integer');

        if ($limit < count($list)) {
            throw new QUI\Exception(
                QUI::getLocale()
                    ->get('quiqqer/tags', 'exception.limit.tags.to.site', array(
                        'limit' => $limit
                    ))
            );
        }

        $Manager->setSiteTags($Site->getId(), $list);
    }

    /**
     * event on site load
     *
     * @param \QUI\Projects\Site $Site
     */
    static function onLoad($Site)
    {
        $Manager = new QUI\Tags\Manager($Site->getProject());
        $tags    = $Manager->getSiteTags($Site->getId());

        $Site->setAttribute('quiqqer.tags.tagList', $tags);
    }

    /**
     * event on site destroy
     *
     * @param \QUI\Projects\Site $Site
     */
    static function onDestroy($Site)
    {
        $Manager = new QUI\Tags\Manager($Site->getProject());
        $Manager->deleteSiteTags($Site->getId());
    }
}
