<?php

/**
 * This file contains QUI\Tags\Groups\Group
 */
namespace QUI\Tags\Groups;

use QUI;
use QUI\Projects\Project;

/**
 * Class Group
 *
 * @package QUI\Tags\Groups
 */
class Group
{
    /**
     * internal project
     *
     * @var Project
     */
    protected $Project;

    /**
     * @var integer
     */
    protected $id;

    /**
     * @var string
     */
    protected $desc;

    /**
     * @var string
     */
    protected $title;

    /**
     * @var string
     */
    protected $image;

    /**
     * @var array
     */
    protected $tags = array();

    /**
     * @var null|QUI\Tags\Manager
     */
    protected $Manager = null;

    /**
     * Group constructor
     *
     * @param integer $groupId
     * @param Project $Project
     * @throws QUI\Tags\Exception
     */
    public function __construct($groupId, Project $Project)
    {
        $result = QUI::getDataBase()->fetch(array(
            'from'  => Handler::table($this->Project),
            'where' => array(
                'id' => (int)$groupId
            ),
            'limit' => 1
        ));

        if (!isset($result[0])) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.group.not.found'
            ));
        }

        $this->id      = (int)$groupId;
        $this->title   = $result[0]['title'];
        $this->desc    = $result[0]['desc'];
        $this->image   = $result[0]['image'];
        $this->Manager = new QUI\Tags\Manager($Project);

        if (!isset($result[0]['tags'])) {
            return;
        }

        $tags = explode(',', $result[0]['tags']);

        foreach ($tags as $tag) {
            try {
                $this->tags[] = $this->Manager->get($tag);
            } catch (QUI\Tags\Exception $Exception) {
            }
        }
    }

    /**
     * Return the group id
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Return the group title
     *
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Return the group description
     *
     * @return string
     */
    public function getDescription()
    {
        return $this->desc;
    }

    /**
     * Return the group image
     *
     * @return QUI\Projects\Media\Image|false
     */
    public function getImage()
    {
        if (QUI\Projects\Media\Utils::isMediaUrl($this->image)) {
            try {
                return QUI\Projects\Media\Utils::getImageByUrl($this->image);
            } catch (QUI\Exception $Exception) {
            }
        }

        $Image = $this->Project->getMedia()->getPlaceholderImage();

        if (QUI\Projects\Media\Utils::isImage($Image)) {
            return $Image;
        }

        return false;
    }

    /**
     * Delete the group
     */
    public function delete()
    {
        Handler::delete($this->getId(), $this->Project);
    }

    /**
     * Save the group
     */
    public function save()
    {
        $image = '';
        $tags  = array();

        if (QUI\Projects\Media\Utils::isMediaUrl($this->image)) {
            try {
                $Image = QUI\Projects\Media\Utils::getImageByUrl($this->image);
                $image = $Image->getUrl();
            } catch (QUI\Exception $Exception) {
            }
        }

        QUI::getDataBase()->update(
            Handler::table($this->Project),
            array(
                'title' => QUI\Utils\Security\Orthos::cleanHTML($this->getTitle()),
                'desc'  => $this->getDescription(),
                'image' => $image,
                'tags'  => implode($tags, ',')
            ),
            array(
                'id' => $this->getId()
            )
        );
    }

    /**
     * Add a tag to the group
     *
     * @param $tag
     * @throws QUI\Tags\Exception
     */
    public function addTag($tag)
    {
        try {
            $this->tags[] = $this->Manager->get($tag);
        } catch (QUI\Tags\Exception $Exception) {
            throw $Exception;
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::writeException($Exception);
        }
    }

    /**
     * Return the tags from the group
     *
     * @return array
     */
    public function getTags()
    {
        return $this->tags;
    }
}
