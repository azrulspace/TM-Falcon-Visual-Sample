import React from 'react';
import {
  NetworkHealthReport,
  type NetworkHealthReportProps,
} from './NetworkHealthReport';

export type DeviceHealthReportProps = NetworkHealthReportProps;

export const DeviceHealthReport: React.FC<DeviceHealthReportProps> = (props) => {
  return <NetworkHealthReport {...props} />;
};

export { NetworkHealthReport };
