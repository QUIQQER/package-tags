<?php

/**
 * This file contains \QUI\Tags\Manager
 */

namespace QUI\Tags;

use \QUI\Utils\Security\Orthos;
use \QUI\Projects\Site\Edit;

/**
 * Tag Manager
 * manage tags for a project
 *
 * @author www.pcsg.de (Henning Leutz)
 * @todo tag permissions
 */

class Manager
{
    /**
     * Project
     * @var \QUI\Projects\Project
     */
    protected $_Project;

    /**
     * tag list
     * @var array
     */
    protected $_tags = array();

    /**
     * constructor
     * @param \QUI\Projects\Project $Project
     */
    public function __construct(\QUI\Projects\Project $Project)
    {
        $this->_Project = $Project;
    }

    /**
     * Add a tag
     *
     * @param String $tag
     * @param Array $params
     */
    public function add($tag, $params)
    {
        $tag = mb_strtolower( $tag );
        $tag = $this->clearTagName( $tag );

        if ( $this->existsTag( $tag ) )
        {
            throw new \QUI\Exception(
                \QUI::getLocale()->get('quiqqer/tags', 'exception.tag.already.exists')
            );
        }

        \QUI::getDataBase()->insert(
            \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            array( 'tag' => $tag )
        );

        $this->edit( $tag , $params );
    }

    /**
     * Tag Namen säubern
     *
     * @param String $str
     *
     * @return String
     */
    static function clearTagName($str)
    {
        $str = Orthos::clear( $str );
        $str = str_replace( array( '|', ' ', "\t", "\n" ), '', $str );
        $str = str_replace( array( '/', '.', '-' ), '_', $str );

        return $str;
    }

    /**
     * Count the tags in the Project
     *
     * @return Integer
     */
    public function count()
    {
        $result = \QUI::getDataBase()->fetch(array(
            'count'  => array(
                'select' => 'tag',
                'as'     => 'count'
            ),
            'from'  => \QUI::getDBProjectTableName( 'tags', $this->_Project )
        ));

        return (int)$result[ 0 ][ 'count' ];
    }

    /**
     * Delete the tag
     *
     * @param String $tag
     */
    public function deleteTag($tag)
    {
        $tag = $this->clearTagName( $tag );

        if ( !$this->existsTag( $tag ) ) {
             return;
        }

        $DataBase = \QUI::getDataBase();

        // Erstmal alle Elternbeziehungen löschen
        $DataBase->fetchSQL(
            "UPDATE `". \QUI::getDBProjectTableName( 'tags', $this->_Project ) ."`
             SET `ptags` = replace(`ptags`, ',". $tag .",', ',')"
        );

        // Dann sich selbst löschen
        $DataBase->delete(
            \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            array('tag' => $tag)
        );

        // @todo cache auch löschen?
    }

    /**
     * Edit a tag
     *
     * @param String $tag
     * @param Array $params
     */
    public function edit($tag, $params)
    {
        $tag = mb_strtolower( $tag );

        // exist tag?
        $tagParams = $this->get( $tag );

        if ( isset( $params['title'] ) ) {
            $tagParams['title'] = Orthos::clear( $params['title'] );
        }

        if ( isset( $params['desc'] ) ) {
            $tagParams['desc'] = Orthos::clear( $params['desc'] );
        }

        if ( isset( $params['image'] ) ) {
            $tagParams['image'] = Orthos::clear( $params['image'] );
        }

        if ( isset( $params['url'] ) ) {
            $tagParams['url'] = Orthos::clear( $params['url'] );
        }


        \QUI::getDataBase()->update(
            \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            $tagParams,
            array( 'tag' => $tag )
        );
    }

    /**
     * Exists the tag?
     *
     * @param String $tag
     * @return Bool
     */
    public function existsTag($tag)
    {
        $result = \QUI::getDataBase()->fetch(array(
            'from'  => \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            'where' => array(
                'tag' => $tag
            ),
            'limit' => 1
        ));

        return isset( $result[ 0 ] );
    }

