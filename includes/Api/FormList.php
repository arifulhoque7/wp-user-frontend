<?php
/**
 * Old name of FormListController
 *
 * @package WP_User_Frontend
 */

namespace WeDevs\Wpuf\Api;

use WeDevs\Wpuf\Platform\REST\Controllers\FormListController;

/**
 * The `wpuf/v1` formlist routes moved to Platform\REST\Controllers\FormListController
 * with every other REST controller. This alias keeps the old class name working.
 *
 * @deprecated WPUF_SINCE Use FormListController.
 */
class_alias( FormListController::class, __NAMESPACE__ . '\\FormList' );
