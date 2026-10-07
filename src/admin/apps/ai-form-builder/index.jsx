/**
 * Entry point of the AI Form Builder React app (mount #wpuf-ai-form-builder,
 * printed by Admin\Screens\AiFormBuilder).
 *
 * @since WPUF_SINCE
 */
import { createRoot } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';
import { WpufProviders } from '@wpuf/components';

import AIFormBuilderApp from './AIFormBuilderApp';

const container = document.getElementById( 'wpuf-ai-form-builder' );

if ( container ) {
    createRoot( container ).render(
        <WpufProviders host>
            <AIFormBuilderApp />
        </WpufProviders>
    );
}

doAction( 'wpuf.aiFormBuilder.init' );