    /**
     * Return a tag
     *
     * @param String $tag
     */
    public function get($tag)
    {
        if ( isset( $this->_tags[ $tag ] ) ) {
            return $this->_tags[ $tag ];
        }

        $result = \QUI::getDataBase()->fetch(array(
            'from'  => \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            'where' => array(
                'tag' => $tag
            ),
            'limit' => 1
        ));

        if ( !isset( $result[ 0 ] ) )
        {
            throw new \QUI\Exception(
                \QUI::getLocale()->get('quiqqer/tags', 'exception.tag.not.found'),
                404
            );
        }

        $this->_tags[ $tag ] = $result[ 0 ];

        return $result[ 0 ];
    }

    /**
     * Return all tags from a project
     * if params set, the return is an grid result array
     *
     * @param Array $params - Grid Params
     * @return Array
     */
    public function getList($params=array())
    {
        if ( empty( $params ) )
        {
            return \QUI::getDataBase()->fetch(array(
                'from'  => \QUI::getDBProjectTableName( 'tags', $this->_Project ),
                'order' => 'tag'
            ));
        }

        $Grid = new \QUI\Utils\Grid();

        $params = array_merge( $Grid->parseDBParams( $params ), array(
            'from'  => \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            'order' => 'tag'
        ));

        return \QUI::getDataBase()->fetch( $params );
    }

    /**
     * Gibt die Tags, welche in "Beziehung" zu diesem Tag stehen, zurück
     * D.h. Welche Tags die Suche verkleinern können um noch Ergebnisse zu bekommen
     *
     * @param Array $tags
     * @return Array
     */
    public function getRelationTags($tags)
    {
        if ( !is_array( $tags ) ) {
            return array();
        }

        if ( empty( $tags ) ) {
            return array();
        }

        // seitenids bekommen
        $str = '';

        for ( $i = 0, $len = count( $tags ); $i < $len; $i++ )
        {
            $str .= ' tag = "'. $this->clearTagName( $tags[ $i ] ) .'"';

            if ( $i != $len - 1 ) {
                $str .= ' OR ';
            }
        }

        $DataBase = \QUI::getDataBase();

        $result = $DataBase->fetch(array(
            'from'  => \QUI::getDBProjectTableName( 'tags_siteCache', $this->_Project ),
            'where' => $str
        ));

        if ( !isset( $result[0] ) ) {
            return $tags;
        }

        $ids = array();

        foreach ( $result as $entry )
        {
            $_ids = explode( ',', $entry['sites'] );

            foreach ( $_ids as $_id )
            {
                if ( empty( $_id ) ) {
                    continue;
                }

                if ( !isset( $ids[ $_id ] ) )
                {
                    $ids[ $_id ] = 1;
                    continue;
                }

                $ids[ $_id ]++;
            }
        }

        // rausfiltern welche tags nur einmal vorkommen
        $_ids     = array();
        $tagcount = count( $tags );

        foreach ( $ids as $id => $count )
        {
            if ( $count >= $tagcount ) {
                $_ids[] = $id;
            }
        }

        $ids = $_ids;
        $ids = array_unique( $ids );

        if ( empty( $_ids ) ) {
            return array();
        }


        // tags der ids bekommen
        $ids = implode( ',', $ids );
        $ids = trim( $ids, ',' );


        $result = $DataBase->fetch(array(
            'from'  => \QUI::getDBProjectTableName( 'tags_sites', $this->_Project ),
            'where' => 'id in ('. $ids .')'
        ));

        $tag_str = '';

        foreach ( $result as $entry ) {
            $tag_str .= $entry['tags'];
        }

        $tag_str = str_replace( ',,', ',', $tag_str );
        $tag_str = trim( $tag_str, ',' );
        $tag_str = explode( ',', $tag_str );

        foreach ( $tags as $_tag ) {
            $tag_str[] = $_tag;
        }


        $tags = array_unique( $tag_str );
        sort( $tags );

        return $tags;
    }

