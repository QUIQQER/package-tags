<?php

/**
 * This file contains \QUI\Tags\Manager
 */

namespace QUI\Tags;

use QUI;
use QUI\Utils\Security\Orthos;
use QUI\Projects\Site\Edit;
use QUI\Permissions\Permission;
use QUI\Utils\Grid;

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
     * @var \QUI\Projects\Project
     */
    protected $Project;

    /**
     * tag list
     *
     * @var array
     */
    protected $tags = array();

    /**
     * constructor
     *
     * @param \QUI\Projects\Project $Project
     */
    public function __construct(QUI\Projects\Project $Project)
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
     * @throws QUI\Tags\Exception
     */
    public function add($tag, $params)
    {
        Permission::checkPermission('tags.create');

        $title = Orthos::removeHTML($tag);
        $title = Orthos::clearFormRequest($title);

        if ($this->existsTagTitle($title)) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.tag.already.exists'
            ));
        }

        $tag = $this->clearTagName($tag);

        // if tag name exists -> append (increasing) number
        if ($this->existsTag($tag)) {
            $i = 1;

            do {
                $tag .= (string)$i++;
            } while ($this->existsTag($tag));
        }

        QUI::getDataBase()->insert(
            QUI::getDBProjectTableName('tags', $this->Project),
            array(
                'tag'   => $tag,
                'title' => $title
            )
        );

        $this->edit($tag, $params);

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
        $result = QUI::getDataBase()->fetch(array(
            'count' => array(
                'select' => 'tag',
                'as'     => 'count'
            ),
            'from'  => QUI::getDBProjectTableName('tags', $this->Project)
        ));

        return (int)$result[0]['count'];
    }

    /**
     * Delete the tag
     *
     * @param string $tag
     *
     * @throws QUI\Database\Exception
     */
    public function deleteTag($tag)
    {
        Permission::checkPermission('tags.delete');

        $tag = $this->clearTagName($tag);

        if (!$this->existsTag($tag)) {
            return;
        }


        // Erstmal alle Elternbeziehungen löschen
        $Statement = QUI::getPDO()->prepare(
            "UPDATE `" . QUI::getDBProjectTableName('tags', $this->Project) . "`
             SET `ptags` = replace(`ptags`, '," . $tag . ",', ',')"
        );

        try {
            $Statement->execute();

        } catch (\PDOException $Exception) {
            throw new QUI\Database\Exception(
                $Exception->getMessage(),
                $Exception->getCode()
            );
        }

        // Dann sich selbst löschen
        QUI::getDataBase()->delete(
            QUI::getDBProjectTableName('tags', $this->Project),
            array('tag' => $tag)
        );

        // @todo cache auch löschen?
    }

    /**
     * Edit a tag
     *
     * @param string $tag
     * @param array $params
     *
     * @throws QUI\Tags\Exception
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
            $tagParams['generated'] = $tagParams['generated'] ? 1 : 0;
        }

        if (isset($params['generator']) && is_string($params['generator'])) {
            $tagParams['generator'] = $params['generator'];
        }

        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'title' => $tagParams['title']
            )
        ));

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
            array('tag' => $tag)
        );
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
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'tag' => $tag
            ),
            'limit' => 1
        ));

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
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'title' => $title
            ),
            'limit' => 1
        ));

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

        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'tag' => $tag
            ),
            'limit' => 1
        ));

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(
                array(
                    'quiqqer/tags',
                    'exception.tag.not.found'
                ),
                404
            );
        }

        $this->tags[$tag] = $result[0];

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
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'title' => $title
            ),
            'limit' => 1
        ));

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(
                array(
                    'quiqqer/tags',
                    'exception.tag.not.found'
                ),
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
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'generator' => $generator
            ),
            'limit' => 1
        ));

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(
                array(
                    'quiqqer/tags',
                    'exception.tag.not.found'
                ),
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
    public function getList($params = array())
    {
        $Grid  = new Grid();
        $order = 'tag ASC';

        if (isset($params['sortOn']) &&
            !empty($params['sortOn'])
        ) {
            $order = '`' . $params['sortOn'] . '`';

            if (isset($params['sortBy']) &&
                !empty($params['sortBy'])
            ) {
                $order .= ' ' . $params['sortBy'];
            }
        }

        $params = array_merge($Grid->parseDBParams($params), array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'order' => $order
        ));

        $result    = QUI::getDataBase()->fetch($params);
        $tags      = array();
        $tagsCount = array();

        foreach ($result as $row) {
            $tags[] = $row['tag'];
        }

        if (empty($result)) {
            return $tags;
        }

        // get count
        $countResult = QUI::getDataBase()->fetch(array(
            'select' => array(
                'tag',
                'count'
            ),
            'from'   => QUI::getDBProjectTableName('tags_cache', $this->Project),
            'where'  => array(
                'tag' => array(
                    'type'  => 'IN',
                    'value' => $tags
                )
            )
        ));

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
            return array();
        }

        if (empty($tags)) {
            return array();
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

        $result = $DataBase->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags_siteCache', $this->Project),
            'where' => $str
        ));

        if (!isset($result[0])) {
            return $tags;
        }

        $ids = array();

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
        $_ids     = array();
        $tagcount = count($tags);

        foreach ($ids as $id => $count) {
            if ($count >= $tagcount) {
                $_ids[] = $id;
            }
        }

        $ids = $_ids;
        $ids = array_unique($ids);

        if (empty($_ids)) {
            return array();
        }


        // tags der ids bekommen
        $ids = implode(',', $ids);
        $ids = trim($ids, ',');


        $result = $DataBase->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags_sites', $this->Project),
            'where' => 'id in (' . $ids . ')'
        ));

        $tag_str = '';

        foreach ($result as $entry) {
            $tag_str .= $entry['tags'];
        }

        $tag_str = str_replace(',,', ',', $tag_str);
        $tag_str = trim($tag_str, ',');
        $tag_str = explode(',', $tag_str);

        foreach ($tags as $_tag) {
            $tag_str[] = $_tag;
        }


        $tags = array_unique($tag_str);
        sort($tags);

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
    public function searchTags($search, $queryParams = array())
    {
        $search = mb_strtolower($search);
        $query  = array(
            'from'  => QUI::getDBProjectTableName('tags', $this->Project),
            'where' => array(
                'tag' => array(
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

        $result = QUI::getDataBase()->fetch($query);

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
    public function getSiteIdsFromTags($tags, $params = array())
    {
        $cacheTable = QUI::getDBProjectTableName('tags_cache', $this->Project);

        if (!is_array($tags)) {
            return array();
        }

        // tag check
        $tagList = array();

        foreach ($tags as $tag) {
            if ($this->existsTag($tag)) {
                $tagList[] = $tag;
            }
        }

        if (empty($tagList)) {
            return array();
        }

        // search string
        $where = '';

        for ($i = 0, $len = count($tagList); $i < $len; $i++) {
            $where .= ' tag = "' . $tagList[$i] . '"';

            if ($i != $len - 1) {
                $where .= ' OR ';
            }
        }

        $result = QUI::getDataBase()->fetch(array(
            'from'  => $cacheTable,
            'where' => $where
        ));

        if (!isset($result[0])) {
            return array();
        }

        $ids = array();

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

        arsort($ids);

        if (isset($params['limit']) && $params['limit']) {
            if (strpos($params['limit'], ',') === false) {
                $start = 0;
                $end   = (int)$params['limit'];
            } else {
                $parts = explode(',', $params['limit']);

                $start = (int)$parts[0];
                $end   = (int)$parts[1];
            }

            $ids = array_slice($ids, $start, $end, true);
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
    public function getSitesFromTags($tags, $params = array())
    {
        $siteIds = $this->getSiteIdsFromTags($tags, $params);
        $result  = array();

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

        if (in_array($tag, $siteTags)) {
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

        if (!in_array($tag, $siteTags)) {
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

        $siteId   = (int)$siteId;
        $Site     = new Edit($this->Project, $siteId);
        $isActive = $Site->getAttribute('active');

        $list  = array();
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
        $result = QUI::getDataBase()->fetch(array(
            'from'  => $table,
            'where' => array(
                'id' => $siteId
            ),
            'limit' => 1
        ));

        if (!isset($result[0])) {
            QUI::getDataBase()->insert($table, array(
                'id' => $siteId
            ));
        }

        QUI::getDataBase()->update(
            $table,
            array('tags' => ',' . implode(',', $list) . ','),
            array('id' => $siteId)
        );

        // if side is not active, dont generate the cache
        if ($isActive == false) {
            $this->removeSiteFromTags($siteId, $list);
            return;
        }

        $tableTagCache = QUI::getDBProjectTableName('tags_cache', $this->Project);

        // update cache of tags
        foreach ($list as $tag) {
            $result = QUI::getDataBase()->fetch(array(
                'from'  => $tableTagCache,
                'where' => array(
                    'tag' => $tag
                ),
                'limit' => 1
            ));

            if (!isset($result[0])) {
                QUI::getDataBase()->insert($tableTagCache, array(
                    'tag'   => $tag,
                    'sites' => ',' . $siteId . ',',
                    'count' => 1
                ));

                continue;
            }

            if (strpos($result[0]['sites'], ',' . $siteId . ',') !== false) {
                continue;
            }

            QUI::getDataBase()->update($tableTagCache, array(
                'sites' => $result[0]['sites'] . $siteId . ',',
                'count' => count($result[0]['sites']) + 1
            ), array(
                'tag' => $tag
            ));
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

        $list = array();

        foreach ($tags as $tag) {
            if ($this->existsTag($tag)) {
                $list[] = $tag;
            }
        }

        // update cache of tags
        foreach ($list as $tag) {
            $result = QUI::getDataBase()->fetch(array(
                'from'  => $tableTagCache,
                'where' => array(
                    'tag' => $tag
                ),
                'limit' => 1
            ));

            if (!isset($result[0])) {
                continue;
            }

            if (strpos($result[0]['sites'], ',' . $siteId . ',') === false) {
                continue;
            }


            $result[0]['sites'] = str_replace(
                ',' . $siteId . ',',
                ',',
                $result[0]['sites']
            );

            QUI::getDataBase()->update($tableTagCache, array(
                'sites' => $result[0]['sites'],
                'count' => count($result[0]['sites'])
            ), array(
                'tag' => $tag
            ));
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

        QUI::getDataBase()->delete($table, array(
            'id' => $siteId
        ));
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
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBProjectTableName('tags_sites', $this->Project),
            'where' => array(
                'id' => (int)$siteId
            ),
            'limit' => 1
        ));

        if (!isset($result[0])) {
            return array();
        }

        $tags = str_replace(',,', ',', $result[0]['tags']);
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
    public function getTagCount($tag)
    {
        $result = array(
            'select' => array(
                'count'
            ),
            'from'   => QUI::getDBProjectTableName('tags_cache', $this->Project),
            'where'  => array(
                'tag' => $tag
            )
        );

        if (empty($result)) {
            return 0;
        }

        return $result[0]['count'];
    }
}
