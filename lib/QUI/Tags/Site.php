<?php

/**
 * This file contains \QUI\Tags\Site
 */

namespace QUI\Tags;

/**
 * Site events for tags
 *
 * @author www.pcsg.de (Henning Leutz)
 */

class Site
{
    /**
     * event on site save
     * @param \QUI\Projects\Project\Site $Site
     */
    static function onSave($Site)
    {
        $Project = $Site->getProject();
        $tags    = $Site->getAttribute( 'quiqqer.tags.tagList' );
        $Manager = new \QUI\Tags\Manager( $Project );

        if ( !$tags ) {
            $tags = '';
        }

        if ( is_string( $tags ) ) {
            $tags = explode( ',', $tags );
        }

        if ( !is_array( $tags ) ) {
            return;
        }

        $list = array();

        foreach ( $tags as $tag )
        {
            if ( $Manager->existsTag( $tag ) ) {
                $list[] = mb_strtolower( $tag );
            }
        }

        $Manager->setSiteTags( $Site->getId(), $list );
    }

    /**
     * event on site load
     * @param \QUI\Projects\Project\Site $Site
     */
    static function onLoad($Site)
    {
        $Manager = new \QUI\Tags\Manager( $Site->getProject() );
        $tags    = $Manager->getSiteTags( $Site->getId() );

        $Site->setAttribute( 'quiqqer.tags.tagList', $tags );
    }

    /**
     * event on site destroy
     * @param \QUI\Projects\Project\Site $Site
     */
    static function onDestroy($Site)
    {
        $Manager = new \QUI\Tags\Manager( $Site->getProject() );
        $Manager->deleteSiteTags( $Site->getId() );
    }
}
