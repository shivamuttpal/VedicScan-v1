import { getPeriodKey, endOfBillingDay, startOfBillingDay, getPeriodResetAt } from '../utils/period.util';

let fail = 0;
const eq = (label: string, actual: any, expected: any) => {
  const a = String(actual), e = String(expected);
  if (a !== e) { console.log(`FAIL ${label}\n  actual=  ${a}\n  expected=${e}`); fail++; }
  else console.log(`ok   ${label} => ${a}`);
};

// IST = UTC+5:30. 2026-07-19T18:29:59Z is 23:59:59 IST on the 19th.
eq('daily key just before IST midnight', getPeriodKey('daily', new Date('2026-07-19T18:29:59Z')), '2026-07-19');
// 18:30:00Z is 00:00:00 IST on the 20th -> new day
eq('daily key at IST midnight', getPeriodKey('daily', new Date('2026-07-19T18:30:00Z')), '2026-07-20');

// Monthly rollover: 2026-07-31T18:30:00Z = 2026-08-01 00:00 IST
eq('monthly key end of July IST', getPeriodKey('monthly', new Date('2026-07-31T18:29:59Z')), '2026-07');
eq('monthly key start of Aug IST', getPeriodKey('monthly', new Date('2026-07-31T18:30:00Z')), '2026-08');

eq('lifetime key constant', getPeriodKey('lifetime', new Date('2026-07-19T00:00:00Z')), 'lifetime');

// Add-on bought 11pm IST on the 19th must die at IST midnight (18:30Z), ~1h later.
const lateBuy = new Date('2026-07-19T17:30:00Z'); // 23:00 IST
eq('addon bought 23:00 IST expires at next IST midnight',
   endOfBillingDay(lateBuy).toISOString(), '2026-07-19T18:30:00.000Z');
const hours = (endOfBillingDay(lateBuy).getTime() - lateBuy.getTime()) / 3600000;
eq('addon lifetime is 1h not 24h', hours, 1);

// Add-on bought 1am IST gets nearly the full day
const earlyBuy = new Date('2026-07-19T19:30:00Z'); // 01:00 IST on the 20th
eq('addon bought 01:00 IST expires next IST midnight',
   endOfBillingDay(earlyBuy).toISOString(), '2026-07-20T18:30:00.000Z');

eq('startOfBillingDay is IST midnight', startOfBillingDay(new Date('2026-07-19T12:00:00Z')).toISOString(), '2026-07-18T18:30:00.000Z');
eq('lifetime never resets', String(getPeriodResetAt('lifetime')), 'null');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
