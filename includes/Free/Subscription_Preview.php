<?php
/**
 * Subscription Preview (free plugin only)
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Free;

use WeDevs\Wpuf\Platform\Stores\Stores;

/**
 * Pro subscription features previewed in the free plugin: gateways, the pack tabs and the subscriber detail rows.
 *
 * @since WPUF_SINCE Moved out of Free_Loader (same Pro_Prompt base), which keeps the hooks and delegates.
 */
class Subscription_Preview extends Pro_Prompt {

    /**
     * The loader: callbacks of other groups are registered on it.
     *
     * @var Free_Loader
     */
    protected $loader;

    /**
     * @since WPUF_SINCE
     *
     * @param Free_Loader $loader The loader.
     */
    public function __construct( Free_Loader $loader ) {
        $this->loader = $loader;
    }

    /**
     * Payment gateways for previewing in the Free version
     *
     * @since 3.6.0
     *
     * @param $gateways
     *
     * @return void
     */
    public function wpuf_payment_gateways( $gateways ) {
        // Keep the admin label as plain text. The PRO badge is rendered by the
        // gateway card UI based on the is_pro_preview flag, so embedding badge
        // markup here would only show up as escaped text in the card grid.
        $gateways['stripe'] = [
            'admin_label'    => __( 'Credit Card', 'wp-user-frontend' ),
            'checkout_label' => __( 'Credit Card', 'wp-user-frontend' ),
            'label_class'    => 'pro-preview',
            'is_pro_preview' => true,
        ];

        return $gateways;
    }

    /**
     * The subscription tabs from User Frontend > Subscription > Add/Edit Subscription
     *
     * @since 3.6.0
     *
     * @return void
     */
    public function subscription_tabs() {
        $crown_icon = WPUF_ROOT . '/assets/images/pro-badge.svg';
        $crown      = '';

        if ( file_exists( $crown_icon ) ) {
            $crown = sprintf( '<span class="pro-icon-title"> %s</span>', '<img src="' . WPUF_ASSET_URI . '/images/pro-badge.svg" alt="PRO">' );
        }

        echo '<li><a href="#taxonomy-restriction"><span class="dashicons dashicons-image-filter"></span> ' . esc_html( __( 'Taxonomy Restriction ', 'wp-user-frontend' ) ) . wp_kses(
            $crown, array(
				'svg' => [
					'xmlns' => true,
					'width' => true,
					'height' => true,
					'viewBox' => true,
					'fill' => true,
				],
				'path' => [
					'd' => true,
					'fill' => true,
				],
            )
        ) . '</a></li>';
    }

