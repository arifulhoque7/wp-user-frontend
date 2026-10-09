<?php
/**
 * Old name of React_Assets
 *
 * @package WP_User_Frontend
 */

namespace WeDevs\Wpuf\Admin;

/**
 * The React admin assets registry is React_Assets now (the name clashed with
 * the legacy WeDevs\Wpuf\Assets registry). This alias keeps the old class name
 * working.
 *
 * @deprecated WPUF_SINCE Use React_Assets.
 */
class_alias( React_Assets::class, __NAMESPACE__ . '\\Assets' );
