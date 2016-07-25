<?php

use QUI\Tags\Manager;
use QUI\Utils\Grid;
use QUI\Utils\Security\Orthos;

/**
 * Get all sites a tag is associated with
 *
 * @param String $projectName - name of the project
 * @param String $projectLang - lang of the project
 * @param String $tag - wanted tag
 * @param array $searchParams - search parameters
 *
 * @return array
 */
function package_quiqqer_tags_ajax_tag_getSites($projectName, $projectLang, $tag, $searchParams)
{
    $Project      = QUI::getProject($projectName, $projectLang);
    $Manager      = new Manager($Project);
    $siteIdsAssoc = $Manager->getSiteIdsFromTags(array($tag));
    $siteIds      = array();

    foreach ($siteIdsAssoc as $siteId => $count) {
        $siteIds[] = $siteId;
    }

    $tagSites = array();

    $searchParams = Orthos::clearArray(json_decode($searchParams, true));
    $Grid         = new Grid($searchParams);
    $gridParams   = $Grid->parseDBParams($searchParams);
    $order        = '';

    if (empty($siteIds)) {
        return $Grid->parseResult(
            array(),
            0
        );
    }

    if (isset($searchParams['sortOn']) &&
        !empty($searchParams['sortOn'])
    ) {
        $order = $searchParams['sortOn'];

        if (isset($searchParams['sortBy']) &&
            !empty($searchParams['sortBy'])
        ) {
            $order .= ' ' . $searchParams['sortBy'];
        }
    }

    $result = QUI::getDataBase()->fetch(array(
        'select' => array(
            'id'
        ),
        'from'   => QUI::getDBProjectTableName('sites', $Project),
        'where'  => array(
            'id' => array(
                'type'  => 'IN',
                'value' => $siteIds
            )
        ),
        'order'  => empty($order) ? null : $order,
        'limit'  => $gridParams['limit']
    ));

    foreach ($result as $row) {
        $Site = $Project->get($row['id']);

        $tagSites[] = array(
            'id'    => $Site->getId(),
            'title' => $Site->getAttribute('title'),
            'url'   => $Site->getUrlRewritten()
        );
    }

    $result = $Grid->parseResult(
        $tagSites,
        count($siteIds)
    );

    return $result;
}

QUI::$Ajax->register(
    'package_quiqqer_tags_ajax_tag_getSites',
    array('projectName', 'projectLang', 'tag', 'searchParams')
);
