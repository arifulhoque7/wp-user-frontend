<?php
/**
 * Old name of SubscriptionController
 *
 * @package WP_User_Frontend
 */

namespace WeDevs\Wpuf\Api;

use WeDevs\Wpuf\Platform\REST\Controllers\SubscriptionController;

/**
 * The `wpuf/v1` subscription routes moved to Platform\REST\Controllers\SubscriptionController
 * with every other REST controller. This alias keeps the old class name working.
 *
 * @deprecated WPUF_SINCE Use SubscriptionController.
 */
class_alias( SubscriptionController::class, __NAMESPACE__ . '\\Subscription' );
