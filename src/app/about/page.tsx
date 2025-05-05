export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">About WebVital AI</h2>
            <p className="mt-4 text-lg text-gray-500">
              Empowering website owners with AI-driven performance insights.
            </p>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            <dl className="space-y-12">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Our Mission</dt>
                <dd className="mt-2 text-base text-gray-500">
                  At WebVital AI, our mission is to democratize web performance optimization by providing powerful, 
                  AI-driven tools that help website owners, developers, and marketers improve their site's performance, 
                  accessibility, SEO, and security. We believe that a faster, more accessible web benefits everyone, 
                  and we're committed to making these improvements achievable for businesses of all sizes.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Our Story</dt>
                <dd className="mt-2 text-base text-gray-500">
                  WebVital AI was founded in 2024 by a team of web performance enthusiasts who saw a gap in the market 
                  for tools that not only identify performance issues but also provide actionable, prioritized 
                  recommendations for fixing them. By combining cutting-edge AI technology with deep expertise in web 
                  performance, we've created a platform that makes it easy for anyone to optimize their website's 
                  performance and improve their user experience.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Our Technology</dt>
                <dd className="mt-2 text-base text-gray-500">
                  WebVital AI leverages the latest advancements in artificial intelligence and machine learning to 
                  analyze websites and provide personalized recommendations. Our platform integrates with industry-standard 
                  tools like Lighthouse, axe-core, and security headers analysis, and then applies our proprietary AI 
                  algorithms to prioritize fixes based on impact and effort. This approach ensures that our users can 
                  focus on the changes that will have the biggest impact on their website's performance.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Our Values</dt>
                <dd className="mt-2 text-base text-gray-500">
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Accessibility:</strong> We believe the web should be accessible to everyone, regardless of ability.</li>
                    <li><strong>Transparency:</strong> We provide clear, honest insights about your website's performance.</li>
                    <li><strong>Empowerment:</strong> We give you the tools and knowledge to make meaningful improvements.</li>
                    <li><strong>Innovation:</strong> We continuously improve our technology to provide the best possible recommendations.</li>
                    <li><strong>Privacy:</strong> We respect your data and maintain strict privacy standards.</li>
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Team section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-5 sm:space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Our Team</h2>
              <p className="text-xl text-gray-500">
                Meet the passionate experts behind WebVital AI who are dedicated to making the web faster and more accessible.
              </p>
            </div>
            <div className="lg:col-span-2">
              <ul className="space-y-12 sm:grid sm:grid-cols-2 sm:gap-12 sm:space-y-0 lg:gap-x-8">
                <li>
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-xl font-bold">
                      JD
                    </div>
                    <div className="space-y-1 text-lg font-medium leading-6">
                      <h3>Jane Doe</h3>
                      <p className="text-primary-600">CEO & Founder</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-xl font-bold">
                      JS
                    </div>
                    <div className="space-y-1 text-lg font-medium leading-6">
                      <h3>John Smith</h3>
                      <p className="text-primary-600">CTO</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-xl font-bold">
                      AJ
                    </div>
                    <div className="space-y-1 text-lg font-medium leading-6">
                      <h3>Alice Johnson</h3>
                      <p className="text-primary-600">Head of AI</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-xl font-bold">
                      RB
                    </div>
                    <div className="space-y-1 text-lg font-medium leading-6">
                      <h3>Robert Brown</h3>
                      <p className="text-primary-600">Lead Developer</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}