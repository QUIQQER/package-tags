<?php

/**
 * This file contains \QUI\Tags\Controls\SiteTags
 */

namespace QUI\Tags\Controls;

use QUI;

/**
 * tag list control
 *
 * @author www.pcsg.de (Henning Leutz)
 */
class SiteTags extends QUI\Control
{
    /**
     * constructor
     *
     * @param array $attributes
     */
    public function __construct($attributes = array())
    {
        // defaults
        $this->setAttributes(array(
            'hideTitle' => true
        ));

        parent::__construct($attributes);

        $this->addCSSFile(
            dirname(__FILE__) . '/SiteTags.css'
        );

        $this->setAttribute('class', 'quiqqer-tags-list grid-100 grid-parent');
    }

    /**
     * (non-PHPdoc)
     *
     * @see \QUI\Control::create()
     */
    public function getBody()
    {
        /* @var $Site QUI\Projects\Site */
        $Engine = QUI::getTemplateManager()->getEngine();
        $Site   = $this->getAttribute('Site');

        if (!$Site) {
            $Site = QUI::getRewrite()->getSite();
        }

        $Project = $Site->getProject();
        $Tags    = new QUI\Tags\Manager($Project);
        $tags    = $Site->getAttribute('quiqqer.tags.tagList');
        $tagList = array();

        if (is_array($tags)) {
            foreach ($tags as $tag) {
                try {
                    $tagList[] = $Tags->get($tag);
                } catch (QUI\Exception $Exception) {
                }
            }
        }


        $Engine->assign(array(
            'Project' => $Project,
            'Site' => $Site,
            'Locale' => QUI::getLocale(),
            'TagManager' => new QUI\Tags\Manager($Project),
            'this' => $this,
            'tagList' => $tagList
        ));


        // Sucheseite finden
        $cacheName = $Project->getName() . '/' . $Project->getLang()
                     . '/sites/quiqqer/tags:types/tag-search';

        try {
            $result = QUI\Cache\Manager::get($cacheName);

        } catch (QUI\Exception $Exception) {
            $result = $Project->getSites(array(
                'where' => array(
                    'type' => 'quiqqer/tags:types/tag-search'
                )
            ));

            QUI\Cache\Manager::set($cacheName, $result, 60);
        }

        $SearchSite = $Site;

        if (isset($result[0])) {
            $SearchSite = $result[0];
        }

        $Engine->assign(array(
            'SearchSite' => $SearchSite
        ));

        return $Engine->fetch(dirname(__FILE__) . '/SiteTags.html');
    }
}
