'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { THRESHOLDS } from "@/app/lib/notificationService";

export function ThresholdTable() {
  return (
    <Table>
      <TableCaption>Final Thresholds for Tilapia in Philippine Fishponds</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Parameter</TableHead>
          <TableHead>Optimal Range</TableHead>
          <TableHead>Warning Notification</TableHead>
          <TableHead>Critical Alert</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">pH</TableCell>
          <TableCell>{THRESHOLDS.pH.optimal.min} – {THRESHOLDS.pH.optimal.max}</TableCell>
          <TableCell>
            &lt; {THRESHOLDS.pH.warning.min} or &gt; {THRESHOLDS.pH.warning.max}
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.pH.critical.min} or &gt; {THRESHOLDS.pH.critical.max}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Dissolved Oxygen</TableCell>
          <TableCell>
            {THRESHOLDS.DO.optimal.min} – {THRESHOLDS.DO.optimal.max} mg/L
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.DO.warning.min} mg/L
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.DO.critical.min} mg/L
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Temperature</TableCell>
          <TableCell>
            {THRESHOLDS.temperature.optimal.min}°C – {THRESHOLDS.temperature.optimal.max}°C
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.temperature.warning.min}°C or &gt; {THRESHOLDS.temperature.warning.max}°C
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.temperature.critical.min}°C or &gt; {THRESHOLDS.temperature.critical.max}°C
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Electrical Conductivity (EC)</TableCell>
          <TableCell>
            {THRESHOLDS.EC.optimal.min} – {THRESHOLDS.EC.optimal.max} µS/cm
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.EC.warning.min} µS/cm or &gt; {THRESHOLDS.EC.warning.max} µS/cm
          </TableCell>
          <TableCell>
            &lt; {THRESHOLDS.EC.critical.min} µS/cm or &gt; {THRESHOLDS.EC.critical.max} µS/cm
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Weight (Refill Alert)</TableCell>
          <TableCell>
            &gt; {THRESHOLDS.weight.refill.max} kg
          </TableCell>
          <TableCell>
            ≤ {THRESHOLDS.weight.refill.max} kg
          </TableCell>
          <TableCell>
            ≤ 0.5 kg
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
} 