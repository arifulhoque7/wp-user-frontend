<?php
/**
 * User Frontend > Help (classic page; the admin app shows the same content
 * on its #/help route). Content: Admin\Help_Content.
 *
 * @package WP_User_Frontend
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$current_user    = wp_get_current_user();
$wpuf_help       = new \WeDevs\Wpuf\Admin\Help_Content();
$articles        = $wpuf_help->articles();
$wpuf_newsletter = $wpuf_help->newsletter();

if ( ! function_exists( 'wpuf_help_related_articles' ) ) {
    /**
     * Print related articles
     *
     * @param array $articles
     *
     * @return void
     */
    function wpuf_help_related_articles( $articles ) {
        $content = new \WeDevs\Wpuf\Admin\Help_Content();
        ?>
        <h2><?php esc_html_e( 'Related Articles:', 'wp-user-frontend' ); ?></h2>

        <ul class="related-articles">
        <?php foreach ( $articles as $article ) : ?>
            <li>
                <span class="dashicons dashicons-media-text"></span>
                <a href="<?php echo esc_url( $content->article_url( $article ) ); ?>" target="_blank"><?php echo esc_html( $article['title'] ); ?></a>
            </li>
        <?php endforeach; ?>
        </ul>
        <?php
    }
}
?>

<div class="wrap wpuf-help-page">
    <h1><?php esc_html_e( 'General Help Questions', 'wp-user-frontend' ); ?> <a href="<?php echo esc_url( $wpuf_help->docs_url() ); ?>" target="_blank" class="page-title-action"><span class="dashicons dashicons-external" style="margin-top: 8px;"></span> <?php esc_html_e( 'View all Documentations', 'wp-user-frontend' ); ?></a></h1>

    <div class="wpuf-subscribe-box">
        <div class="wpuf-text-wrap">
            <h3><?php esc_html_e( 'Subscribe to Our Newsletter', 'wp-user-frontend' ); ?></h3>
            <p>
                <?php echo wp_kses_post(
                    __(
                        'Subscribe to our newsletter for regular <strong>tips</strong>, <strong>offers</strong> and <strong>news updates</strong>.',
                        'wp-user-frontend'
                    )
                ); ?>
            </p>
        </div>
        <div class="wpuf-form-wrap">
            <form id="wemail-embedded-subscriber-form" method="post"
                  action="<?php echo esc_url( $wpuf_newsletter['action'] ); ?>">
                <div class="form-group">
                    <label for="wemail-first-name">First Name <span
                            class="required-indicator">*</span></label>
                    <div>
                        <input
                            type="text"
                            name="first_name"
                            id="wemail-first-name"
                            required="required"
                            placeholder="<?php echo esc_attr( "Enter first name" ); ?>"
                            value="<?php echo esc_attr( $current_user->first_name ); ?>"
                            class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="wemail-email">Email <span
                            class="required-indicator">*</span></label>
                    <div>
                        <input
                            type="email"
                            name="email"
                           required="required"
                            id="wemail-email"
                            placeholder="<?php echo esc_attr( "Enter email" ); ?>"
                            value="<?php echo esc_attr( $current_user->user_email ); ?>"
                           class="form-control">
                    </div>
                </div>
                <input type="hidden" name="tag" value="<?php echo esc_attr( $wpuf_newsletter['tag'] ); ?>">
                <div>
                    <button class="button button-primary"><?php esc_html_e( 'Subscribe', 'wp-user-frontend' ); ?></button>
                </div>

            </form>
        </div>
    </div>

    <div class="wpuf-help-tabbed">
        <nav>
            <ul>
                <?php foreach ( $wpuf_help->topics() as $wpuf_index => $wpuf_topic ) : ?>
                    <li<?php echo 0 === $wpuf_index ? ' class="tab-current"' : ''; ?>>
                        <a href="#<?php echo esc_attr( $wpuf_topic['id'] ); ?>">
                            <span class="dashicons <?php echo esc_attr( $wpuf_topic['icon'] ); ?>"></span>
                            <label><?php echo esc_html( $wpuf_topic['label'] ); ?></label>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </nav>

        <div class="nav-content">
            <?php foreach ( $wpuf_help->topics() as $wpuf_index => $wpuf_topic ) : ?>
                <section id="<?php echo esc_attr( $wpuf_topic['id'] ); ?>"<?php echo 0 === $wpuf_index ? ' class="content-current"' : ''; ?>>
                    <h2><?php echo esc_html( $wpuf_topic['title'] ); ?></h2>

                    <?php $wpuf_help->print_body( $wpuf_topic['id'] ); ?>

                    <a class="button button-primary button-large" href="<?php echo esc_url( $wpuf_topic['button']['url'] ); ?>" target="_blank"><?php echo esc_html( $wpuf_topic['button']['label'] ); ?></a>

                    <?php
                    if ( $wpuf_topic['articles'] && ! empty( $articles[ $wpuf_topic['articles'] ] ) ) {
                        wpuf_help_related_articles( $articles[ $wpuf_topic['articles'] ] );
                    }
                    ?>
                </section>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="help-blocks">
        <?php foreach ( $wpuf_help->blocks() as $wpuf_block ) : ?>
            <div class="help-block">
                <img src="<?php echo esc_url( $wpuf_block['image'] ); ?>" alt="<?php echo esc_attr( $wpuf_block['title'] ); ?>">

                <h3><?php echo esc_html( $wpuf_block['title'] ); ?></h3>

                <p><?php echo esc_html( $wpuf_block['text'] ); ?></p>

                <a target="_blank" class="button button-primary" href="<?php echo esc_url( $wpuf_block['url'] ); ?>"><?php echo esc_html( $wpuf_block['button'] ); ?></a>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<script type="text/javascript">
    jQuery(function($) {
        var tabs = $('.wpuf-help-tabbed > nav > ul > li' ),
            items = $('.wpuf-help-tabbed .nav-content > section');

        tabs.first().addClass('tab-current');
        items.first().addClass('content-current');

        tabs.on('click', 'a', function(event) {
            event.preventDefault();

            var self = $(this);

            tabs.removeClass('tab-current');
            self.parent('li').addClass('tab-current');

            $.each(items, function(index, val) {
                var element = $(val);

                if ( '#' + element.attr( 'id' ) === self.attr('href') ) {
                    element.addClass('content-current');
                } else {
                    element.removeClass('content-current');
                }
            });
        });

        const wemailForm = document.getElementById('wemail-embedded-subscriber-form');

        if (wemailForm) {
            wemailForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const formData = new FormData(wemailForm);
                const email = formData.get('email');

                if (!isValidEmail( email )) {
                    alert( 'Please enter a valid email address' );

                    return;
                }

                wemailForm.submit();
            });
        }

        function isValidEmail(email) {
            // Regular expression for validating an Email
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            return regex.test(email);
        }
    });
</script>
