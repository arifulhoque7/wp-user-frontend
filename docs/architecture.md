DESCRIPTION: WPUF architecture as built on `feature/react-admin-revamp`: the admin platform (container, providers, REST, stores, screens, React apps), the legacy layer that stays, how Pro plugs in, and a "where is X" map.
Read when new to the codebase, before touching the admin (lists, builders, subscriptions, settings, tools, transactions, onboarding), or before adding a hook, a route or a screen.

# Architecture

WPUF has two layers that run together:

- **Admin platform** (`includes/Platform/`, `includes/Admin/Screens/`, `includes/Admin/App/`, `src/admin/`): the FlyHR-style backend and the single React admin app. Every admin screen of the plugin runs here.
- **Legacy layer** (`wpuf.php` array container, `includes/Admin/*`, `includes/Frontend/*`, `includes/Fields/*`, `wpuf-functions.php`, templates): the site frontend, the form field types, payments, the classic Settings mode and the services the platform still calls. It is not a second admin: the classic per-page admin screens were removed (phase B of the clean-up), only their load hooks and old URLs remain, redirecting to the app.

## Boot flow

1. `wpuf.php` loads Composer, defines the constants and creates the `WP_User_Frontend` singleton (`wpuf()`).
2. `plugins_loaded` → `instantiate()` fills the legacy array container (`wpuf()->admin`, `->frontend`, `->api`, `->subscription` ...). Legacy services add their hooks in their constructors, as always.
3. Then `wpuf()->platform_bootstrap()->boot()` (`Platform\Bootstrap`): the four providers register their services in `Platform\Container` (`CoreServiceProvider`, `StoreServiceProvider`, `RestServiceProvider`, `AiServiceProvider`), every service tagged `Hookable` gets `register_hooks()` once, then `do_action( 'wpuf_platform_loaded', $container, $bootstrap )`.
4. Pro boots after free (`wpuf_platform_loaded`, script dependencies, `Platform\VersionGuard` refuses an older free) and adds its own providers to the same container (`wpuf-pro/includes/Platform/ProPlatformProvider.php`).
5. `rest_api_init` → `Platform\REST\Manager` registers every controller once: the three frozen ones `wpuf()->api` built, every service tagged `RestRoute` (free and Pro), plus the `wpuf_rest_controllers` filter.
6. `admin_menu` → `Admin\Menu` registers the top-level page (the app) and the old submenu slugs; each old page's `load-` hook runs `Screens\Registry::load()`, which fires the screen's load step and redirects to the app route.

Rules of the container: services are built only in providers (`share_tagged`), dependencies are passed in constructors, hooks are added in `register_hooks()` (never in a platform constructor), capabilities come from `Platform\Caps` (never literal strings).

## Where is X

