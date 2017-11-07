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
    protected $workingtitle = '';

    /**
     * @var string
     */
    protected $image = '';

    /**
     * @var int
     */
    protected $priority = 1;

    /**
     * @var bool
     */
    protected $generated = false;

    /**
     * @var string
     */
    protected $generator = '';

    /**
     * @var array
     */
    protected $tags = array();

    /**
     * ID of parent tag group
     *
     * @var null|int - null if no parent set; ID otherwise
     */
    protected $parentId = null;

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

        if (empty($result)) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.group.not.found'
            ));
        }

        $this->Project = $Project;
        $this->id      = (int)$groupId;
        $this->Manager = new QUI\Tags\Manager($this->Project);

        $data = $result[0];

        $this->setTitle($data['title']);
        $this->setWorkingTitle($data['workingtitle']);
        $this->setDescription($data['desc']);
        $this->setPriority($data['priority']);
        $this->setGenerateStatus($data['generated']);
        $this->setGenerator($data['generator']);

        if (!empty($data['parentId'])) {
            $this->parentId = (int)$data['parentId'];
        }

        try {
            $this->setImage($data['image']);
        } catch (QUI\Exception $Exception) {
        }

        if (!isset($data['tags'])) {
            return;
        }

        $tags = explode(',', $data['tags']);

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
     * Return the group working title
     *
     * @return string
     */
    public function getWorkingTitle()
    {
        return $this->workingtitle;
    }

    /**
     * Return the group priority
     *
     * @return integer
     */
    public function getPriority()
    {
        return $this->priority;
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
     * Is the group generated?
     *
     * @return bool
     */
    public function isGenerated()
    {
        return $this->generated ? true : false;
    }

    /**
     * Return generator of this tag group
     *
     * @return string
     */
    public function getGenerator()
    {
        return $this->generator;
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
     * Set the tag group working title
     * no html allowed
     *
     * @param string $title
     */
    public function setWorkingTitle($title)
    {
        $this->workingtitle = trim(Orthos::removeHTML($title));
    }

    /**
     * Set the tag group description
     * no html allowed
     *
     * @param string $description
     */
    public function setDescription($description)
    {
        $this->desc = trim(Orthos::removeHTML($description));
    }

    /**
     *  Set the tag group priority
     *
     * @param integer $priority
     */
    public function setPriority($priority)
    {
        $this->priority = (int)$priority;
    }

    /**
     * Set the genereated status
     * Is the group generated?
     *
     * @param bool $status
     */
    public function setGenerateStatus($status)
    {
        // cannot set to false if a generator is set
        if (!$status && !empty($this->generator)) {
            return;
        }

        $this->generated = $status ? true : false;
    }

    /**
     * Set string describing the generator of the tags (e.g. package name)
     *
     * @param string $generator
     */
    public function setGenerator($generator)
    {
        if (!is_string($generator)) {
            return;
        }

        $this->generator = $generator;
        $this->generated = true;
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
     * Set the parent tag group of this tag group
     *
     * @param int $groupId - ID of parent tag group
     * @return void
     *
     * @throws QUI\Tags\Exception
     */
    public function setParentGroup($groupId)
    {
        $groupId = (int)$groupId;

        if ($this->parentId === $groupId) {
            return;
        }

        if ($groupId === $this->id) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.groups.group.cannot.be.its.own.parent'
            ));
        }

        if (!Handler::exists($this->Project, $groupId)) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.groups.group.parent.does.not.exist',
                array(
                    'tagGroupId' => $groupId
                )
            ));
        }

        if (in_array($groupId, $this->getChildrenIds())) {
            throw new QUI\Tags\Exception(array(
                'quiqqer/tags',
                'exception.groups.group.parent.cannot.be.child',
                array(
                    'childTagGroupId' => $groupId,
                    'tagGroupId'      => $this->id
                )
            ));
        }

        QUI::getDataBase()->update(
            Handler::table($this->Project),
            array(
                'parentId' => $groupId
            ),
            array(
                'id' => $this->id
            )
        );

        $this->parentId = $groupId;
    }

    /**
     * Get IDs of all child tag groups
     *
     * @return array
     */
    public function getChildrenIds()
    {
        return Handler::getTagGroupChildrenIds($this->Project, $this->id);
    }

    /**
     * Removes the current parent tag group from this tag group.
     * This makes the tag group parentless.
     *
     * @return void
     */
    public function removeParentGroup()
    {
        if (is_null($this->parentId)) {
            return;
        }

        QUI::getDataBase()->update(
            Handler::table($this->Project),
            array(
                'parentId' => null
            ),
            array(
                'id' => $this->id
            )
        );

        $this->parentId = null;
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
                'title'        => $this->getTitle(),
                'workingtitle' => $this->getWorkingTitle(),
                'desc'         => $this->getDescription(),
                'image'        => $image,
                'priority'     => $this->getPriority(),
                'tags'         => ',' . implode($tags, ',') . ',',
                'generated'    => $this->isGenerated() ? 1 : 0,
                'generator'    => $this->getGenerator()
            ),
            array(
                'id' => $this->getId()
            )
        );
    }

    /**
     * Add a tag to the group
     *
     * @param string $tag - Tag
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
     * Add multiple tags to the group
     *
     * @param array $tags - tags
     */
    public function addTags($tags)
    {
        foreach ($tags as $tag) {
            try {
                $this->addTag($tag);
            } catch (\Exception $Exception) {
                // do not add tag
            }
        }
    }

    /**
     * Set tags to group (overwrites all previous tags!)
     *
     * @param array $tags
     * @return void
     */
    public function setTags($tags)
    {
        $this->tags = array();

        foreach ($tags as $tag) {
            $this->addTag($tag);
        }
    }

    /**
     * Remove a tag from the group
     *
     * @param string $tag
     * @return void
     */
    public function removeTag($tag)
    {
        if (isset($this->tags[$tag])) {
            unset($this->tags[$tag]);
        }
    }

    /**
     * Remove all tags with specific generator from the group
     *
     * @param string $generator - tag generator
     * @return void
     */
    public function removeTagsByGenerator($generator)
    {
        $tags = $this->getTags();

        foreach ($tags as $tag => $tagData) {
            if ($tagData['generator'] == $generator) {
                unset($tags[$tag]);
            }
        }

        $this->tags = $tags;
    }

    /**
     * Return the tags from the group
     *
     * @return array
     */
    public function getTags()
    {
        $tags = array_values($this->tags);

        usort($tags, function ($a, $b) {
            return strcmp($a["title"], $b["title"]);
        });

        return $tags;
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
            'id'           => $this->id,
            'title'        => $this->title,
            'workingtitle' => $this->workingtitle,
            'desc'         => $this->desc,
            'image'        => $this->image,
            'priority'     => $this->priority,
            'tags'         => implode(',', $tags),
            'countTags'    => count($this->tags),
            'generated'    => $this->isGenerated(),
            'parentId'     => $this->parentId
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
