<?php
/**
 * Old name of SettingsController
 *
 * @package WP_User_Frontend
 */

namespace WeDevs\Wpuf\Api;

use WeDevs\Wpuf\Platform\REST\Controllers\SettingsController;

/**
 * The `wpuf/v1` settings routes moved to Platform\REST\Controllers\SettingsController
 * with every other REST controller. This alias keeps the old class name working.
 *
 * @deprecated WPUF_SINCE Use SettingsController.
 */
class_alias( SettingsController::class, __NAMESPACE__ . '\\Settings' );
