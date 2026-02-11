import * as setSummaryChannel from './set-summary-channel';
import * as setSummaryTime from './set-summary-time';
import * as sendSummaryNow from './send-summary-now';

export const commands = [
  { data: setSummaryChannel.data, execute: setSummaryChannel.execute },
  { data: setSummaryTime.data, execute: setSummaryTime.execute },
  { data: sendSummaryNow.data, execute: sendSummaryNow.execute },
];
