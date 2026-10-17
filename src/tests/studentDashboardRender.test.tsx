import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StudentDashboard } from '../components/pages/StudentDashboard';
import { PaymentHistory } from '../components/common/PaymentHistory';
import { VerifiedSkills } from '../components/common/VerifiedSkills';
import { HelpCenter } from '../components/pages/HelpCenter';
import App from '../App';
import { marketplaceStore } from '../lib/storage';
import { User } from '../types';

describe('StudentDashboard Comprehensive Render Diagnostics', () => {
  it('renders for all initial users in storage', () => {
    marketplaceStore.resetToDefaults();
    const users = marketplaceStore.getUsers();
    
    users.forEach((user) => {
      expect(() => {
        const html = renderToString(<StudentDashboard currentUser={user} onNavigate={() => {}} />);
        expect(html.length).toBeGreaterThan(100);
      }).not.toThrow();
    });
  });

  it('renders App when user navigates or is on student_dashboard view', () => {
    marketplaceStore.resetToDefaults();
    marketplaceStore.setCurrentUserId('student-1');

    expect(() => {
      const html = renderToString(<App />);
      expect(html.length).toBeGreaterThan(100);
    }).not.toThrow();
  });

  it('renders PaymentHistory standalone for student-1', () => {
    marketplaceStore.resetToDefaults();
    expect(() => {
      const html = renderToString(<PaymentHistory studentId="student-1" />);
      expect(html).toContain('Total Transactions');
    }).not.toThrow();
  });

  it('renders VerifiedSkills standalone for student-1', () => {
    marketplaceStore.resetToDefaults();
    expect(() => {
      const html = renderToString(<VerifiedSkills studentId="student-1" />);
      expect(html).toContain('Client-Endorsed Credentials');
    }).not.toThrow();
  });

  it('handles edge cases where profile or payment or review data has missing or partial fields', () => {
    const edgeUser: User = {
      id: 'edge-user-999',
      name: 'Test Edge Case',
      email: 'edge@test.com',
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
    };

    expect(() => {
      const html = renderToString(<StudentDashboard currentUser={edgeUser} onNavigate={() => {}} />);
      expect(html).toBeDefined();
    }).not.toThrow();
  });

  it('renders Quick Actions row with Find New Projects, View Portfolio, and Request Support', () => {
    marketplaceStore.resetToDefaults();
    const user = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
    const html = renderToString(<StudentDashboard currentUser={user} onNavigate={() => {}} />);

    expect(html).toContain('Quick Actions');
    expect(html).toContain('Find New Projects');
    expect(html).toContain('View Portfolio');
    expect(html).toContain('Request Support');
  });

  it('renders summary card with small bar chart visualizer', () => {
    marketplaceStore.resetToDefaults();
    const user = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
    const html = renderToString(<StudentDashboard currentUser={user} onNavigate={() => {}} />);

    expect(html).toContain('Deliverable');
    expect(html).toContain('Earnings Growth');
    expect(html).toContain('Completed Projects');
    expect(html).toContain('Total Cleared');
  });

  it('renders Sign Out action button in StudentDashboard header and settings', () => {
    marketplaceStore.resetToDefaults();
    const user = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
    const html = renderToString(<StudentDashboard currentUser={user} onNavigate={() => {}} onLogout={() => {}} />);

    expect(html).toContain('Sign Out');
  });

  it('renders HelpCenter component with FAQs and troubleshooting steps', () => {
    const html = renderToString(<HelpCenter onNavigate={() => {}} />);
    expect(html).toContain('Help Center');
    expect(html).toContain('Troubleshooting');
    expect(html).toContain('Creator Quick Resolution Steps');
    expect(html).toContain('Business Quick Resolution Steps');
    expect(html).toContain('How do creators get paid');
    expect(html).toContain('Scope Lock');
    expect(html).toContain('18+');
  });
});