    /**
     * Return all site ids that have the tags
     *
     * @param Array $tags - list of tags
     * @return Array
     */
    public function getSiteIdsFromTags($tags)
    {
        $cacheTable = \QUI::getDBProjectTableName( 'tags_cache', $this->_Project );

        if ( !is_array( $tags ) ) {
            return array();
        }

        // tag check
        $tagList = array();

        foreach ( $tags as $tag )
        {
            if ( $this->existsTag( $tag ) ) {
                $tagList[] = $tag;
            }
        }

        if ( !empty( $tagList ) ) {
            return array();
        }


        // search string
        $where = '';

        for ($i = 0, $len = count( $tagList ); $i < $len; $i++)
        {
            $where .= ' tag = "'. $tagList[ $i ] .'"';

            if ( $i != $len-1 ) {
                $where .= ' OR ';
            }
        }

        $result = \QUI::getDataBase()->fetch(array(
            'from'  => $cacheTable,
            'where' => $where
        ));

        if ( !isset( $result[0] ) ) {
            return array();
        }

        $sites = array();
        $ids   = array();
        $_tmp  = array();

        // filter double tags
        foreach ( $result as $entry )
        {
            $list = explode( ',', $entry['sites'] );

            foreach ( $list as $id )
            {
                $id = (int)$id;

                if ( !$id ) {
                    continue;
                }

                if ( !isset( $ids[ $id ] ) ) {
                    $ids[ (int)$id ] = 0;
                }

                $ids[ (int)$id ]++;
            }
        }

        arsort( $ids );

        return $ids;
    }

    /**
     * Return all sites that have the tags
     *
     * @param Array $tags - list of tags
     * @return Array
     */
    public function getSitesFromTags($tags)
    {
        $siteIds = $this->getSiteIdsFromTags( $tags );
        $result  = array();

        foreach ( $siteIds as $id )
        {
            try
            {
                $result[] = $this->_Project->get( $id );

            } catch ( \QUI\Exception $Exception )
            {

            }
        }

        return $result;
    }


    /**
     * site methods
     */

    /**
     * Set tags to a site
     *
     * @param String $siteId - id of the Site ID
     * @param Array $tags - Tag List
     */
    public function setSiteTags($siteId, $tags)
    {
        if ( !is_array( $tags ) ) {
            return;
        }

        $list  = array();
        $table = \QUI::getDBProjectTableName( 'tags_sites', $this->_Project );
        $Site  = new Edit( $this->_Project, $siteId );

        foreach ( $tags as $tag )
        {
            if ( $this->existsTag( $tag ) ) {
                $list[] = $tag;
            }
        }



        // entry exists?
        $result = \QUI::getDataBase()->fetch(array(
            'from'  => $table,
            'where' => array(
                'id' => $Site->getId()
            ),
            'limit' => 1
        ));

        if ( !isset( $result[ 0 ] ) )
        {
            \QUI::getDataBase()->insert($table, array(
                'id' => $Site->getId()
            ));
        }


        \QUI::getDataBase()->update(
            $table,
            array( 'tags' => ','. implode( ',', $list ) .',' ),
            array( 'id' => $Site->getId() )
        );
    }

    /**
     * Delete the tags from a site
     *
     * @param String $siteId
     */
    public function deleteSiteTags($siteId)
    {
        $table = \QUI::getDBProjectTableName( 'tags_sites', $this->_Project );
        $Site  = new Edit($this->_Project, $siteId );

        \QUI::getDataBase()->delete($table, array(
            'id' => $Site->getId()
        ));
    }

    /**
     * Get the tags from a site
     *
     * @param unknown $siteId
     * @return array
     */
    public function getSiteTags($siteId)
    {
        $result = \QUI::getDataBase()->fetch(array(
            'from'  => \QUI::getDBProjectTableName( 'tags_sites', $this->_Project ),
            'where' => array(
                'id' => $siteId
            ),
            'limit' => 1
        ));

        if ( !isset( $result[ 0 ] ) ) {
            return array();
        }

        $tags = str_replace( ',,', ',', $result[ 0 ][ 'tags' ] );
        $tags = trim( $tags, ',' );
        $tags = explode( ',', $tags );

        return $tags;
    }
}
