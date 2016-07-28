<?php

/**
 * This file contains QUI\Tags\Groups\Handler
 */
namespace QUI\Tags\Groups;

use QUI;
use QUI\Projects\Project;

/**
 * Class Group - Tag groups handler
 *
 * @package QUI\Tags\Groups
 */
class Handler
{
    /**
     * instantiated groups
     *
     * @var array
     */
    protected static $groups = array();

    /**
     * Return the tag groups table name
     *
     * @param Project $Project
     * @return string
     */
    public static function table(Project $Project)
    {
        return QUI::getDBProjectTableName('tags_groups', $Project);
    }

    /**
     * Create a new tag group
     *
     * @param Project $Project
     * @param string $title
     * @return Group
     */
    public static function create(Project $Project, $title)
    {
        QUI::getDataBase()->insert(
            self::table($Project),
            array(
                'title' => QUI\Utils\Security\Orthos::cleanHTML($title)
            )
        );

        $gid = QUI::getDataBase()->getPDO()->lastInsertId();

        return self::get($Project, $gid);
    }

    /**
     * Count the tag groups
     *
     * @param Project $Project
     * @param array $queryParams
     * @return int
     */
    public static function count(Project $Project, $queryParams = array())
    {
        $query = array(
            'from'  => self::table($Project),
            'count' => array(
                'select' => 'id',
                'as'     => 'count'
            )
        );

        if (isset($queryParams['where'])) {
            $query['where'] = $queryParams['where'];
        }

        if (isset($queryParams['where_or'])) {
            $query['where_or'] = $queryParams['where_or'];
        }

        $data = QUI::getDataBase()->fetch($query);

        if (isset($data[0]) && isset($data[0]['count'])) {
            return (int)$data[0]['count'];
        }

        return 0;
    }

    /**
     * Delete a tag group
     *
     * @param Project $Project
     * @param integer $groupId
     */
    public static function delete(Project $Project, $groupId)
    {
        $project = $Project->getName();
        $lang    = $Project->getLang();

        QUI::getDataBase()->delete(
            self::table($Project),
            array(
                'id' => (int)$groupId
            )
        );

        if (isset(self::$groups[$project])
            && isset(self::$groups[$project][$lang])
            && isset(self::$groups[$project][$lang][$groupId])
        ) {
            unset(self::$groups[$project][$lang][$groupId]);
        }
    }

    /**
     * Return the group
     *
     * @param Project $Project
     * @param integer $groupId - ID of the tag group
     * @return Group
     * @throws QUI\Tags\Exception
     */
    public static function get(Project $Project, $groupId)
    {
        $project = $Project->getName();
        $lang    = $Project->getLang();

        if (isset(self::$groups[$project])
            && isset(self::$groups[$project][$lang])
            && isset(self::$groups[$project][$lang][$groupId])
        ) {
            return self::$groups[$project][$lang][$groupId];
        }

        $Group = new Group($groupId, $Project);

        self::$groups[$project][$lang][$groupId] = $Group;

        return self::$groups[$project][$lang][$groupId];
    }

    /**
     * Return a list of Tag groups
     * if $params is empty, all groups are returned
     *
     * @param Project $Project
     * @param array $params - array $params - query parameter
     *                              $queryParams['where'],
     *                              $queryParams['where_or'],
     *                              $queryParams['limit']
     *                              $queryParams['order']
     * @return array
     *
     * @throws QUI\Tags\Exception
     */
    public static function getGroups(Project $Project, $params = array())
    {
        $result   = array();
        $groupIds = self::getGroupIds($Project, $params);

        foreach ($groupIds as $groupId) {
            $result[] = self::get($Project, $groupId);
        }

        return $result;
    }

    /**
     * Return a list of Tag group ids
     * if $params is empty, all group ids are returned
     *
     * @param Project $Project
     * @param array $params - query parameter
     *                              $queryParams['where'],
     *                              $queryParams['where_or'],
     *                              $queryParams['limit']
     *                              $queryParams['order']
     * @return array
     */
    public static function getGroupIds(Project $Project, $params = array())
    {
        $query = array(
            'from' => self::table($Project)
        );

        if (isset($params['where'])) {
            $query['where_or'] = $params['where'];
        }

        if (isset($params['where_or'])) {
            $query['where_or'] = $params['where_or'];
        }

        if (isset($params['limit'])) {
            $query['limit'] = $params['limit'];
        }

        if (isset($params['order'])) {
            $query['order'] = $params['order'];
        }

        if (isset($params['debug'])) {
            $query['debug'] = $params['debug'];
        }

        $result = array();
        $data   = QUI::getDataBase()->fetch($query);

        foreach ($data as $entry) {
            try {
                $result[] = $entry['id'];
            } catch (QUI\Exception $Exception) {
            }
        }

        return $result;
    }
}
