<?php

namespace QUI\Tags;

use PDOException;
use QUI;
use QUI\Permissions\Permission;
use QUI\Projects\Project;
use QUI\Projects\Site\Edit;
use QUI\Tags\Groups\Handler as TagGroupsHandler;
use QUI\Utils\Grid;
use QUI\Utils\Security\Orthos;

use function array_diff;
use function array_search;
use function array_values;
use function count;
use function explode;
use function implode;
use function is_array;
use function is_string;
use function mb_strtolower;
use function md5;
use function preg_replace;
use function substr;
use function trim;
use function ucwords;

/**
 * Tag Manager
 * manage tags for a project
 *
 * @author www.pcsg.de (Henning Leutz)
 * @todo   tag permissions
 */
class Manager
{
    /**
     * Project
     *
     * @var Project
     */
    protected $Project;

    /**
     * tag list
     *
     * @var array
     */
    protected $tags = [];

    /**
     * tag list - only for exists check
     *
     * @var array
     */
    protected $exists = [];

    /**
     * @var array
     */
    protected $groupsFromTags = [];

    /**
     * constructor
     *
     * @param Project $Project
     */
    public function __construct(Project $Project)
    {
        $this->Project = $Project;
    }

    /**
     * Add a tag
     *
     * @param string $tag
     * @param array $params
     *
     * @return string - Tag
     *
     * @throws QUI\Tags\Exception
     * @throws QUI\Permissions\Exception
     */
    public function add($tag, $params)
    {
        Permission::checkPermission('tags.create');

        $title = Orthos::removeHTML($tag);
        $title = Orthos::clearFormRequest($title);

        if ($this->existsTagTitle($title)) {
            throw new QUI\Tags\Exception([
                'quiqqer/tags',
                'exception.tag.already.exists'
            ]);
        }

        $tag = $this->clearTagName($tag);

        // if tag name exists -> append (increasing) number
        if ($this->existsTag($tag)) {
            $i = 1;

            do {
                $tag .= $i++;
            } while ($this->existsTag($tag));
        }

        try {
            QUI::getDataBase()->insert(
                QUI::getDBProjectTableName('tags', $this->Project),
                [
                    'tag' => $tag,
                    'title' => $title
                ]
            );

            $this->edit($tag, $params);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            throw new QUI\Tags\Exception(
                QUI::getLocale()->get('quiqqer/tags', 'exception.tag.creation')
            );
        }

        return $tag;
    }

    /**
     * Tag Namen säubern
     *
     * @param string $str
     *
     * @return string
     */
    public static function clearTagName($str)
    {
        $str = Orthos::clear($str);
        $str = ucwords(mb_strtolower($str));
        $str = preg_replace('/[^a-zA-Z0-9]/', '', $str);
        $str = substr($str, 0, 250);
        $str = trim($str);

        return $str;
    }

