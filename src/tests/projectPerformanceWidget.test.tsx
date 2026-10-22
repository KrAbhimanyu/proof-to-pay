import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProjectPerformanceWidget } from '../components/common/ProjectPerformanceWidget';
import { BusinessDashboard } from '../components/pages/BusinessDashboard';
import { marketplaceStore } from '../lib/storage';
import { User } from '../types';

describe('Project Performance D3 Widget & BusinessDashboard Integration', () => {
  const mockBusinessUser: User = {
    id: 'business-1',
    name: 'Siddharth Menon',
    email: 'siddharth@hyperflow.ai',
    role: 'BUSINESS',
    city: 'Bengaluru',
    state: 'Karnataka',
    createdAt: '2026-07-01T09:00:00.000Z',
  };

  it('renders ProjectPerformanceWidget standalone with D3 SVG containers and KPI metrics', () => {
    marketplaceStore.resetToDefaults();
    const projects = marketplaceStore.getProjects().filter((p) => p.businessId === 'business-1');
    const reviews = marketplaceStore.getReviews();
    const submissions = marketplaceStore.getSubmissions();

    const html = renderToString(
      <ProjectPerformanceWidget
        projects={projects}
        reviews={reviews}
        submissions={submissions}
        businessId="business-1"
      />
    );

    expect(html).toContain('Project Performance &amp; Creator Velocity');
    expect(html).toContain('Avg Turnaround');
    expect(html).toContain('On-Time Delivery');
    expect(html).toContain('Creator Rating');
    expect(html).toContain('Scope Lock Adherence');
    expect(html).toContain('<svg');
  });

  it('renders ProjectPerformanceWidget within BusinessDashboard overview tab', () => {
    marketplaceStore.resetToDefaults();

    const html = renderToString(
      <BusinessDashboard
        currentUser={mockBusinessUser}
        onNavigate={() => {}}
        controlledTab="overview"
      />
    );

    expect(html).toContain('Project Performance &amp; Creator Velocity');
    expect(html).toContain('Project Completion Times (Days)');
    expect(html).toContain('Student Rating Distributions');
  });

  it('renders BusinessDashboard when navigated to the dedicated performance tab', () => {
    marketplaceStore.resetToDefaults();

    const html = renderToString(
      <BusinessDashboard
        currentUser={mockBusinessUser}
        onNavigate={() => {}}
        controlledTab="performance"
      />
    );

    expect(html).toContain('Project Performance (D3)');
    expect(html).toContain('Project Performance &amp; Creator Velocity');
    expect(html).toContain('Platform Benchmarks');
  });

  it('gracefully handles empty projects and reviews by serving verified benchmarks', () => {
    const html = renderToString(
      <ProjectPerformanceWidget
        projects={[]}
        reviews={[]}
        submissions={[]}
      />
    );

    expect(html).toContain('Project Performance &amp; Creator Velocity');
    expect(html).toContain('Avg Turnaround');
    expect(html).toContain('Creator Rating');
    expect(html.length).toBeGreaterThan(100);
  });
});
