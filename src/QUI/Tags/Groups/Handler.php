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
     * Category tree runtime cache
     *
     * @var array
     */
    protected static $trees = array();

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
     * @return void
     *
     * @throws QUI\Tags\Exception
     */
    public static function delete(Project $Project, $groupId)
    {
        $project = $Project->getName();
        $lang    = $Project->getLang();
        $groupId = (int)$groupId;

        // check if group has children
        $result = QUI::getDataBase()->fetch(array(
            'count' => 1,
            'from'  => self::table($Project),
            'where' => array(
                'parentId' => $groupId
            )
        ));

        $hasChildren = boolval((int)current(current($result)));

        if ($hasChildren) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.manager.cannot.delete.group.with.children'
            ));
        }

        QUI::getDataBase()->delete(
            self::table($Project),
            array(
                'id' => $groupId
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
     * Search groups
     *
     * @param Project $Project
     * @param string $search - search string
     * @param array $queryParams -  optional, query params order, limit
     * @return array
     */
    public static function search(Project $Project, $search, $queryParams = array())
    {
        $query = array(
            'from'  => self::table($Project),
            'where' => array(
                'title' => array(
                    'value' => $search,
                    'type'  => 'LIKE%'
                )
            )
        );

        if (isset($queryParams['order'])) {
            $query['order'] = $queryParams['order'];
        }

        if (isset($queryParams['limit'])) {
            $query['limit'] = $queryParams['limit'];
        }

        return QUI::getDataBase()->fetch($query);
    }

    /**
     * Return a tag group list by its sektor (title)
     *
     * @param Project $Project
     * @param string $sektor - group sektor, "abc", "def", "ghi", "jkl", "mno", "pqr", "stu", "vz", "123"
     *
     * @return array
     */
    public static function getBySektor(Project $Project, $sektor)
    {
        switch ($sektor) {
            default:
            case 'abc':
                $where = 'title LIKE "a%" OR title LIKE "b%" OR title LIKE "c%"';
                break;

            case 'def':
                $where = 'title LIKE "d%" OR title LIKE "e%" OR title LIKE "f%"';
                break;

            case 'ghi':
                $where = 'title LIKE "g%" OR title LIKE "h%" OR title LIKE "i%"';
                break;

            case 'jkl':
                $where = 'title LIKE "j%" OR title LIKE "k%" OR title LIKE "l%"';
                break;

            case 'mno':
                $where = 'title LIKE "m%" OR title LIKE "n%" OR title LIKE "o%"';
                break;

            case 'pqr':
                $where = 'title LIKE "p%" OR title LIKE "q%" OR title LIKE "r%"';
                break;

            case 'stu':
                $where = 'title LIKE "s%" OR title LIKE "t%" OR title LIKE "u%"';
                break;

            case '123':
                $where = 'title REGEXP \'^[^A-Za-z]\'';
                break;

            case 'vz':
                $where = 'title LIKE "v%" OR
                        title LIKE "w%" OR
                        title LIKE "x%" OR
                        title LIKE "y%" OR
                        title LIKE "z%"';
                break;

            case 'special':
                $where = 'title REGEXP \'^[^A-Za-z0-9]\'';
                break;

            case 'all':
                $where = '';
                break;
        }

        return QUI::getDataBase()->fetch(array(
            'from'  => self::table($Project),
            'order' => 'title',
            'where' => $where
        ));
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
     * Exists the group id?
     *
     * @param Project $Project
     * @param integer $groupId
     * @return bool
     */
    public static function exists(Project $Project, $groupId)
    {
        try {
            self::get($Project, $groupId);

            return true;
        } catch (QUI\Tags\Exception $Exception) {
        }

        return false;
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

    /**
     * Get complete hierarchial tag group tree from a project
     *
     * @param Project $Project
     * @return array
     */
    public static function getTree(Project $Project)
    {
        $project = $Project->getName();
        $lang    = $Project->getLang();

        if (isset(self::$trees[$project][$lang])) {
            return self::$trees[$project][$lang];
        }

        if (!isset(self::$trees[$project])) {
            self::$trees[$project] = array();
        }

        $result = QUI::getDataBase()->fetch(array(
            'select' => array(
                'id',
                'title',
                'parentId'
            ),
            'from'   => self::table($Project)
        ));

        $groups = array();

        foreach ($result as $row) {
            $row['children'] = array();

            if (empty($row['parentId'])) {
                $row['parentId'] = false;
            }

            $groups[] = $row;
        }

        self::$trees[$project][$lang] = self::buildTree($groups);

        return self::$trees[$project][$lang];
    }

    /**
     * Build hierarchical group tree
     *
     * @param array $groups
     * @param bool $parentId (optional) - parent id of group (branch)
     * @return array
     */
    protected static function buildTree(&$groups, $parentId = false)
    {
        $tree = array();

        foreach ($groups as $group) {
            if ($group['parentId'] != $parentId) {
                continue;
            }

            $group['children'] = self::buildTree($groups, $group['id']);
            $tree[]            = $group;
        }

        return $tree;
    }

    /**
     * Get IDs of all children (recursive) of a tag group
     *
     * @param Project $Project
     * @param int $groupId - tag group ID
     * @param $groupId
     * @return array
     */
    public static function getTagGroupChildrenIds(Project $Project, $groupId)
    {
        $tree = self::getTree($Project);
        $groupNode = self::searchTree($tree, (int)$groupId);

        // group has no children
        if (empty($groupNode)) {
            return array();
        }

        return self::getChildrenIdsFromNode($groupNode['children']);
    }

    /**
     * Get all children IDs from a tree nide
     *
     * @param array $node - tree nide
     * @param array $children (optional) - array that includes children ids
     * @return array
     */
    protected static function getChildrenIdsFromNode($node, &$children = array())
    {
        foreach ($node as $k => $item) {
            $children[] = $item['id'];

            if (!empty($item['children'])) {
                self::getChildrenIdsFromNode($item['children'], $children);
            }
        }

        return $children;
    }

    /**
     * Search tag group tree for a specific node and return this node
     *
     * @param array $tree - the tree to search in
     * @param int $nodeId - ID of the node to search for
     * @return array|false
     */
    protected static function searchTree($tree, $nodeId)
    {
        foreach ($tree as $k => $node) {
            if ($node['id'] == $nodeId) {
                return $node;
            }
        }

        foreach ($tree as $k => $node) {
            if (!empty($node['children'])) {
                $resultNode = self::searchTree($node['children'], $nodeId);

                if ($resultNode !== false) {
                    return $resultNode;
                }
            }
        }

        return false;
    }
}
