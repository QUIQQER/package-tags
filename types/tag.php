<?php

/**
 * Tag anzeige
 *
 * Anzeige aller Seiten die dem Tag zugewiesen sind
 */

$Manager = new \QUI\Tags\Manager( $Project );

// tag is undefined
if ( !isset( $_REQUEST['tag'] ) || !$Manager->existsTag( $_REQUEST['tag'] ) )
{
    // tag liste
    $result = $Project->getSites(array(
        'where' => array(
            'type' => 'quiqqer/tags:types/tag-listing'
        ),
        'limit' => 1
    ));

    if ( isset( $result[ 0 ] ) )
    {
        $TagListing = $result[ 0 ];
    } else
    {
        $TagListing = $Site->getParent();
    }


    header("Location: ". URL_DIR . $TagListing->getUrlRewrited());
    exit;
}

$sites = $Manager->getSitesFromTags( array( $_REQUEST['tag'] ) );
$tag   = $Manager->get( $_REQUEST['tag'] );

$Engine->assign(array(
    'tag'   => $tag,
    'sites' => $sites
));
