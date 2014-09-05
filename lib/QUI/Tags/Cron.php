<?php

/**
 * This file contains \QUI\Tags\Cron
 */

namespace QUI\Tags;

/**
 * Tag Crons - Crons for the tag system
 *
 * @author www.pcsg.de (Henning Leutz)
 */

class Cron
{
    /**
     * creates the tag cache
     *
     * @param Array $params
     * @param unknown $CronManager
     */
    static function createCache($params, $CronManager)
    {
        if ( !isset( $params['project'] ) ) {
            return;
        }

        if ( !isset( $params['lang'] ) ) {
            return;
        }


        $Project  = \QUI::getProject( $params['project'], $params['lang'] );
        $DataBase = \QUI::getDataBase();

        $tableSites     = \QUI::getDBProjectTableName( 'tags_sites', $Project );
        $tableSiteCache = \QUI::getDBProjectTableName( 'tags_siteCache', $Project );
        $tableCache     = \QUI::getDBProjectTableName( 'tags_cache', $Project );


        // get ids
        $result = $DataBase->fetch(array(
            'from' => $tableSites
        ));

        $list = array();
        $_tmp = array();

        foreach ( $result as $entry )
        {
            $tags = explode( ',', $entry['tags'] );

            foreach ( $tags as $tag )
            {
                if ( empty( $tag ) ) {
                    continue;
                }

                $entry['id'] = (int)$entry['id'];

                $_str = $entry['id'] .'_'. $tag;


                if ( isset( $_tmp[ $_str ] ) ) {
                    continue;
                }

                $list[ $tag ][] = $entry['id'];
                $_tmp[ $_str ]  = 1; // temp zum prüfen ob schon drinnen, in_array ist zulangsam
            }
        }


        /**
         * Tag cache
         */
        $DataBase->Table()->truncate( $tableCache );

        foreach ( $list as $tag => $entry )
        {
            $DataBase->insert( $tableCache, array(
                'tag'   => $tag,
                'sites' => ','. implode(',', $entry) .','
            ));
        }


        /**
         * Sites cache
         */
        $DataBase->Table()->truncate( $tableSiteCache );

        foreach ( $result as $entry )
        {
            if ( empty( $entry['tags'] ) ) {
                continue;
            }

            if ( $entry['tags'] == ',,' ) {
                continue;
            }

            if ( $entry['tags'] == ',' ) {
                continue;
            }

            try
            {
                $Site = $Project->get( (int)$entry['id'] );

                $DataBase->insert(
                    $tableSiteCache,
                    array(
                        'id'     => $Site->getId(),
                        'name'   => $Site->getAttribute('name'),
                        'title'  => $Site->getAttribute('title'),
                        'tags'   => $entry['tags'],
                        'c_date' => $Site->getAttribute('c_date'),
                        'e_date' => $Site->getAttribute('e_date')
                    )
                );

            } catch ( \QUI\Exception $Exception )
            {

            }
        }
    }
}