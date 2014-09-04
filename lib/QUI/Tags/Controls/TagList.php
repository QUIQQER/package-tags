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

        $Engine->assign(array(
            'Project' => $Project,
            'Site'    => $Site,
            'Locale'  => \QUI::getLocale()
        ));


        $needle = 'abc';

        if ( isset( $_REQUEST['list'] ) )
        {
            switch ( $_REQUEST['list'] )
            {
                case 'def':
                case 'ghi':
                case 'jkl':
                case 'mno':
                case 'pqr':
                case 'stu':
                case 'vz':
                    $needle = $_REQUEST['list'];
                break;
            }
        }


        $Tags = new \QUI\Tags\Manager( $Project );
        $tags = $Tags->getList();

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
            'tags'       => $tags,
            'SearchSite' => $SearchSite
        ));


        return $Engine->fetch( dirname( __FILE__ ) .'/TagList.html' );
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
