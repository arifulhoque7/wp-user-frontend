/**
 * The posts of one type: the FlyHR table idiom, status pill, the actions
 * (view, edit, pay, delete with a confirm), `?pagenum=` honoured and
 * written, the "deleted" notice after a delete.
 *
 * @since WPUF_SINCE
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, Pagination, Pill, SkeletonRows, api, confirmDialog, icons } from '@wpuf/frontend-kit';

const { Eye, Pencil, Trash2 } = icons;

const TONE = {
    publish: 'green',
    pending: 'amber',
    draft: 'gray',
    future: 'blue',
    private: 'gray',
};

const readPage = () => Number( new URLSearchParams( window.location.search ).get( 'pagenum' ) || 1 );

export default function Posts( { type, label, pageUrl, onChanged } ) {
    const [ page, setPage ] = useState( readPage );
    const [ state, setState ] = useState( { loading: true, error: '', data: null } );
    const [ notice, setNotice ] = useState( () => ( 'deleted' === new URLSearchParams( window.location.search ).get( 'msg' ) ? __( 'Item Deleted successfully!', 'wp-user-frontend' ) : '' ) );
    const [ deleting, setDeleting ] = useState( 0 );

    const load = ( which ) => {
        setState( ( current ) => ( { ...current, loading: true, error: '' } ) );
        api.getAccountPosts( type, which )
            .then( ( data ) => setState( { loading: false, error: '', data } ) )
            .catch( ( e ) => setState( { loading: false, error: e.message, data: null } ) );
    };

    useEffect( () => {
        load( page );
    }, [ type, page ] ); // eslint-disable-line react-hooks/exhaustive-deps

    const changePage = ( next ) => {
        const url = new URL( window.location.href );

        url.searchParams.set( 'section', type );

        if ( next > 1 ) {
            url.searchParams.set( 'pagenum', String( next ) );
        } else {
            url.searchParams.delete( 'pagenum' );
        }

        window.history.pushState( {}, '', url.toString() );
        setPage( next );
    };

    const remove = async ( post ) => {
        const ok = await confirmDialog( {
            title: __( 'Are you sure to delete?', 'wp-user-frontend' ),
            text: post.title,
            confirmText: __( 'Delete', 'wp-user-frontend' ),
        } );

        if ( ! ok ) {
            return;
        }

        setDeleting( post.id );

        try {
            await api.deleteAccountPost( post.id );
            setNotice( __( 'Item Deleted successfully!', 'wp-user-frontend' ) );
            load( page );
            onChanged && onChanged();
        } catch ( e ) {
            setState( ( current ) => ( { ...current, error: e.message } ) );
        } finally {
            setDeleting( 0 );
        }
    };

    const data = state.data;
    const columns = data?.columns || {};

    return (
        <div className="wpuf-posts-section">
            <header className="wpuf-section-head">
                { /* translators: %s: post type label */ }
                <h2 className="wpuf-section-head__title">{ sprintf( __( 'My %s', 'wp-user-frontend' ), data?.post_type?.label || label ) }</h2>
                { data && (
                    <p className="wpuf-section-head__lead">
                        { sprintf( /* translators: %s: number of items */ data.total === 1 ? __( '%s item', 'wp-user-frontend' ) : __( '%s items', 'wp-user-frontend' ), data.total ) }
                    </p>
                ) }
            </header>

            { notice && <Notice kind="success" onClose={ () => setNotice( '' ) }>{ notice }</Notice> }
            { state.error && <Notice kind="error" onClose={ () => setState( ( current ) => ( { ...current, error: '' } ) ) }>{ state.error }</Notice> }

            <Card className="wpuf-posts-card">
                { state.loading && ! data ? (
                    <SkeletonRows rows={ 5 } cols={ 4 } />
                ) : ! data || ! data.items.length ? (
                    <p className="wpuf-muted wpuf-empty">{ __( 'No posts found', 'wp-user-frontend' ) }</p>
                ) : (
                    <div className="wpuf-table-wrap" aria-busy={ state.loading || undefined }>
                        <table className={ `items-table ${ type } wpuf-table` }>
                            <thead>
                                <tr className="items-list-header">
                                    { columns.thumbnail && <th scope="col">{ __( 'Featured Image', 'wp-user-frontend' ) }</th> }
                                    <th scope="col">{ __( 'Title', 'wp-user-frontend' ) }</th>
                                    <th scope="col">{ __( 'Status', 'wp-user-frontend' ) }</th>
                                    <th scope="col">{ __( 'Date', 'wp-user-frontend' ) }</th>
                                    { columns.payment && <th scope="col">{ __( 'Payment', 'wp-user-frontend' ) }</th> }
                                    <th scope="col" className="wpuf-table__actions">{ __( 'Options', 'wp-user-frontend' ) }</th>
                                </tr>
                            </thead>
                            <tbody>
                                { data.items.map( ( post ) => (
                                    <tr key={ post.id }>
                                        { columns.thumbnail && (
                                            <td data-label={ __( 'Featured Image', 'wp-user-frontend' ) }>
                                                { post.thumbnail ? <img className="wpuf-table__thumb" src={ post.thumbnail } alt="" /> : <span className="wpuf-table__thumb wpuf-table__thumb--empty" /> }
                                            </td>
                                        ) }
                                        <td data-label={ __( 'Title', 'wp-user-frontend' ) } className="wpuf-table__title">
                                            { post.permalink ? <a href={ post.permalink }>{ post.title }</a> : post.title }
                                            { post.featured && <Pill tone="amber">{ __( 'Featured', 'wp-user-frontend' ) }</Pill> }
                                        </td>
                                        <td data-label={ __( 'Status', 'wp-user-frontend' ) }>
                                            <Pill tone={ TONE[ post.status ] || 'gray' }>{ post.status_label }</Pill>
                                        </td>
                                        <td data-label={ __( 'Date', 'wp-user-frontend' ) }>{ post.date.slice( 0, 10 ) }</td>
                                        { columns.payment && (
                                            <td data-label={ __( 'Payment', 'wp-user-frontend' ) }>
                                                { ! post.payment_status ? '' : post.pay_url ? (
                                                    <a className="wpuf-btn wpuf-btn--secondary wpuf-btn--sm" href={ post.pay_url }>{ __( 'Pay Now', 'wp-user-frontend' ) }</a>
                                                ) : (
                                                    <Pill tone="green">{ __( 'Completed', 'wp-user-frontend' ) }</Pill>
                                                ) }
                                            </td>
                                        ) }
                                        <td data-label={ __( 'Options', 'wp-user-frontend' ) } className="wpuf-table__actions">
                                            <div className="wpuf-row-actions">
                                                { ( post.permalink || post.preview_url ) && (
                                                    <a className="wpuf-btn wpuf-btn--ghost wpuf-btn--sm" href={ post.permalink || post.preview_url } target="_blank" rel="noopener noreferrer" title={ __( 'View', 'wp-user-frontend' ) }>
                                                        <Eye size={ 16 } aria-hidden="true" />
                                                        <span className="wpuf-sr-only">{ __( 'View', 'wp-user-frontend' ) }</span>
                                                    </a>
                                                ) }
                                                { post.edit_url && (
                                                    <a className="wpuf-btn wpuf-btn--ghost wpuf-btn--sm" href={ post.edit_url } title={ __( 'Edit', 'wp-user-frontend' ) }>
                                                        <Pencil size={ 16 } aria-hidden="true" />
                                                        <span className="wpuf-sr-only">{ __( 'Edit', 'wp-user-frontend' ) }</span>
                                                    </a>
                                                ) }
                                                { post.can_delete && (
                                                    <Button variant="ghost" size="sm" className="wpuf-row-actions__delete" busy={ deleting === post.id } onClick={ () => remove( post ) } title={ __( 'Delete', 'wp-user-frontend' ) }>
                                                        <Trash2 size={ 16 } aria-hidden="true" />
                                                        <span className="wpuf-sr-only">{ __( 'Delete', 'wp-user-frontend' ) }</span>
                                                    </Button>
                                                ) }
                                            </div>
                                        </td>
                                    </tr>
                                ) ) }
                            </tbody>
                        </table>
                    </div>
                ) }
                { data && <Pagination page={ data.page } pages={ data.pages } onChange={ changePage } hrefFor={ ( n ) => `${ pageUrl }?section=${ type }&pagenum=${ n }` } /> }
            </Card>
        </div>
    );
}
