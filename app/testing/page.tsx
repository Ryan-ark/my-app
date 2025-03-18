import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testing Page',
  description: 'Testing page description',
}

export default function TestingPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Testing Page</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Welcome to the testing page. This is a new page created in the Next.js application.
          </p>
        </div>
      </div>
    </main>
  )
} 