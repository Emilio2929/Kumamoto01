import { Component } from '@angular/core';
import { DashboardKpis } from '../../components/dashboard-kpis/dashboard-kpis';
import { GlobalAttendance } from '../../components/global-attendance/global-attendance';
import { RiskMonitor } from '../../components/risk-monitor/risk-monitor';

@Component({
  selector: 'app-resumen',
  imports: [DashboardKpis, GlobalAttendance, RiskMonitor],
  templateUrl: './resumen.html',
  styleUrl: './resumen.scss',
})
export class Resumen {}
