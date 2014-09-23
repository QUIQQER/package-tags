<?php

/**
 * This file contains \QUI\Tags\Controls\TagList
 */

namespace QUI\Tags\Controls;

/**
 * tag list control
 *
 * @author www.pcsg.de (Henning Leutz)
 */

class TagList extends \QUI\Control
{
    /**
     * constructor
     * @param Array $attributes
     */
    public function __construct($attributes=array())
    {
        parent::setAttributes( $attributes );

        $this->addCSSFile(
            dirname( __FILE__ ) .'/TagList.css'
        );

        $this->setAttribute( 'class', 'quiqqer-tags-list grid-100 grid-parent' );
    }

    /**
     * (non-PHPdoc)
     * @see \QUI\Control::create()
     */
    public function getBody()
    {
        $Engine  = \QUI::getTemplateManager()->getEngine();
        $Project = $this->_getProject();
        $Site    = $this->_getSite();
        $Rewrite = \QUI::getRewrite();

        $urlParams = $Rewrite->getUrlParamsList();

        $Engine->assign(array(
            'Project' => $Project,
            'Site'    => $Site,
            'Locale'  => \QUI::getLocale()
        ));


        $needle = 'abc';

        if ( !empty( $urlParams ) )
        {
            switch ( $urlParams[ 0 ] )
            {
                case 'def':
                case 'ghi':
                case 'jkl':
                case 'mno':
                case 'pqr':
                case 'stu':
                case 'vz':
                    $needle = $urlParams[ 0 ];
                break;
            }
        }


        $Tags = new \QUI\Tags\Manager( $Project );
        $tags = $this->getList( $needle );

        // Sucheseite finden
        $result = $Project->getSites(array(
            'where' => array(
                'type' => 'quiqqer/tags:types/tag'
            )
        ));

        $SearchSite = $Site;

        if ( isset( $result[0] ) ) {
            $SearchSite = $result[0];
        }

        $Engine->assign(array(
            'tags'       => $tags,
            'SearchSite' => $SearchSite,
            'list'       => $needle
        ));


        return $Engine->fetch( dirname( __FILE__ ) .'/TagList.html' );
    }

    /**
     * Return a tag list by its sektor
     *
     * @param String $sektor - tag sektor, "abc", "def", "ghi", "jkl", "mno", "pqr", "stu", "vz"
     * @return Array
     */
    public function getList($sektor)
    {
        switch ( $sektor )
        {
            default:
            case 'abc':
                $where = 'tag LIKE "a%" OR tag LIKE "b%" OR tag LIKE "c%"';
            break;

            case 'def':
                $where = 'tag LIKE "d%" OR tag LIKE "e%" OR tag LIKE "f%"';
            break;

            case 'ghi':
                $where = 'tag LIKE "g%" OR tag LIKE "h%" OR tag LIKE "i%"';
            break;

            case 'jkl':
                $where = 'tag LIKE "j%" OR tag LIKE "k%" OR tag LIKE "l%"';
            break;

            case 'mno':
                $where = 'tag LIKE "m%" OR tag LIKE "n%" OR tag LIKE "o%"';
            break;

            case 'pqr':
                $where = 'tag LIKE "p%" OR tag LIKE "q%" OR tag LIKE "r%"';
            break;

            case 'stu':
                $where = 'tag LIKE "s%" OR tag LIKE "t%" OR tag LIKE "u%"';
            break;

            case 'vz':
                $where = 'tag LIKE "v%" OR
                        tag LIKE "w%" OR
                        tag LIKE "x%" OR
                        tag LIKE "y%" OR
                        tag LIKE "z%"';
            break;
        }

        return \QUI::getDataBase()->fetch(array(
            'from'  => \QUI::getDBProjectTableName( 'tags', $this->_getProject() ),
            'order' => 'tag',
            'where' => $where
        ));
    }

    /**
     * Return the Project
     * @return Ambigous <\QUI\unknown_type, boolean, multitype:>|\QUI\Projects\Project
     */
    protected function _getProject()
    {
        if ( $this->getAttribute('Project') ) {
            return $this->getAttribute('Project');
        }

        return \QUI::getProjectManager()->get();
    }

    /**
     * Return the Project
     * @return Ambigous <\QUI\unknown_type, boolean, multitype:>|\QUI\Projects\Project
     */
    protected function _getSite()
    {
        if ( $this->getAttribute('Site') ) {
            return $this->getAttribute('Site');
        }

        // Sucheseite finden
        $result = $this->_getProject()->getSites(array(
            'where' => array(
                'type' => 'quiqqer/tags:types/tag-listing'
            ),
            'limit' => 1
        ));

        return $this->_getProject()->get( $result[ 0 ][ 'id' ] );
    }
}
