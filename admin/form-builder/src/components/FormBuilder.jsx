import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../store';
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import BuilderCanvas from './Canvas/BuilderCanvas';
import FormSettings from './Settings/FormSettings';
import useDirtyState from '../hooks/useDirtyState';
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
        <div className={ `wpuf-form-builder wpuf-form-builder-${ formType }` }>
            <Header activeTab={ activeTab } onTabChange={ setActiveTab } />

            { activeTab === 'form-editor' && (
                <div className="flex bg-white mr-8">
                    <div className="w-2/3 min-h-screen max-h-screen px-13 py-4 border-t border-l border-gray-200 overflow-auto">
                        <BuilderCanvas />
                    </div>
                    <div className="w-1/3 max-h-screen overflow-auto rounded-tr-lg border border-b-0 border-gray-200">
                        <Sidebar />
                    </div>
                </div>
            ) }

            { activeTab === 'form-settings' && (
                <FormSettings />
            ) }

            { /* Tab contents other plugins printed on wpuf-form-builder-tab-contents-{type}. */ }
            <LegacySlot id="tab-contents" html={ getLegacySlots().tabs.contents } className="m-4" />
        </div>
    );
}
