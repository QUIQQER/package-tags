<?php

/**
 * settings
 */

$types = $Site->getAttribute('quiqqer.settings.results.types');
$types = explode(';', $types);

/**
 * Pagination
 */

$Pagination = new QUI\Bricks\Controls\Pagination(array(
    'Site'      => $Site,
    'showLimit' => true,
    'limit'     => $Site->getAttribute('quiqqer.tag.settings.limit')
));

$Pagination->loadFromRequest();

$Pagination->setGetParams(
    'limit',
    $Site->getAttribute('quiqqer.tag.settings.limit')
);

/**
 * Tag Manager
 */

$Manager = new QUI\Tags\Manager($Project);
/** get all Tags */
try {
    $tags = $Manager->getList(array(
        'limit' => 0
    ));

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

if (isset($_GET['tags']) && !empty($_GET['tags'])) {
    $requestList = explode('-', $_GET['tags']);
}

//\QUI\System\Log::writeRecursive([
//    'request tag List' => $requestList
//]);
/** kleingeschrieben als Ergebnis */

foreach ($requestList as $requestTag) {
    try {
        $requestTags[] = $Manager->get($requestTag);
        $requestTagNames[] = $requestTag;
    } catch (QUI\Exception $Exception) {
    }
}
//\QUI\System\Log::writeRecursive([
//    'request $requestTagNames' => $requestTagNames
//]);
/** still kleingeschrieben als Ergebnis */


// default tag set?
if (empty($requestTagNames)
    && $Site->getAttribute('quiqqer.tag.settings.defaultTags')
) {
    $defaultTags = $Site->getAttribute('quiqqer.tag.settings.defaultTags');
    $defaultTags = explode(',', $defaultTags);

    foreach ($defaultTags as $tag) {
        try {
            $requestTags[] = $Manager->get($tag);
            $requestTagNames[] = $tag;
        } catch (QUI\Exception $Exception) {
        }
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

    if (!isset($sqlParams['limit'])) {
        $sqlParams['limit'] = 10;
    }

    /** is this getting the Results ? */
    $result = $Manager->getSitesFromTags($tags, array(
        'limit' => $sqlParams['limit']
    ));

    $count = count($Manager->getSiteIdsFromTags($tags));
}

if ($Pagination->getAttribute('limit')) {
    $sheets = ceil($count / $Pagination->getAttribute('limit'));
}

$Pagination->setAttributes(array(
    'sheets' => $sheets
));

$Pagination->setGetParams('tags', implode('-', $requestTagNames));

/** testing */
/** all tags should be collected and the images retrieved */


$cumulatedTags = [];
$siteTagList = [];
/** for each found Site */
foreach ($result as $id => $resultSite) {
    $siteTagList = $resultSite->getAttribute('quiqqer.tags.tagList');
    /** foreach Tag add tag to cumulated List */
    foreach ($siteTagList as $tagSingle) {
        $cumulatedTags[$tagSingle] = 1;
    }
}
/** foreach found Tags get the Tag */
foreach ($cumulatedTags as $tag => $one) {
    $cumulatedTags[$tag] = $Manager->get($tag);
}

\QUI\System\Log::writeRecursive([
//    'Results'                   => $result,
    'loaded Results for Search' => $requestTagNames,
//    '$siteTagList'              => $siteTagList,
//    '$cumulatedTags'            => $cumulatedTags
]);

/** testing */

$Engine->assign(array(
    'result'        => $result,
    'cumulatedTags' => $cumulatedTags,
    'Manager'       => $Manager,
    'count'         => $count,
    'sheets'        => $Pagination->getAttribute('sheets'),
    'start'         => $Pagination->getStart(),
    'max'           => $Pagination->getAttribute('limit'),
    'Pagination'    => $Pagination,
    'showCreator'   => $Site->getAttribute('quiqqer.tag.settings.showCreator'),
    'showDate'      => $Site->getAttribute('quiqqer.tag.settings.showDate')
));