    /**
     * The subscription tab contents from User Frontend > Subscription > Add/Edit Subscription
     *
     * @since 3.6.0
     *
     * @return void
     */
    public function subscription_tab_contents() {
        $pack               = Stores::subscriptions()->read( get_the_ID() );
        $allowed_tax_id_arr = $pack && isset( $pack['meta']['_sub_allowed_term_ids'] ) ? $pack['meta']['_sub_allowed_term_ids'] : [];
        if ( ! $allowed_tax_id_arr ) {
            $allowed_tax_id_arr = [];
        }
        ?>
        <section id="taxonomy-restriction" class="pro-preview-html">
            <table class='form-table' method='post'>
                <tr><?php esc_html_e( 'Choose the taxonomy terms you want to enable for this pack:', 'wp-user-frontend' ); ?></tr>
                <tr>
                    <td>
                        <?php
                        $cts = get_taxonomies( [ '_builtin' => true ], 'objects' );
                        ?>
                        <?php
                        foreach ( $cts as $ct ) {
                            if ( is_taxonomy_hierarchical( $ct->name ) ) {
                                ?>
                                <div class="metabox-holder" style="float:left; padding:5px;">
                                    <div class="postbox">
                                        <h3 class="handle"><span><?php echo esc_html( $ct->label ); ?></span></h3>
                                        <div class="inside" style="padding:0 10px;">
                                            <div class="taxonomydiv">
                                                <div class="tabs-panel" style="height: 200px; overflow-y:auto">
                                                    <?php
                                                    $tax_terms = get_terms(
                                                        [
                                                            'taxonomy' => $ct->name,
                                                            'hide_empty' => false,
                                                        ]
                                                    );
                                                    foreach ( $tax_terms as $tax_term ) {
                                                        $selected[] = $tax_term;
                                                        ?>
                                                        <ul class="categorychecklist form-no-clear">
                                                            <input type="checkbox" class="tax-term-class" name="allowed-term[]" value="<?php echo esc_attr( $tax_term->term_id ); ?>" <?php echo in_array( $tax_term->term_id, $allowed_tax_id_arr, true ) ? ' checked="checked"' : ''; ?> name="<?php echo esc_attr( $tax_term->name ); ?>" disabled> <?php echo esc_html( $tax_term->name ); ?>
                                                        </ul>
                                                    <?php } ?>
                                                </div>
                                            </div>
                                            <p style="padding-left:10px;">
                                                <strong><?php echo count( $selected ); ?></strong> <?php echo ( count( $selected ) > 1 || 0 === count( $selected ) ) ? 'categories' : 'category'; ?> total
                                                <span class="list-controls" style="float:right; margin-top: 0;">
                                                <input type="checkbox" class="select-all" disabled> Select All
                                            </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <?php
                            }
                        }
                        ?>
                    </td>

                    <?php
                    $cts = get_taxonomies( [ '_builtin' => false ], 'objects' );
                    ?>
                    <?php
                    foreach ( $cts as $ct ) {
                        if ( is_taxonomy_hierarchical( $ct->name ) ) {
                            $selected = array();
                            ?>
                            <td>
                                <div class="metabox-holder" style="float:left; padding:5px;">
                                    <div class="postbox">
                                        <h3 class="handle"><span><?php echo esc_html( $ct->label ); ?></span></h3>
                                        <div class="inside" style="padding:0 10px;">
                                            <div class="taxonomydiv">
                                                <div class="tabs-panel" style="height: 200px; overflow-y:auto">
                                                    <?php
                                                    $tax_terms = get_terms(
                                                        [
                                                            'taxonomy'   => $ct->name,
                                                            'hide_empty' => false,
                                                        ]
                                                    );
                                                    foreach ( $tax_terms as $tax_term ) {
                                                        $selected[] = $tax_term;
                                                        ?>
                                                        <ul class="categorychecklist form-no-clear">
                                                            <input
                                                                type="checkbox"
                                                                class="tax-term-class"
                                                                name="allowed-term[]"
                                                                value="<?php echo esc_attr( $tax_term->term_id ); ?>" <?php echo in_array( $tax_term->term_id, $allowed_tax_id_arr, true ) ? ' checked="checked"' : ''; ?>
                                                                name="<?php echo esc_attr( $tax_term->name ); ?>"
                                                                disabled> <?php echo esc_html( $tax_term->name ); ?>
                                                        </ul>
                                                    <?php } ?>
                                                </div>
                                            </div>
                                            <p style="padding-left:10px;">
                                                <strong><?php echo count( $selected ); ?></strong> <?php echo ( count( $selected ) > 1 || 0 === count( $selected ) ) ? 'categories' : 'category'; ?> total
                                                <span class="list-controls" style="float:right; margin-top: 0;">
                                                <input type="checkbox" class="select-all" disabled> Select All
                                            </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <?php
                        }
                    }
                    ?>
                </tr>
            </table>
            <?php
                echo wp_kses_post( wpuf_get_pro_preview_html() );
            ?>
        </section>

        <?php
    }

    public function wpuf_admin_subscription_detail_runner( $sub_meta, $hidden_recurring_class, $hidden_trial_class, $obj ) {
        Subscription_Element::add_subscription_element( $sub_meta, $hidden_recurring_class, $hidden_trial_class, $obj );
    }
}
