import React from 'react';
import {
  AssetsCoverageReport,
  type AssetsCoverageReportProps,
} from './AssetsCoverageReport';

export type AssetInventoryReportProps = AssetsCoverageReportProps;

export const AssetInventoryReport: React.FC<AssetInventoryReportProps> = (props) => {
  return <AssetsCoverageReport {...props} />;
};

export { AssetsCoverageReport };
