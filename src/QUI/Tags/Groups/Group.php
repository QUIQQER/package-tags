<?php

/**
 * This file contains QUI\Tags\Groups\Group
 */
namespace QUI\Tags\Groups;

use QUI;
use QUI\Projects\Project;
use QUI\Utils\Security\Orthos;

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
    protected $desc = '';

    /**
     * @var string
     */
    protected $title = '';

    /**
     * @var string
     */
    protected $image = '';

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
            'from'  => Handler::table($Project),
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

        $this->Project = $Project;
        $this->id      = (int)$groupId;
        $this->Manager = new QUI\Tags\Manager($this->Project);

        $this->setTitle($result[0]['title']);
        $this->setDescription($result[0]['desc']);

        try {
            $this->setImage($result[0]['image']);
        } catch (QUI\Exception $Exception) {
        }

        if (!isset($result[0]['tags'])) {
            return;
        }

        $tags = explode(',', $result[0]['tags']);

        foreach ($tags as $tag) {
            try {
                $this->addTag($tag);
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
     * Set the tag group title
     * no html allowed
     *
     * @param string $title
     */
    public function setTitle($title)
    {
        $this->title = trim(Orthos::removeHTML($title));
    }

    /**
     * Set the tag group description
     * no html allowed
     *
     * @param $description
     */
    public function setDescription($description)
    {
        $this->desc = trim(Orthos::removeHTML($description));
    }

    /**
     * Set the tag group image
     *
     * @param string|QUI\Projects\Media\Image $Image
     *
     * @throws QUI\Tags\Exception
     * @throws QUI\Exception
     */
    public function setImage($Image)
    {
        if (empty($Image)) {
            $this->image = '';
            return;
        }

        if (is_string($Image)) {
            $Image = QUI\Projects\Media\Utils::getImageByUrl($Image);
        }

        if (!QUI\Projects\Media\Utils::isImage($Image)) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.taggroup.no.image'
            ));
        }

        $this->image = $Image->getUrl();
    }

    /**
     * Delete the group
     */
    public function delete()
    {
        Handler::delete($this->Project, $this->getId());
    }

    /**
     * Save the group
     */
    public function save()
    {
        // image
        $image = '';

        if (QUI\Projects\Media\Utils::isMediaUrl($this->image)) {
            try {
                $Image = QUI\Projects\Media\Utils::getImageByUrl($this->image);
                $image = $Image->getUrl();
            } catch (QUI\Exception $Exception) {
            }
        }

        // tags
        $tags = array_map(function ($tag) {
            return $tag['tag'];
        }, $this->getTags());

        // database
        QUI::getDataBase()->update(
            Handler::table($this->Project),
            array(
                'title' => $this->getTitle(),
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
        if (empty($tag)) {
            return;
        }

        try {
            $tagData = $this->Manager->get($tag);
        } catch (QUI\Tags\Exception $Exception) {
            throw $Exception;
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::writeException($Exception);
            return;
        }

        if (!isset($this->tags[$tagData['tag']])) {
            $this->tags[$tagData['tag']] = $tagData;
        }
    }

    /**
     * Return the tags from the group
     *
     * @return array
     */
    public function getTags()
    {
        return array_values($this->tags);
    }

    /**
     * Return the group as an array
     *
     * @return array
     */
    public function toArray()
    {
        $tags = array_map(function ($tag) {
            return $tag['tag'];
        }, $this->getTags());

        return array(
            'id'        => $this->id,
            'title'     => $this->title,
            'desc'      => $this->desc,
            'image'     => $this->image,
            'tags'      => implode(',', $tags),
            'countTags' => count($this->tags)
        );
    }

    /**
     * Return the group as json
     *
     * @return string
     */
    public function toJSON()
    {
        return json_encode($this->toArray());
    }
}
