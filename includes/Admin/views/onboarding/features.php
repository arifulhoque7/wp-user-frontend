<?php
/**
 * Onboarding: what the admin wants to use
 *
 * @since WPUF_SINCE
 *
 * @var \WeDevs\Wpuf\Admin\Onboarding $this
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$definitions      = $this->get_feature_definitions();
$picked           = $this->get_features();
$directory_in_use = $this->is_directory_active();
?>
<form method="post">
    <h2><?php esc_html_e( 'What does your site need?', 'wp-user-frontend' ); ?></h2>
    <p class="wpuf-onboarding-subtitle">
        <?php esc_html_e( 'Tick what you need and we will set it up with you. We will not ask about the rest.', 'wp-user-frontend' ); ?>
    </p>

    <div class="wpuf-onboarding-field">
        <div class="wpuf-onboarding-grid">
            <?php
            foreach ( $definitions as $key => $feature ) :
                $checked = in_array( $key, $picked, true );
                ?>
                <label class="wpuf-onboarding-card <?php echo $checked ? 'is-selected' : ''; ?>">
                    <input type="checkbox" name="features[]" value="<?php echo esc_attr( $key ); ?>" <?php checked( true, $checked ); ?> <?php echo 'user_directory' === $key && $directory_in_use ? 'data-confirm-off="wpuf-onboarding-directory-confirm"' : ''; ?> />
                    <strong><?php echo esc_html( $feature['name'] ); ?></strong>
                    <p><?php echo esc_html( $feature['desc'] ); ?></p>
                </label>
            <?php endforeach; ?>
        </div>
        <?php if ( $directory_in_use ) : ?>
            <div class="wpuf-onboarding-confirm" id="wpuf-onboarding-directory-confirm" role="alertdialog" aria-labelledby="wpuf-onboarding-directory-confirm-title" hidden>
                <p id="wpuf-onboarding-directory-confirm-title">
                    <strong><?php esc_html_e( 'Turn off the user directory?', 'wp-user-frontend' ); ?></strong>
                    <?php esc_html_e( 'It is in use on this site. Its pages stop working on the front end until you turn it on again. Your directories and their settings are kept.', 'wp-user-frontend' ); ?>
                </p>
                <div class="wpuf-onboarding-confirm-actions">
                    <button type="button" class="wpuf-onboarding-btn-white" data-confirm-keep><?php esc_html_e( 'Keep it on', 'wp-user-frontend' ); ?></button>
                    <button type="button" class="wpuf-onboarding-btn-primary" data-confirm-off-yes><?php esc_html_e( 'Turn it off', 'wp-user-frontend' ); ?></button>
                </div>
            </div>
            <input type="hidden" name="confirm_directory_off" id="wpuf-onboarding-directory-confirmed" value="" />
        <?php endif; ?>
        <p class="wpuf-onboarding-help is-spaced"><?php esc_html_e( 'You can turn any of these on later in Settings.', 'wp-user-frontend' ); ?></p>
    </div>

    <?php wp_nonce_field( 'wpuf-onboarding' ); ?>
    <?php $this->action_bar( [ 'next_label' => __( 'Continue', 'wp-user-frontend' ), 'show_skip' => false ] ); ?>
</form>

