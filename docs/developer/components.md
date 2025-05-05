# Component Documentation

This document provides detailed information about the key components in the WebVital AI application. Each component is described with its purpose, props, and usage examples.

## Table of Contents

- [Layout Components](#layout-components)
  - [Layout](#layout)
  - [Header](#header)
  - [Footer](#footer)
- [Home Components](#home-components)
  - [UrlForm](#urlform)
- [Dashboard Components](#dashboard-components)
  - [DashboardContent](#dashboardcontent)
  - [ScanResults](#scanresults)
  - [LoadingState](#loadingstate)
  - [PrioritizedRecommendations](#prioritizedrecommendations)
  - [IndustryBenchmarks](#industrybenchmarks)
- [Authentication Components](#authentication-components)
  - [LoginForm](#loginform)
  - [SignupForm](#signupform)
- [Subscription Components](#subscription-components)
  - [SubscriptionManager](#subscriptionmanager)
- [Agency Components](#agency-components)
  - [ClientList](#clientlist)
  - [ClientInvitation](#clientinvitation)
- [Alert Components](#alert-components)
  - [AlertManager](#alertmanager)
- [Scorecard Components](#scorecard-components)
  - [SocialScorecard](#socialscorecard)

## Layout Components

### Layout

The main layout component that wraps all pages.

**File:** `src/components/layout/Layout.tsx`

**Props:**
- `children`: React nodes to be rendered inside the layout

**Usage:**
```tsx
import Layout from '@/components/layout/Layout';

export default function Page() {
  return (
    <Layout>
      <h1>Page Content</h1>
    </Layout>
  );
}
```

### Header

The header component that appears at the top of every page.

**File:** `src/components/layout/Header.tsx`

**Props:** None

**Usage:**
```tsx
import Header from '@/components/layout/Header';

export default function CustomLayout() {
  return (
    <div>
      <Header />
      <main>{/* Page content */}</main>
    </div>
  );
}
```

### Footer

The footer component that appears at the bottom of every page.

**File:** `src/components/layout/Footer.tsx`

**Props:** None

**Usage:**
```tsx
import Footer from '@/components/layout/Footer';

export default function CustomLayout() {
  return (
    <div>
      <main>{/* Page content */}</main>
      <Footer />
    </div>
  );
}
```

## Home Components

### UrlForm

A form component for submitting URLs to be scanned.

**File:** `src/components/home/UrlForm.tsx`

**Props:**
- `onSubmit`: Function to call when the form is submitted
- `isLoading`: Boolean indicating if a scan is in progress

**Usage:**
```tsx
import UrlForm from '@/components/home/UrlForm';

export default function HomePage() {
  const handleSubmit = async (url: string) => {
    // Handle URL submission
  };

  return (
    <div>
      <h1>Analyze Your Website</h1>
      <UrlForm onSubmit={handleSubmit} isLoading={false} />
    </div>
  );
}
```

## Dashboard Components

### DashboardContent

The main dashboard component that displays scan results.

**File:** `src/components/dashboard/DashboardContent.tsx`

**Props:**
- `scanId`: String ID of the current scan
- `userId`: String ID of the current user

**Usage:**
```tsx
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
  return <DashboardContent scanId="123" userId="456" />;
}
```

### ScanResults

Displays the results of a website scan.

**File:** `src/components/dashboard/ScanResults.tsx`

**Props:**
- `scan`: Scan object containing results
- `isPremium`: Boolean indicating if the user has a premium subscription

**Usage:**
```tsx
import ScanResults from '@/components/dashboard/ScanResults';

export default function ResultsSection({ scan, isPremium }) {
  return <ScanResults scan={scan} isPremium={isPremium} />;
}
```

### LoadingState

Displays a loading indicator while a scan is in progress.

**File:** `src/components/dashboard/LoadingState.tsx`

**Props:**
- `progress`: Number indicating the scan progress (0-100)
- `status`: String indicating the current scan status

**Usage:**
```tsx
import LoadingState from '@/components/dashboard/LoadingState';

export default function ScanningSection() {
  return <LoadingState progress={75} status="Processing accessibility tests" />;
}
```

### PrioritizedRecommendations

Displays AI-prioritized recommendations for fixing issues.

**File:** `src/components/dashboard/PrioritizedRecommendations.tsx`

**Props:**
- `recommendations`: Array of recommendation objects
- `isPremium`: Boolean indicating if the user has a premium subscription

**Usage:**
```tsx
import PrioritizedRecommendations from '@/components/dashboard/PrioritizedRecommendations';

export default function RecommendationsSection({ recommendations, isPremium }) {
  return <PrioritizedRecommendations recommendations={recommendations} isPremium={isPremium} />;
}
```

### IndustryBenchmarks

Displays industry benchmark comparisons.

**File:** `src/components/dashboard/IndustryBenchmarks.tsx`

**Props:**
- `metrics`: Array of metric objects
- `industry`: String indicating the industry for comparison
- `isPremium`: Boolean indicating if the user has a premium subscription

**Usage:**
```tsx
import IndustryBenchmarks from '@/components/dashboard/IndustryBenchmarks';

export default function BenchmarksSection({ metrics, industry, isPremium }) {
  return <IndustryBenchmarks metrics={metrics} industry={industry} isPremium={isPremium} />;
}
```

## Authentication Components

### LoginForm

A form component for user login.

**File:** `src/components/auth/LoginForm.tsx`

**Props:**
- `onSuccess`: Function to call when login is successful

**Usage:**
```tsx
import LoginForm from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div>
      <h1>Log In</h1>
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
}
```

### SignupForm

A form component for user registration.

**File:** `src/components/auth/SignupForm.tsx`

**Props:**
- `onSuccess`: Function to call when signup is successful

**Usage:**
```tsx
import SignupForm from '@/components/auth/SignupForm';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <SignupForm onSuccess={handleSuccess} />
    </div>
  );
}
```

## Subscription Components

### SubscriptionManager

Manages user subscriptions and displays subscription status.

**File:** `src/components/subscription/SubscriptionManager.tsx`

**Props:**
- `userId`: String ID of the current user

**Usage:**
```tsx
import SubscriptionManager from '@/components/subscription/SubscriptionManager';

export default function SettingsPage({ userId }) {
  return (
    <div>
      <h1>Subscription Settings</h1>
      <SubscriptionManager userId={userId} />
    </div>
  );
}
```

## Agency Components

### ClientList

Displays a list of agency clients.

**File:** `src/components/agency/ClientList.tsx`

**Props:**
- `agencyId`: String ID of the agency

**Usage:**
```tsx
import ClientList from '@/components/agency/ClientList';

export default function AgencyDashboard({ agencyId }) {
  return (
    <div>
      <h1>Client Management</h1>
      <ClientList agencyId={agencyId} />
    </div>
  );
}
```

### ClientInvitation

A form component for inviting clients to the agency portal.

**File:** `src/components/agency/ClientInvitation.tsx`

**Props:**
- `agencyId`: String ID of the agency
- `onInviteSent`: Function to call when an invitation is sent

**Usage:**
```tsx
import ClientInvitation from '@/components/agency/ClientInvitation';

export default function InviteClientPage({ agencyId }) {
  const handleInviteSent = () => {
    // Handle successful invitation
  };

  return (
    <div>
      <h1>Invite Client</h1>
      <ClientInvitation agencyId={agencyId} onInviteSent={handleInviteSent} />
    </div>
  );
}
```

## Alert Components

### AlertManager

Manages and displays website performance alerts.

**File:** `src/components/alerts/AlertManager.tsx`

**Props:**
- `userId`: String ID of the current user
- `websiteId`: String ID of the website (optional)

**Usage:**
```tsx
import AlertManager from '@/components/alerts/AlertManager';

export default function AlertsPage({ userId }) {
  return (
    <div>
      <h1>Alert Management</h1>
      <AlertManager userId={userId} />
    </div>
  );
}
```

## Scorecard Components

### SocialScorecard

Displays a shareable scorecard of website performance.

**File:** `src/components/scorecard/SocialScorecard.tsx`

**Props:**
- `scanId`: String ID of the scan
- `shareCode`: String code for public sharing

**Usage:**
```tsx
import SocialScorecard from '@/components/scorecard/SocialScorecard';

export default function ScoreCardPage({ scanId, shareCode }) {
  return (
    <div>
      <h1>Performance Scorecard</h1>
      <SocialScorecard scanId={scanId} shareCode={shareCode} />
    </div>
  );
}
```

## Component Best Practices

When developing new components for WebVital AI, follow these best practices:

1. **Component Structure**:
   - Keep components focused on a single responsibility
   - Use TypeScript interfaces to define props
   - Provide default props where appropriate
   - Use React.memo for performance optimization when needed

2. **State Management**:
   - Use React hooks (useState, useEffect, useContext) for state management
   - Keep state as local as possible
   - Use context for global state that needs to be accessed by many components

3. **Styling**:
   - Use TailwindCSS for styling
   - Follow the project's design system
   - Use responsive design principles
   - Ensure accessibility (proper contrast, focus states, etc.)

4. **Error Handling**:
   - Implement proper error boundaries
   - Provide user-friendly error messages
   - Log errors for debugging

5. **Testing**:
   - Write unit tests for all components
   - Test edge cases and error states
   - Use React Testing Library for component testing

## Example Component Template

```tsx
import { useState, useEffect } from 'react';

interface ExampleComponentProps {
  title: string;
  data?: any[];
  onAction?: (id: string) => void;
}

export default function ExampleComponent({
  title,
  data = [],
  onAction,
}: ExampleComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Component logic here
  }, [data]);

  const handleClick = (id: string) => {
    if (onAction) {
      onAction(id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ul>
        {data.map((item) => (
          <li key={item.id} className="mb-2">
            {item.name}
            <button
              onClick={() => handleClick(item.id)}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
            >
              Action
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}