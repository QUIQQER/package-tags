<?php

/**
 * settings
 */

$types = $Site->getAttribute('quiqqer.settings.results.types');
$types = explode(';', $types);

/**
 * Pagination
 */

$Pagination = new \QUI\Controls\Sheets(array(
    'Site'      => $Site,
    'showLimit' => true,
    'limit'     => $Site->getAttribute('quiqqer.tag.settings.limit')
));

$Pagination->loadFromRequest();


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

$count = 0;
$sheets = 0;
$result = array();

if (!empty($requestTags)) {

    $tags = array();

    foreach ($requestTags as $requestTag) {
        $tags[] = $requestTag['tag'];
    }

    $sqlParams = $Pagination->getSQLParams();

    $result = $Manager->getSitesFromTags($tags, array(
        'limit' => $sqlParams['limit']
    ));

    $count = count($Manager->getSiteIdsFromTags($tags));
}

if ($Pagination->getAttribute('limit')) {
    $sheets = ceil($count / $Pagination->getAttribute('limit'));
}


$Pagination->setAttributes(array(
    'sheets' => $sheets,
    'tags'   => $requestTagNames
));


$Engine->assign(array(
    'result'     => $result,
    'Manager'    => $Manager,
    'count'      => $count,
    'sheets'     => $Pagination->getAttribute('sheets'),
    'start'      => $Pagination->getStart(),
    'max'        => $Pagination->getAttribute('limit'),
    'Pagination' => $Pagination
));
