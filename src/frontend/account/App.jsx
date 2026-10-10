/**
 * The account shell in the FlyHR profile layout (frontend-react-architecture.md
 * 2.1, 5.4): profile header card, left rail, content by `?section=` (the URL
 * stays the contract; rail links are real links intercepted with
 * pushState). Sections: native (overview, posts, edit profile, change
 * password) or the PHP output of their hook (everything else).
 *
 * @since WPUF_SINCE
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { applyFilters, doAction } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import { Avatar, Button, Notice, Pill, RailItem, ServerHtml, SkeletonLines, api, icons } from '@wpuf/frontend-kit';
import Overview from './sections/Overview';
import Posts from './sections/Posts';
import { ChangePassword, EditProfile } from './sections/Profile';

const { CalendarDays, LogOut, Mail, Pencil, iconByName } = icons;

const readSection = ( fallback ) => {
    const params = new URLSearchParams( window.location.search );

    return params.get( 'section' ) || fallback;
};

const urlFor = ( pageUrl, section, extra = {} ) => {
    const url = new URL( pageUrl, window.location.origin );

    url.searchParams.set( 'section', section );
    Object.entries( extra ).forEach( ( [ key, value ] ) => {
        if ( value ) {
            url.searchParams.set( key, value );
        } else {
            url.searchParams.delete( key );
        }
    } );

    return url.toString();
};

function HtmlSection( { slug, pageUrl } ) {
    const [ state, setState ] = useState( { html: '', loading: true, error: '' } );
    const pagenum = Number( new URLSearchParams( window.location.search ).get( 'pagenum' ) || 1 );

    useEffect( () => {
        let cancelled = false;

        setState( { html: '', loading: true, error: '' } );
        api.getSection( slug, pagenum )
            .then( ( data ) => ! cancelled && setState( { html: data.html, loading: false, error: '' } ) )
            .catch( ( e ) => ! cancelled && setState( { html: '', loading: false, error: e.message } ) );

        return () => {
            cancelled = true;
        };
    }, [ slug, pagenum ] );

    if ( state.loading ) {
        return <div className="wpuf-card"><SkeletonLines lines={ 6 } /></div>;
    }

    if ( state.error ) {
        return <Notice kind="error">{ state.error }</Notice>;
    }

    return <ServerHtml html={ state.html } slug={ slug } className="wpuf-account-html" />;
}

export default function App( { boot, root } ) {
    const data = applyFilters( 'wpuf.frontend.account.boot', boot );
    const { profile, settings, nonces } = data;
    const sections = useMemo( () => applyFilters( 'wpuf.frontend.account.sections', data.sections || [] ), [ data.sections ] );
    const [ stats, setStats ] = useState( data.stats || [] );
    const [ current, setCurrent ] = useState( () => readSection( settings.default_tab ) );
    const [ menuOpen, setMenuOpen ] = useState( false );
    const [ person, setPerson ] = useState( profile );

    const known = sections.some( ( section ) => section.slug === current );
    const active = known ? current : settings.default_tab;
    const section = sections.find( ( item ) => item.slug === active ) || sections[ 0 ];

    const go = useCallback( ( slug, extra = {} ) => {
        window.history.pushState( {}, '', urlFor( settings.page_url, slug, extra ) );
        setCurrent( slug );
        setMenuOpen( false );
        root.scrollIntoView( { behavior: 'smooth', block: 'start' } );
    }, [ settings.page_url, root ] );

    useEffect( () => {
        const onPop = () => setCurrent( readSection( settings.default_tab ) );

        window.addEventListener( 'popstate', onPop );

        return () => window.removeEventListener( 'popstate', onPop );
    }, [ settings.default_tab ] );

    useEffect( () => {
        doAction( 'wpuf.frontend.account.section', active, root );
    }, [ active, root ] );

    const refreshStats = useCallback( () => {
        api.getAccount().then( ( fresh ) => {
            setStats( fresh.stats || [] );
            setPerson( fresh.profile );
        } ).catch( () => undefined );
    }, [] );

    const since = person.registered ? new Date( person.registered.replace( ' ', 'T' ) + 'Z' ) : null;

    let body;

    if ( ! section ) {
        body = <Notice kind="info">{ __( 'There is nothing to show on this page yet.', 'wp-user-frontend' ) }</Notice>;
    } else if ( 'dashboard' === section.slug && 'native' === section.kind ) {
        body = <Overview profile={ person } stats={ stats } sections={ sections } go={ go } pageUrl={ settings.page_url } />;
    } else if ( 'posts' === section.kind ) {
        body = <Posts type={ section.post_type } label={ section.label } pageUrl={ settings.page_url } onChanged={ refreshStats } />;
    } else if ( 'edit-profile' === section.slug && 'native' === section.kind ) {
        body = <EditProfile profile={ person } nonce={ nonces.profile } onSaved={ ( fresh ) => { setPerson( fresh ); refreshStats(); } } />;
    } else if ( 'change-password' === section.slug && 'native' === section.kind ) {
        body = <ChangePassword nonce={ nonces.password } />;
    } else {
        body = <HtmlSection slug={ section.slug } pageUrl={ settings.page_url } />;
    }

    return (
        <div className="wpuf-account-container wpuf-account-shell">
            <section className="wpuf-profile-section wpuf-profile-header">
                <div className="wpuf-profile-header__main">
                    <Avatar url={ person.avatar?.url } initials={ person.avatar?.initials } alt={ person.display_name } size={ 90 } className="wpuf-profile-avatar" />
                    <div className="wpuf-profile-header__text">
                        <div className="wpuf-profile-header__name-row">
                            <h1 className="wpuf-profile-name">{ person.display_name }</h1>
                            { person.role_label && <Pill tone="black" className="wpuf-profile-role">{ person.role_label }</Pill> }
                        </div>
                        { person.email && (
                            <p className="wpuf-profile-header__line">
                                <Mail size={ 14 } aria-hidden="true" /> { person.email }
                            </p>
                        ) }
                    </div>
                    <div className="wpuf-profile-header__actions">
                        { sections.some( ( item ) => 'edit-profile' === item.slug ) && (
                            <Button size="sm" className="wpuf-edit-profile-btn" onClick={ () => go( 'edit-profile' ) }>
                                <Pencil size={ 14 } aria-hidden="true" />
                                { __( 'Edit Profile', 'wp-user-frontend' ) }
                            </Button>
                        ) }
                        <Button variant="secondary" size="sm" className="wpuf-logout-link" onClick={ () => window.location.assign( person.logout_url ) }>
                            <LogOut size={ 14 } aria-hidden="true" />
                            { __( 'Sign out', 'wp-user-frontend' ) }
                        </Button>
                    </div>
                </div>
                <div className="wpuf-profile-header__meta">
                    { since && (
                        <span className="wpuf-meta-pill">
                            <CalendarDays size={ 14 } aria-hidden="true" />
                            { /* translators: %s: date */ }
                            { sprintf( __( 'Member since %s', 'wp-user-frontend' ), since.toLocaleDateString( undefined, { year: 'numeric', month: 'short', day: 'numeric' } ) ) }
                        </span>
                    ) }
                    { person.username && (
                        <span className="wpuf-meta-pill">@{ person.username }</span>
                    ) }
                    { person.website && (
                        <a className="wpuf-meta-pill" href={ person.website } target="_blank" rel="noopener noreferrer">{ person.website.replace( /^https?:\/\//, '' ) }</a>
                    ) }
                </div>
            </section>

            <div className="wpuf-account-body">
                <aside className="wpuf-account-sidebar">
                    <button type="button" className="wpuf-account-menu-toggle" aria-expanded={ menuOpen } onClick={ () => setMenuOpen( ( open ) => ! open ) }>
                        { section ? section.label : __( 'Menu', 'wp-user-frontend' ) }
                        <icons.ChevronDown size={ 16 } aria-hidden="true" />
                    </button>
                    <nav className={ 'wpuf-account-nav' + ( menuOpen ? ' is-open' : '' ) } aria-label={ __( 'Account sections', 'wp-user-frontend' ) }>
                        <ul>
                            { sections.map( ( item ) => {
                                const Icon = iconByName( item.icon );

                                return (
                                    <RailItem
                                        key={ item.slug }
                                        icon={ <Icon size={ 16 } /> }
                                        label={ item.label }
                                        href={ item.url || urlFor( settings.page_url, item.slug ) }
                                        active={ item.slug === active }
                                        onSelect={ () => go( item.slug ) }
                                    />
                                );
                            } ) }
                        </ul>
                    </nav>
                </aside>
                <div className="wpuf-account-content" key={ active }>
                    { body }
                </div>
            </div>
        </div>
    );
}
