import { expect } from '@playwright/test';
import * as path from 'path';
import { parityDir, parityWp, type ParitySite } from '../utils/paritySites';

/**
 * Stored form as dumped by parity/wp/dump-form.php: every value with its PHP type,
 * IDs replaced by positions.
 */
export interface FormDump {
    post_type: string;
    post_status: string;
    post_title: string;
    meta: Record<string, unknown>;
    fields: Array<{
        menu_order: number;
        post_status: string;
        post_content: unknown;
        meta: Record<string, unknown>;
    }>;
}

/**
 * Data-layer page object for the parity suite (develop vs branch). Seeds identical
 * data on both sites and compares what each site stored.
 */
export class ParityPage {

    /** Create a form on a site from a fixture in parity/fixtures and return its id. */
    doSeedForm(site: ParitySite, fixture: string): number {
        const out = parityWp(site, ['eval-file', path.join(parityDir, 'wp', 'seed-form.php'), path.join(parityDir, 'fixtures', fixture)]);
        const id = Number(out.trim().split(/\s+/).pop());
        if (!id) {
            throw new Error(`Seeding ${fixture} on ${site.name} returned no id: ${out}`);
        }
        return id;
    }

    /** Read a stored form from a site. */
    readForm(site: ParitySite, formId: number): FormDump {
        return JSON.parse(parityWp(site, ['eval-file', path.join(parityDir, 'wp', 'dump-form.php'), String(formId)])) as FormDump;
    }

    /** Assert two stored forms are identical (values and PHP types). */
    validateFormsEqual(develop: FormDump, branch: FormDump) {
        expect(branch, 'branch storage must equal develop storage').toStrictEqual(develop);
    }
}