| I want to find... | Look in |
|---|---|
| The admin page and its hash routes | `Admin\App\AppPage` (one page `admin.php?page=wp-user-frontend`, routes from every screen's `app_routes()`, `wpuf_admin_app_routes` filter); helpers in `includes/functions/admin-app.php` |
| A screen (menu slug, load hook, route, boot data) | `includes/Admin/Screens/<Screen>.php`, registered in `Screens\Registry`; Pro screens in `wpuf-pro/includes/Platform/Screens/` |
| A REST route under `wpuf/v1` | `includes/Platform/REST/Controllers/*Controller.php` (admin routes `admin/*`, frozen routes `wpuf_form`, `wpuf_subscription*`, `settings`); the AI form builder's routes in `includes/AI/RestController.php` (feature-local); Pro routes in `wpuf-pro/includes/Platform/<Feature>/*Controller.php`. All go through `Platform\REST\Manager`; base class `Platform\REST\RestController` |
| Who may do what | `Platform\Caps` (`MANAGE_FORMS`, `MANAGE_SUBSCRIPTIONS`, `MANAGE_SETTINGS` map to `wpuf_admin_role()`; `MANAGE_SITE` to `manage_options`; `wpuf_capability` filter) |
| Reading or writing forms, fields, packs, settings | `Platform\Stores\*Store` (through `Stores::forms()`, `::fields()`, `::subscriptions()`, `::settings()`); models in `Platform\Models` |
| The builder save | AJAX `wpuf_form_builder_save_form` and REST `admin/forms/{id}` both call `Builder\FormSave` → `Admin\Forms\Admin_Form_Builder::save_form()` → the stores. Builder boot data: `Builder\BuilderBoot` |
| Tools, Transactions | `Platform\Tools\ToolsService`, `Platform\Transactions\TransactionService` (container services; old action links of develop's pages are replayed by `TransactionService::legacy_request()` and `Admin_Tools`' `wpuf_load_tools` handlers) |
| Onboarding | `Admin\Onboarding` (the wizard: hooks, steps, state, step savers) delegating to `Platform\Onboarding\Pages` and `Platform\Onboarding\Plugin_Installer`; REST `OnboardingController`; screen `Screens\Onboarding` |
| Hooks of the old Vue builder | `Builder\HookBridge` (fires the kept PHP hooks into React slots), `Builder\HookDeprecations` (retired hooks fire as deprecated), guide `docs/hooks/migration-vue-to-react.md` |
| React admin assets | `Admin\React_Assets` (bundles under `assets/js/react/`, their `*.asset.php`, screen stylesheets); the legacy `WeDevs\Wpuf\Assets` keeps the full handle list and merges these in |
| A React app | `src/admin/apps/<app>/` (forms-list, form-builder, subscriptions, settings, onboarding, tools, transactions, help, welcome, ai-form-builder, the Pro promos); shared parts in `src/admin/shared/`; the runtime `window.wpuf` in `src/admin/app/` |
| Settings values and schema | `Platform\Stores\SettingsStore`, `includes/functions/settings-options.php` (the schema), `includes/functions/settings-react.php`; classic mode stays on `Lib/WeDevs_Settings_API.php` |

## Folder map (PHP)

```
includes/Platform/            the platform: Container, ServiceProvider, Bootstrap, Caps, VersionGuard
  Contracts/                  Hookable, RestRoute, DataStore
  Providers/                  Core, Store, Rest, Ai service providers
  REST/                       Manager, RestController (base), Controllers/*
  Stores/                     FormStore, FieldStore, SubscriptionStore, SettingsStore, Normalizers, Stores
  Models/                     Form, SubscriptionPack
  Onboarding/                 Pages, Plugin_Installer
  Tools/, Transactions/       ToolsService, TransactionService
includes/Admin/Screens/       one class per admin screen + Registry, Screen (base), PrintsNotices
includes/Admin/App/           AppPage (the one admin page)
includes/Builder/             BuilderBoot, FormSave, HookBridge, HookDeprecations
includes/Admin/               legacy admin services still in use (Menu, Admin_Tools, Admin_Subscription, Onboarding facade,
                              Posting, Help_Content, views/ for Subscribers / Premium / shortcode builder / help content)
includes/Api/                 alias stubs of the old controller names (deprecated)
includes/AI/                  AI form builder (Config, FormGenerator, prompts, its RestController)
includes/Frontend/, Fields/, Integrations/, Free/   the site frontend, field types, third-party integrations, free-only promos
wpuf-functions.php            global functions (public API)
```

Pro mirrors this under `wpuf-pro/includes/Platform/<Feature>/` (Coupons, License, Modules, Settings, Subscriptions, Builder, Screens), each with its provider.

## Non-negotiables

1. **Stored data is frozen.** Same CPTs, meta keys, option keys and value shapes as develop; an untouched save changes nothing.
2. **WPUF fires its own hooks.** A React screen still calls every PHP hook the old screen called, at the equivalent point, with the same arguments.
3. **Modules are not edited.** Pro modules and User Directory keep their code.
4. **Retired hooks are deprecated, never deleted silently.**
5. **Old URLs keep working**: every old admin URL redirects to its app route after its load step ran.
6. **Old class names keep working**: renamed classes leave a `class_alias` stub at the old path (see `includes/Api/`, `includes/Admin/Assets.php`, `includes/Admin/Forms/Post/Templates/Form_Template.php`).
7. **Frontend output is identical** to develop.

## Verification

- PHPUnit (`tests/php/`): platform container and REST, every `wpuf/v1` route refuses visitors and subscribers, stores, onboarding, tools, transactions, builder boot.
- Playwright (`tests/e2e/`): the app, every screen, the frontend; parity suite against a develop site (`tests/e2e/parity/`).
- Contract dump (QA script `contract-dump.php`): REST routes, AJAX actions and shortcodes compared before and after a refactor.
