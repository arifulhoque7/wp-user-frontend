import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../store';
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import BuilderCanvas from './Canvas/BuilderCanvas';
import BuilderDnd from './Dnd/BuilderDnd';
import FormSettings from './Settings/FormSettings';
import useDirtyState from '../hooks/useDirtyState';
import { PageFooter, PageShell } from '@wpuf/components';
import LegacySlot, { getLegacySlots } from '../common/LegacySlot';

export default function FormBuilder() {
    const { formType } = useSelect( ( select ) => {
        return {
            formType: select( STORE_NAME ).getFormType(),
        };
    }, [] );

    const [ activeTab, setActiveTab ] = useState( 'form-editor' );

    useDirtyState();

    return (
        <PageShell className={ `wpuf-form-builder wpuf-form-builder-${ formType }` }>
            <Header activeTab={ activeTab } onTabChange={ setActiveTab } />

            { activeTab === 'form-editor' && (
                // One drag-and-drop context for the palette and the canvas (D16).
                <BuilderDnd>
                    { /* White card on the gray page (D26 page look, owner 2026-10-04). Same
                         width as before (mx-4 = the old mr-8) and a ring, not a border, so the
                         stage keeps develop's sizes; the inner edge borders stay as transparent. */ }
                    <div className="flex bg-white mx-4 mt-4 rounded-lg ring-1 ring-gray-200 overflow-hidden">
                        <div className="w-2/3 min-h-screen max-h-screen px-13 py-4 border-t border-l border-transparent overflow-auto">
                            <BuilderCanvas />
                        </div>
                        <div className="w-1/3 max-h-screen overflow-auto border border-b-0 border-gray-200 border-t-transparent border-r-transparent">
                            <Sidebar />
                        </div>
                    </div>
                </BuilderDnd>
            ) }

            { activeTab === 'form-settings' && (
                <FormSettings />
            ) }

            { /* Tab contents other plugins printed on wpuf-form-builder-tab-contents-{type}. */ }
            <LegacySlot id="tab-contents" html={ getLegacySlots().tabs.contents } className="m-4" />

            { /* FlyHR logo footer, as the other shared-layer screens (D26); px-5 = the
                 20px its full-bleed band reaches out by. */ }
            <PageFooter className="px-5" />
        </PageShell>
    );
}
