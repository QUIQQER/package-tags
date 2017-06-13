<?php

/**
 * This file contains QUI\ERP\Products\Controls\Category\Menu
 */

namespace QUI\Tags\Controls;

use QUI;
use QUI\Tags\Groups\Handler as TagGroupsHandler;

/**
 * Class TagSelect
 *
 * List all tag groups and their tags in a dropdown with selectable entries (entry = tag)
 */
class TagSelect extends QUI\Control
{
    /**
     * Current Project
     *
     * @var QUI\Projects\Project
     */
    protected $Project = null;

    /**
     * constructor
     *
     * @param array $attributes
     */
    public function __construct($attributes = array())
    {
        if (isset($attributes['Project'])
            && $attributes['Project'] instanceof QUI\Projects\Project
        ) {
            $this->Project = $attributes['Project'];
        } else {
            $this->Project = QUI::getRewrite()->getSite()->getProject();
        }

        $this->setAttributes(array(
            'data-qui'     => 'package/quiqqer/tags/bin/TagSelect',
            'selectedTags' => array()
        ));

        $this->addCSSClass('quiqqer-tags-tagselect');
        $this->addCSSFile(dirname(__FILE__) . '/TagSelect.css');

        parent::__construct($attributes);
    }

    /**
     * (non-PHPdoc)
     *
     * @see \QUI\Control::create()
     */
    public function getBody()
    {
        $Engine = QUI::getTemplateManager()->getEngine();

        // Get Tag Search Site
        $Engine->assign(array(
            'children'     => $this->getChildren(),
            'this'         => $this,
            'Rewrite'      => QUI::getRewrite(),
            'selectedTags' => $this->getAttribute('selectedTags')
        ));

        return $Engine->fetch(dirname(__FILE__) . '/TagSelect.html');
    }

    /**
     * Get all tag groups
     *
     * @return array
     */
    public function getChildren()
    {
        $tagGroupIds = TagGroupsHandler::getGroupIds($this->Project);
        $children    = array();

        foreach ($tagGroupIds as $tagGroupId) {
            $TagGroup = TagGroupsHandler::get($this->Project, $tagGroupId);

            $children[] = array(
                'id'       => $TagGroup->getId(),
                'title'    => $TagGroup->getTitle(),
                'tags'     => $TagGroup->getTags(),
                'priority' => $TagGroup->getPriority()
            );
        }

        // sort by priority DESC
        usort($children, function ($a, $b) {
            $prioA = $a['priority'];
            $prioB = $b['priority'];

            if ($prioA === $prioB) {
                return 0;
            }

            return $prioA < $prioB ? 1 : -1;
        });

        return $children;
    }
}
