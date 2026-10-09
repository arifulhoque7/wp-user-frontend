<?php
/**
 * Old name of Post_Form_Templates
 *
 * @package WP_User_Frontend
 */

namespace WeDevs\Wpuf\Admin\Forms\Post\Templates;

/**
 * The post form templates handler is Post_Form_Templates now (the name
 * clashed with the template base class Admin\Forms\Form_Template). This alias
 * keeps the old class name working.
 *
 * @deprecated WPUF_SINCE Use Post_Form_Templates.
 */
class_alias( Post_Form_Templates::class, __NAMESPACE__ . '\\Form_Template' );
