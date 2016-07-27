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
     * @param string $title
     * @param Project $Project
     * @return Group
     */
    public static function create($title, Project $Project)
    {
        QUI::getDataBase()->insert(
            self::table($Project),
            array(
                'title' => QUI\Utils\Security\Orthos::cleanHTML($title)
            )
        );

        $gid = QUI::getDataBase()->getPDO()->lastInsertId();

        return self::get($gid, $Project);
    }

    /**
     * @param integer $groupId
     * @param Project $Project
     */
    public static function delete($groupId, Project $Project)
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
     * @param integer $groupId - ID of the tag group
     * @param Project $Project
     * @return Group
     * @throws QUI\Tags\Exception
     */
    public static function get($groupId, Project $Project)
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
}
