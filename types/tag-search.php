<?php

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

foreach ($requestList as $requestTag) {

    try {
        $requestTags[] = $Manager->get($requestTag);
        $requestTagNames[] = $requestTag;

    } catch (QUI\Exception $Exception) {

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

    $result = $Manager->getSitesFromTags($tags);
}


$Engine->assign(array(
    'result'  => $result,
    'Manager' => $Manager
));