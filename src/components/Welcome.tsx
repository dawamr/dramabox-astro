import { Button, Card } from 'flowbite-react';
import AppNavbar from './Navbar';

interface WelcomeProps {
	title?: string;
}

export default function Welcome({ title = "Welcome to DramaBox API" }: WelcomeProps) {
	return (
		<>
			<AppNavbar />
			<div className="max-w-4xl mx-auto p-8">
			<Card className="mb-8">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
					{title}
				</h1>
				<p className="text-lg text-gray-700 dark:text-gray-400 mb-6">
					This is your new Astro project with React TypeScript and Flowbite CSS integration.
				</p>
				<div className="flex gap-4">
					<Button color="blue" size="lg">
						<a href="/api-test">Test API</a>
					</Button>
					<Button color="light" size="lg">
						Learn More
					</Button>
				</div>
			</Card>
			
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<h3 className="text-xl font-semibold mb-2">🚀 Astro</h3>
					<p className="text-gray-600 dark:text-gray-400">
						Modern static site generator with islands architecture
					</p>
				</Card>
				<Card>
					<h3 className="text-xl font-semibold mb-2">⚛️ React TypeScript</h3>
					<p className="text-gray-600 dark:text-gray-400">
						Interactive components with full TypeScript support
					</p>
				</Card>
				<Card>
					<h3 className="text-xl font-semibold mb-2">🎨 Flowbite</h3>
					<p className="text-gray-600 dark:text-gray-400">
						Beautiful UI components built on Tailwind CSS
					</p>
				</Card>
			</div>
			</div>
		</>
	);
}