/**
 * Standalone billing seeder entrypoint.
 *
 *   npm run seed:billing            # safe: creates missing docs, never overwrites
 *   npm run seed:billing -- --force # DESTRUCTIVE: overwrites existing plans
 *
 * `--force` discards any pricing or limit changes made by operators in the
 * database, so it is guarded against production below.
 */

import mongoose from 'mongoose';
import config from '../../../config';
import connectDatabase from '../../../config/database';
import { seedBillingData } from './billing.seed';

async function main(): Promise<void> {
  const force = process.argv.includes('--force');

  if (force && config.env === 'production') {
    console.error(
      '[BillingSeed] Refusing to run with --force in production: this would overwrite live pricing.\n' +
        'Edit plan documents directly instead, or run without --force to add new plans only.'
    );
    process.exit(1);
  }

  await connectDatabase();
  await seedBillingData(force);
  await mongoose.connection.close();
  console.log('[BillingSeed] Connection closed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[BillingSeed] Failed:', err);
  process.exit(1);
});
