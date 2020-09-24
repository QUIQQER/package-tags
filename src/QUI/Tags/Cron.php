<?php

/**
 * This file contains \QUI\Tags\Cron
 */

namespace QUI\Tags;

use QUI;
use function DusanKasan\Knapsack\isEmpty;

/**
 * Tag Crons - Crons for the tag system
 *
 * @author www.pcsg.de (Henning Leutz)
 */
class Cron
{
    /**
     * creates the tag cache
     *
     * @param array $params
     * @param QUI\Cron\Manager $CronManager
     */
    public static function createCache($params, $CronManager)
    {
        if (!isset($params['project'])) {
            return;
        }

        if (!isset($params['lang'])) {
            return;
        }

        $Project = QUI::getProject($params['project'], $params['lang']);
        $DataBase = QUI::getDataBase();

        $tableSites = QUI::getDBProjectTableName('tags_sites', $Project);
        $tableSiteCache = QUI::getDBProjectTableName('tags_siteCache', $Project);
        $tableCache = QUI::getDBProjectTableName('tags_cache', $Project);

        $tableTagGroups = QUI::getDBProjectTableName('tags_groups', $Project);

        // get ids
        $result = $DataBase->fetch([
            'from' => $tableSites
        ]);

        $list = [];
        $_tmp = [];

        foreach ($result as $entry) {
            $tags = \explode(',', $entry['tags']);

            foreach ($tags as $tag) {
                if (empty($tag)) {
                    continue;
                }

                $tag = Manager::clearTagName($tag);
//                $tag = mb_strtolower($tag);

                $entry['id'] = (int)$entry['id'];

                $_str = $entry['id'] . '_' . $tag;


                if (isset($_tmp[$_str])) {
                    continue;
                }

                $list[$tag][] = $entry['id'];
                $_tmp[$_str] = 1; // temp zum prüfen ob schon drinnen, in_array ist zulangsam
            }
        }

        /**
         * Tag cache
         */
        $DataBase->table()->truncate($tableCache);

        foreach ($list as $tag => $entry) {
            $siteIds = [];

            // only active sites
            foreach ($entry as $siteId) {
                try {
                    $Site = $Project->get((int)$siteId);

                    if ($Site->getAttribute('active')) {
                        $siteIds[] = $siteId;
                    }
                } catch (QUI\Exception $Exception) {
                    continue;
                }
            }

            $DataBase->insert($tableCache, [
                'tag'   => $tag,
                'sites' => ',' . \implode(',', $siteIds) . ',',
                'count' => \count($siteIds)
            ]);
        }

        /**
         * Sites cache
         */
        $DataBase->table()->truncate($tableSiteCache);

        foreach ($result as $entry) {
            if (empty($entry['tags'])) {
                continue;
            }

            if ($entry['tags'] == ',,') {
                continue;
            }

            if ($entry['tags'] == ',') {
                continue;
            }

            try {
                $Site = $Project->get((int)$entry['id']);

                if (!$Site->getAttribute('active')) {
                    continue;
                }

                if ($Site->getAttribute('deleted')) {
                    continue;
                }

                /** die Gruppen müssen evaluiert werden
                 * für jeden Tag muss nach der Gruppe geschaut werden und in eine Liste geschrieben
                 */
                $groupsIds = [];
                $groupsIdsAssoc = [];
                $tags = \explode(',', $entry['tags']);
                foreach ($tags as $tag) {
                    if (empty($tag)) {
                        continue;
                    }

                    $query = "SELECT * FROM $tableTagGroups WHERE tags LIKE '%,$tag,%'";
                    $result = $DataBase->fetchSQL($query);

                    /**
                     * for every group add id to the List
                     */
                    $currentGroup = [];
                    foreach ($result as $foundGroup) {
                        $groupId = $foundGroup['id'];
                        $groupsIds[] = $groupId;
                        $currentGroup[] = $groupId;
                    }
                    if (!isEmpty($currentGroup)) {
                        $groupsIdsAssoc[$tag] = $currentGroup;
                    }
                }

                $goupsStr = ',' . \implode(',', $groupsIds) . ',';

                $DataBase->insert($tableSiteCache, [
                    'id'     => $Site->getId(),
                    'name'   => $Site->getAttribute('name'),
                    'title'  => $Site->getAttribute('title'),
                    'tags'   => $entry['tags'],
                    'groups'   => $goupsStr,
                    'c_date' => $Site->getAttribute('c_date'),
                    'e_date' => $Site->getAttribute('e_date')
                ]);
            } catch (QUI\Exception $Exception) {
            }
        }
    }
}
