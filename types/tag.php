<?php

/**
 * Tag anzeige
 *
 * Anzeige aller Seiten die dem Tag zugewiesen sind
 */

$Manager = new \QUI\Tags\Manager($Project);
$tag = false;

$urlParams = \QUI::getRewrite()->getUrlParamsList();

if (isset($urlParams[0])) {
    $tag = $urlParams[0];
}

// tag is undefined
if (!$tag || !$Manager->existsTag($tag)) {
    // tag liste
    $result = $Project->getSites(array(
        'where' => array(
            'type' => 'quiqqer/tags:types/tag-listing'
        ),
        'limit' => 1
    ));

    if (isset($result[0])) {
        $TagListing = $result[0];
    } else {
        $TagListing = $Site->getParent();
    }


    header("Location: ".URL_DIR.$TagListing->getUrlRewrited());
    exit;
}

$sites = $Manager->getSitesFromTags(array($tag));

$Engine->assign(array(
    'tag'   => $Manager->get($tag),
    'sites' => $sites
));