    /**
     * Count the tags in the Project
     *
     * @return integer
     */
    public function count()
    {
        try {
            $result = QUI::getDataBase()->fetch([
                'count' => [
                    'select' => 'tag',
                    'as' => 'count'
                ],
                'from' => QUI::getDBProjectTableName('tags', $this->Project)
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::writeDebugException($Exception);
            QUI\System\Log::addError($Exception->getMessage());

            return 0;
        }

        return (int)$result[0]['count'];
    }

    /**
     * Delete a tag
     *
     * @param string $tag
     *
     * @throws QUI\Database\Exception
     * @throws QUI\Permissions\Exception
     */
    public function deleteTag($tag)
    {
        Permission::checkPermission('tags.delete');

        $tag = $this->clearTagName($tag);

        if (!$this->existsTag($tag)) {
            return;
        }

        // Delete tag from all tag groups
        $Statement = QUI::getPDO()->prepare(
            "UPDATE `" . QUI::getDBProjectTableName('tags_groups', $this->Project) . "`
             SET `tags` = replace(`tags`, '," . $tag . ",', ',')"
        );

        try {
            $Statement->execute();
        } catch (PDOException $Exception) {
            QUI\System\Log::writeException($Exception);

            throw new QUI\Database\Exception(
                $Exception->getMessage(),
                $Exception->getCode()
            );
        }

        // Delete tag itself
        QUI::getDataBase()->delete(
            QUI::getDBProjectTableName('tags', $this->Project),
            ['tag' => $tag]
        );

        QUI\Cache\Manager::clear('quiqqer/tags/' . md5($tag));
        // @todo also delete tag from cache and tag group cache tables?
    }

    /**
     * Edit a tag
     *
     * @param string $tag
     * @param array $params
     *
     * @throws QUI\Tags\Exception
     * @throws QUI\Permissions\Exception
     */
    public function edit($tag, $params)
    {
        Permission::checkPermission('tags.create');

        // exist tag?
        $tagParams = $this->get($tag);

        if (isset($params['title'])) {
            $tagParams['title'] = Orthos::removeHTML($params['title']);
            $tagParams['title'] = Orthos::clearFormRequest($tagParams['title']);
        }

        if (isset($params['desc'])) {
            $tagParams['desc'] = Orthos::removeHTML($params['desc']);
            $tagParams['desc'] = Orthos::clearFormRequest($tagParams['desc']);
        }

        if (isset($params['image'])) {
            $tagParams['image'] = Orthos::removeHTML($params['image']);
            $tagParams['image'] = Orthos::clearFormRequest($tagParams['image']);
        }

        if (isset($params['url'])) {
            $tagParams['url'] = Orthos::removeHTML($params['url']);
            $tagParams['url'] = Orthos::clearFormRequest($tagParams['url']);
        }

        if (isset($params['generated'])) {
            $tagParams['generated'] = $params['generated'] ? 1 : 0;
        }

        if (isset($params['generator']) && is_string($params['generator'])) {
            $tagParams['generator'] = $params['generator'];
        }

        $result = QUI::getDataBase()->fetch([
            'from' => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => [
                'title' => $tagParams['title']
            ]
        ]);

        foreach ($result as $tagEntry) {
            if ($tagEntry['tag'] != $tag) {
                throw new QUI\Tags\Exception(
                    QUI::getLocale()->get(
                        'quiqqer/tags',
                        'exception.tag.title.exist'
                    ),
                    404
                );
            }
        }

        QUI::getDataBase()->update(
            QUI::getDBProjectTableName('tags', $this->Project),
            $tagParams,
            ['tag' => $tag]
        );

        if (isset($params['tagGroupIds'])) {
            $currentTagGroupIds = TagGroupsHandler::getGroupIdsByTag($this->Project, $tag);
            $removeTagGroupIds = array_diff($currentTagGroupIds, $params['tagGroupIds']);

            foreach ($removeTagGroupIds as $tagGroupId) {
                try {
                    $TagGroup = QUI\Tags\Groups\Handler::get($this->Project, $tagGroupId);
                    $TagGroup->removeTag($tag);
                    $TagGroup->save();
                } catch (\Exception $Exception) {
                    QUI\System\Log::writeException($Exception);
                }
            }

            foreach ($params['tagGroupIds'] as $tagGroupId) {
                try {
                    $TagGroup = QUI\Tags\Groups\Handler::get($this->Project, $tagGroupId);
                    $TagGroup->addTag($tag);
                    $TagGroup->save();
                } catch (\Exception $Exception) {
                    QUI\System\Log::writeException($Exception);
                }
            }
        }

        QUI\Cache\Manager::clear('quiqqer/tags/' . md5($tag));
    }

    /**
     * Exists the tag?
     *
     * @param string $tag
     *
     * @return boolean
     */
    public function existsTag($tag)
    {
        if (isset($this->tags[$tag])) {
            return true;
        }

        if (isset($this->exists[$tag])) {
            return true;
        }

        try {
            QUI\Cache\Manager::get('quiqqer/tags/' . md5($tag));
            $this->exists[$tag] = true;

            return true;
        } catch (QUI\Exception $Exception) {
        }

        try {
            $result = QUI::getDataBase()->fetch([
                'select' => 'tag',
                'from' => QUI::getDBProjectTableName('tags', $this->Project),
                'where' => [
                    'tag' => $tag
                ],
                'limit' => 1
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addWarning($Exception->getMessage());
            QUI\System\Log::writeDebugException($Exception);

            return false;
        }

        $this->exists[$tag] = true;

        return isset($result[0]);
    }

    /**
     * Checks if a tag with a specific title exists
     *
     * @param string $title
     * @return boolean
     */
    public function existsTagTitle($title)
    {
        try {
            $result = QUI::getDataBase()->fetch([
                'select' => 'tag',
                'from' => QUI::getDBProjectTableName('tags', $this->Project),
                'where' => [
                    'title' => $title
                ],
                'limit' => 1
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addWarning($Exception->getMessage());
            QUI\System\Log::writeDebugException($Exception);

            return false;
        }


        return isset($result[0]);
    }

    /**
     * Return a tag
     *
     * @param string $tag
     * @return array
     *
     * @throws QUI\Tags\Exception
     */
    public function get($tag)
    {
        if (isset($this->tags[$tag])) {
            return $this->tags[$tag];
        }

        $cache = 'quiqqer/tags/' . md5($tag);

        try {
            $this->tags[$tag] = QUI\Cache\Manager::get($cache);

            return $this->tags[$tag];
        } catch (QUI\Exception $Exception) {
        }

        try {
            $result = QUI::getDataBase()->fetch([
                'from' => QUI::getDBProjectTableName('tags', $this->Project),
                'where' => [
                    'tag' => $tag
                ],
                'limit' => 1
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addWarning($Exception->getMessage());
            QUI\System\Log::writeDebugException($Exception);

            throw new QUI\Tags\Exception(
                ['quiqqer/tags', 'exception.tag.not.found'],
                404
            );
        }

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(
                ['quiqqer/tags', 'exception.tag.not.found'],
                404
            );
        }

        $this->tags[$tag] = $result[0];
        QUI\Cache\Manager::set($cache, $result[0]);

        return $result[0];
    }

    /**
     * Return a tag by title
     *
     * @param string $title
     * @return array - tag attributes
     * @throws QUI\Exception
     */
    public function getByTitle($title)
    {
        $result = QUI::getDataBase()->fetch([
            'from' => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => [
                'title' => $title
            ],
            'limit' => 1
        ]);

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(
                [
                    'quiqqer/tags',
                    'exception.tag.not.found'
                ],
                404
            );
        }

        $tagData = $result[0];

        if (isset($this->tags[$tagData['tag']])) {
            return $this->tags[$tagData['tag']];
        }

        $this->tags[$tagData['tag']] = $tagData;

        return $tagData;
    }

    /**
     * Return a tag by generator
     *
     * @param string $generator
     * @return array - tag attributes
     * @throws QUI\Exception
     */
    public function getByGenerator($generator)
    {
        $result = QUI::getDataBase()->fetch([
            'from' => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => [
                'generator' => $generator
            ],
            'limit' => 1
        ]);

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(
                [
                    'quiqqer/tags',
                    'exception.tag.not.found'
                ],
                404
            );
        }

        $tagData = $result[0];

        if (isset($this->tags[$tagData['tag']])) {
            return $this->tags[$tagData['tag']];
        }

        $this->tags[$tagData['tag']] = $tagData;

        return $tagData;
    }

    /**
     * Return all tags from a project
     * if params set, the return is an grid result array
     *
     * @param array $params - Grid Params
     *
     * @return array
     */
    public function getList($params = [])
    {
        $Grid = new Grid();
        $order = 'tag ASC';

        if (!empty($params['sortOn'])) {
            $order = '`' . $params['sortOn'] . '`';

            if (!empty($params['sortBy'])) {
                $order .= ' ' . $params['sortBy'];
            }
        }

        $params = \array_merge($Grid->parseDBParams($params), [
            'from' => QUI::getDBProjectTableName('tags', $this->Project),
            'order' => $order
        ]);

        try {
            $result = QUI::getDataBase()->fetch($params);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }

        $tags = [];
        $tagsCount = [];

        foreach ($result as $row) {
            $tags[] = $row['tag'];
        }

        if (empty($result)) {
            return $tags;
        }

        // get count
        try {
            $countResult = QUI::getDataBase()->fetch([
                'select' => [
                    'tag',
                    'count'
                ],
                'from' => QUI::getDBProjectTableName('tags_cache', $this->Project),
                'where' => [
                    'tag' => [
                        'type' => 'IN',
                        'value' => $tags
                    ]
                ]
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }

        foreach ($countResult as $row) {
            $tagsCount[$row['tag']] = $row['count'];
        }

        foreach ($result as $k => $row) {
            if (isset($tagsCount[$row['tag']])) {
                $row['count'] = $tagsCount[$row['tag']];
            } else {
                $row['count'] = 0;
            }

            $result[$k] = $row;
        }

        return $result;
    }

    /**
     * Gibt die Tags, welche in "Beziehung" zu diesem Tag stehen, zurück
     * D.h. Welche Tags die Suche verkleinern können um noch Ergebnisse zu bekommen
     *
     * @param array $tags
     *
     * @return array
     */
    public function getRelationTags($tags)
    {
        if (!is_array($tags)) {
            return [];
        }

        if (empty($tags)) {
            return [];
        }

        // seitenids bekommen
        $str = '';

        for ($i = 0, $len = count($tags); $i < $len; $i++) {
            $str .= ' tag = "' . $this->clearTagName($tags[$i]) . '"';

            if ($i != $len - 1) {
                $str .= ' OR ';
            }
        }

        $DataBase = QUI::getDataBase();

        try {
            $result = $DataBase->fetch([
                'from' => QUI::getDBProjectTableName('tags_siteCache', $this->Project),
                'where' => $str
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }

        if (!isset($result[0])) {
            return $tags;
        }

        $ids = [];

        foreach ($result as $entry) {
            $_ids = explode(',', $entry['sites']);

            foreach ($_ids as $_id) {
                if (empty($_id)) {
                    continue;
                }

                if (!isset($ids[$_id])) {
                    $ids[$_id] = 1;
                    continue;
                }

                $ids[$_id]++;
            }
        }

        // rausfiltern welche tags nur einmal vorkommen
        $_ids = [];
        $tagcount = count($tags);

        foreach ($ids as $id => $count) {
            if ($count >= $tagcount) {
                $_ids[] = $id;
            }
        }

        $ids = $_ids;
        $ids = \array_unique($ids);

        if (empty($_ids)) {
            return [];
        }


        // tags der ids bekommen
        $ids = implode(',', $ids);
        $ids = trim($ids, ',');

        try {
            $result = $DataBase->fetch([
                'from' => QUI::getDBProjectTableName('tags_sites', $this->Project),
                'where' => 'id in (' . $ids . ')'
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }
        $tag_str = '';

        foreach ($result as $entry) {
            $tag_str .= $entry['tags'];
        }

        $tag_str = \str_replace(',,', ',', $tag_str);
        $tag_str = trim($tag_str, ',');
        $tag_str = explode(',', $tag_str);

        foreach ($tags as $_tag) {
            $tag_str[] = $_tag;
        }


        $tags = \array_unique($tag_str);
        \sort($tags);

        return $tags;
    }

    /**
     * Search similar tags
     *
     * @param string $search - Search string
     * @param array $queryParams - optional, query params order, limit
     *
     * @return array
     */
    public function searchTags($search, $queryParams = [])
    {
        $search = mb_strtolower($search);
        $query = [
            'from' => QUI::getDBProjectTableName('tags', $this->Project),
            'where_or' => [
                'tag' => [
                    'value' => $search,
                    'type' => '%LIKE%'
                ],
                'title' => [
                    'value' => $search,
                    'type' => '%LIKE%'
                ]
            ]
        ];

        if (isset($queryParams['order'])) {
            $query['order'] = $queryParams['order'];
        }

        if (isset($queryParams['limit'])) {
            $query['limit'] = $queryParams['limit'];
        }

        try {
            $result = QUI::getDataBase()->fetch($query);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }

        return $result;
    }

    /**
     * Return all site ids that have the tags
     *
     * @param array $tags - list of tags
     * @param array $params - Database params , only limit
     *
     * @return array
     */
    public function getSiteIdsFromTags($tags, $params = [])
    {
        $cacheTable = QUI::getDBProjectTableName('tags_cache', $this->Project);

        if (!is_array($tags)) {
            return [];
        }

        // tag check
        $tagList = [];

        foreach ($tags as $tag) {
            if ($this->existsTag($tag)) {
                $tagList[] = $tag;
            }
        }

        if (empty($tagList)) {
            return [];
        }

        // search string
        $where = '';

        for ($i = 0, $len = count($tagList); $i < $len; $i++) {
            $where .= ' tag = "' . $tagList[$i] . '"';

            if ($i != $len - 1) {
                $where .= ' OR ';
            }
        }

        try {
            $result = QUI::getDataBase()->fetch([
                'from' => $cacheTable,
                'where' => $where
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }

        if (!isset($result[0])) {
            return [];
        }

        $ids = [];

        // filter double tags
        foreach ($result as $entry) {
            $list = explode(',', $entry['sites']);

            foreach ($list as $id) {
                $id = (int)$id;

                if (!$id) {
                    continue;
                }

                if (!isset($ids[$id])) {
                    $ids[(int)$id] = 0;
                }

                $ids[(int)$id]++;
            }
        }

        \arsort($ids);

        if (isset($params['limit']) && $params['limit']) {
            if (\strpos($params['limit'], ',') === false) {
                $start = 0;
                $end = (int)$params['limit'];
            } else {
                $parts = explode(',', $params['limit']);

                $start = (int)$parts[0];
                $end = (int)$parts[1];
            }

            $ids = \array_slice($ids, $start, $end, true);
        }

        return $ids;
    }

    /**
     * Return all sites that have the tags
     *
     * @param array $tags - list of tags
     * @param array $params - Database params
     *
     * @return array
     */
    public function getSitesFromTags($tags, $params = [])
    {
        $siteIds = $this->getSiteIdsFromTags($tags, $params);
        $result = [];

        foreach ($siteIds as $id => $count) {
            try {
                $Child = $this->Project->get($id);
                $Child->load('quiqqer/tags');

                $result[] = $Child;
            } catch (QUI\Exception $Exception) {
            }
        }

        return $result;
    }

    /**
     * Return a group tag array
     * Return all parent groups from the tag
     *
     * @param string $tag
     * @return array
     */
    public function getGroupsFromTag($tag)
    {
        if (isset($this->groupsFromTags[$tag])) {
            return $this->groupsFromTags[$tag];
        }

        $PDO = QUI::getDataBase()->getPDO();
        $table = QUI::getDBProjectTableName('tags_groups', $this->Project);

        $query = "
            SELECT *
            FROM {$table}
            WHERE
                tags LIKE :search1 OR
                tags LIKE :search2 OR
                tags LIKE :search3
        ";

        $Statement = $PDO->prepare($query);

        $Statement->bindValue('search1', '%,' . $tag . ',%', \PDO::PARAM_STR);
        $Statement->bindValue('search2', $tag . ',%', \PDO::PARAM_STR);
        $Statement->bindValue('search3', '%,' . $tag, \PDO::PARAM_STR);

        try {
            $Statement->execute();
            $this->groupsFromTags[$tag] = $Statement->fetchAll(\PDO::FETCH_ASSOC);

            return $this->groupsFromTags[$tag];
        } catch (\Exception $Exception) {
            QUI\System\Log::writeException($Exception);
        }

        return [];
    }

    /**
     * site methods
     */

    /**
     * Adds a single tag to a site
     *
     * @param integer $siteId - ID of Site
     * @param string $tag - Tag name
     *
     * @return void
     */
    public function addTagToSite($siteId, $tag)
    {
        if (!$this->existsTag($tag)) {
            return;
        }

        $siteTags = $this->getSiteTags($siteId);

        if (\in_array($tag, $siteTags)) {
            return;
        }

        $siteTags[] = $tag;

        $this->setSiteTags($siteId, $siteTags);
    }

    /**
     * Removes a single tag from a Site
     *
     * @param integer $siteId - ID of Site
     * @param string $tag - Tag name
     *
     * @return void
     */
    public function removeTagFromSite($siteId, $tag)
    {
        $siteTags = $this->getSiteTags($siteId);

        if (!\in_array($tag, $siteTags)) {
            return;
        }

        $k = array_search($tag, $siteTags);
        unset($siteTags[$k]);

        $this->setSiteTags($siteId, $siteTags);
    }

    /**
     * Set tags to a site
     *
     * @param string $siteId - id of the Site ID
     * @param array $tags - Tag List
     */
    public function setSiteTags($siteId, $tags)
    {
        if (!is_array($tags)) {
            return;
        }

        $siteId = (int)$siteId;
        $Site = new Edit($this->Project, $siteId);
        $isActive = $Site->getAttribute('active');

        $list = [];
        $table = QUI::getDBProjectTableName(
            'tags_sites',
            $this->Project
        );

        foreach ($tags as $tag) {
            if ($this->existsTag($tag)) {
                $list[] = $tag;
            }
        }

        // entry exists?
        $result = QUI::getDataBase()->fetch([
            'from' => $table,
            'where' => [
                'id' => $siteId
            ],
            'limit' => 1
        ]);

        if (!isset($result[0])) {
            QUI::getDataBase()->insert($table, [
                'id' => $siteId
            ]);
        }

        QUI::getDataBase()->update(
            $table,
            ['tags' => ',' . implode(',', $list) . ','],
            ['id' => $siteId]
        );

        // if side is not active, dont generate the cache
        if ($isActive == false) {
            $this->removeSiteFromTags($siteId, $list);

            return;
        }

        $tableTagCache = QUI::getDBProjectTableName('tags_cache', $this->Project);

        // update cache of tags
        foreach ($list as $tag) {
            $result = QUI::getDataBase()->fetch([
                'from' => $tableTagCache,
                'where' => [
                    'tag' => $tag
                ],
                'limit' => 1
            ]);

            if (empty($result)) {
                QUI::getDataBase()->insert($tableTagCache, [
                    'tag' => $tag,
                    'sites' => ',' . $siteId . ',',
                    'count' => 1
                ]);

                continue;
            }

            $siteIds = trim($result[0]['sites'], ',');

            if (empty($siteIds)) {
                $siteIds = [];
            } else {
                $siteIds = explode(',', $siteIds);
            }

            if (\in_array($siteId, $siteIds)) {
                continue;
            }

            $siteIds[] = $siteId;

            QUI::getDataBase()->update($tableTagCache, [
                'sites' => ',' . implode(',', $siteIds) . ',',
                'count' => count($siteIds)
            ], [
                'tag' => $tag
            ]);
        }
    }

    /**
     * Remove the site from the tags
     *
     * @param integer $siteId
     * @param array $tags
     */
    public function removeSiteFromTags($siteId, $tags)
    {
        if (!is_array($tags)) {
            return;
        }

        // cleanup tag cache
        $tableTagCache = QUI::getDBProjectTableName(
            'tags_cache',
            $this->Project
        );

        $list = [];

        foreach ($tags as $tag) {
            if ($this->existsTag($tag)) {
                $list[] = $tag;
            }
        }

        // update cache of tags
        foreach ($list as $tag) {
            try {
                $result = QUI::getDataBase()->fetch([
                    'from' => $tableTagCache,
                    'where' => [
                        'tag' => $tag
                    ],
                    'limit' => 1
                ]);
            } catch (QUI\Exception $Exception) {
                QUI\System\Log::addError($Exception->getMessage());

                continue;
            }

            if (empty($result)) {
                continue;
            }

            $siteIds = trim($result[0]['sites'], ',');

            if (empty($siteIds)) {
                continue;
            }

            $siteIds = explode(',', $siteIds);
            $k = array_search($siteId, $siteIds);

            if ($k === false) {
                continue;
            }

            unset($siteIds[$k]);

            $siteIds = array_values($siteIds);

            try {
                QUI::getDataBase()->update($tableTagCache, [
                    'sites' => ',' . implode(',', $siteIds) . ',',
                    'count' => count($siteIds)
                ], [
                    'tag' => $tag
                ]);
            } catch (QUI\Exception $Exception) {
                QUI\System\Log::addError($Exception->getMessage());
            }
        }
    }

    /**
     * Delete the tags from a site
     *
     * @param string $siteId
     */
    public function deleteSiteTags($siteId)
    {
        $table = QUI::getDBProjectTableName(
            'tags_sites',
            $this->Project
        );

        try {
            QUI::getDataBase()->delete($table, [
                'id' => $siteId
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());
        }
    }

    /**
     * Get the tags from a site
     *
     * @param integer $siteId
     *
     * @return array
     */
    public function getSiteTags($siteId)
    {
        try {
            $result = QUI::getDataBase()->fetch([
                'from' => QUI::getDBProjectTableName('tags_sites', $this->Project),
                'where' => [
                    'id' => (int)$siteId
                ],
                'limit' => 1
            ]);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::addError($Exception->getMessage());

            return [];
        }

        if (!isset($result[0])) {
            return [];
        }

        $tags = \str_replace(',,', ',', $result[0]['tags']);
        $tags = trim($tags, ',');
        $tags = explode(',', $tags);

        return $tags;
    }

    /**
     * Get number of sites a tag is associated with
     *
     * @param string $tag
     * @return integer
     */
    public function getTagCount(string $tag): int
    {
        try {
            $result = QUI::getDatabase()->fetch([
                'select' => [
                    'count'
                ],
                'from' => QUI::getDBProjectTableName('tags_cache', $this->Project),
                'where' => [
                    'tag' => $tag
                ]
            ]);
        } catch (QUI\Exception $exception) {
            QUI\System\Log::addError($exception->getMessage());
            return 0;
        }

        if (empty($result)) {
            return 0;
        }

        return $result[0]['count'];
    }
}
