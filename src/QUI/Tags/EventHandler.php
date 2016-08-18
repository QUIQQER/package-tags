<?php

/**
 * This file contains QUI\Tags\EventHandler
 */

namespace QUI\Tags;

use QUI;

/**
 * Event handling
 *
 * @author www.pcsg.de (Henning Leutz)
 */
class EventHandler
{
    /**
     * event : on admin header loaded
     */
    public static function onAdminLoadFooter()
    {
        if (!defined('ADMIN') || !ADMIN) {
            return;
        }

        $Package   = QUI::getPackageManager()->getInstalledPackage('quiqqer/tags');
        $Config    = $Package->getConfig();
        $useGroups = $Config->getValue('tags', 'useGroups') ? 1 : 0;

        echo '<script>var QUIQQER_TAGS_USE_GROUPS = ' . $useGroups . '</script>';
    }
}
