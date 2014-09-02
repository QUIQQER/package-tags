<?php

/**
 * This file contains \QUI\Tags\Manager
 */

namespace QUI\Tags;

use \QUI\Utils\Security\Orthos;

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

        return $result[ 0 ];
    }

    /**
     * Return all tags from a project
     *
     * @param Array $params - Grid Params
     * @return Array
     */
    public function getList($params=array())
    {
        $Grid = new \QUI\Utils\Grid();

        $params = array_merge( $Grid->parseDBParams( $params ), array(
            'from'  => \QUI::getDBProjectTableName( 'tags', $this->_Project ),
            'order' => 'tag'
        ));

        $result = \QUI::getDataBase()->fetch( $params );

        return $result;
    }

}
