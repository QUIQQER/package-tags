<?php

$url = $_REQUEST['_url'];
$url = pathinfo($url);

$siteUrl = $Site->getUrlRewrited();

// tag
if ($siteUrl != $_REQUEST['_url']
    && $siteUrl == $url['dirname'].\QUI\Rewrite::URL_DEFAULT_SUFFIX
) {

    try {

        $title = $Site->getAttribute('title');
        $Manager = new \QUI\Tags\Manager($Project);
        $tag = $Manager->get($url['filename']);

        if (isset($tag['image']) && !empty($tag['image'])) {
            $Site->setAttribute('image_emotion', $tag['image']);
        }

        if (isset($tag['title'])) {
            $Site->setAttribute('meta.seotitle', $title.' - '.$tag['title']);
        } else {
            $Site->setAttribute('meta.seotitle', $title.' - '.$tag['tag']);
        }

        $TagSite = new \QUI\Projects\Site\Virtual(array(
            'id'    => $Site->getId(),
            'name'  => $tag['tag'],
            'url'   => URL_DIR.$_REQUEST['_url'],
            'title' => $tag['title']
        ), $Project, $Site);

        QUI::getRewrite()->addSiteToPath($TagSite);

        $Engine->assign(array(
            'tag'   => $tag,
            'sites' => $Manager->getSitesFromTags(array($tag['tag']))
    ));

    } catch (QUI\Exception $Exception) {

        QUI::getRewrite()->showErrorHeader(404);

        $Site->setAttribute('canonical', $Site->getUrlRewrited());
    }

}
