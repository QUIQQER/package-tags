<?php

/**
 * This file contains \QUI\Tags\Controls\TagList
 */

namespace QUI\Tags\Controls;

use QUI;
use QUI\Tags\Groups\Handler as TagGroupsHandler;

/**
 * tag list control
 *
 * @author www.pcsg.de (Henning Leutz)
 */
class TagList extends QUI\Control
{
    /**
     * constructor
     *
     * @param array $attributes
     */
    public function __construct($attributes = [])
    {
        parent::__construct($attributes);

        $this->addCSSFile(
            \dirname(__FILE__).'/TagList.css'
        );

        $this->setAttribute('class', 'quiqqer-tags-list grid-100 grid-parent');
    }

    /**
     * (non-PHPdoc)
     *
     * @see \QUI\Control::create()
     */
    public function getBody()
    {
        $Engine  = QUI::getTemplateManager()->getEngine();
        $Rewrite = QUI::getRewrite();

        $urlParams = $Rewrite->getUrlParamsList();

        $Engine->assign([
            'Project' => $this->getProject(),
            'Site'    => $this->getSite(),
            'Locale'  => QUI::getLocale()
        ]);


        $needle = 'abc';

        if (!empty($urlParams)) {
            switch ($urlParams[0]) {
                case 'def':
                case 'ghi':
                case 'jkl':
                case 'mno':
                case 'pqr':
                case 'stu':
                case 'vz':
                case '123':
                    $needle = $urlParams[0];
                    break;
            }
        }


        $tags = $this->getList($needle);

        $Engine->assign([
            'tags' => $tags,
            'list' => $needle
        ]);


        return $Engine->fetch(\dirname(__FILE__).'/TagList.html');
    }

    /**
     * Return a tag list by its sektor (title)
     *
     * @param String $sektor - tag sektor, "abc", "def", "ghi", "jkl", "mno", "pqr", "stu", "vz", "123"
     * @param int $groupId (optional) - limit results to a specific tag group
     *
     * @return array
     */
    public function getList($sektor, $groupId = null)
    {
        switch ($sektor) {
            default:
            case 'abc':
                $where = '(title LIKE "a%" OR title LIKE "b%" OR title LIKE "c%")';
                break;

            case 'def':
                $where = '(title LIKE "d%" OR title LIKE "e%" OR title LIKE "f%")';
                break;

            case 'ghi':
                $where = '(title LIKE "g%" OR title LIKE "h%" OR title LIKE "i%")';
                break;

            case 'jkl':
                $where = '(title LIKE "j%" OR title LIKE "k%" OR title LIKE "l%")';
                break;

            case 'mno':
                $where = '(title LIKE "m%" OR title LIKE "n%" OR title LIKE "o%")';
                break;

            case 'pqr':
                $where = '(title LIKE "p%" OR title LIKE "q%" OR title LIKE "r%")';
                break;

            case 'stu':
                $where = '(title LIKE "s%" OR title LIKE "t%" OR title LIKE "u%")';
                break;

            case '123':
                $where = 'title REGEXP \'^[0-9]\'';
                break;

            case 'special':
                $where = 'title REGEXP \'^[^A-Za-z0-9]\'';
                break;

            case 'all':
                $where = '';
                break;

            case 'vz':
                $where = '(title LIKE "v%" OR
                        title LIKE "w%" OR
                        title LIKE "x%" OR
                        title LIKE "y%" OR
                        title LIKE "z%")';
                break;
        }

        if (!\is_null($groupId)) {
            $TagGroup  = TagGroupsHandler::get($this->getProject(), $groupId);
            $tags      = [];
            $groupTags = $TagGroup->getTags();

//            QUI\System\Log::writeRecursive([
//                '$groupTags' => $groupTags
//            ]);

            if (empty($groupTags)) {
                return [];
            }

            foreach ($groupTags as $tagData) {
                $tags[] = $tagData['tag'];
            }

            $tags = \array_unique($tags);

            if (empty($where)) {
                $where .= '`tag` IN (\''.\implode('\',\'', $tags).'\')';
            } else {
                $where .= ' AND `tag` IN (\''.\implode('\',\'', $tags).'\')';
            }
        }

        return QUI::getDataBase()->fetch([
            'from'  => QUI::getDBProjectTableName('tags', $this->getProject()),
            'order' => 'title',
            'where' => $where
        ]);
    }

    /**
     * Return the Tag Search Site
     *
     * @return QUI\Projects\Site
     */
    protected function getSite()
    {
        if ($this->getAttribute('Site')) {
            return $this->getAttribute('Site');
        }

        $Project      = $this->getProject();
        $language     = $Project->getLang();
        $tagSearchIds = $Project->getConfig('tags.tagSearchId');

        if ($tagSearchIds) {
            $tagSearchIds = \json_decode($tagSearchIds, true);

            if ($tagSearchIds[$language]) {
                try {
                    $Site = QUI\Projects\Site\Utils::getSiteByLink($tagSearchIds[$language]);
                    $this->setAttribute('Site', $Site);

                    return $Site;
                } catch (QUI\Exception $Exception) {
                }
            }
        }

        $result = $this->getProject()->getSites([
            'where' => [
                'type' => 'quiqqer/tags:types/tag-listing'
            ],
            'limit' => 1
        ]);

        return $this->getProject()->get($result[0]['id']);
    }
}
