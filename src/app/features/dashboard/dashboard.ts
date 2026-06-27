import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { PlatformsService } from '@features/platforms/platforms-api';
import { EfectyDailyClose, Platform } from '@features/platforms/platforms.models';
import { DashboardService } from './dashboard-data';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, CurrencyCopPipe, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardSvc = inject(DashboardService);
  private readonly platformsSvc = inject(PlatformsService);
  private readonly destroyRef = inject(DestroyRef);

  protected platforms = signal<Platform[]>([]);
  protected todayIncome = signal(0);
  protected todaySaleCount = signal(0);
  protected outOfStockCount = signal(0);
  protected lowStockCount = signal(0);
  protected efectyClose = signal<EfectyDailyClose | null>(null);
  protected loading = signal(false);
  protected lastRefreshed = signal<Date | null>(null);

  protected readonly todayDate = new Date();

  protected readonly totalPlatformBalance = computed(() =>
    this.platforms().reduce((sum, p) => sum + p.currentBalance, 0),
  );

  protected readonly criticalPlatforms = computed(() => this.platforms().filter((p) => p.status === 'CRITICAL'));
  protected readonly lowPlatforms = computed(() => this.platforms().filter((p) => p.status === 'LOW'));

  protected readonly efectyClosedToday = computed(() => {
    const close = this.efectyClose();
    return close?.closeDate === today();
  });

  protected readonly alertCount = computed(
    () =>
      this.criticalPlatforms().length +
      this.lowPlatforms().length +
      (this.outOfStockCount() > 0 ? 1 : 0) +
      (!this.efectyClosedToday() ? 1 : 0),
  );

  private refreshTimer: number | null = null;

  ngOnInit(): void {
    this.loadAll();
    this.refreshTimer = window.setInterval(() => this.loadPlatformsOnly(), 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) window.clearInterval(this.refreshTimer);
  }

  protected loadAll(): void {
    this.loading.set(true);
    this.dashboardSvc
      .loadDashboardData(today())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.platforms.set(data.platforms);
          this.todayIncome.set(data.finance?.totalIncome ?? 0);
          this.todaySaleCount.set(data.salesTotalElements);
          this.outOfStockCount.set(data.outOfStockCount);
          this.lowStockCount.set(data.lowStockCount);
          this.efectyClose.set(data.efectyClose);
          this.lastRefreshed.set(new Date());
        },
      });
  }

  private loadPlatformsOnly(): void {
    this.platformsSvc
      .getPlatforms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.platforms.set(list);
          this.lastRefreshed.set(new Date());
        },
        error: () => {},
      });
  }

  protected progressWidth(p: Platform): number {
    if (!p.minimumThreshold) return 100;
    return Math.min((p.currentBalance / p.minimumThreshold) * 100, 100);
  }

  protected progressColorClass(status: Platform['status']): string {
    switch (status) {
      case 'SUFFICIENT':
        return 'bg-emerald-500';
      case 'LOW':
        return 'bg-amber-500';
      case 'CRITICAL':
        return 'bg-red-500';
    }
  }

  protected isEfecty(p: Platform): boolean {
    return p.code === 'EFECTY';
  }
}
