# WebVital AI

WebVital AI is a comprehensive web performance monitoring and optimization tool powered by artificial intelligence. It helps developers, performance engineers, and website owners track, analyze, and improve their website's performance metrics.

## Features

- **Web Vitals Monitoring**: Track Core Web Vitals (LCP, FID, CLS) and other performance metrics
- **AI-Powered Recommendations**: Get intelligent suggestions to improve your website's performance
- **Performance History**: View historical performance data to track improvements over time
- **Alerts & Notifications**: Receive alerts when performance metrics degrade
- **Security Analysis**: Identify security vulnerabilities in your website
- **Industry Benchmarks**: Compare your website's performance against industry standards

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Performance Testing**: Lighthouse, axe-core
- **AI Integration**: OpenAI API
- **Security Testing**: SecurityHeaders.com API
- **Payments**: Stripe

## Project Structure

```
webvitalai/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── login/            # Authentication pages
│   │   └── ...
│   ├── components/           # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Layout components
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── models/               # Data models
│   ├── services/             # Service integrations
│   ├── styles/               # Global styles
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── supabase/                 # Supabase configuration and migrations
├── public/                   # Static assets
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenAI API key (for AI recommendations)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/webvitalai.git
   cd webvitalai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase URL and anon key
   - Add your OpenAI API key

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
