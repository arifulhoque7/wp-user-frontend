/**
 * StatusTabs component — renders tab navigation for form statuses.
 *
 * @since WPUF_SINCE
 */
const StatusTabs = ( { postCounts, currentTab, onTabChange } ) => {
    return (
        <div className="flex mt-9">
            { Object.entries( postCounts ).map( ( [ key, value ] ) => {
                const tabKey = key === 'all' ? 'any' : key;
                const isActive = currentTab === tabKey || ( key === 'all' && currentTab === 'any' );

                return (
                    <span
                        key={ key }
                        onClick={ () => onTabChange( tabKey ) }
                        className={
                            'flex hover:border-primary hover:text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 focus:outline-hidden focus:shadow-none wpuf-transition-all hover:cursor-pointer ' +
                            ( isActive
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500' )
                        }
                    >
                        { value.label }
                        <span className="bg-gray-100 text-gray-900 ml-3 rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block">
                            { value.count }
                        </span>
                    </span>
                );
            } ) }
        </div>
    );
};

export default StatusTabs;
