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
    public static function onSave($Site)
    {
        $Project = $Site->getProject();
        $tags    = $Site->getAttribute('quiqqer.tags.tagList');
        $Manager = new QUI\Tags\Manager($Project);

        // register path
        if ($Site->getAttribute('type') == 'quiqqer/tags:types/tag-listing' &&
            $Site->getAttribute('active')
        ) {
            $url = $Site->getLocation();
            $url = \str_replace(QUI\Rewrite::getDefaultSuffix(), '', $url);

            QUI::getRewrite()->registerPath($url.'/*', $Site);
        }

        // set tags
        if (empty($tags) || (!\is_string($tags) && !\is_array($tags))) {
            $tags = [];
        } elseif (\is_string($tags)) {
            $tags = \explode(',', \trim($tags, ','));
        }

        $list = [];

        foreach ($tags as $tag) {
            if ($Manager->existsTag($tag)) {
                $list[] = $tag;
            }
        }

        $User  = QUI::getUserBySession();
        $limit = $User->getPermission('tags.siteLimit', 'maxInteger');

        if ($limit < \count($list)) {
            $message = QUI::getLocale()->get(
                'quiqqer/tags',
                'exception.limit.tags.to.site',
                ['limit' => $limit]
            );

            QUI::getMessagesHandler()->addAttention($message);

            throw new QUI\Tags\Exception($message);
        }

        $Manager->setSiteTags($Site->getId(), $list);

        self::setTagsToFulltextSearch($Site, $list);
    }

    /**
     * Add tags to Fulltext search
     *
     * @param QUI\Projects\Site $Site
     * @param array $tags
     * @return void
     */
    public static function setTagsToFulltextSearch($Site, $tags)
    {
        try {
            QUI::getPackageManager()->getInstalledPackage('quiqqer/search');
        } catch (\Exception $Exception) {
            return;
        }

        QUI\Search\Fulltext::setEntryData(
            $Site->getProject(),
            $Site->getId(),
            [
                'tags' => ','.\implode(",", $tags).','
            ]
        );
    }

    /**
     * event : on site deactivate
     *
     * @param \QUI\Projects\Site $Site
     *
     * @throws \QUI\Exception
     */
    public static function onSiteDeactivate($Site)
    {
        self::onSave($Site);
    }

    /**
     * event on site load
     *
     * @param \QUI\Projects\Site $Site
     */
    public static function onLoad($Site)
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
    public static function onDestroy($Site)
    {
        $Manager = new QUI\Tags\Manager($Site->getProject());
        $Manager->deleteSiteTags($Site->getId());
    }
}
