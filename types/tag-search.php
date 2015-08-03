<?php

/**
 * settings
 */

$max = $Site->getAttribute('quiqqer.settings.results.max');
$types = $Site->getAttribute('quiqqer.settings.results.types');

$count = 0;
$start = 0;
$types = explode(';', $types);

if (!$max) {
    $max = 1;
}

if (isset($_REQUEST['sheet'])) {
    $start = ((int)$_REQUEST['sheet'] - 1) * $max;
}

if (isset($_REQUEST['limit']) && is_numeric($_REQUEST['limit'])) {
    $max = (int)$_REQUEST['limit'];
}

/**
 * Tag Manager
 */

$Manager = new \QUI\Tags\Manager($Project);

try {

    $tags = $Manager->getList();

    $Engine->assign(array(
        'tags' => $tags
    ));

} catch (QUI\Exception $Exception) {

}

/**
 * Requested tags
 */
$requestList = QUI::getRewrite()->getUrlParamsList();
$requestTags = array();
$requestTagNames = array();

if (isset($_REQUEST['tags']) && !empty($_REQUEST['tags'])) {
    $requestList = explode(QUI\Rewrite::URL_SPACE_CHARACTER, $_REQUEST['tags']);
}

foreach ($requestList as $requestTag) {

    try {
        $requestTags[] = $Manager->get($requestTag);
        $requestTagNames[] = $requestTag;

    } catch (QUI\Exception $Exception) {

        // tag not found
        QUI::getRewrite()->showErrorHeader(404);
    }

}

$Engine->assign(array(
    'requestTags'     => $requestTags,
    'requestTagNames' => $requestTagNames
));

/**
 * Search
 */

$result = array();

if (!empty($requestTags)) {
    $tags = array();

    foreach ($requestTags as $requestTag) {
        $tags[] = $requestTag['tag'];
    }

    $result = $Manager->getSitesFromTags($tags, array(
        'limit' => $start.','.$max
    ));

    $count = count($Manager->getSiteIdsFromTags($tags));
}

$Engine->assign(array(
    'result'  => $result,
    'Manager' => $Manager,
    'count'   => $count,
    'sheets'  => ceil($count / $max),
    'start'   => $start,
    'max'     => $max
));
