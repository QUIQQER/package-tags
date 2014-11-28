<?php

/**
 * This file contains \QUI\Tags\Controls\TagList
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
     * @param Array $attributes
     */
    public function __construct($attributes=array())
    {
        parent::setAttributes( $attributes );

        $this->addCSSFile(
            dirname( __FILE__ ) .'/SiteTags.css'
        );

        $this->setAttribute( 'class', 'quiqqer-tags-list grid-100 grid-parent' );
    }

    /**
     * (non-PHPdoc)
     * @see \QUI\Control::create()
     */
    public function getBody()
    {
        /* @var $Site QUI\Projects\Site */
        $Engine  = QUI::getTemplateManager()->getEngine();
        $Site    = $this->getAttribute('Site');
        $Project = $Site->getProject();


        $Engine->assign(array(
            'Project'    => $Project,
            'Site'       => $Site,
            'Locale'     => QUI::getLocale(),
            'TagManager' => new QUI\Tags\Manager( $Project ),
            'this'       => $this
        ));


        // Sucheseite finden
        $result = $Project->getSites(array(
            'where' => array(
                'type' => 'quiqqer/tags:types/search'
            )
        ));

        $SearchSite = $Site;

        if ( isset( $result[0] ) ) {
            $SearchSite = $result[0];
        }

        $Engine->assign(array(
            'SearchSite' => $SearchSite
        ));

        return $Engine->fetch( dirname( __FILE__ ) .'/SiteTags.html' );
    }
}
