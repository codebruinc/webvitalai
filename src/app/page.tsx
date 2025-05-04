import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import UrlForm from '@/components/home/UrlForm';

export default function Home() {
  return (
    <Layout>
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Optimize your website performance with AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              WebVital AI analyzes your website's performance metrics and provides AI-powered
              recommendations to improve user experience and SEO rankings.
            </p>
            <div className="mt-10">
              <UrlForm />
            </div>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/features"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}